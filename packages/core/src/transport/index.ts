/**
 * 传输接口
 */
export interface Transport {
    send(data: Record<string, unknown>): void
}
