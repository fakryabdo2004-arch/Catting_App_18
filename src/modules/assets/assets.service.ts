import type { Request, Response } from "express";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { success, entity, entities } from "../../utils/response/success.response";
import { s3, S3_BUCKET } from "../../utils/storage/s3.client";
import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AssetModel } from "../../DB/model/asset.model";
import { AssetRepository } from "../../DB/repository/asset.repository";
import { createReadStream, statSync } from "node:fs";
import { basename } from "node:path";

class AssetsService {
  private repo = new AssetRepository(AssetModel as any);

  uploadSmall = async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File;
    if (!file) throw new BadRequestException("file is required");

    const key = `${(req as any).user?._id ?? "anonymous"}/${Date.now()}-${basename(file.filename)}`;

    const put = new PutObjectCommand({
      Bucket: S3_BUCKET, Key: key, Body: createReadStream(file.path), ContentType: file.mimetype,
    });

    const result = await s3.send(put);

    const saved = await this.repo.create({
      owner: (req as any).user?._id,
      key, bucket: S3_BUCKET, mime: file.mimetype, size: file.size, etag: (result as any).ETag, type: "generic",
    });

    return success(res, 201, entity(saved, "Uploaded"));
  };

  uploadLarge = async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File;
    if (!file) throw new BadRequestException("file is required");

    const key = `${(req as any).user?._id ?? "anonymous"}/large/${Date.now()}-${basename(file.filename)}`;

    const created = await s3.send(new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET, Key: key, ContentType: file.mimetype,
    }));

    if (!created.UploadId) throw new BadRequestException("Failed to initiate multipart upload");

    const partSize = Math.max(5 * 1024 * 1024, Number(process.env.MULTIPART_MIN_CHUNK ?? 8 * 1024 * 1024));
    const size = statSync(file.path).size;
    const parts = Math.ceil(size / partSize);

    const uploadedParts: { ETag?: string; PartNumber: number }[] = [];
    for (let partNumber = 1; partNumber <= parts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, size) - 1;
      const stream = createReadStream(file.path, { start, end });
      const up = await s3.send(new UploadPartCommand({ Bucket: S3_BUCKET, Key: key, UploadId: created.UploadId, PartNumber: partNumber, Body: stream }));
      uploadedParts.push({ ETag: up.ETag, PartNumber: partNumber });
    }

    const complete = await s3.send(new CompleteMultipartUploadCommand({ Bucket: S3_BUCKET, Key: key, UploadId: created.UploadId, MultipartUpload: { Parts: uploadedParts } }));

    const saved = await this.repo.create({
      owner: (req as any).user?._id, key, bucket: S3_BUCKET, mime: file.mimetype, size: file.size, etag: complete.ETag, type: "generic",
    });

    return success(res, 201, entity(saved, "Uploaded (multipart)"));
  };

  createPreUploadSignedUrl = async (req: Request, res: Response) => {
    const { key, mime, expiresIn, visibility, type } = (req as any).body;
    const put = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: mime, ACL: visibility === "public" ? "public-read" : undefined as any });
    const url = await getSignedUrl(s3, put, { expiresIn: Number(expiresIn ?? 900) });
    const draft = await this.repo.create({ owner: (req as any).user?._id, key, bucket: S3_BUCKET, mime, size: 0, type });
    return success(res, 201, entity({ url, key, bucket: S3_BUCKET, draftId: (draft as any)._id }, "Pre-signed URL created"));
  };

  getAssetStream = async (req: Request, res: Response) => {
    const { key } = (req as any).params;
    const asset = await this.repo.findByKey(key);
    if (!asset) throw new NotFoundException("Asset not found");
    const out = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    res.setHeader("Content-Type", (out as any).ContentType ?? (asset as any).mime);
    if ((out as any).Body) ((out as any).Body as any).pipe(res as any);
  };

  getAssetPresignedUrl = async (req: Request, res: Response) => {
    const { key } = (req as any).params;
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: Number((req as any).query.expiresIn ?? 900) });
    return success(res, 200, entity({ url }, "OK"));
  };

  download = async (req: Request, res: Response) => {
    const { key } = (req as any).params;
    const asset = await this.repo.findByKey(key);
    if (!asset) throw new NotFoundException("Asset not found");
    const out = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    res.setHeader("Content-Disposition", `attachment; filename="${basename(key)}"`);
    res.setHeader("Content-Type", (out as any).ContentType ?? (asset as any).mime);
    if ((out as any).Body) ((out as any).Body as any).pipe(res as any);
  };

  deleteFile = async (req: Request, res: Response) => {
    const { key } = (req as any).params;
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    const doc = await this.repo.findByKey(key);
    if (doc) await this.repo.softDeleteById((doc as any)._id);
    return success(res, 200, entity({ key }, "Deleted (soft)"));
  };

  deleteFiles = async (req: Request, res: Response) => {
    const { keys } = (req as any).body as { keys: string[] };
    if (!keys?.length) throw new BadRequestException("keys[] required");
    await s3.send(new DeleteObjectsCommand({ Bucket: S3_BUCKET, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
    return success(res, 200, entities(keys.map((k) => ({ key: k })), "Deleted"));
  };

  deleteFolderByPrefix = async (req: Request, res: Response) => {
    const { prefix } = (req as any).params;
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix }));
    const toDelete = ((listed.Contents ?? []) as any[]).map((c: any) => ({ Key: c.Key }));
    if (toDelete.length) await s3.send(new DeleteObjectsCommand({ Bucket: S3_BUCKET, Delete: { Objects: toDelete } }));
    return success(res, 200, entity({ prefix, deleted: toDelete.length }, "Deleted by prefix"));
  };

  restore = async (req: Request, res: Response) => {
    const { id } = (req as any).params as any;
    const restored = await (new AssetRepository(AssetModel as any)).restoreById(id);
    if (!restored) throw new NotFoundException("Asset not found");
    return success(res, 200, entity(restored, "Restored"));
  };

  hardDelete = async (req: Request, res: Response) => {
    const { id } = (req as any).params as any;
    const doc = await (new AssetRepository(AssetModel as any)).findById(id);
    if (!doc) throw new NotFoundException("Asset not found");
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: (doc as any).key }));
    await (new AssetRepository(AssetModel as any)).hardDeleteById(id);
    return success(res, 200, entity({ id }, "Hard deleted"));
  };

  setProfileImage = async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File;
    if (!file) throw new BadRequestException("file is required");
    const key = `${(req as any).user?._id}/profile/${Date.now()}-${basename(file.originalname)}`;
    await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: createReadStream(file.path), ContentType: file.mimetype }));
    await this.deleteFolderByPrefixLike(`${(req as any).user?._id}/profile/`);
    const saved = await this.repo.create({ owner: (req as any).user?._id, key, bucket: S3_BUCKET, mime: file.mimetype, size: file.size, type: "profile" });
    return success(res, 201, entity(saved, "Profile image updated"));
  };

  setCoverImages = async (req: Request, res: Response) => {
    const files = (req as any).files as Express.Multer.File[];
    if (!files?.length) throw new BadRequestException("files[] required");
    await this.deleteFolderByPrefixLike(`${(req as any).user?._id}/cover/`);
    const out: any[] = [];
    for (const file of files) {
      const key = `${(req as any).user?._id}/cover/${Date.now()}-${basename(file.originalname)}`;
      await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: createReadStream(file.path), ContentType: file.mimetype }));
      out.push(await this.repo.create({ owner: (req as any).user?._id, key, bucket: S3_BUCKET, mime: file.mimetype, size: file.size, type: "cover" }));
    }
    return success(res, 201, entities(out, "Cover images updated"));
  };

  private deleteFolderByPrefixLike = async (prefix: string) => {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix }));
    const toDelete = ((listed.Contents ?? []) as any[]).map((c: any) => ({ Key: c.Key }));
    if (toDelete.length) await s3.send(new DeleteObjectsCommand({ Bucket: S3_BUCKET, Delete: { Objects: toDelete } }));
  };
}

export default new AssetsService();
