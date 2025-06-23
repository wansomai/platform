
import nodemailer from 'nodemailer';


export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-mail.outlook.com',

  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});