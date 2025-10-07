import { mount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Blog from '@/components/Blog/Blog.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)

const router = new VueRouter({
  routes: [
    { path: '/blog', component: Blog },
    { path: '/blog/:slug', component: { template: '<div>Blog Post</div>' } }
  ]
})

// Mock the blog data
const mockBlogData = [
  {
    id: 1,
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test blog post excerpt',
    content: 'Full blog post content',
    author: 'Test Author',
    publishDate: '2024-01-01',
    featured: true
  },
  {
    id: 2,
    title: 'Another Test Post',
    slug: 'another-test-post',
    excerpt: 'Another test blog post excerpt',
    content: 'Another full blog post content',
    author: 'Another Author',
    publishDate: '2024-01-02',
    featured: false
  }
]

describe('Blog.vue', () => {
  let wrapper

  beforeEach(() => {
    // Mock the blog data import
    jest.doMock('@/components/Blog/data/index.js', () => ({
      default: mockBlogData
    }))
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
  })

  it('renders without crashing', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      }
    })
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.Blog').exists()).toBe(true)
  })

  it('displays the blog title', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      }
    })
    
    expect(wrapper.text()).toContain('SharedStake Blog')
  })

  it('displays the blog description', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      }
    })
    
    expect(wrapper.text()).toContain('Stay updated with the latest developments')
  })

  it('has correct CSS classes', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      }
    })
    
    const blogElement = wrapper.find('.Blog')
    expect(blogElement.classes()).toContain('min-h-screen')
    expect(blogElement.classes()).toContain('bg-gray-900')
    expect(blogElement.classes()).toContain('text-white')
  })

  it('renders featured posts section when posts are available', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      },
      data() {
        return {
          posts: mockBlogData
        }
      }
    })
    
    expect(wrapper.text()).toContain('Featured Posts')
  })

  it('renders all posts section', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      },
      data() {
        return {
          posts: mockBlogData
        }
      }
    })
    
    expect(wrapper.text()).toContain('All Posts')
  })

  it('has proper heading structure', () => {
    wrapper = mount(Blog, {
      localVue,
      router,
      stubs: {
        'router-link': true,
        'router-view': true
      }
    })
    
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('SharedStake Blog')
  })
})