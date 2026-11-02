import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { z } from 'zod'

import { ZodValidationPipe } from '../../pipes/zod-validation-pipe.js'
import { createRuleRequestSchema, updateAlertSchema, verifyRuleEmailSchema } from './alert.dto.js'
import { AlertsService } from './alerts.service.js'

const applicationQuerySchema = z.object({ applicationId: z.string().min(1).max(100).optional() })

@ApiTags('告警')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get()
    async list(@Request() request, @Query(new ZodValidationPipe(applicationQuerySchema)) query: { applicationId?: string }) {
        return { data: await this.alertsService.listRules(request.user.id, query.applicationId), success: true }
    }

    @Post()
    async create(@Request() request, @Body(new ZodValidationPipe(createRuleRequestSchema)) body) {
        return { data: await this.alertsService.createRule(request.user.id, body), success: true }
    }

    @Patch(':id')
    async update(@Request() request, @Param('id') id: string, @Body(new ZodValidationPipe(updateAlertSchema)) body) {
        return { data: await this.alertsService.updateRule(request.user.id, id, body), success: true }
    }

    @Post(':id/email/verification')
    async requestEmailVerification(@Request() request, @Param('id') id: string) {
        await this.alertsService.requestEmailVerification(request.user.id, id)
        return { success: true }
    }

    @Get('incidents')
    async incidents(@Request() request, @Query(new ZodValidationPipe(applicationQuerySchema)) query: { applicationId?: string }) {
        return { data: await this.alertsService.listIncidents(request.user.id, query.applicationId), success: true }
    }

    @Post('incidents/:id/acknowledge')
    async acknowledge(@Request() request, @Param('id') id: string) {
        return { data: await this.alertsService.acknowledgeIncident(request.user.id, id), success: true }
    }
}

@ApiTags('告警')
@Controller('alerts/email')
export class AlertEmailVerificationController {
    constructor(private readonly alertsService: AlertsService) {}

    @Post('verify')
    async verify(@Body(new ZodValidationPipe(verifyRuleEmailSchema)) body: { token: string }) {
        await this.alertsService.verifyEmail(body.token)
        return { success: true }
    }
}
