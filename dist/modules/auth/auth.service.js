"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DB/model/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
const user_model_2 = require("../../DB/model/user.model");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEP_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("Fail to verify account");
        }
        return payload;
    }
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: user_model_2.ProviderEnum.GOOGLE
            },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("not register account");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({ message: "Done", date: { credentials } });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, givin_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
            },
        });
        if (user) {
            if (user.provider === user_model_2.ProviderEnum.GOOGLE) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.ConflictException(`Email exists with another provider ${user.provider}`);
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: givin_name,
                    lastName: family_name,
                    email: email,
                    profileImage: picture,
                    confirmedAt: new Date(),
                    provider: user_model_2.ProviderEnum.GOOGLE,
                },
            ],
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequestException("Fail to sign up gmail please try again");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return res.status(201).json({ message: "Done", date: { credentials } });
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        console.log({ username, email, password });
        const CheckUserExist = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: {
                lean: false
            }
        });
        console.log({ CheckUserExist });
        if (CheckUserExist) {
            throw new error_response_1.ConflictException(" Email exist ");
        }
        const otp = (0, otp_1.generateNumperOtp)();
        const user = await this.userModel.createUser({
            data: [{ username,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)) }],
        });
        email_event_1.emailEvent.emit("confirmEmail", {
            to: email, otp
        });
        return res.status(201).json({ message: " Done ", data: { user } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid Account ");
        }
        if (!await (0, hash_security_1.compareeHash)(otp, user.confirmEmailOtp)) {
            throw new error_response_1.ConflictException("innalid confirm");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 }
            }
        });
        return res.json({ message: " Done " });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: user_model_2.ProviderEnum.SYSTEM }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid login data");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("Verify your account first");
        }
        if (!(await (0, hash_security_1.compareeHash)(password, user.password))) {
            throw new error_response_1.NotFoundException("Invalid login data");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({
            message: " Done ",
            data: { credentials }
        });
    };
    sendForgotCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: user_model_2.ProviderEnum.SYSTEM, confirmedAt: { $exists: true } }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        const otp = (0, otp_1.generateNumperOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp))
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to send reset code");
        }
        email_event_1.emailEvent.emit("resetPassword ", { to: email, otp });
        return res.json({
            message: " Done "
        });
    };
    verifyForgotCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: { email,
                provider: user_model_2.ProviderEnum.SYSTEM,
                confirmedAt: { $exists: true },
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareeHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        return res.json({
            message: " Done "
        });
    };
    resetForgotCode = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email,
                provider: user_model_2.ProviderEnum.SYSTEM,
                confirmedAt: { $exists: true },
                resetPasswordOtp: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareeHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            }
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequestException("Fail to reset code");
        }
        return res.json({
            message: " Done "
        });
    };
}
exports.default = new AuthenticationService();
