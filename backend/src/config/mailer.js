import nodemailer from 'nodemailer'
import { ENV } from '../libs/environments.js'

export const transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: Number(ENV.smtpPort),
    secure: true,
    auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPassword
    }
})