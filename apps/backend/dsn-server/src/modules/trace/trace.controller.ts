import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common'
import { HttpCode, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js'
import { TraceService } from './trace.service.js'

@ApiTags('性能指标')
@Controller()
export class TraceController {
    private readonly logger = new Logger(TraceController.name)

    constructor(private readonly traceService: TraceService) {}

    @Post('tracing/:app_id')
    @HttpCode(HttpStatus.ACCEPTED)
    async tracing(
        @Param() { app_id }: { app_id: string },
        @Body() params: { event_type: string; message: string }
    ) {
        // 降级兜底：持久化失败也不能让采集入口报错，业务方不应感知监控系统故障
        try {
            await this.traceService.tracing(app_id, params)
        } catch (error) {
            this.logger.error(
                `Failed to persist trace event (dropped): ${error instanceof Error ? error.stack || error.message : String(error)}`
            )
        }
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('all')
    getAll() {
        return this.traceService.getAll()
    }

    @ApiOperation({ summary: '获取错误信息' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('bugs')
    getBugs() {
        return this.traceService.getBugs()
    }

    @ApiOperation({ summary: '获取性能指标' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('performance')
    getPerformance() {
        return this.traceService.getPerformance()
    }
}
