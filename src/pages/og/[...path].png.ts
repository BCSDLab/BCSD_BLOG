import type { APIRoute, GetStaticPaths } from 'astro';
import { allPosts, type Post } from '@lib/posts';
import { renderPostImage, socialImagePath } from '@lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  (await allPosts()).map((post) => ({
    params: {
      path: socialImagePath(post)
        .replace(/^\/og\//, '')
        .replace(/\.png$/, ''),
    },
    props: { post },
  }));

export const GET: APIRoute = async ({ props }) => {
  const png = await renderPostImage(props.post as Post);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
