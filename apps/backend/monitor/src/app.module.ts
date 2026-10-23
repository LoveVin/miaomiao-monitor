import { join } from 'node:path'

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import database from './config/database.js'
import { ApplicationModule } from './modules/application/application.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { UserModule } from './modules/user/user.module.js'

@Module({
    imports: [
        // 环境变量相关配置
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: join(import.meta.dirname, `../../../../.env.${process.env.NODE_ENV ?? 'development'}`),
            load: [database],
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
    ],
    providers: [],
})
export class AppModule {}
