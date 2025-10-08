// Sitemap generation utility for blog posts
import { blogPosts } from '@/components/Blog/data/index.js';

/**
 * Generate XML sitemap for blog posts
 * @param {string} baseUrl - The base URL of the site
 * @returns {string} XML sitemap content
 */
export function generateBlogSitemap(baseUrl = 'https://sharedstake.org') {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemapHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  const sitemapFooter = `</urlset>`;

  // Main blog page
  const blogPage = `
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

  // Individual blog posts
  const blogPostUrls = blogPosts.map(post => {
    const lastmod = new Date(post.publishDate).toISOString().split('T')[0];
    const priority = post.featured ? '0.9' : '0.7';
    
    return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <news:news>
      <news:publication>
        <news:name>SharedStake Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${post.publishDate}</news:publication_date>
      <news:title>${post.title}</news:title>
      <news:keywords>${post.tags.join(', ')}</news:keywords>
    </news:news>
  </url>`;
  }).join('');

  return sitemapHeader + blogPage + blogPostUrls + sitemapFooter;
}

/**
 * Generate robots.txt content
 * @param {string} baseUrl - The base URL of the site
 * @returns {string} robots.txt content
 */
export function generateRobotsTxt(baseUrl = 'https://sharedstake.org') {
  return `User-agent: *
Allow: /

# Blog posts
Allow: /blog/
Allow: /blog/*

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-blog.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /private/
Disallow: /api/

# Crawl delay for respectful crawling
Crawl-delay: 1`;
}

/**
 * Generate JSON-LD sitemap for search engines
 * @param {string} baseUrl - The base URL of the site
 * @returns {Object} JSON-LD sitemap object
 */
export function generateJsonLdSitemap(baseUrl = 'https://sharedstake.org') {
  const currentDate = new Date().toISOString();
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "SharedStake Blog Posts",
    "description": "Complete list of blog posts about Ethereum liquid staking and DeFi",
    "url": `${baseUrl}/blog`,
    "dateModified": currentDate,
    "numberOfItems": blogPosts.length,
    "itemListElement": blogPosts.map((post, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.meta.description,
        "url": `${baseUrl}/blog/${post.slug}`,
        "datePublished": post.publishDate,
        "author": {
          "@type": "Organization",
          "name": post.author
        },
        "publisher": {
          "@type": "Organization",
          "name": "SharedStake"
        }
      }
    }))
  };
}

/**
 * Get blog post URLs for internal linking
 * @returns {Array} Array of blog post objects with URL and title
 */
export function getBlogPostUrls() {
  return blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    publishDate: post.publishDate,
    featured: post.featured
  }));
}

/**
 * Find related posts based on tags
 * @param {Array} currentTags - Tags of the current post
 * @param {string} currentSlug - Slug of the current post
 * @param {number} limit - Maximum number of related posts to return
 * @returns {Array} Array of related post objects
 */
export function getRelatedPosts(currentTags, currentSlug, limit = 3) {
  return blogPosts
    .filter(post => post.slug !== currentSlug)
    .filter(post => post.tags.some(tag => currentTags.includes(tag)))
    .sort((a, b) => {
      // Sort by number of matching tags, then by publish date
      const aMatches = a.tags.filter(tag => currentTags.includes(tag)).length;
      const bMatches = b.tags.filter(tag => currentTags.includes(tag)).length;
      
      if (aMatches !== bMatches) {
        return bMatches - aMatches;
      }
      
      return new Date(b.publishDate) - new Date(a.publishDate);
    })
    .slice(0, limit)
    .map(post => ({
      url: `/blog/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt,
      publishDate: post.publishDate,
      tags: post.tags
    }));
}