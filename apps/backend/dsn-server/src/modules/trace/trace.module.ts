import { Module } from '@nestjs/common'

import { AuthModule } from '../../common/auth/auth.module.js'
import { TraceController } from './trace.controller.js'
import { TraceService } from './trace.service.js'
import { TraceConsumerService } from './trace-consumer.service.js'

@Module({
    imports: [AuthModule],
    controllers: [TraceController],
    providers: [TraceService, TraceConsumerService],
    exports: [],
})
export class TraceModule {}
