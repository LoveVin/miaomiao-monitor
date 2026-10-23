import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module.js'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // 允许跨域
    app.enableCors()

    app.setGlobalPrefix('api')

    // 设置 swagger 相关的配置
    const swaggerOptions = new DocumentBuilder()
        .setTitle('喵喵监控平台指标微服务 API 文档')
        .setDescription('喵喵监控平台指标微服务 API 文档')
        .setVersion('1.0')
        .addBearerAuth() // 需要鉴权
        .build()

    const document = SwaggerModule.createDocument(app, swaggerOptions)
    SwaggerModule.setup('api', app, document)

    await app.listen(process.env.PORT ?? 3000)
}
await bootstrap()
