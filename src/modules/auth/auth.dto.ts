// export interface IsignupBodyINputDto{
//     username:string;
//     email:string;
//     password:string;
// }

import * as validators from "./auth.validation"
import {z} from 'zod'

export type IsignupBodyINputDto = z.infer<typeof validators.signup.body>
export type IconfirmEmailBodyINputDto = z.infer<typeof validators.confirmEmail.body>
export type ILoginBodyINputDto = z.infer<typeof validators.login.body>
export type IForgotcodeBodyINputDto = z.infer<typeof validators.sendForgotPasswordCode.body>
export type IGmail = z.infer<typeof validators.signupWithGmail.body>
export type IVerifycodeBodyINputDto = z.infer<typeof validators.verifyForgotPassword.body>
export type IResetcodeBodyINputDto = z.infer<typeof validators.resetForgotPassword.body>