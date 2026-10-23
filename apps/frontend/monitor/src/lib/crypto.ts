/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */
import bcrypt from 'bcryptjs'

// 加密密码
const saltRounds = '$2a$10$j08v6qUb20lAUMyyG2d0TO' // 推荐盐的复杂度设置为10

export const encrypt = async (password: string) => bcrypt.hash(password, saltRounds)

export const encryptCompare = async (password: string, hash: string) => bcrypt.compare(password, hash)
