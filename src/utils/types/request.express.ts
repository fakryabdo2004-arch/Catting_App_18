import { JwtPayload } from "jsonwebtoken";
import { HUserDecument } from "../../DB/model/user.model";

declare module "express-serve-static-core" {
    interface Request{
        user ?: HUserDecument,
        decoded?: JwtPayload
    }
}