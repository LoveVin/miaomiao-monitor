import { createClient } from '@clickhouse/client'
import { DynamicModule, Global, Module } from '@nestjs/common'

interface ClickhouseModuleOptions {
    url: string
    username: string
    password: string
    database?: string
}

interface ClickhouseModuleAsyncOptions {
    imports?: DynamicModule['imports']
    inject?: any[]
    useFactory: (...args: any[]) => ClickhouseModuleOptions | Promise<ClickhouseModuleOptions>
}

@Global()
@Module({})
export class ClickhouseModule {
    static forRootAsync(options: ClickhouseModuleAsyncOptions): DynamicModule {
        return {
            module: ClickhouseModule,
            imports: options.imports,
            providers: [
                {
                    provide: 'CLICKHOUSE_CLIENT',
                    inject: options.inject,
                    useFactory: async (...args: any[]) => {
                        const clickhouseOptions = await options.useFactory(...args)
                        return createClient(clickhouseOptions)
                    },
                },
            ],
            exports: ['CLICKHOUSE_CLIENT'],
        }
    }
}
