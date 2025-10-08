#!/usr/bin/env node

/**
 * SEO Validation Script for SharedStake
 * 
 * This script validates all critical SEO elements and provides
 * actionable recommendations for improvements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SEO validation rules
const seoRules = {
  // Meta tags validation
  metaTags: {
    title: {
      required: true,
      minLength: 30,
      maxLength: 60,
      description: 'Page title for search engines'
    },
    description: {
      required: true,
      minLength: 120,
      maxLength: 160,
      description: 'Meta description for search results'
    },
    keywords: {
      required: false,
      description: 'Meta keywords (optional)'
    },
    robots: {
      required: true,
      description: 'Robots meta tag for crawler instructions'
    }
  },

  // Open Graph validation
  openGraph: {
    'og:title': {
      required: true,
      maxLength: 60,
      description: 'Open Graph title for social sharing'
    },
    'og:description': {
      required: true,
      maxLength: 160,
      description: 'Open Graph description for social sharing'
    },
    'og:image': {
      required: true,
      description: 'Open Graph image for social sharing'
    },
    'og:url': {
      required: true,
      description: 'Canonical URL for social sharing'
    },
    'og:type': {
      required: true,
      description: 'Open Graph content type'
    }
  },

  // Twitter Card validation
  twitterCard: {
    'twitter:card': {
      required: true,
      description: 'Twitter card type'
    },
    'twitter:title': {
      required: true,
      maxLength: 60,
      description: 'Twitter card title'
    },
    'twitter:description': {
      required: true,
      maxLength: 160,
      description: 'Twitter card description'
    },
    'twitter:image': {
      required: true,
      description: 'Twitter card image'
    }
  },

  // Technical SEO validation
  technical: {
    canonical: {
      required: true,
      description: 'Canonical URL to prevent duplicate content'
    },
    favicon: {
      required: true,
      description: 'Favicon for browser tabs'
    },
    sitemap: {
      required: true,
      description: 'XML sitemap for search engines'
    },
    robotsTxt: {
      required: true,
      description: 'Robots.txt file for crawler instructions'
    }
  }
};

// Critical files to check
const criticalFiles = [
  '/workspace/public/index.html',
  '/workspace/public/robots.txt',
  '/workspace/public/sitemap.xml',
  '/workspace/public/favicon.ico',
  '/workspace/public/apple-touch-icon.png',
  '/workspace/public/images/og-image.jpg',
  '/workspace/public/images/twitter-card.jpg'
];

// Blog posts to validate
const blogPosts = [
  'ethereum-staking-guide-2024',
  'understanding-liquid-staking-benefits',
  'defi-integration-opportunities',
  'security-audit-results-certik',
  'sharedstake-v2-launch-announcement',
  'how-we-updated-sharedstake-ui-with-ai',
  'ethereum-node-made-simple-eth2-quickstart'
];

class SEOValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
  }

  validateFile(filePath, description) {
    console.log(`\n🔍 Validating ${description}...`);
    
    if (!fs.existsSync(filePath)) {
      this.addIssue('CRITICAL', `${description} not found`, filePath);
      return false;
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      this.addIssue('CRITICAL', `${description} is empty`, filePath);
      return false;
    }

    console.log(`   ✅ ${description} exists (${(stats.size / 1024).toFixed(1)}KB)`);
    return true;
  }

  validateHTML(htmlContent) {
    console.log('\n📄 Validating HTML structure...');
    
    // Check for required meta tags
    this.validateMetaTag(htmlContent, 'title', seoRules.metaTags.title);
    this.validateMetaTag(htmlContent, 'description', seoRules.metaTags.description);
    this.validateMetaTag(htmlContent, 'robots', seoRules.metaTags.robots);
    
    // Check for Open Graph tags
    this.validateOpenGraph(htmlContent);
    
    // Check for Twitter Card tags
    this.validateTwitterCard(htmlContent);
    
    // Check for canonical URL
    this.validateCanonical(htmlContent);
    
    // Check for structured data
    this.validateStructuredData(htmlContent);
  }

  validateMetaTag(html, name, rule) {
    const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    
    if (!match && rule.required) {
      this.addIssue('CRITICAL', `Missing required meta tag: ${name}`, 'index.html');
      return;
    }
    
    if (match) {
      const content = match[1];
      console.log(`   ✅ Meta ${name}: "${content}"`);
      
      // Check length constraints
      if (rule.minLength && content.length < rule.minLength) {
        this.addIssue('WARNING', `Meta ${name} too short (${content.length}/${rule.minLength} chars)`, 'index.html');
      }
      
      if (rule.maxLength && content.length > rule.maxLength) {
        this.addIssue('WARNING', `Meta ${name} too long (${content.length}/${rule.maxLength} chars)`, 'index.html');
      }
    }
  }

  validateOpenGraph(html) {
    console.log('\n📱 Validating Open Graph tags...');
    
    Object.keys(seoRules.openGraph).forEach(tag => {
      const regex = new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(regex);
      
      if (!match && seoRules.openGraph[tag].required) {
        this.addIssue('CRITICAL', `Missing required Open Graph tag: ${tag}`, 'index.html');
        return;
      }
      
      if (match) {
        const content = match[1];
        console.log(`   ✅ ${tag}: "${content}"`);
        
        // Check length constraints
        if (seoRules.openGraph[tag].maxLength && content.length > seoRules.openGraph[tag].maxLength) {
          this.addIssue('WARNING', `${tag} too long (${content.length}/${seoRules.openGraph[tag].maxLength} chars)`, 'index.html');
        }
      }
    });
  }

  validateTwitterCard(html) {
    console.log('\n🐦 Validating Twitter Card tags...');
    
    Object.keys(seoRules.twitterCard).forEach(tag => {
      const regex = new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(regex);
      
      if (!match && seoRules.twitterCard[tag].required) {
        this.addIssue('CRITICAL', `Missing required Twitter Card tag: ${tag}`, 'index.html');
        return;
      }
      
      if (match) {
        const content = match[1];
        console.log(`   ✅ ${tag}: "${content}"`);
        
        // Check length constraints
        if (seoRules.twitterCard[tag].maxLength && content.length > seoRules.twitterCard[tag].maxLength) {
          this.addIssue('WARNING', `${tag} too long (${content.length}/${seoRules.twitterCard[tag].maxLength} chars)`, 'index.html');
        }
      }
    });
  }

  validateCanonical(html) {
    console.log('\n🔗 Validating canonical URL...');
    
    const regex = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i;
    const match = html.match(regex);
    
    if (!match) {
      this.addIssue('CRITICAL', 'Missing canonical URL', 'index.html');
      return;
    }
    
    const canonicalUrl = match[1];
    console.log(`   ✅ Canonical URL: "${canonicalUrl}"`);
    
    if (!canonicalUrl.startsWith('https://')) {
      this.addIssue('WARNING', 'Canonical URL should use HTTPS', 'index.html');
    }
  }

  validateStructuredData(html) {
    console.log('\n📊 Validating structured data...');
    
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is;
    const matches = html.match(regex);
    
    if (!matches) {
      this.addIssue('WARNING', 'No structured data found', 'index.html');
      return;
    }
    
    matches.forEach((match, index) => {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const structuredData = JSON.parse(jsonContent);
        
        console.log(`   ✅ Structured data ${index + 1}: ${structuredData['@type'] || 'Unknown type'}`);
        
        // Validate required fields
        if (structuredData['@type'] === 'Organization') {
          if (!structuredData.name) {
            this.addIssue('WARNING', 'Organization structured data missing name', 'index.html');
          }
          if (!structuredData.url) {
            this.addIssue('WARNING', 'Organization structured data missing URL', 'index.html');
          }
        }
      } catch (error) {
        this.addIssue('CRITICAL', `Invalid structured data JSON: ${error.message}`, 'index.html');
      }
    });
  }

  validateSitemap(sitemapPath) {
    console.log('\n🗺️ Validating XML sitemap...');
    
    if (!fs.existsSync(sitemapPath)) {
      this.addIssue('CRITICAL', 'XML sitemap not found', 'sitemap.xml');
      return;
    }
    
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    
    // Check for required XML structure
    if (!sitemapContent.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      this.addIssue('WARNING', 'Sitemap missing XML declaration', 'sitemap.xml');
    }
    
    if (!sitemapContent.includes('<urlset')) {
      this.addIssue('CRITICAL', 'Sitemap missing urlset element', 'sitemap.xml');
    }
    
    // Count URLs
    const urlMatches = sitemapContent.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    console.log(`   ✅ Sitemap contains ${urlCount} URLs`);
    
    // Check for blog posts
    blogPosts.forEach(post => {
      if (!sitemapContent.includes(`/blog/${post}`)) {
        this.addIssue('WARNING', `Blog post missing from sitemap: ${post}`, 'sitemap.xml');
      }
    });
  }

  validateRobotsTxt(robotsPath) {
    console.log('\n🤖 Validating robots.txt...');
    
    if (!fs.existsSync(robotsPath)) {
      this.addIssue('CRITICAL', 'robots.txt not found', 'robots.txt');
      return;
    }
    
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    
    // Check for required directives
    if (!robotsContent.includes('User-agent:')) {
      this.addIssue('WARNING', 'robots.txt missing User-agent directive', 'robots.txt');
    }
    
    if (!robotsContent.includes('Sitemap:')) {
      this.addIssue('WARNING', 'robots.txt missing Sitemap directive', 'robots.txt');
    }
    
    console.log(`   ✅ robots.txt exists (${robotsContent.length} characters)`);
  }

  addIssue(severity, message, file) {
    this.results.issues.push({ severity, message, file });
    
    if (severity === 'CRITICAL') {
      this.results.failed++;
      console.log(`   ❌ ${severity}: ${message}`);
    } else if (severity === 'WARNING') {
      this.results.warnings++;
      console.log(`   ⚠️  ${severity}: ${message}`);
    } else {
      this.results.passed++;
      console.log(`   ✅ ${severity}: ${message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEO VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings}`);
    
    const totalIssues = this.results.failed + this.results.warnings;
    const score = totalIssues === 0 ? 100 : Math.max(0, 100 - (totalIssues * 5));
    
    console.log(`\n🎯 SEO Score: ${score}/100`);
    
    if (this.results.issues.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      this.results.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.severity}: ${issue.message}`);
        console.log(`   File: ${issue.file}`);
      });
    }
    
    console.log(`\n📋 Recommendations:`);
    
    if (this.results.failed > 0) {
      console.log(`\n🔴 CRITICAL (Fix Immediately):`);
      this.results.issues
        .filter(issue => issue.severity === 'CRITICAL')
        .forEach(issue => {
          console.log(`   • ${issue.message}`);
        });
    }
    
    if (this.results.warnings > 0) {
      console.log(`\n🟡 WARNINGS (Fix Soon):`);
      this.results.issues
        .filter(issue => issue.severity === 'WARNING')
        .forEach(issue => {
          console.log(`   • ${issue.message}`);
        });
    }
    
    console.log(`\n🚀 Next Steps:`);
    console.log(`   1. Fix all CRITICAL issues immediately`);
    console.log(`   2. Address WARNING issues within 1 week`);
    console.log(`   3. Test with Google's Rich Results Test`);
    console.log(`   4. Submit sitemap to Google Search Console`);
    console.log(`   5. Monitor performance with PageSpeed Insights`);
    
    console.log('\n' + '='.repeat(60));
    
    return {
      score,
      issues: this.results.issues,
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings
      }
    };
  }

  async run() {
    console.log('🔍 Starting SEO Validation...\n');
    
    // Validate critical files
    criticalFiles.forEach(file => {
      const description = path.basename(file);
      this.validateFile(file, description);
    });
    
    // Validate HTML content
    const htmlPath = '/workspace/public/index.html';
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      this.validateHTML(htmlContent);
    }
    
    // Validate sitemap
    this.validateSitemap('/workspace/public/sitemap.xml');
    
    // Validate robots.txt
    this.validateRobotsTxt('/workspace/public/robots.txt');
    
    // Generate final report
    return this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SEOValidator();
  validator.run().then(report => {
    process.exit(report.score >= 90 ? 0 : 1);
  });
}

export default SEOValidator;