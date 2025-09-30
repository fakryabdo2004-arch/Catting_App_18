import {z} from "zod"
import { logoutEnum } from "../../utils/security/token.security"

export const logout = { 
    body:z.strictObject({
        flag:z.enum(logoutEnum).default(logoutEnum.only)
    })
}

export const updateBasic = {
  body: z.strictObject({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    phone: z.string().min(5).max(20).optional(),
    gender: z.enum(["male","female"]).optional(),
  }).refine(d=>Object.keys(d).length>0, { message: "No fields to update" })
}

export const updatePassword = {
  body: z.strictObject({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
  })
}

export const requestEmailUpdate = {
  body: z.strictObject({
    newEmail: z.string().email()
  })
}

export const confirmEmailUpdate = {
  body: z.strictObject({
    newEmail: z.string().email(),
    otp: z.number().int().min(100000).max(999999)
  })
}

export const sendMailWithTags = {
  body: z.strictObject({
    to: z.string().email(),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).refine(d=>d.html || d.text, { message: "Provide html or text" })
}

export const twofaEnable = { body: z.strictObject({}).optional() }
export const twofaVerify = { body: z.strictObject({ otp: z.number().int().min(100000).max(999999) }) }
export const twofaDisable = { body: z.strictObject({}).optional() }
