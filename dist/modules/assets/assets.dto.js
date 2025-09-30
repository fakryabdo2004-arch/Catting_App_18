"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteManyDto = exports.deletePrefixDto = exports.getAssetDto = exports.createPresignUploadDto = void 0;
const zod_1 = require("zod");
exports.createPresignUploadDto = zod_1.z.object({
    key: zod_1.z.string().min(3),
    mime: zod_1.z.string().min(3),
    expiresIn: zod_1.z.number().min(60).max(3600).optional().default(900),
    visibility: zod_1.z.enum(["public", "private"]).optional().default("private"),
    type: zod_1.z.enum(["profile", "cover", "generic"]).optional().default("generic"),
});
exports.getAssetDto = zod_1.z.object({ key: zod_1.z.string().min(3) });
exports.deletePrefixDto = zod_1.z.object({ prefix: zod_1.z.string().min(1) });
exports.deleteManyDto = zod_1.z.object({ keys: zod_1.z.array(zod_1.z.string()).min(1) });
