import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApplicationEntity } from '../../entities/application.entity.js'
import { UserEntity } from '../../entities/user.entity.js'
import { EmailModule } from '../email/email.module.js'
import { MetricsModule } from '../metrics/metrics.module.js'
import { AlertIncidentEntity, AlertNotificationEntity, AlertRuleEntity } from './alert.entity.js'
import { AlertEmailVerificationController, AlertsController } from './alerts.controller.js'
import { AlertsService } from './alerts.service.js'

@Module({
    imports: [
        TypeOrmModule.forFeature([ApplicationEntity, UserEntity, AlertRuleEntity, AlertIncidentEntity, AlertNotificationEntity]),
        EmailModule,
        MetricsModule,
    ],
    controllers: [AlertsController, AlertEmailVerificationController],
    providers: [AlertsService],
})
export class AlertsModule {}
