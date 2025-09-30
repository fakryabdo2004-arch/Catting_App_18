"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiUpload = exports.singleUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const error_response_1 = require("../utils/response/error.response");
const TEMP_DIR = (0, node_path_1.join)((0, node_os_1.tmpdir)(), "uploads");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_DIR),
    filename: (_req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split(".").pop();
        cb(null, `${unique}.${ext}`);
    },
});
const allowed = (process.env.UPLOAD_MIME_ALLOW ??
    "image/jpeg,image/png,image/webp,application/pdf,video/mp4,application/zip").split(",");
const fileFilter = (_req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
        return cb(new error_response_1.BadRequestException(`Unsupported mimetype: ${file.mimetype}`));
    }
    cb(null, true);
};
const singleUpload = (field = "file") => (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE ?? 15 * 1024 * 1024) } }).single(field);
exports.singleUpload = singleUpload;
const multiUpload = (field = "files", maxCount = 10) => (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE ?? 50 * 1024 * 1024) } }).array(field, maxCount);
exports.multiUpload = multiUpload;
