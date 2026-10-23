import { randomUUID } from 'node:crypto'

import { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable } from '@nestjs/common'
import { Producer } from 'kafkajs'

import { KAFKA_PRODUCER, TRACE_TOPIC } from '../../fundamentals/kafka/constants.js'

@Injectable()
export class TraceService {
    constructor(
        @Inject(KAFKA_PRODUCER) private kafkaProducer: Producer,
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient
    ) {}

    async tracing(app_id: string, params: { event_type: string; message: string }) {
        const { event_type, message, ...rest } = params
        const values = {
            event_id: randomUUID(),
            app_id,
            event_type,
            message,
            info: rest,
            // 记录当前时间，因为 kafka 写入 clickhouse 是有延迟的，所以需要记录当前时间
            occurred_at: new Date().toISOString(),
        }

        // 不直接存入 clickhouse，先存储到 kafka 中，等待 clickhouse 从 kafka 中消费数据
        await this.kafkaProducer.send({
            topic: TRACE_TOPIC,
            messages: [
                {
                    key: app_id,
                    value: JSON.stringify(values),
                },
            ],
        })

        // 直接写入 clickhouse 太频繁，使用 kafka 缓冲消息
        // const res = await this.clickhouseClient.insert({
        //     table: 'base_monitor_storage',
        //     values,
        //     columns: ['app_id', 'event_type', 'message', 'info'],
        //     format: 'JSONEachRow',
        // })

        // Logger.log('Query result', JSON.stringify(res.summary))
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

        return groupData(queryResult.data)
    }
}

function groupData(data) {
    return data.reduce((acc, cur) => {
        const { app_id, info } = cur
        const { path } = info

        if (!acc[app_id]) {
            acc[app_id] = {}
        }

        if (!acc[app_id][path]) {
            acc[app_id][path] = []
        }

        acc[app_id][path].push(cur)

        return acc
    }, {})
}
