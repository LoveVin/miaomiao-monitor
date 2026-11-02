import { lookup } from 'node:dns/promises'
import net from 'node:net'

import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer, { type Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
    private transporter?: Transporter

    constructor(private readonly config: ConfigService) {}

    async send(to: string, subject: string, text: string, html: string): Promise<void> {
        const { transporter, from } = await this.getTransport()
        await transporter.sendMail({ from, to, subject, text, html })
    }

    async sendRuleVerification(to: string, ruleName: string, token: string): Promise<void> {
        const baseUrl = this.config.get<string>('APP_WEB_URL') ?? 'http://localhost:5173'
        const link = new URL('/alerts/email/verify', baseUrl)
        link.searchParams.set('token', token)
        const text = `请确认接收喵喵监控告警规则「${ruleName}」的通知：\n${link.toString()}\n链接 30 分钟内有效。如非本人操作，请忽略此邮件。`
        const html = `<p>${escapeHtml(`请确认接收告警规则「${ruleName}」的通知。`)}</p><p><a href="${escapeHtml(link.toString())}">确认收件邮箱</a></p><p>链接 30 分钟内有效。如非本人操作，请忽略此邮件。</p>`
        await this.send(to, '验证喵喵监控告警收件邮箱', text, html)
    }

    private async getTransport(): Promise<{ transporter: Transporter; from: string }> {
        if (this.transporter) {
            return { transporter: this.transporter, from: this.config.getOrThrow<string>('SMTP_FROM') }
        }

        const host = this.config.get<string>('SMTP_HOST')
        const configuredPort = this.config.get<string>('SMTP_PORT')
        const port = configuredPort ? Number.parseInt(configuredPort, 10) : 587
        const from = this.config.get<string>('SMTP_FROM')
        if (!host || !from) {
            throw new ServiceUnavailableException('邮件服务尚未配置，请联系管理员')
        }

        const user = this.config.get<string>('SMTP_USERNAME')
        const pass = this.config.get<string>('SMTP_PASSWORD')
        const resolvedHost = net.isIP(host) ? host : (await lookup(host, { family: 4 })).address
        this.transporter = nodemailer.createTransport({
            host: resolvedHost,
            port,
            secure: port === 465,
            tls: { servername: host },
            ...(user && pass ? { auth: { user, pass } } : {}),
        })

        return { transporter: this.transporter, from }
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}
