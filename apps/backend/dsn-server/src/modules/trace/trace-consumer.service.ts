import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Consumer } from 'kafkajs'

import { KAFKA_CONSUMER, TRACE_TOPIC } from '../../fundamentals/kafka/constants.js'

const CLICKHOUSE_CLIENT = 'CLICKHOUSE_CLIENT'

@Injectable()
export class TraceConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly buffer: any[] = []
    private flushing = false
    private timer?: NodeJS.Timeout

    constructor(
        @Inject(KAFKA_CONSUMER) private readonly kafkaConsumer: Consumer,
        @Inject(CLICKHOUSE_CLIENT) private readonly clickhouseClient: ClickHouseClient
    ) {}

    async onModuleInit() {
        await this.kafkaConsumer.subscribe({
            topic: TRACE_TOPIC,
            fromBeginning: false,
        })

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

        this.timer = setInterval(() => {
            this.flush().catch(error => {
                Logger.error('Scheduled trace flush failed', error)
            })
        }, 1000)
    }

    async onModuleDestroy() {
        clearInterval(this.timer)

        await this.flush()
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
                    event_type: event.event_type,
                    message: event.message,
                    info: event.info,
                })),
                columns: ['app_id', 'event_type', 'message', 'info'],
                format: 'JSONEachRow',
            })

            Logger.log(`Inserted ${events.length} trace events into ClickHouse`)
        } catch (error) {
            this.buffer.unshift(...events)

            throw error
        } finally {
            this.flushing = false
        }
    }
}
