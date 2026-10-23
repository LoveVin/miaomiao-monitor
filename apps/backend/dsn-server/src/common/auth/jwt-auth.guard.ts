import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'

interface JwtPayload {
    sub?: unknown
    username?: unknown
}

interface AuthenticatedRequest extends Request {
    user?: JwtPayload
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
        const authorization = request.headers.authorization

        if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException('缺少登录 token')
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(authorization.slice(7))

            if (!payload.sub) {
                throw new UnauthorizedException('登录 token 无效')
            }

            request.user = payload
            return true
        } catch {
            throw new UnauthorizedException('登录 token 无效或已过期')
        }
    }
}
