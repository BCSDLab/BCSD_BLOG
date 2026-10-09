import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    base: '.',
    pattern: ['@*/**/*.mdx', 'docs/**/*.{md,mdx}'],
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''),
  }),
  schema: z.object({
    title: z.string().default('template'),
    description: z.string().default(''),
    date: z.coerce.date().optional(),
    authors: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    slug: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});
export const collections = { posts };
