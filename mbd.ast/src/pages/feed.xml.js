import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blog = await getCollection('blog');
  return rss({
    title: 'MbD',
    description: 'Music by Date',
    stylesheet: false,
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      // Entries labelled "In the past" or "Ongoing" parse to an Invalid
      // Date, which RSS rejects. Omit pubDate for those rather than
      // emitting a broken timestamp.
      ...(Number.isNaN(post.data.pubDate.getTime())
        ? {}
        : { pubDate: post.data.pubDate }),
      description: post.data.description,
      link: `/blog/${post.slug}/`,
    })),
    customData: '<language>en-us</language>',
  });
}
