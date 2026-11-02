import { join } from 'node:path'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'

import clickhouse from './config/clickhouse.js'
import database from './config/database.js'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module.js'
import { AlertsModule } from './modules/alerts/alerts.module.js'
import { ApplicationModule } from './modules/application/application.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { EmailModule } from './modules/email/email.module.js'
import { UserModule } from './modules/user/user.module.js'

@Module({
    imports: [
        // 环境变量相关配置
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: join(import.meta.dirname, `../../../../.env.${process.env.NODE_ENV ?? 'development'}`),
            load: [database, clickhouse],
        }),

        ScheduleModule.forRoot(),
        EmailModule,
        ClickhouseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => config.getOrThrow('clickhouse'),
        }),

        // typeorm
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return config.get('database')
            },
        }),

        AuthModule,
        UserModule,
        ApplicationModule,
        AlertsModule,
    ],
    providers: [],
})
export class AppModule {}
