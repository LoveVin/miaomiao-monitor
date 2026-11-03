import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Consumer } from 'kafkajs'

import { KAFKA_CONSUMER, TRACE_TOPIC } from '../../fundamentals/kafka/constants.js'

const CLICKHOUSE_CLIENT = 'CLICKHOUSE_CLIENT'

const CONSUMER_RETRY_DELAY_MS = 10_000

@Injectable()
export class TraceConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TraceConsumerService.name)
    private readonly buffer: any[] = []
    private flushing = false
    private stopping = false
    private timer?: NodeJS.Timeout
    private runner?: Promise<void>

    constructor(
        @Inject(KAFKA_CONSUMER) private readonly kafkaConsumer: Consumer,
        @Inject(CLICKHOUSE_CLIENT) private readonly clickhouseClient: ClickHouseClient
    ) {}

    async onModuleInit() {
        // 降级容忍：启动时 Kafka 不可用只打日志并按间隔重试，不阻塞应用启动
        this.runner = this.startConsumer().catch(() => {})

        this.timer = setInterval(() => {
            this.flush().catch(error => {
                this.logger.error('Scheduled trace flush failed', error)
            })
        }, 1000)
    }

    async onModuleDestroy() {
        this.stopping = true

        clearInterval(this.timer)

        await this.flush().catch(error => {
            this.logger.error('Final trace flush failed', error)
        })

        await this.kafkaConsumer.disconnect().catch(error => {
            this.logger.error('Trace consumer disconnect failed', error)
        })
    }

    private async startConsumer(): Promise<void> {
        while (!this.stopping) {
            try {
                await this.kafkaConsumer.connect()
                await this.kafkaConsumer.subscribe({
                    topic: TRACE_TOPIC,
                    fromBeginning: false,
                })

                // run() 会一直消费，只有在消费者停止时才返回
                await this.kafkaConsumer.run({
                    eachMessage: async ({ message }) => {
                        const rawValue = message.value?.toString()

                        if (!rawValue) {
                            return
                        }

                        const payload = JSON.parse(rawValue)

                        this.buffer.push(payload)

                        if (this.buffer.length >= 500) {
                            await this.flush()
                        }
                    },
                })

                return
            } catch (error) {
                if (this.stopping) {
                    return
                }

                this.logger.error(
                    `Trace consumer failed to start, retrying in ${CONSUMER_RETRY_DELAY_MS / 1000}s: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                )

                await new Promise(resolve => setTimeout(resolve, CONSUMER_RETRY_DELAY_MS))
            }
        }
    }

    private async flush() {
        if (this.flushing || this.buffer.length === 0) {
            return
        }

        this.flushing = true

        const events = [...this.buffer]
        this.buffer.length = 0

        try {
            // 实际存储到 clickhouse
            await this.clickhouseClient.insert({
                table: 'base_monitor_storage',
                values: events.map(event => ({
                    app_id: event.app_id,
                    event_id: event.event_id ?? '',
                    event_type: event.event_type,
                    message: event.message,
                    info: event.info,
                })),
                columns: ['app_id', 'event_id', 'event_type', 'message', 'info'],
                format: 'JSONEachRow',
            })

            this.logger.log(`Inserted ${events.length} trace events into ClickHouse`)
        } catch (error) {
            this.buffer.unshift(...events)

            throw error
        } finally {
            this.flushing = false
        }
    }
}
