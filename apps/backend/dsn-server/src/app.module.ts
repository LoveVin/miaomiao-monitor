import { join } from 'node:path'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import clickhouseConfig from './config/clickhouse.js'
import kafkaConfig from './config/kafka.js'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module.js'
import { KafkaModule } from './fundamentals/kafka/kafka.module.js'
import { TraceModule } from './modules/trace/trace.module.js'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: join(import.meta.dirname, `../../../../.env.${process.env.NODE_ENV ?? 'development'}`),
            load: [clickhouseConfig, kafkaConfig],
        }),
        ClickhouseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return config.get('clickhouse')
            },
        }),
        KafkaModule.forRootSync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return config.get('kafka')
            },
        }),
        TraceModule,
    ],
    providers: [],
})
export class AppModule {}
