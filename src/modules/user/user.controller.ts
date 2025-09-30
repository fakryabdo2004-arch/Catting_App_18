import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation"
import { TokenEnum } from "../../utils/security/token.security";
const router = Router();

router.get("/" , authentication() , userService.profile)
router.post("/refresh-token" , authentication(TokenEnum.refresh),  userService.refreshToken)
router.post("/logout" , authentication(), validation(validators.logout), userService.logout)

router.patch("/update-basic", authentication(), validation(validators.updateBasic), userService.updateBasicInfo)
router.patch("/update-password", authentication(), validation(validators.updatePassword), userService.updatePassword)
router.patch("/request-email-update", authentication(), validation(validators.requestEmailUpdate), userService.requestEmailUpdate)
router.patch("/confirm-email-update", authentication(), validation(validators.confirmEmailUpdate), userService.confirmEmailUpdate)

router.post("/send-email", authentication(), validation(validators.sendMailWithTags), userService.sendEmailWithTags)

router.patch("/2fa/enable", authentication(), validation(validators.twofaEnable), userService.twoFAEnable)
router.patch("/2fa/verify", authentication(), validation(validators.twofaVerify), userService.twoFAVerify)
router.patch("/2fa/disable", authentication(), validation(validators.twofaDisable), userService.twoFADisable)

export default router