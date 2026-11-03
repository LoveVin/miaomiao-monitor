import { randomUUID } from 'node:crypto'

import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Producer } from 'kafkajs'

import { KAFKA_PRODUCER, TRACE_TOPIC } from '../../fundamentals/kafka/constants.js'

interface TracePayload {
    app_id: string
    event_id: string
    event_type: string
    message: string
    info: Record<string, unknown>
    occurred_at: string
}

@Injectable()
export class TraceService {
    private readonly logger = new Logger(TraceService.name)

    constructor(
        @Inject(KAFKA_PRODUCER) private kafkaProducer: Producer,
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient
    ) {}

    async tracing(app_id: string, params: { event_type: string; message: string }) {
        const { event_type, message, ...rest } = params
        const values: TracePayload = {
            event_id: randomUUID(),
            app_id,
            event_type,
            message,
            info: rest,
            // 记录当前时间，因为 kafka 写入 clickhouse 是有延迟的，所以需要记录当前时间
            occurred_at: new Date().toISOString(),
        }

        try {
            await this.sendToKafka(values)
        } catch (error) {
            // 降级容忍：Kafka 不可用时直写 ClickHouse，保证采集入口不丢数据
            this.logger.warn(
                `Kafka unavailable, fallback to direct ClickHouse insert: ${error instanceof Error ? error.message : String(error)}`
            )
            await this.insertToClickhouse(values)
        }
    }

    private async sendToKafka(values: TracePayload) {
        // 不直接存入 clickhouse，先存储到 kafka 中，等待消费端批量写入 clickhouse
        await this.kafkaProducer.send({
            topic: TRACE_TOPIC,
            messages: [
                {
                    key: values.app_id,
                    value: JSON.stringify(values),
                },
            ],
        })
    }

    private async insertToClickhouse(values: TracePayload) {
        await this.clickhouseClient.insert({
            table: 'base_monitor_storage',
            values: [
                {
                    app_id: values.app_id,
                    event_id: values.event_id,
                    event_type: values.event_type,
                    message: values.message,
                    info: values.info,
                },
            ],
            columns: ['app_id', 'event_id', 'event_type', 'message', 'info'],
            format: 'JSONEachRow',
        })
    }

    async getAll() {
        const query = `
        SELECT * FROM base_monitor_view;
        `
        const res = await this.clickhouseClient.query({
            query,
        })

        const queryResult = await res.json()

        return queryResult.data
    }

    async getBugs() {
        const query = `
        SELECT * FROM base_monitor_view WHERE event_type = 'error';
        `
        const res = await this.clickhouseClient.query({
            query,
        })

        const queryResult = await res.json()

        return queryResult.data
    }

    async getPerformance() {
        const query = `
        SELECT * FROM base_monitor_view WHERE event_type = 'performance';
        `
        const res = await this.clickhouseClient.query({
            query,
        })

        const queryResult = await res.json()

        return queryResult.data
    }
}
