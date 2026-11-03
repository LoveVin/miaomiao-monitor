import { DynamicModule, Global, Logger, Module } from '@nestjs/common'
import { Consumer, Kafka, Producer } from 'kafkajs'

import { KAFKA_CLIENT, KAFKA_CONSUMER, KAFKA_PRODUCER, TRACE_CONSUMER_GROUP } from './constants.js'

interface KafkaModuleOptions {
    clientId: string
    brokers: string[]
}

interface KafkaModuleAsyncOptions {
    inject?: any[]
    useFactory: (...args: any[]) => KafkaModuleOptions | Promise<KafkaModuleOptions>
}

@Global()
@Module({})
export class KafkaModule {
    static forRootSync(options: KafkaModuleAsyncOptions): DynamicModule {
        const logger = new Logger(KafkaModule.name)

        return {
            module: KafkaModule,
            imports: [],
            providers: [
                {
                    provide: KAFKA_CLIENT,
                    inject: options.inject,
                    useFactory: async (...args: any[]) => {
                        const kafkaOptions = await options.useFactory(...args)

                        return new Kafka({
                            clientId: kafkaOptions.clientId,
                            brokers: kafkaOptions.brokers,
                        })
                    },
                },
                {
                    provide: KAFKA_PRODUCER,
                    inject: [KAFKA_CLIENT],
                    useFactory: async (kafka: Kafka): Promise<Producer> => {
                        const producer = kafka.producer({
                            idempotent: true,
                        })

                        // 降级容忍：Kafka 不可用时应用必须能正常启动，
                        // kafkajs 会在 send() 时懒连接并自动重试，这里不阻塞启动
                        producer.connect().catch(error => {
                            logger.error(`Kafka producer initial connect failed, will retry on send: ${error}`)
                        })

                        return producer
                    },
                },
                {
                    provide: KAFKA_CONSUMER,
                    inject: [KAFKA_CLIENT],
                    useFactory: async (kafka: Kafka): Promise<Consumer> => {
                        const consumer = kafka.consumer({
                            groupId: TRACE_CONSUMER_GROUP,
                        })

                        // 连接与订阅由 TraceConsumerService 负责重试，这里不阻塞启动
                        return consumer
                    },
                },
            ],
            exports: [KAFKA_CLIENT, KAFKA_PRODUCER, KAFKA_CONSUMER],
        }
    }
}
