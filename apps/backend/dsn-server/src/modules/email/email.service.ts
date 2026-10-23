import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class EmailService {
    constructor(private readonly mailerService: MailerService) {}

    sendEmail() {
        this.mailerService.sendMail({
            to: '123@qq.com',
            from: '',
            subject: 'Test email',
            template: 'test-email',
        })
    }
}
