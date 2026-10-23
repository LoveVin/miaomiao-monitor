import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryFailedError, Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity.js'

@Injectable()
export class ApplicationService {
    constructor(@InjectRepository(ApplicationEntity) private readonly applicationRepository: Repository<ApplicationEntity>) {}

    /**
     * 创建应用
     */
    async create(app: ApplicationEntity) {
        const existing = await this.applicationRepository.findOne({
            where: {
                name: app.name,
                user: { id: app.user.id },
            },
        })

        if (existing) {
            throw new ConflictException('应用名称已存在')
        }

        try {
            const savedApp = await this.applicationRepository.save(app)
            return savedApp
        } catch (error) {
            if (error instanceof QueryFailedError && (error.driverError as { code?: string } | undefined)?.code === '23505') {
                throw new ConflictException('应用名称已存在')
            }
            throw error
        }
    }

    /**
     * 更新应用
     */
    async update(params: { id: number; userId: number; name?: string; description?: string }) {
        const app = await this.applicationRepository.findOne({
            where: {
                id: params.id,
                user: { id: params.userId },
            },
        })

        if (!app) {
            throw new NotFoundException('Application not found')
        }

        if (params.name !== undefined && params.name !== app.name) {
            const existing = await this.applicationRepository.findOne({
                where: {
                    name: params.name,
                    user: { id: params.userId },
                },
            })

            if (existing && existing.id !== app.id) {
                throw new ConflictException('应用名称已存在')
            }
        }

        if (params.name !== undefined) {
            app.name = params.name
        }

        if (params.description !== undefined) {
            app.description = params.description
        }

        app.updatedAt = new Date()

        return this.applicationRepository.save(app)
    }

    /**
     * 查询用户的所有应用
     */
    async list(params: { userId: number }) {
        const [apps, count] = await this.applicationRepository.findAndCount({
            where: {
                user: {
                    id: params.userId,
                },
            },
        })
        return { applications: apps, count }
    }

    /**
     * 删除应用
     */
    async delete(params: { appId: string; userId: number }) {
        const result = await this.applicationRepository.delete({
            appId: params.appId,
            user: {
                id: params.userId,
            },
        })
        if (result.affected === 0) {
            throw new NotFoundException('Application not found')
        }
        return result
    }
}
