"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const user_model_1 = require("../../DB/model/user.model");
exports.endpoint = {
    profile: [user_model_1.RoleEnum.user, user_model_1.RoleEnum.admin]
};
