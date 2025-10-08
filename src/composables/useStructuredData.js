// Composable for managing structured data (JSON-LD)
import { computed, watch } from 'vue'

export function useStructuredData() {
  
  // Generate BlogPosting schema
  const generateBlogPostingSchema = (post, currentUrl) => {
    if (!post) return null
    
    // Calculate word count from content
    const wordCount = post.rawContent ? post.rawContent.split(/\s+/).length : 0
    
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
      "publisher": {
        "@type": "Organization",
        "name": "SharedStake",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sharedstake.org/logo-white.svg",
          "width": 200,
          "height": 60
        },
        "url": "https://sharedstake.org"
      },
      "datePublished": post.publishDate,
      "dateModified": post.publishDate,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      },
      "keywords": post.meta?.keywords || post.tags?.join(', '),
      "articleSection": "DeFi",
      "wordCount": wordCount,
      "inLanguage": "en-US",
      "url": currentUrl
    }
  }
  
  // Generate FAQ schema from FAQ content
  const generateFAQSchema = (faqContent) => {
    if (!faqContent) return null
    
    const questions = []
    const lines = faqContent.split('\n')
    let currentQuestion = null
    let currentAnswer = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Check if line is a question (starts with ### or ##)
      if (line.match(/^#{2,3}\s+(.+)/)) {
        // Save previous question if exists
        if (currentQuestion && currentAnswer.length > 0) {
          questions.push({
            "@type": "Question",
            "name": currentQuestion,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": currentAnswer.join(' ').trim()
            }
          })
        }
        
        // Start new question
        currentQuestion = line.replace(/^#{2,3}\s+/, '').replace(/\?$/, '')
        currentAnswer = []
      } else if (currentQuestion && line && !line.startsWith('#')) {
        // Add to current answer
        currentAnswer.push(line)
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
      })
    }
    
    if (questions.length === 0) return null
    
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questions
    }
  }
  
  // Generate Breadcrumb schema
  const generateBreadcrumbSchema = (breadcrumbs) => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    }
  }
  
  // Inject JSON-LD script into document head
  const injectSchema = (schema, id) => {
    // Remove existing schema with same ID
    const existing = document.getElementById(id)
    if (existing) {
      existing.remove()
    }
    
    if (!schema) return
    
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    script.textContent = JSON.stringify(schema, null, 2)
    document.head.appendChild(script)
  }
  
  // Remove schema by ID
  const removeSchema = (id) => {
    const existing = document.getElementById(id)
    if (existing) {
      existing.remove()
    }
  }
  
  return {
    generateBlogPostingSchema,
    generateFAQSchema,
    generateBreadcrumbSchema,
    injectSchema,
    removeSchema
  }
}