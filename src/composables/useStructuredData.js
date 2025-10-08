// Composable for managing structured data (JSON-LD)
import { extractFAQContent } from '@/utils/blogUtils.js';

// Schema generators
const createOrganization = () => ({
  "@type": "Organization",
  "name": "SharedStake",
  "logo": {
    "@type": "ImageObject",
    "url": "https://sharedstake.org/logo-white.svg",
    "width": 200,
    "height": 60
  },
  "url": "https://sharedstake.org"
});

const parseFAQQuestions = (faqContent) => {
  const questions = [];
  const lines = faqContent.split('\n');
  let currentQuestion = null;
  let currentAnswer = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^#{2,3}\s+(.+)/)) {
      // Save previous question
      if (currentQuestion && currentAnswer.length > 0) {
        questions.push({
          "@type": "Question",
          "name": currentQuestion,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": currentAnswer.join(' ').trim()
          }
        });
      }
      
      // Start new question
      currentQuestion = trimmedLine.replace(/^#{2,3}\s+/, '').replace(/\?$/, '');
      currentAnswer = [];
    } else if (currentQuestion && trimmedLine && !trimmedLine.startsWith('#')) {
      currentAnswer.push(trimmedLine);
    }
  }
  
  // Add last question
  if (currentQuestion && currentAnswer.length > 0) {
    questions.push({
      "@type": "Question",
      "name": currentQuestion,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": currentAnswer.join(' ').trim()
      }
    });
  }
  
  return questions;
};

export function useStructuredData() {
  // Schema management
  const schemaCache = new Map();
  
  const generateBlogPostingSchema = (post, currentUrl) => {
    if (!post) return null;
    
    const wordCount = post.rawContent ? post.rawContent.split(/\s+/).length : 0;
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.meta?.description || post.excerpt,
      "image": post.featuredImage || `https://sharedstake.org/images/blog-${post.slug}.jpg`,
      "author": {
        "@type": "Organization",
        "name": post.author || "SharedStake Team",
        "url": "https://sharedstake.org"
      },
      "publisher": createOrganization(),
      "datePublished": post.publishDate,
      "dateModified": post.publishDate,
      "mainEntityOfPage": { "@type": "WebPage", "@id": currentUrl },
      "keywords": post.meta?.keywords || post.tags?.join(', '),
      "articleSection": "DeFi",
      "wordCount": wordCount,
      "inLanguage": "en-US",
      "url": currentUrl
    };
  };
  
  const generateFAQSchema = (faqContent) => {
    if (!faqContent) return null;
    
    const questions = parseFAQQuestions(faqContent);
    if (questions.length === 0) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questions
    };
  };
  
  const generateBreadcrumbSchema = (breadcrumbs) => {
    if (!breadcrumbs?.length) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  };
  
  // Schema injection with caching
  const injectSchema = (schema, id) => {
    if (!schema) return;
    
    // Remove existing schema
    removeSchema(id);
    
    // Cache schema
    schemaCache.set(id, schema);
    
    // Inject new schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  };
  
  const removeSchema = (id) => {
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
      schemaCache.delete(id);
    }
  };
  
  // Batch operations
  const injectBlogSchemas = (post, currentUrl) => {
    if (!post) return;
    
    // BlogPosting schema
    const blogSchema = generateBlogPostingSchema(post, currentUrl);
    if (blogSchema) injectSchema(blogSchema, 'blogposting-schema');
    
    // FAQ schema
    const faqContent = extractFAQContent(post.rawContent);
    if (faqContent) {
      const faqSchema = generateFAQSchema(faqContent);
      if (faqSchema) injectSchema(faqSchema, 'faq-schema');
    }
  };
  
  const cleanupBlogSchemas = () => {
    removeSchema('blogposting-schema');
    removeSchema('faq-schema');
  };
  
  return {
    generateBlogPostingSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    injectSchema,
    removeSchema,
    injectBlogSchemas,
    cleanupBlogSchemas
  };
}