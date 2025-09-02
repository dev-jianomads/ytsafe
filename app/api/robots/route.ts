import { NextResponse } from 'next/server';

export async function GET() {
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://streamsafekids.com/sitemap.xml

# Important pages for crawling
Allow: /
Allow: /about
Allow: /how-it-works
Allow: /parent-guide

# Block any admin or API routes
Disallow: /api/analyse
Disallow: /_next/
Disallow: /admin/

# Crawl delay (optional - helps with server load)
Crawl-delay: 1`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}