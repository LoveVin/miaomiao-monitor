import { join } from 'node:path'

export default () => {
    const host = process.env.DATABASE_HOST
    const port = Number.parseInt(process.env.DATABASE_PORT ?? '', 10)
    const username = process.env.DATABASE_USERNAME
    const password = process.env.DATABASE_PASSWORD
    const database = process.env.DATABASE_NAME

    if (!host || !Number.isInteger(port) || !username || !password || !database) {
        throw new Error(
            'Missing database environment variables: DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME'
        )
    }

    return {
        database: {
            type: 'postgres',
            host,
            port,
            username,
            password,
            database,
            entities: [join(import.meta.dirname, '../', '**/**.entity{.ts,.js}')],
            synchronize: true,
        },
    }
}
