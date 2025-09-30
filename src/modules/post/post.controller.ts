
import { Router } from "express";
import { PostService } from "./post.service";
import { validation } from "../../middleware/validation.middleware";
import { createPostSchema, likeSchema, unlikeSchema } from "./post.validation";
import { authentication } from "../../middleware/authentication.middleware";

const router = Router();
const service = new PostService();

router.post("/",
  authentication,
  validation(createPostSchema),
  (req,res)=>service.createPost(req,res)
);

router.post("/:id/like",
  authentication,
  validation(likeSchema),
  (req,res)=>service.like(req,res)
);

router.post("/:id/unlike",
  authentication,
  validation(unlikeSchema),
  (req,res)=>service.unlike(req,res)
);

export default router;
