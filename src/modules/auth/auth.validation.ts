
import { generalFields } from '../../middleware/validation.middleware';
import {z} from 'zod'

export const login ={
    body: z.strictObject ({
        email: generalFields.email,
        password:generalFields.password,
    })
}



export const signup ={
    body: login.body.extend ({
      username: generalFields.username,
      confirmPassword:generalFields.confirmPassword
    })
    .superRefine((data , ctx) => {
        console.log({data ,ctx});

        if (data.confirmPassword !== data.password){
    ctx.addIssue({
        code:"custom",
        path: ["confirmEmail"],
        message: "password mismatch confirmPassword"

    })
}
 
if (data.username?.split(" ")?.length!=2){
    ctx.addIssue({
        code:"custom",
        path: ["username"],
        message: "username must consist of 2 parts like ex:JONE DOE"

    })
}

    })
}

export const confirmEmail ={
    body: z.strictObject ({
        email: generalFields.email,
        otp:generalFields.otp
    })
  
}

export const signupWithGmail={
    body: z.strictObject ({
        idToken:z.string()
    })
  
}

export const sendForgotPasswordCode={
    body: z.strictObject ({
      email: generalFields.email, 
    })
}
export const verifyForgotPassword={
    body:sendForgotPasswordCode.body.extend ({
        otp:generalFields.otp, 
    })
}
export const resetForgotPassword={
    body:sendForgotPasswordCode.body.extend ({
        otp:generalFields.otp, 
        password: generalFields.password,
        confirmPassword: generalFields.confirmPassword
    }).refine((data)=>{
return data.password === data.confirmPassword
    },{message:"password missmatch confirm password",path:['confirmPassword']})
}

export const verify2faLogin = { 
  body: z.strictObject({
    email: z.string().email(),
    otp: z.number().int().min(100000).max(999999)
  })
}
