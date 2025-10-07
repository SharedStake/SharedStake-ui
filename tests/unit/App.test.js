import { mount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import App from '@/App.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)

const router = new VueRouter({
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/stake', component: { template: '<div>Stake</div>' } },
    { path: '/earn', component: { template: '<div>Earn</div>' } },
    { path: '/withdraw', component: { template: '<div>Withdraw</div>' } }
  ]
})

describe('App.vue', () => {
  it('renders without crashing', () => {
    const wrapper = mount(App, {
      localVue,
      router,
      stubs: {
        'router-view': true,
        'notifications': true
      }
    })
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('#app').exists()).toBe(true)
  })

  it('contains router-view', () => {
    const wrapper = mount(App, {
      localVue,
      router,
      stubs: {
        'router-view': true,
        'notifications': true
      }
    })
    
    expect(wrapper.find('router-view-stub').exists()).toBe(true)
  })

  it('contains notifications component', () => {
    const wrapper = mount(App, {
      localVue,
      router,
      stubs: {
        'router-view': true,
        'notifications': true
      }
    })
    
    expect(wrapper.find('notifications-stub').exists()).toBe(true)
  })

  it('has correct component name', () => {
    const wrapper = mount(App, {
      localVue,
      router,
      stubs: {
        'router-view': true,
        'notifications': true
      }
    })
    
    expect(wrapper.vm.$options.name).toBe('App')
  })
})