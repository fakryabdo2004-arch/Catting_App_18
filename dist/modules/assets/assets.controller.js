"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const validators = __importStar(require("./assets.validation"));
const assets_service_1 = __importDefault(require("./assets.service"));
const multer_middleware_1 = require("../../middleware/multer.middleware");
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const router = (0, express_1.Router)();
router.post("/upload/small", authentication_middleware_1.authentication, (0, multer_middleware_1.singleUpload)("file"), assets_service_1.default.uploadSmall);
router.post("/upload/large", authentication_middleware_1.authentication, (0, multer_middleware_1.singleUpload)("file"), assets_service_1.default.uploadLarge);
router.post("/upload/presign", authentication_middleware_1.authentication, (0, validation_middleware_1.validation)(validators.createPresignUploadDto), assets_service_1.default.createPreUploadSignedUrl);
router.get("/asset/stream/:key", authentication_middleware_1.authentication, assets_service_1.default.getAssetStream);
router.get("/asset/url/:key", authentication_middleware_1.authentication, assets_service_1.default.getAssetPresignedUrl);
router.get("/asset/download/:key", authentication_middleware_1.authentication, assets_service_1.default.download);
router.delete("/asset/:key", authentication_middleware_1.authentication, assets_service_1.default.deleteFile);
router.delete("/assets", authentication_middleware_1.authentication, (0, validation_middleware_1.validation)(validators.deleteManyDto), assets_service_1.default.deleteFiles);
router.delete("/assets/prefix/:prefix", authentication_middleware_1.authentication, assets_service_1.default.deleteFolderByPrefix);
router.patch("/assets/restore/:id", authentication_middleware_1.authentication, assets_service_1.default.restore);
router.delete("/assets/hard-delete/:id", authentication_middleware_1.authentication, assets_service_1.default.hardDelete);
router.post("/profile", authentication_middleware_1.authentication, (0, multer_middleware_1.singleUpload)("file"), assets_service_1.default.setProfileImage);
router.post("/cover", authentication_middleware_1.authentication, (0, multer_middleware_1.multiUpload)("files", 5), assets_service_1.default.setCoverImages);
exports.default = router;
