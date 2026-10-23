import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common'
import { HttpCode, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js'
import { TraceService } from './trace.service.js'

@ApiTags('性能指标')
@Controller()
export class TraceController {
    constructor(private readonly traceService: TraceService) {}

    @Post('tracing/:app_id')
    @HttpCode(HttpStatus.ACCEPTED)
    tracing(@Param() { app_id }: { app_id: string }, @Body() params: { event_type: string; message: string }) {
        Logger.log(app_id)
        Logger.log(params)
        return this.traceService.tracing(app_id, params)
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
