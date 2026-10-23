import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'

import { registerSchemaDoc } from './user.dto.js'
import { UserService } from './user.service.js'

@ApiTags('用户')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    @ApiOperation({ summary: '用户注册' })
    @ApiBody({ schema: registerSchemaDoc, description: '注册所需参数' })
    async add(@Body() body) {
        const newUser = await this.userService.register(body)
        return { data: newUser, success: true }
    }
}
