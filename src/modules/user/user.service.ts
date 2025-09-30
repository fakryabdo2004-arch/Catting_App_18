import { Response , Request } from "express"
import { ILogoutDto } from "./user.dto"
import { createLoginCredentials, logoutEnum ,createRvokeToken } from "../../utils/security/token.security"
import { UpdateQuery  } from "mongoose"
import { HUserDecument, IUser, UserModel } from "../../DB/model/user.model"
import { UserRepository } from "../../DB/repository/user.repository"
import { TokenRepository } from "../../DB/repository/token.repository"
import { TokenModel } from "../../DB/model/Token.model"
import { JwtPayload } from "jsonwebtoken"

class UserService {
    private userModel = new UserRepository(UserModel)
     private tokenModel = new TokenRepository(TokenModel)
    constructor(){}


profile = async (req :Request, res : Response):Promise<Response> => {
  
    return res.json({
        message:"Done",
        data:{
            user: req.user?._id,
            decoded:req.decoded?.iat
        },
    })
}

logout = async (req :Request, res : Response):Promise<Response> => {
  const {flag} : ILogoutDto= req.body
  const update : UpdateQuery<IUser>={};  
let statusCode : number = 200;
  switch (flag) {
    case logoutEnum.all:
        update.changeCredentialsTime = new Date()
        break;
    default:
     await createRvokeToken(req.decoded as JwtPayload)
        statusCode=201
        break;
  }
  await this.userModel.updateOne({
    filter: {_id:req.decoded?._id},
    update
  })
  return res.status(statusCode).json({
        message:"Done",
       
    })
}


refreshToken =async (req :Request, res : Response):Promise<Response> => {
  const credentials = await createLoginCredentials(req.user as HUserDecument)
await createRvokeToken(req.decoded as JwtPayload)
  return res.status(201).json({message : "Done" , data :{credentials}})
}

}

export default new UserService()

updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const allowed: any = {};
  const { firstName, lastName, bio, phone, gender } = req.body;
  if (firstName !== undefined) allowed.firstName = firstName;
  if (lastName !== undefined) allowed.lastName = lastName;
  if (bio !== undefined) allowed.bio = bio;
  if (phone !== undefined) allowed.phone = phone;
  if (gender !== undefined) allowed.gender = gender;
  const result = await this.userModel.updateOne({ filter: { _id: userId }, update: { $set: allowed } });
  if (!result.matchedCount) throw new BadRequestException("User not found");
  return res.status(200).json({ message: "Updated", data: allowed });
}

updatePassword = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const { currentPassword, newPassword } = req.body;
  const user = await (this.userModel as any).model.findById(userId).select("+password");
  if (!user) throw new NotFoundException("User not found");
  const { compareeHash, generateHash } = await import("../../utils/security/hash.security");
  const ok = await compareeHash(currentPassword, user.password);
  if (!ok) throw new BadRequestException("Current password incorrect");
  user.password = await generateHash(newPassword);
  await user.save();
  return res.status(200).json({ message: "Password updated" });
}

requestEmailUpdate = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const { newEmail } = req.body;
  const { generateNumperOtp } = await import("../../utils/otp");
  const { sendEmail } = await import("../../utils/email/send.email");
  const { verifyEmail } = await import("../../utils/email/verify.template.email");
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const otp = generateNumperOtp();
  const expiresAt = new Date(Date.now() + 10*60*1000);
  await TwoFAModel.create({ userId, otp, expiresAt, type: "emailChange", newEmail });
  await sendEmail({
    to: newEmail,
    subject: "Verify your new email",
    html: verifyEmail({ otp, title: "Confirm your new email" }),
    tags: ["email-change"]
  } as any);
  return res.status(200).json({ message: "OTP sent to new email" });
}

confirmEmailUpdate = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const { newEmail, otp } = req.body;
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const rec = await TwoFAModel.findOne({ userId, type: "emailChange", newEmail }).sort({ createdAt: -1 });
  if (!rec) throw new NotFoundException("No pending change");
  if (rec.expiresAt < new Date()) throw new BadRequestException("OTP expired");
  if (rec.otp !== otp) throw new BadRequestException("Invalid OTP");
  const result = await this.userModel.updateOne({ filter: { _id: userId }, update: { $set: { email: newEmail } } });
  if (!result.matchedCount) throw new BadRequestException("User not found");
  await rec.deleteOne();
  return res.status(200).json({ message: "Email updated" });
}

sendEmailWithTags = async (req: Request, res: Response): Promise<Response> => {
  const { to, subject, html, text, tags } = req.body;
  const { sendEmail } = await import("../../utils/email/send.email");
  await sendEmail({ to, subject, html, text, tags } as any);
  return res.status(200).json({ message: "Email sent" });
}

twoFAEnable = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const { generateNumperOtp } = await import("../../utils/otp");
  const { sendEmail } = await import("../../utils/email/send.email");
  const { verifyEmail } = await import("../../utils/email/verify.template.email");
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const otp = generateNumperOtp();
  const expiresAt = new Date(Date.now() + 10*60*1000);
  await TwoFAModel.create({ userId, otp, expiresAt, type: "enable" });
  const user = await (this.userModel as any).model.findById(userId);
  await sendEmail({ to: user.email, subject: "Enable 2FA", html: verifyEmail({ otp, title: "Enable Two-Step Verification" }), tags: ["2fa","enable"] } as any);
  return res.status(200).json({ message: "OTP sent" });
}

twoFAVerify = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  const { otp } = req.body;
  const { TwoFAModel } = await import("../../DB/model/twofa.model");
  const rec = await TwoFAModel.findOne({ userId, type: "enable" }).sort({ createdAt: -1 });
  if (!rec) throw new NotFoundException("No pending request");
  if (rec.expiresAt < new Date()) throw new BadRequestException("OTP expired");
  if (rec.otp !== otp) throw new BadRequestException("Invalid OTP");
  await (this.userModel as any).model.updateOne({ _id: userId }, { $set: { twoFAEnabled: true } });
  await rec.deleteOne();
  return res.status(200).json({ message: "2FA enabled" });
}

twoFADisable = async (req: Request, res: Response): Promise<Response> => {
  const userId = (req as any).user?._id;
  await (this.userModel as any).model.updateOne({ _id: userId }, { $set: { twoFAEnabled: false } });
  return res.status(200).json({ message: "2FA disabled" });
}
