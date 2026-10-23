import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { UserEntity } from '../../entities/user.entity.js'

@Injectable()
export class UserService {
    constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>) {}

    /**
     * 校验用户（登录用）：账号不存在或密码错误时统一提示，避免暴露账号是否存在
     */
    async validateUser(username: string, password: string) {
        const user = await this.userRepository.findOne({
            where: {
                username,
                password,
            },
        })
        if (!user) {
            throw new UnauthorizedException('账号或密码错误')
        }
        return user
    }

    /**
     * 根据主键查询用户（供 JWT 校验使用，去除敏感字段）
     */
    async findById(id: number) {
        const user = await this.userRepository.findOne({
            where: {
                id,
            },
        })
        if (!user) {
            throw new UnauthorizedException('登录状态已失效，请重新登录')
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user
        return result
    }

    /**
     * 注册用户
     */
    async register(body) {
        if (!body?.username || !body?.password) {
            throw new BadRequestException('用户名和密码不能为空')
        }
        const userIsExist = await this.userRepository.findOne({
            where: {
                username: body.username,
            },
        })
        if (userIsExist) {
            throw new BadRequestException('用户名已被注册')
        }
        const user = this.userRepository.create(body)
        await this.userRepository.save(user)
        return user
    }
}
