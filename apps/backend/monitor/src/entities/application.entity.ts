import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity.js'

@Entity({ name: 'application' })
@Index('UQ_application_user_name', ['user', 'name'], { unique: true })
export class ApplicationEntity {
    constructor(partial: Partial<ApplicationEntity>) {
        Object.assign(this, partial)
    }

    /**
     * 主键
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * 应用ID
     */
    @Column({ type: 'varchar', length: 100 })
    appId: string

    /**
     * 应用类型
     */
    @Column({ type: 'varchar', length: 20 })
    type: 'vanilla' | 'react' | 'vue' | 'nodejs'

    /**
     * 应用名称
     */
    @Column({ type: 'varchar', length: 255 })
    name: string

    /**
     * 应用描述
     */
    @Column({ type: 'text', nullable: true })
    description: string

    /**
     * 创建时间
     */
    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    /**
     * 更新时间
     */
    @Column({ nullable: true })
    updatedAt: Date

    /**
     * 应用所属用户
     */
    @ManyToOne('UserEntity', 'applications')
    user: UserEntity
}
