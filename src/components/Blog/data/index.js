// Dynamic loader for blog posts stored in individual files.
// Each post file should export a default object with fields:
// { id, slug, title, excerpt, content, author, publishDate, tags, featured, meta }

const requirePost = require.context('../posts', true, /\.js$/);

const loadedPosts = requirePost.keys().map((key) => {
  const mod = requirePost(key);
  return mod && mod.default ? mod.default : mod;
});

// Sort by publishDate desc by default
loadedPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

export const blogPosts = loadedPosts;

export const getBlogPostBySlug = (slug) => {
  return blogPosts.find((post) => post.slug === slug);
};

export const getFeaturedPosts = () => {
  return blogPosts.filter((post) => post.featured);
};

export const getPostsByTag = (tag) => {
  return blogPosts.filter((post) => post.tags && post.tags.includes(tag));
};

export const getAllTags = () => {
  const tags = new Set();
  blogPosts.forEach((post) => {
    (post.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags);
};

