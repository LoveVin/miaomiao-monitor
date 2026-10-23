import { Body, Controller, Delete, Get, Post, Put, Request, UseGuards, UsePipes } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { nanoid } from 'nanoid'

import { ApplicationEntity } from '../../entities/application.entity.js'
import { UserEntity } from '../../entities/user.entity.js'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe.js'
import {
    CreateApplicationDto,
    createApplicationSchema,
    createApplicationSchemaDoc,
    DeleteApplicationDto,
    deleteApplicationSchema,
    deleteApplicationSchemaDoc,
    UpdateApplicationDto,
    updateApplicationSchema,
    updateApplicationSchemaDoc,
} from './application.dto.js'
import { ApplicationService } from './application.service.js'

@ApiTags('应用管理')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('application')
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}

    /**
     * 创建应用
     * 使用 ZodValidationPipe 校验请求体的格式
     */
    @Post()
    @ApiOperation({ summary: '创建应用' })
    @ApiBody({ schema: createApplicationSchemaDoc, description: '创建应用所需参数' })
    @UsePipes(new ZodValidationPipe(createApplicationSchema))
    async create(@Body() body: CreateApplicationDto, @Request() req) {
        const user = new UserEntity()
        user.id = req.user.id
        const app = new ApplicationEntity(body)
        // 生成唯一的应用ID
        app.appId = body.type + nanoid(6)

        const newApp = await this.applicationService.create({ ...app, user })
        return { data: newApp, success: true }
    }

    /**
     * 更新应用
     */
    @Put()
    @ApiOperation({ summary: '更新应用' })
    @ApiBody({ schema: updateApplicationSchemaDoc, description: '需要更新的应用字段' })
    @UsePipes(new ZodValidationPipe(updateApplicationSchema))
    async update(@Body() body: UpdateApplicationDto, @Request() req) {
        const updatedApp = await this.applicationService.update({
            id: body.id,
            userId: req.user.id,
            name: body.name,
            description: body.description,
        })
        return { data: updatedApp, success: true }
    }

    /**
     * 查询当前用户的所有应用
     */
    @Get()
    @ApiOperation({ summary: '查询当前用户的所有应用' })
    async list(@Request() req) {
        const apps = await this.applicationService.list({
            userId: req.user.id,
        })
        return { data: apps, success: true }
    }

    /**
     * 删除应用
     * 使用 ZodValidationPipe 校验请求体的格式
     */
    @Delete()
    @ApiOperation({ summary: '删除应用' })
    @ApiBody({ schema: deleteApplicationSchemaDoc, description: '删除应用所需参数' })
    @UsePipes(new ZodValidationPipe(deleteApplicationSchema))
    async delete(@Body() body: DeleteApplicationDto, @Request() req) {
        const deletedApp = this.applicationService.delete({
            appId: body.appId,
            userId: req.user.id,
        })
        return { data: deletedApp, success: true }
    }
}
