import multer, { FileFilterCallback } from "multer";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BadRequestException } from "../utils/response/error.response";

const TEMP_DIR = join(tmpdir(), "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `${unique}.${ext}`);
  },
});

const allowed = (process.env.UPLOAD_MIME_ALLOW ??
  "image/jpeg,image/png,image/webp,application/pdf,video/mp4,application/zip").split(",");

const fileFilter = (_req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!allowed.includes(file.mimetype)) {
    return cb(new BadRequestException(`Unsupported mimetype: ${file.mimetype}`) as any);
  }
  cb(null, true);
};

export const singleUpload = (field = "file") =>
  multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE ?? 15 * 1024 * 1024) } }).single(field);

export const multiUpload = (field = "files", maxCount = 10) =>
  multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_FILE_SIZE ?? 50 * 1024 * 1024) } }).array(field, maxCount);
