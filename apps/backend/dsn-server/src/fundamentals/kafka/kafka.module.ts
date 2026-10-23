import { DynamicModule, Global, Module } from '@nestjs/common'
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

                        await producer.connect()

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

                        await consumer.connect()

                        return consumer
                    },
                },
            ],
            exports: [KAFKA_CLIENT, KAFKA_PRODUCER, KAFKA_CONSUMER],
        }
    }
}
