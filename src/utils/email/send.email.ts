import {createTransport, Transporter} from "nodemailer"
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestException } from "../response/error.response";

export type SendEmailWithTags = Mail.Options & { tags?: string[] };
export const sendEmail = async (data: SendEmailWithTags): Promise<void> => {
    if(!data.html && !data.attachments?.length && !data.text){
        throw new BadRequestException("missing email content")
    }
    const transporter :
    Transporter <SMTPTransport.SentMessageInfo,SMTPTransport.Options>= createTransport({
        service:"gmail",
        auth : {
            user:process.env.EMAIL as string,
            pass:process.env.EMAIL_PASSWORD as string,
        }

    })



const headers = data.tags && data.tags.length ? { 'X-Tags': data.tags.join(',') } : undefined;
const subject = data.tags && data.tags.length ? `[${data.tags.join(', ')}] ${data.subject||''}`.trim() : data.subject;
const info = await transporter.sendMail({
    ...data,
    headers,
    subject,
    from: `" FIKA ${process.env.APPLICATION_NAME}" <${process.env.EMAIL as string }>`,
  });

console.log("MESSAGE send :" ,info.messageId);

}