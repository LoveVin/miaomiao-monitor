import type { ClickHouseClient } from '@clickhouse/client'
import { Inject, Injectable } from '@nestjs/common'

export interface MetricSample {
    value: number | null
    count: number
}

@Injectable()
export class MetricsService {
    constructor(@Inject('CLICKHOUSE_CLIENT') private readonly client: ClickHouseClient) {}

    async evaluate(rule: {
        applicationId: string
        type: 'error_count' | 'performance'
        metricName: string | null
        aggregation: 'count' | 'avg' | 'p95'
        windowSeconds: number
    }): Promise<MetricSample> {
        const to = new Date()
        const from = new Date(to.getTime() - rule.windowSeconds * 1000)
        const params = {
            appId: rule.applicationId,
            from: from.toISOString(),
            to: to.toISOString(),
        }

        if (rule.type === 'error_count') {
            // 与性能告警一致，按 event_id 去重，避免重试上报重复计数
            const result = await this.client.query({
                query: `
                    WITH if(
                             event_id = '',
                             concat('legacy-', toString(cityHash64(app_id, event_type, message, toJSONString(info), created_at))),
                             event_id
                         ) AS dedupe_id
                    SELECT count() AS sample_count
                    FROM (
                        SELECT dedupe_id
                        FROM base_monitor_storage
                        WHERE app_id = {appId:String}
                          AND event_type = 'error'
                          AND created_at >= parseDateTimeBestEffort({from:String})
                          AND created_at < parseDateTimeBestEffort({to:String})
                        GROUP BY dedupe_id
                    )
                `,
                query_params: params,
                format: 'JSONEachRow',
            })
            const [row] = await result.json<{ sample_count: string | number }>()
            const count = Number(row?.sample_count ?? 0)
            return { value: count, count }
        }

        const result = await this.client.query({
            query: `
                WITH JSONExtractRaw(toJSONString(info), 'value') AS raw_value,
                     toFloat64OrNull(raw_value) AS metric_value,
                     if(
                         event_id = '',
                         concat('legacy-', toString(cityHash64(app_id, event_type, message, toJSONString(info), created_at))),
                         event_id
                     ) AS dedupe_id
                SELECT
                    count() AS sample_count,
                    avg(metric_value) AS average,
                    quantileTDigest(0.95)(metric_value) AS p95
                FROM (
                    SELECT dedupe_id, any(metric_value) AS metric_value
                    FROM base_monitor_storage
                    WHERE app_id = {appId:String}
                      AND event_type = 'performance'
                      AND JSONExtractString(toJSONString(info), 'name') = {metricName:String}
                      AND created_at >= parseDateTimeBestEffort({from:String})
                      AND created_at < parseDateTimeBestEffort({to:String})
                      AND isNotNull(metric_value)
                      AND isFinite(metric_value)
                    GROUP BY dedupe_id
                )
            `,
            query_params: { ...params, metricName: rule.metricName ?? '' },
            format: 'JSONEachRow',
        })
        const [row] = await result.json<{ sample_count: string | number; average: string | number; p95: string | number }>()
        const count = Number(row?.sample_count ?? 0)
        const aggregate = rule.aggregation === 'p95' ? Number(row?.p95) : Number(row?.average)
        return { value: count && Number.isFinite(aggregate) ? aggregate : null, count }
    }
}
