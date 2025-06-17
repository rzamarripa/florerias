import { z } from "zod";

export const brandSchema = z.object({
  logo: z.instanceof(File).optional(),
  category: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type BrandFormData = z.infer<typeof brandSchema>;
