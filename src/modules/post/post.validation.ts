
import { z } from "zod";
export const createPostSchema = {
  body: z.object({
    body: z.string().min(1).max(280),
    media: z.array(z.string()).optional()
  })
};
export const likeSchema = {
  body: z.object({ postId: z.string().regex(/^[0-9a-fA-F]{24}$/) })
};
export const unlikeSchema = likeSchema;
