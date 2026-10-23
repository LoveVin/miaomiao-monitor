import { BadRequestException, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { UserService } from '../user/user.service.js'

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async login(username: string, password: string) {
        if (!username || !password) {
            throw new BadRequestException('用户名和密码不能为空')
        }
        const user = await this.userService.validateUser(username, password)
        const payload = { sub: user.id, username: user.username }
        return {
            access_token: this.jwtService.sign(payload),
        }
    }

    async logout(): Promise<boolean> {
        return true
    }
}
