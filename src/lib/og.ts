import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { Post } from './posts';
import { dateLabel, postAuthors, postUrl, sectionOf } from './posts';

const font = readFileSync(
  `${process.cwd()}/src/assets/fonts/NanumGothic-Regular.ttf`,
);
const logo = `data:image/svg+xml;base64,${readFileSync(`${process.cwd()}/static/img/blog-logo.svg`).toString('base64')}`;
export const socialImagePath = (post: Post) =>
  `/og${postUrl(post).replace(/\/$/, '')}.png`;
const shorten = (text: string, limit: number) => {
  const characters = Array.from(text);
  return characters.length > limit
    ? `${characters.slice(0, limit - 1).join('')}…`
    : text;
};

export async function renderPostImage(post: Post) {
  const title = shorten(post.data.title, 180);
  const titleSize = title.length > 100 ? 40 : title.length > 65 ? 48 : 60;
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          position: 'relative',
          width: 1200,
          height: 630,
          background: '#faf8ff',
          color: '#24232e',
          fontFamily: 'NanumGothic',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 12,
                background: '#9264ff',
              },
            },
          },
          {
            type: 'img',
            props: {
              src: logo,
              width: 296,
              height: 46,
              style: { position: 'absolute', top: 66, left: 72 },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 78,
                right: 72,
                color: '#8052e8',
                fontSize: 25,
              },
              children: sectionOf(post).label,
            },
          },
          {
            type: 'div',
            props: {
              lang: 'ko-KR',
              style: {
                position: 'absolute',
                left: 72,
                top: 160,
                width: 1056,
                height: 305,
                display: 'flex',
                alignItems: 'center',
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    width: 1056,
                    fontSize: titleSize,
                    lineHeight: 1.35,
                    letterSpacing: '-1px',
                    wordBreak: 'keep-all',
                  },
                  children: title,
                },
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: 72,
                top: 492,
                width: 1056,
                height: 1,
                background: '#ded8ec',
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: 72,
                top: 514,
                fontSize: 22,
                color: '#777281',
              },
              children: shorten(
                post.data.tags
                  .slice(0, 4)
                  .map((tag) => `#${tag}`)
                  .join('  '),
                70,
              ),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: 72,
                top: 558,
                fontSize: 22,
                color: '#777281',
              },
              children: shorten(
                postAuthors(post)
                  .map((author) => author.name)
                  .join(', '),
                60,
              ),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                right: 72,
                top: 558,
                fontSize: 22,
                color: '#777281',
              },
              children: dateLabel(post.data.date),
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'NanumGothic', data: font, weight: 400, style: 'normal' },
      ],
    },
  );
  return new Resvg(svg).render().asPng();
}
