import { z, defineCollection } from 'astro:content';

const blogCollection = defineCollection({
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.string().transform((str) => new Date(str)),
      draft: z.boolean().optional().default(false),
      tags: z.array(z.string()).optional().default([]),
      buttonLabel: z.string().optional(),
    }),
});

export const collections = {
  blog: blogCollection,
};
