import { z } from "zod";

export const ZUpdateInputSchema = z.object({
  bio: z.string().optional(),
  name: z.string().optional(),
  logo: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
  slug: z.string().optional(),
  hideBranding: z.boolean().optional(),
  hideBookATeamMember: z.boolean().optional(),
  brandColor: z.string().optional(),
  darkBrandColor: z.string().optional(),
  theme: z.string().optional().nullable(),
});

export type TUpdateInputSchema = z.infer<typeof ZUpdateInputSchema>;
