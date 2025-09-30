"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_response_1 = require("../../utils/response/error.response");
const success_response_1 = require("../../utils/response/success.response");
const s3_client_1 = require("../../utils/storage/s3.client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const asset_model_1 = require("../../DB/model/asset.model");
const asset_repository_1 = require("../../DB/repository/asset.repository");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class AssetsService {
    repo = new asset_repository_1.AssetRepository(asset_model_1.AssetModel);
    uploadSmall = async (req, res) => {
        const file = req.file;
        if (!file)
            throw new error_response_1.BadRequestException("file is required");
        const key = `${req.user?._id ?? "anonymous"}/${Date.now()}-${(0, node_path_1.basename)(file.filename)}`;
        const put = new client_s3_1.PutObjectCommand({
            Bucket: s3_client_1.S3_BUCKET, Key: key, Body: (0, node_fs_1.createReadStream)(file.path), ContentType: file.mimetype,
        });
        const result = await s3_client_1.s3.send(put);
        const saved = await this.repo.create({
            owner: req.user?._id,
            key, bucket: s3_client_1.S3_BUCKET, mime: file.mimetype, size: file.size, etag: result.ETag, type: "generic",
        });
        return (0, success_response_1.success)(res, 201, (0, success_response_1.entity)(saved, "Uploaded"));
    };
    uploadLarge = async (req, res) => {
        const file = req.file;
        if (!file)
            throw new error_response_1.BadRequestException("file is required");
        const key = `${req.user?._id ?? "anonymous"}/large/${Date.now()}-${(0, node_path_1.basename)(file.filename)}`;
        const created = await s3_client_1.s3.send(new client_s3_1.CreateMultipartUploadCommand({
            Bucket: s3_client_1.S3_BUCKET, Key: key, ContentType: file.mimetype,
        }));
        if (!created.UploadId)
            throw new error_response_1.BadRequestException("Failed to initiate multipart upload");
        const partSize = Math.max(5 * 1024 * 1024, Number(process.env.MULTIPART_MIN_CHUNK ?? 8 * 1024 * 1024));
        const size = (0, node_fs_1.statSync)(file.path).size;
        const parts = Math.ceil(size / partSize);
        const uploadedParts = [];
        for (let partNumber = 1; partNumber <= parts; partNumber++) {
            const start = (partNumber - 1) * partSize;
            const end = Math.min(start + partSize, size) - 1;
            const stream = (0, node_fs_1.createReadStream)(file.path, { start, end });
            const up = await s3_client_1.s3.send(new client_s3_1.UploadPartCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key, UploadId: created.UploadId, PartNumber: partNumber, Body: stream }));
            uploadedParts.push({ ETag: up.ETag, PartNumber: partNumber });
        }
        const complete = await s3_client_1.s3.send(new client_s3_1.CompleteMultipartUploadCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key, UploadId: created.UploadId, MultipartUpload: { Parts: uploadedParts } }));
        const saved = await this.repo.create({
            owner: req.user?._id, key, bucket: s3_client_1.S3_BUCKET, mime: file.mimetype, size: file.size, etag: complete.ETag, type: "generic",
        });
        return (0, success_response_1.success)(res, 201, (0, success_response_1.entity)(saved, "Uploaded (multipart)"));
    };
    createPreUploadSignedUrl = async (req, res) => {
        const { key, mime, expiresIn, visibility, type } = req.body;
        const put = new client_s3_1.PutObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key, ContentType: mime, ACL: visibility === "public" ? "public-read" : undefined });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_client_1.s3, put, { expiresIn: Number(expiresIn ?? 900) });
        const draft = await this.repo.create({ owner: req.user?._id, key, bucket: s3_client_1.S3_BUCKET, mime, size: 0, type });
        return (0, success_response_1.success)(res, 201, (0, success_response_1.entity)({ url, key, bucket: s3_client_1.S3_BUCKET, draftId: draft._id }, "Pre-signed URL created"));
    };
    getAssetStream = async (req, res) => {
        const { key } = req.params;
        const asset = await this.repo.findByKey(key);
        if (!asset)
            throw new error_response_1.NotFoundException("Asset not found");
        const out = await s3_client_1.s3.send(new client_s3_1.GetObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key }));
        res.setHeader("Content-Type", out.ContentType ?? asset.mime);
        if (out.Body)
            out.Body.pipe(res);
    };
    getAssetPresignedUrl = async (req, res) => {
        const { key } = req.params;
        const cmd = new client_s3_1.GetObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_client_1.s3, cmd, { expiresIn: Number(req.query.expiresIn ?? 900) });
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entity)({ url }, "OK"));
    };
    download = async (req, res) => {
        const { key } = req.params;
        const asset = await this.repo.findByKey(key);
        if (!asset)
            throw new error_response_1.NotFoundException("Asset not found");
        const out = await s3_client_1.s3.send(new client_s3_1.GetObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key }));
        res.setHeader("Content-Disposition", `attachment; filename="${(0, node_path_1.basename)(key)}"`);
        res.setHeader("Content-Type", out.ContentType ?? asset.mime);
        if (out.Body)
            out.Body.pipe(res);
    };
    deleteFile = async (req, res) => {
        const { key } = req.params;
        await s3_client_1.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key }));
        const doc = await this.repo.findByKey(key);
        if (doc)
            await this.repo.softDeleteById(doc._id);
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entity)({ key }, "Deleted (soft)"));
    };
    deleteFiles = async (req, res) => {
        const { keys } = req.body;
        if (!keys?.length)
            throw new error_response_1.BadRequestException("keys[] required");
        await s3_client_1.s3.send(new client_s3_1.DeleteObjectsCommand({ Bucket: s3_client_1.S3_BUCKET, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entities)(keys.map((k) => ({ key: k })), "Deleted"));
    };
    deleteFolderByPrefix = async (req, res) => {
        const { prefix } = req.params;
        const listed = await s3_client_1.s3.send(new client_s3_1.ListObjectsV2Command({ Bucket: s3_client_1.S3_BUCKET, Prefix: prefix }));
        const toDelete = (listed.Contents ?? []).map((c) => ({ Key: c.Key }));
        if (toDelete.length)
            await s3_client_1.s3.send(new client_s3_1.DeleteObjectsCommand({ Bucket: s3_client_1.S3_BUCKET, Delete: { Objects: toDelete } }));
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entity)({ prefix, deleted: toDelete.length }, "Deleted by prefix"));
    };
    restore = async (req, res) => {
        const { id } = req.params;
        const restored = await (new asset_repository_1.AssetRepository(asset_model_1.AssetModel)).restoreById(id);
        if (!restored)
            throw new error_response_1.NotFoundException("Asset not found");
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entity)(restored, "Restored"));
    };
    hardDelete = async (req, res) => {
        const { id } = req.params;
        const doc = await (new asset_repository_1.AssetRepository(asset_model_1.AssetModel)).findById(id);
        if (!doc)
            throw new error_response_1.NotFoundException("Asset not found");
        await s3_client_1.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: doc.key }));
        await (new asset_repository_1.AssetRepository(asset_model_1.AssetModel)).hardDeleteById(id);
        return (0, success_response_1.success)(res, 200, (0, success_response_1.entity)({ id }, "Hard deleted"));
    };
    setProfileImage = async (req, res) => {
        const file = req.file;
        if (!file)
            throw new error_response_1.BadRequestException("file is required");
        const key = `${req.user?._id}/profile/${Date.now()}-${(0, node_path_1.basename)(file.originalname)}`;
        await s3_client_1.s3.send(new client_s3_1.PutObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key, Body: (0, node_fs_1.createReadStream)(file.path), ContentType: file.mimetype }));
        await this.deleteFolderByPrefixLike(`${req.user?._id}/profile/`);
        const saved = await this.repo.create({ owner: req.user?._id, key, bucket: s3_client_1.S3_BUCKET, mime: file.mimetype, size: file.size, type: "profile" });
        return (0, success_response_1.success)(res, 201, (0, success_response_1.entity)(saved, "Profile image updated"));
    };
    setCoverImages = async (req, res) => {
        const files = req.files;
        if (!files?.length)
            throw new error_response_1.BadRequestException("files[] required");
        await this.deleteFolderByPrefixLike(`${req.user?._id}/cover/`);
        const out = [];
        for (const file of files) {
            const key = `${req.user?._id}/cover/${Date.now()}-${(0, node_path_1.basename)(file.originalname)}`;
            await s3_client_1.s3.send(new client_s3_1.PutObjectCommand({ Bucket: s3_client_1.S3_BUCKET, Key: key, Body: (0, node_fs_1.createReadStream)(file.path), ContentType: file.mimetype }));
            out.push(await this.repo.create({ owner: req.user?._id, key, bucket: s3_client_1.S3_BUCKET, mime: file.mimetype, size: file.size, type: "cover" }));
        }
        return (0, success_response_1.success)(res, 201, (0, success_response_1.entities)(out, "Cover images updated"));
    };
    deleteFolderByPrefixLike = async (prefix) => {
        const listed = await s3_client_1.s3.send(new client_s3_1.ListObjectsV2Command({ Bucket: s3_client_1.S3_BUCKET, Prefix: prefix }));
        const toDelete = (listed.Contents ?? []).map((c) => ({ Key: c.Key }));
        if (toDelete.length)
            await s3_client_1.s3.send(new client_s3_1.DeleteObjectsCommand({ Bucket: s3_client_1.S3_BUCKET, Delete: { Objects: toDelete } }));
    };
}
exports.default = new AssetsService();
