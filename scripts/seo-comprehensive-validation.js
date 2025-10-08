#!/usr/bin/env node

/**
 * Comprehensive SEO Validation Script for SharedStake
 * 
 * This script performs a thorough SEO audit including:
 * - Technical SEO validation
 * - Content SEO analysis
 * - Performance metrics
 * - Accessibility checks
 * - Schema markup validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive SEO validation rules
const seoRules = {
  // Technical SEO
  technical: {
    title: { min: 30, max: 60, required: true },
    description: { min: 120, max: 160, required: true },
    keywords: { required: false },
    canonical: { required: true },
    robots: { required: true },
    sitemap: { required: true },
    robotsTxt: { required: true },
    favicon: { required: true },
    ogImage: { required: true },
    twitterCard: { required: true }
  },
  
  // Content SEO
  content: {
    h1Tags: { min: 1, max: 1, required: true },
    h2Tags: { min: 2, max: 10, required: true },
    internalLinks: { min: 3, required: true },
    externalLinks: { min: 1, required: false },
    imagesWithAlt: { min: 1, required: true },
    wordCount: { min: 300, required: true }
  },
  
  // Performance
  performance: {
    imageOptimization: { required: true },
    lazyLoading: { required: true },
    compression: { required: true },
    caching: { required: true }
  },
  
  // Accessibility
  accessibility: {
    altText: { required: true },
    headingStructure: { required: true },
    colorContrast: { required: true },
    keyboardNavigation: { required: true }
  }
};

// Files to analyze
const analysisFiles = [
  '/workspace/public/index.html',
  '/workspace/src/components/Blog/BlogPost.vue',
  '/workspace/src/components/Blog/Blog.vue',
  '/workspace/src/composables/useStructuredData.js',
  '/workspace/src/utils/markdown.js'
];

// Blog posts to analyze (based on actual files)
const blogPosts = [
  'ethereum-staking-guide-2024',
  'understanding-liquid-staking-benefits',
  'defi-integration-opportunities',
  'security-audit-results-certik',
  'sharedstake-v2-launch-announcement',
  'how-we-updated-sharedstake-ui-with-ai',
  'eth2-quickstart-introduction',
  'eth2-quickstart-installation-guide',
  'eth2-quickstart-client-diversity',
  'eth2-quickstart-advanced-features',
  'eth2-quickstart-maintenance'
];

class ComprehensiveSEOValidator {
  constructor() {
    this.results = {
      technical: { passed: 0, failed: 0, warnings: 0, issues: [] },
      content: { passed: 0, failed: 0, warnings: 0, issues: [] },
      performance: { passed: 0, failed: 0, warnings: 0, issues: [] },
      accessibility: { passed: 0, failed: 0, warnings: 0, issues: [] },
      overall: { score: 0, grade: 'F' }
    };
  }

  // Technical SEO validation
  validateTechnicalSEO() {
    console.log('\n🔧 Validating Technical SEO...');
    
    // Check HTML structure
    this.validateHTMLStructure();
    
    // Check meta tags
    this.validateMetaTags();
    
    // Check structured data
    this.validateStructuredData();
    
    // Check sitemap and robots.txt
    this.validateSitemapAndRobots();
    
    // Check social media tags
    this.validateSocialMediaTags();
  }

  validateHTMLStructure() {
    const htmlPath = '/workspace/public/index.html';
    if (!fs.existsSync(htmlPath)) {
      this.addIssue('technical', 'CRITICAL', 'index.html not found', 'index.html');
      return;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for proper HTML5 structure
    if (!htmlContent.includes('<!DOCTYPE html>')) {
      this.addIssue('technical', 'WARNING', 'Missing HTML5 doctype', 'index.html');
    }
    
    if (!htmlContent.includes('<html lang=')) {
      this.addIssue('technical', 'WARNING', 'Missing lang attribute on html tag', 'index.html');
    }
    
    if (!htmlContent.includes('<meta charset=')) {
      this.addIssue('technical', 'CRITICAL', 'Missing charset meta tag', 'index.html');
    }
    
    if (!htmlContent.includes('<meta name="viewport"')) {
      this.addIssue('technical', 'CRITICAL', 'Missing viewport meta tag', 'index.html');
    }
    
    console.log('   ✅ HTML structure validation completed');
  }

  validateMetaTags() {
    const htmlPath = '/workspace/public/index.html';
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Title validation
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      const title = titleMatch[1];
      if (title.length < seoRules.technical.title.min) {
        this.addIssue('technical', 'WARNING', `Title too short (${title.length}/${seoRules.technical.title.min} chars)`, 'index.html');
      } else if (title.length > seoRules.technical.title.max) {
        this.addIssue('technical', 'WARNING', `Title too long (${title.length}/${seoRules.technical.title.max} chars)`, 'index.html');
      } else {
        this.addIssue('technical', 'PASS', `Title length optimal (${title.length} chars)`, 'index.html');
      }
    } else {
      this.addIssue('technical', 'CRITICAL', 'Missing title tag', 'index.html');
    }
    
    // Description validation
    const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/);
    if (descMatch) {
      const description = descMatch[1];
      if (description.length < seoRules.technical.description.min) {
        this.addIssue('technical', 'WARNING', `Description too short (${description.length}/${seoRules.technical.description.min} chars)`, 'index.html');
      } else if (description.length > seoRules.technical.description.max) {
        this.addIssue('technical', 'WARNING', `Description too long (${description.length}/${seoRules.technical.description.max} chars)`, 'index.html');
      } else {
        this.addIssue('technical', 'PASS', `Description length optimal (${description.length} chars)`, 'index.html');
      }
    } else {
      this.addIssue('technical', 'CRITICAL', 'Missing meta description', 'index.html');
    }
    
    console.log('   ✅ Meta tags validation completed');
  }

  validateStructuredData() {
    const htmlPath = '/workspace/public/index.html';
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for JSON-LD structured data
    const jsonLdMatches = htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs);
    
    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      this.addIssue('technical', 'WARNING', 'No structured data found', 'index.html');
      return;
    }
    
    let validSchemas = 0;
    jsonLdMatches.forEach((match, index) => {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const structuredData = JSON.parse(jsonContent);
        
        if (structuredData['@type']) {
          validSchemas++;
          this.addIssue('technical', 'PASS', `Valid ${structuredData['@type']} schema`, 'index.html');
        }
      } catch (error) {
        this.addIssue('technical', 'CRITICAL', `Invalid structured data JSON: ${error.message}`, 'index.html');
      }
    });
    
    if (validSchemas > 0) {
      this.addIssue('technical', 'PASS', `${validSchemas} valid schema(s) found`, 'index.html');
    }
    
    console.log('   ✅ Structured data validation completed');
  }

  validateSitemapAndRobots() {
    // Check sitemap
    const sitemapPath = '/workspace/public/sitemap.xml';
    if (fs.existsSync(sitemapPath)) {
      const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      
      if (urlCount > 0) {
        this.addIssue('technical', 'PASS', `Sitemap contains ${urlCount} URLs`, 'sitemap.xml');
      } else {
        this.addIssue('technical', 'CRITICAL', 'Sitemap is empty', 'sitemap.xml');
      }
    } else {
      this.addIssue('technical', 'CRITICAL', 'Sitemap not found', 'sitemap.xml');
    }
    
    // Check robots.txt
    const robotsPath = '/workspace/public/robots.txt';
    if (fs.existsSync(robotsPath)) {
      const robotsContent = fs.readFileSync(robotsPath, 'utf8');
      
      if (robotsContent.includes('User-agent:') && robotsContent.includes('Sitemap:')) {
        this.addIssue('technical', 'PASS', 'Robots.txt properly configured', 'robots.txt');
      } else {
        this.addIssue('technical', 'WARNING', 'Robots.txt missing required directives', 'robots.txt');
      }
    } else {
      this.addIssue('technical', 'CRITICAL', 'Robots.txt not found', 'robots.txt');
    }
    
    console.log('   ✅ Sitemap and robots.txt validation completed');
  }

  validateSocialMediaTags() {
    const htmlPath = '/workspace/public/index.html';
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check Open Graph tags
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    let ogCount = 0;
    
    ogTags.forEach(tag => {
      if (htmlContent.includes(`property="${tag}"`)) {
        ogCount++;
      }
    });
    
    if (ogCount === ogTags.length) {
      this.addIssue('technical', 'PASS', 'All Open Graph tags present', 'index.html');
    } else {
      this.addIssue('technical', 'WARNING', `Missing ${ogTags.length - ogCount} Open Graph tags`, 'index.html');
    }
    
    // Check Twitter Card tags
    const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    let twitterCount = 0;
    
    twitterTags.forEach(tag => {
      if (htmlContent.includes(`property="${tag}"`)) {
        twitterCount++;
      }
    });
    
    if (twitterCount === twitterTags.length) {
      this.addIssue('technical', 'PASS', 'All Twitter Card tags present', 'index.html');
    } else {
      this.addIssue('technical', 'WARNING', `Missing ${twitterTags.length - twitterCount} Twitter Card tags`, 'index.html');
    }
    
    console.log('   ✅ Social media tags validation completed');
  }

  // Content SEO validation
  validateContentSEO() {
    console.log('\n📝 Validating Content SEO...');
    
    // Analyze blog posts
    this.analyzeBlogPosts();
    
    // Check content structure
    this.validateContentStructure();
    
    // Check internal linking
    this.validateInternalLinking();
  }

  analyzeBlogPosts() {
    blogPosts.forEach(postSlug => {
      const postPath = `/workspace/src/components/Blog/posts/${postSlug}.md`;
      if (fs.existsSync(postPath)) {
        const postContent = fs.readFileSync(postPath, 'utf8');
        
        // Check for frontmatter
        if (postContent.includes('---')) {
          this.addIssue('content', 'PASS', `Blog post ${postSlug} has proper frontmatter`, postPath);
        } else {
          this.addIssue('content', 'WARNING', `Blog post ${postSlug} missing frontmatter`, postPath);
        }
        
        // Check for FAQ sections
        if (postContent.includes('## FAQ') || postContent.includes('### FAQ')) {
          this.addIssue('content', 'PASS', `Blog post ${postSlug} contains FAQ section`, postPath);
        } else {
          this.addIssue('content', 'WARNING', `Blog post ${postSlug} missing FAQ section`, postPath);
        }
        
        // Check word count
        const wordCount = postContent.split(/\s+/).length;
        if (wordCount >= seoRules.content.wordCount.min) {
          this.addIssue('content', 'PASS', `Blog post ${postSlug} has sufficient word count (${wordCount})`, postPath);
        } else {
          this.addIssue('content', 'WARNING', `Blog post ${postSlug} word count too low (${wordCount}/${seoRules.content.wordCount.min})`, postPath);
        }
      } else {
        this.addIssue('content', 'CRITICAL', `Blog post ${postSlug} not found`, postPath);
      }
    });
    
    console.log('   ✅ Blog posts analysis completed');
  }

  validateContentStructure() {
    // Check Vue components for proper heading structure
    const vueFiles = [
      '/workspace/src/components/Blog/BlogPost.vue',
      '/workspace/src/components/Blog/Blog.vue'
    ];
    
    vueFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for h1 tags
        const h1Count = (content.match(/<h1/g) || []).length;
        if (h1Count >= seoRules.content.h1Tags.min && h1Count <= seoRules.content.h1Tags.max) {
          this.addIssue('content', 'PASS', `Proper h1 tag usage in ${path.basename(filePath)}`, filePath);
        } else {
          this.addIssue('content', 'WARNING', `Incorrect h1 tag usage in ${path.basename(filePath)} (${h1Count})`, filePath);
        }
        
        // Check for h2 tags
        const h2Count = (content.match(/<h2/g) || []).length;
        if (h2Count >= seoRules.content.h2Tags.min) {
          this.addIssue('content', 'PASS', `Sufficient h2 tags in ${path.basename(filePath)} (${h2Count})`, filePath);
        } else {
          this.addIssue('content', 'WARNING', `Insufficient h2 tags in ${path.basename(filePath)} (${h2Count})`, filePath);
        }
      }
    });
    
    console.log('   ✅ Content structure validation completed');
  }

  validateInternalLinking() {
    // Check for internal linking in blog posts
    let totalInternalLinks = 0;
    
    blogPosts.forEach(postSlug => {
      const postPath = `/workspace/src/components/Blog/posts/${postSlug}.md`;
      if (fs.existsSync(postPath)) {
        const postContent = fs.readFileSync(postPath, 'utf8');
        const internalLinks = (postContent.match(/\[.*?\]\(.*?sharedstake\.org.*?\)/g) || []).length;
        totalInternalLinks += internalLinks;
      }
    });
    
    if (totalInternalLinks >= seoRules.content.internalLinks.min) {
      this.addIssue('content', 'PASS', `Sufficient internal links found (${totalInternalLinks})`, 'blog-posts');
    } else {
      this.addIssue('content', 'WARNING', `Insufficient internal links (${totalInternalLinks}/${seoRules.content.internalLinks.min})`, 'blog-posts');
    }
    
    console.log('   ✅ Internal linking validation completed');
  }

  // Performance validation
  validatePerformance() {
    console.log('\n⚡ Validating Performance...');
    
    // Check image optimization
    this.validateImageOptimization();
    
    // Check lazy loading implementation
    this.validateLazyLoading();
    
    // Check compression
    this.validateCompression();
  }

  validateImageOptimization() {
    const imagePath = '/workspace/public/images';
    if (fs.existsSync(imagePath)) {
      const images = fs.readdirSync(imagePath).filter(file => 
        /\.(jpg|jpeg|png|webp|avif)$/i.test(file)
      );
      
      let optimizedImages = 0;
      let totalSize = 0;
      
      images.forEach(image => {
        const imageStats = fs.statSync(path.join(imagePath, image));
        totalSize += imageStats.size;
        
        // Check if image is reasonably sized (less than 500KB)
        if (imageStats.size < 500 * 1024) {
          optimizedImages++;
        }
      });
      
      const avgSize = totalSize / images.length;
      if (avgSize < 200 * 1024) {
        this.addIssue('performance', 'PASS', `Images well optimized (avg: ${(avgSize / 1024).toFixed(1)}KB)`, 'images');
      } else {
        this.addIssue('performance', 'WARNING', `Images need optimization (avg: ${(avgSize / 1024).toFixed(1)}KB)`, 'images');
      }
    }
    
    console.log('   ✅ Image optimization validation completed');
  }

  validateLazyLoading() {
    const markdownPath = '/workspace/src/utils/markdown.js';
    if (fs.existsSync(markdownPath)) {
      const content = fs.readFileSync(markdownPath, 'utf8');
      
      if (content.includes('loading="lazy"')) {
        this.addIssue('performance', 'PASS', 'Lazy loading implemented in markdown renderer', markdownPath);
      } else {
        this.addIssue('performance', 'WARNING', 'Lazy loading not implemented', markdownPath);
      }
    }
    
    console.log('   ✅ Lazy loading validation completed');
  }

  validateCompression() {
    // Check for compression configuration in build files
    const viteConfigPath = '/workspace/vite.config.js';
    if (fs.existsSync(viteConfigPath)) {
      const content = fs.readFileSync(viteConfigPath, 'utf8');
      
      if (content.includes('compression') || content.includes('gzip')) {
        this.addIssue('performance', 'PASS', 'Compression configured in build', viteConfigPath);
      } else {
        this.addIssue('performance', 'WARNING', 'Compression not configured', viteConfigPath);
      }
    }
    
    console.log('   ✅ Compression validation completed');
  }

  // Accessibility validation
  validateAccessibility() {
    console.log('\n♿ Validating Accessibility...');
    
    // Check alt text implementation
    this.validateAltText();
    
    // Check heading structure
    this.validateHeadingStructure();
    
    // Check color contrast (basic check)
    this.validateColorContrast();
  }

  validateAltText() {
    const markdownPath = '/workspace/src/utils/markdown.js';
    if (fs.existsSync(markdownPath)) {
      const content = fs.readFileSync(markdownPath, 'utf8');
      
      if (content.includes('alt=')) {
        this.addIssue('accessibility', 'PASS', 'Alt text implementation found', markdownPath);
      } else {
        this.addIssue('accessibility', 'CRITICAL', 'Alt text not implemented', markdownPath);
      }
    }
    
    console.log('   ✅ Alt text validation completed');
  }

  validateHeadingStructure() {
    // Check for proper heading hierarchy in Vue components
    const vueFiles = [
      '/workspace/src/components/Blog/BlogPost.vue',
      '/workspace/src/components/Blog/Blog.vue'
    ];
    
    vueFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for h1, h2, h3 structure
        const hasH1 = content.includes('<h1');
        const hasH2 = content.includes('<h2');
        
        if (hasH1 && hasH2) {
          this.addIssue('accessibility', 'PASS', `Proper heading structure in ${path.basename(filePath)}`, filePath);
        } else {
          this.addIssue('accessibility', 'WARNING', `Improper heading structure in ${path.basename(filePath)}`, filePath);
        }
      }
    });
    
    console.log('   ✅ Heading structure validation completed');
  }

  validateColorContrast() {
    // Basic check for color contrast implementation
    const cssPath = '/workspace/public/assets/styles/main.css';
    if (fs.existsSync(cssPath)) {
      const content = fs.readFileSync(cssPath, 'utf8');
      
      if (content.includes('color:') && content.includes('background:')) {
        this.addIssue('accessibility', 'PASS', 'Color and background styles found', cssPath);
      } else {
        this.addIssue('accessibility', 'WARNING', 'Color contrast not verified', cssPath);
      }
    }
    
    console.log('   ✅ Color contrast validation completed');
  }

  // Utility methods
  addIssue(category, severity, message, file) {
    this.results[category].issues.push({ severity, message, file });
    
    if (severity === 'CRITICAL') {
      this.results[category].failed++;
      console.log(`   ❌ ${severity}: ${message}`);
    } else if (severity === 'WARNING') {
      this.results[category].warnings++;
      console.log(`   ⚠️  ${severity}: ${message}`);
    } else if (severity === 'PASS') {
      this.results[category].passed++;
      console.log(`   ✅ ${severity}: ${message}`);
    }
  }

  calculateOverallScore() {
    const categories = ['technical', 'content', 'performance', 'accessibility'];
    let totalScore = 0;
    let totalWeight = 0;
    
    const weights = {
      technical: 0.4,
      content: 0.3,
      performance: 0.2,
      accessibility: 0.1
    };
    
    categories.forEach(category => {
      const categoryResults = this.results[category];
      const totalIssues = categoryResults.passed + categoryResults.failed + categoryResults.warnings;
      const categoryScore = totalIssues > 0 ? (categoryResults.passed / totalIssues) * 100 : 0;
      
      totalScore += categoryScore * weights[category];
      totalWeight += weights[category];
    });
    
    this.results.overall.score = Math.round(totalScore / totalWeight);
    
    // Determine grade
    if (this.results.overall.score >= 95) this.results.overall.grade = 'A+';
    else if (this.results.overall.score >= 90) this.results.overall.grade = 'A';
    else if (this.results.overall.score >= 85) this.results.overall.grade = 'B+';
    else if (this.results.overall.score >= 80) this.results.overall.grade = 'B';
    else if (this.results.overall.score >= 75) this.results.overall.grade = 'C+';
    else if (this.results.overall.score >= 70) this.results.overall.grade = 'C';
    else if (this.results.overall.score >= 65) this.results.overall.grade = 'D+';
    else if (this.results.overall.score >= 60) this.results.overall.grade = 'D';
    else this.results.overall.grade = 'F';
  }

  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE SEO VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Overall score
    console.log(`\n🎯 Overall SEO Score: ${this.results.overall.score}/100 (Grade: ${this.results.overall.grade})`);
    
    // Category breakdown
    const categories = [
      { name: 'Technical SEO', key: 'technical', weight: 40 },
      { name: 'Content SEO', key: 'content', weight: 30 },
      { name: 'Performance', key: 'performance', weight: 20 },
      { name: 'Accessibility', key: 'accessibility', weight: 10 }
    ];
    
    console.log('\n📈 Category Breakdown:');
    categories.forEach(category => {
      const results = this.results[category.key];
      const totalIssues = results.passed + results.failed + results.warnings;
      const score = totalIssues > 0 ? Math.round((results.passed / totalIssues) * 100) : 0;
      
      console.log(`\n${category.name} (${category.weight}% weight):`);
      console.log(`   Score: ${score}/100`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   ⚠️  Warnings: ${results.warnings}`);
    });
    
    // Critical issues
    const allCriticalIssues = [];
    Object.keys(this.results).forEach(category => {
      if (category !== 'overall') {
        this.results[category].issues
          .filter(issue => issue.severity === 'CRITICAL')
          .forEach(issue => allCriticalIssues.push({ ...issue, category }));
      }
    });
    
    if (allCriticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Fix Immediately):');
      allCriticalIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. [${issue.category.toUpperCase()}] ${issue.message}`);
        console.log(`   File: ${issue.file}`);
      });
    }
    
    // Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    
    if (this.results.overall.score >= 90) {
      console.log('   🎉 Excellent SEO implementation! Focus on maintaining quality and monitoring performance.');
    } else if (this.results.overall.score >= 80) {
      console.log('   👍 Good SEO implementation. Address warnings to reach excellence.');
    } else if (this.results.overall.score >= 70) {
      console.log('   📈 Decent SEO implementation. Focus on critical issues and major improvements.');
    } else {
      console.log('   🚨 SEO needs significant improvement. Address critical issues immediately.');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Fix all CRITICAL issues immediately');
    console.log('   2. Address WARNING issues within 1 week');
    console.log('   3. Test with Google\'s Rich Results Test');
    console.log('   4. Submit sitemap to Google Search Console');
    console.log('   5. Monitor performance with PageSpeed Insights');
    console.log('   6. Set up Google Analytics 4 for tracking');
    
    console.log('\n' + '='.repeat(80));
    
    return this.results;
  }

  async run() {
    console.log('🔍 Starting Comprehensive SEO Validation...\n');
    
    // Run all validations
    this.validateTechnicalSEO();
    this.validateContentSEO();
    this.validatePerformance();
    this.validateAccessibility();
    
    // Calculate overall score
    this.calculateOverallScore();
    
    // Generate report
    return this.generateComprehensiveReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ComprehensiveSEOValidator();
  validator.run().then(report => {
    process.exit(report.overall.score >= 80 ? 0 : 1);
  });
}

export default ComprehensiveSEOValidator;