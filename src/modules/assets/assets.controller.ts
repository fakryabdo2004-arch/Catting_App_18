import { Router } from "express";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./assets.validation";
import service from "./assets.service";
import { singleUpload, multiUpload } from "../../middleware/multer.middleware";
import { authentication } from "../../middleware/authentication.middleware";

const router = Router();

router.post("/upload/small", authentication, singleUpload("file"), service.uploadSmall);
router.post("/upload/large", authentication, singleUpload("file"), service.uploadLarge);
router.post("/upload/presign", authentication, validation(validators.createPresignUploadDto), service.createPreUploadSignedUrl);

router.get("/asset/stream/:key", authentication, service.getAssetStream);
router.get("/asset/url/:key", authentication, service.getAssetPresignedUrl);
router.get("/asset/download/:key", authentication, service.download);

router.delete("/asset/:key", authentication, service.deleteFile);
router.delete("/assets", authentication, validation(validators.deleteManyDto), service.deleteFiles);
router.delete("/assets/prefix/:prefix", authentication, service.deleteFolderByPrefix);

router.patch("/assets/restore/:id", authentication, service.restore);
router.delete("/assets/hard-delete/:id", authentication, service.hardDelete);

router.post("/profile", authentication, singleUpload("file"), service.setProfileImage);
router.post("/cover", authentication, multiUpload("files", 5), service.setCoverImages);

export default router;
