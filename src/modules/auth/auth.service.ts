import type { Request , Response } from "express"
import type { IconfirmEmailBodyINputDto, IsignupBodyINputDto ,ILoginBodyINputDto, IGmail, IForgotcodeBodyINputDto,IVerifycodeBodyINputDto, IResetcodeBodyINputDto} from "./auth.dto";
import { UserModel } from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response";
import { compareeHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/event/email.event";
import { generateNumperOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/security/token.security";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { ProviderEnum } from "../../DB/model/user.model";

class AuthenticationService{
 
    private userModel = new UserRepository(UserModel)
    constructor  () {}

private async verifyGmailAccount(idToken:string):Promise<TokenPayload> {

const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
      idToken,
      audience:process.env.WEP_CLIENT_IDS?.split(",") || [], 
  });
  const payload = ticket.getPayload();

if (!payload?.email_verified) {
 throw new BadRequestException("Fail to verify account") 
}
return payload
}

loginWithGmail = async(req : Request , res: Response):Promise<Response> => {
  const {idToken}:IGmail=req.body;
  const {email}=  await this.verifyGmailAccount(idToken)
  const user = await this.userModel.findOne({
    filter :{
      email,
      provider: ProviderEnum.GOOGLE
    },
  })
  
  if (!user) {
   throw new NotFoundException("not register account") 
  }
 

// 2FA check
if ((user as any).twoFAEnabled) {
  const { generateNumperOtp } = await import("../../utils/otp");
  const { sendEmail } = await import("../../utils/email/send.email");
  const { verifyEmail } = await import("../../utils/email/verify.template.email");
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const otp = generateNumperOtp();
  const expiresAt = new Date(Date.now() + 10*60*1000);
  await TwoFAModel.create({ userId: user._id, otp, expiresAt, type: "login" });
  await sendEmail({ to: user.email, subject: "Your login code", html: verifyEmail({ otp, title: "Your login code" }), tags: ["2fa","login"] } as any);
  return res.status(200).json({ message: "2FA required" , data: { twoFA: true } });
}
const credentials = await createLoginCredentials(user)

  return res.json({message: "Done" ,date : {credentials}})
}

signupWithGmail = async(req : Request , res: Response):Promise<Response> => {
  const {idToken}:IGmail=req.body;
  const {email,family_name,givin_name, picture} = 
  
  await this.verifyGmailAccount(idToken)
  const user = await this.userModel.findOne({
    filter :{
      email,
    },
  })
  
  if (user) {
   if(user.provider === ProviderEnum.GOOGLE){
      return await this.loginWithGmail(req,res)
   }
   throw new ConflictException(`Email exists with another provider ${user.provider}`) 
  }
const [newUser] = (await this.userModel.create({
  data:[
    {
      firstName:givin_name  as string,
      lastName : family_name as string,
      email: email as string,
      profileImage: picture  as string,
      confirmedAt : new Date(),
      provider: ProviderEnum.GOOGLE,
    },
  ],
})) || [];
if (!newUser) {
  throw new BadRequestException("Fail to sign up gmail please try again") 
}
 
const credentials = await createLoginCredentials(newUser)

  return res.status(201).json({message: "Done" ,date : {credentials}})
}

    signup = async (req:Request , res:Response) : Promise<Response> => {

 let {username, email , password}:IsignupBodyINputDto = req.body  
 console.log({username,email , password});


   const CheckUserExist = await this.userModel.findOne({
    filter : {email},
    select : "email",
   options :{
    lean:false
   }
})
  console.log({CheckUserExist});
  if (CheckUserExist){
    throw new ConflictException(" Email exist ")
  }

  const otp = generateNumperOtp()

 const user = await this.userModel.createUser({
    data : [{ username,
    email,
    password : await generateHash(password) ,
    confirmEmailOtp :await generateHash(String(otp) )}] ,

});

emailEvent.emit("confirmEmail" ,{
  to : email ,   otp })
 return res.status(201).json({message : " Done ", data : {user}})
}



   confirmEmail = async( req:Request, res:Response):Promise <Response> => {
    const {email , otp } : IconfirmEmailBodyINputDto=req.body

    const user = await this.userModel.findOne({
        filter:{
         email ,
         confirmEmailOtp:{$exists:true},
         confirmedAt:{$exists:false}   
        }
    })
   if (!user) {
    throw new NotFoundException ("Invalid Account ")
   }
   if (!await compareeHash(otp ,user.confirmEmailOtp as string)) {
    throw new ConflictException ("innalid confirm")
   }
      await this.userModel.updateOne({
        filter: {email},
        update:{
            confirmedAt : new Date(),
            $unset:{confirmEmailOtp: 1}
        }
      })

    return res.json({message : " Done "})
}



   login = async( req:Request, res:Response) :Promise<Response> => {
    const {email ,password  }: ILoginBodyINputDto = req.body;
    const user= await this.userModel.findOne({
      filter:{email , provider:ProviderEnum.SYSTEM }
    })
    if (!user) {
      throw new NotFoundException("Invalid login data")
    }
    if (!user.confirmedAt) {
      throw new BadRequestException("Verify your account first")
    }
    if (!(await compareeHash(password, user.password))) {
      throw new NotFoundException("Invalid login data")
    }
   
    
// 2FA check
if ((user as any).twoFAEnabled) {
  const { generateNumperOtp } = await import("../../utils/otp");
  const { sendEmail } = await import("../../utils/email/send.email");
  const { verifyEmail } = await import("../../utils/email/verify.template.email");
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const otp = generateNumperOtp();
  const expiresAt = new Date(Date.now() + 10*60*1000);
  await TwoFAModel.create({ userId: user._id, otp, expiresAt, type: "login" });
  await sendEmail({ to: user.email, subject: "Your login code", html: verifyEmail({ otp, title: "Your login code" }), tags: ["2fa","login"] } as any);
  return res.status(200).json({ message: "2FA required" , data: { twoFA: true } });
}
const credentials = await createLoginCredentials(user);
   
    return res.json({
      message : " Done ",
       data : {credentials}
      })
}


sendForgotCode =async( req:Request, res:Response) :Promise<Response> => {
    const {email }: IForgotcodeBodyINputDto = req.body;
    const user= await this.userModel.findOne({
      filter:{email , provider:ProviderEnum.SYSTEM , confirmedAt:{$exists: true}}
    })
    if (!user) {
      throw new NotFoundException("Invalid account")
    }
   

    const otp = generateNumperOtp();
   const result =  await this.userModel.updateOne({
      filter : {email} ,
    update: {
      resetPasswordOtp: await generateHash(String(otp))
    }
    
    })
   
if (!result.matchedCount) {
  throw new BadRequestException ("Fail to send reset code")
}
emailEvent.emit("resetPassword " , {to : email , otp})
    return res.json({
      message : " Done "
      })
}

verifyForgotCode =async( req:Request, res:Response) :Promise<Response> => {
    const {email , otp}: IVerifycodeBodyINputDto = req.body;
    const user= await this.userModel.findOne({
      filter:{email , 
        provider:ProviderEnum.SYSTEM ,
         confirmedAt:{$exists: true},
         resetPasswordOtp: {$exists : true}
        }
    })
    if (!user) {
      throw new NotFoundException("Invalid account")
    }
    if (!(await compareeHash (otp,user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid otp")
    }
   

    return res.json({
      message : " Done "
      })
}

resetForgotCode =async( req:Request, res:Response) :Promise<Response> => {
    const {email , otp , password}: IResetcodeBodyINputDto = req.body;
    const user= await this.userModel.findOne({
      filter:{email , 
        provider:ProviderEnum.SYSTEM ,
         confirmedAt:{$exists: true},
         resetPasswordOtp: {$exists : true}
        }
    })
    if (!user) {
      throw new NotFoundException("Invalid account")
    }
    if (!(await compareeHash (otp,user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid otp")
    }

    
   const result =  await this.userModel.updateOne({
      filter : {email} ,
    update: {
      password : await generateHash(password),
      changeCredentialsTime: new Date(),
    $unset: {resetPasswordOtp:1},
    }
    
    })
   
if (!result.matchedCount) {
  throw new BadRequestException ("Fail to reset code")
}
   
    return res.json({
      message : " Done "
      })
}


}

export default new AuthenticationService()

verify2FALogin = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } = req.body as any;
  const user = await this.userModel["model"].findOne({ email });
  if (!user) throw new NotFoundException("User not found");
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const rec = await TwoFAModel.findOne({ userId: user._id, type: "login" }).sort({ createdAt: -1 });
  if (!rec) throw new BadRequestException("No pending 2FA");
  if (rec.expiresAt < new Date()) throw new BadRequestException("OTP expired");
  if (rec.otp !== otp) throw new BadRequestException("Invalid OTP");
  const credentials = await createLoginCredentials(user);
  await rec.deleteOne();
  return res.status(200).json({ message: "Done", data: { credentials } });
}
