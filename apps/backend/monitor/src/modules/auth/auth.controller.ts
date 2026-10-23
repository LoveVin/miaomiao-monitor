import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'

import { loginSchemaDoc } from './auth.dto.js'
import { AuthService } from './auth.service.js'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: '用户登录' })
    @ApiBody({ schema: loginSchemaDoc, description: '登录所需参数' })
    async login(@Body() body: { username: string; password: string }) {
        return await this.authService.login(body.username, body.password)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    @ApiOperation({ summary: '获取当前登录用户信息' })
    getProfile(@Request() req) {
        return req.user
    }
}
