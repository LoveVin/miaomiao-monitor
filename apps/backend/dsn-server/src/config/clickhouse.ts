export default () => {
    const url = process.env.CLICKHOUSE_URL
    const username = process.env.CLICKHOUSE_USERNAME
    const password = process.env.CLICKHOUSE_PASSWORD
    const database = process.env.CLICKHOUSE_DATABASE

    if (!url || !username || !password || !database) {
        throw new Error(
            'Missing ClickHouse environment variables: CLICKHOUSE_URL, CLICKHOUSE_USERNAME, CLICKHOUSE_PASSWORD, CLICKHOUSE_DATABASE'
        )
    }

    return {
        clickhouse: {
            url,
            username,
            password,
            database,
        },
    }
}
