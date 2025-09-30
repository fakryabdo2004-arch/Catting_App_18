import * as validators from "./auth.validation"
import { validation } from "../../middleware/validation.middleware";
import authService from './auth.service'
import { Router } from "express";


const router = Router ()

router.post("/signup" ,validation(validators.signup),authService.signup);
router.post("/signup-gmail" , validation(validators.signupWithGmail),authService.signupWithGmail)
router.post("/login-gmail" , validation(validators.signupWithGmail),authService.loginWithGmail)
router.patch("/confirm-email" ,validation(validators.confirmEmail),authService.confirmEmail)
router.post("/login" ,validation(validators.login),authService.login);
router.post("/verify-2fa-login" ,validation(validators.verify2faLogin),authService.verify2FALogin);

router.patch("/send-reset-password" ,validation(validators.sendForgotPasswordCode),authService.sendForgotCode)
router.patch("/verify-forget-password" ,validation(validators.verifyForgotPassword),authService.verifyForgotCode)
router.patch("/reset-forget-password" ,validation(validators.resetForgotPassword),authService.resetForgotCode)
export default router;