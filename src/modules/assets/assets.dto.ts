import { z } from "zod";

export const createPresignUploadDto = z.object({
  key: z.string().min(3),
  mime: z.string().min(3),
  expiresIn: z.number().min(60).max(3600).optional().default(900),
  visibility: z.enum(["public","private"]).optional().default("private"),
  type: z.enum(["profile","cover","generic"]).optional().default("generic"),
});

export const getAssetDto = z.object({ key: z.string().min(3) });
export const deletePrefixDto = z.object({ prefix: z.string().min(1) });
export const deleteManyDto = z.object({ keys: z.array(z.string()).min(1) });

export type TCreatePresignUpload = z.infer<typeof createPresignUploadDto>;
