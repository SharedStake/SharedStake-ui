/**
 * Vue 3 Composition API composable for managing element visibility based on scroll direction
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum scroll distance before triggering visibility change (default: 100)
 * @param {boolean} options.hideOnScrollDown - Whether to hide element when scrolling down (default: true)
 * @param {boolean} options.showOnScrollUp - Whether to show element when scrolling up (default: true)
 * @returns {Object} - Object containing reactive scroll visibility state and methods
 */
import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollVisibility(options = {}) {
  const {
    threshold = 100,
    hideOnScrollDown = true,
    showOnScrollUp = true
  } = options;

  // Reactive state
  const isVisible = ref(true)
  const lastScrollPosition = ref(0)
  const currentScrollPosition = ref(0)

  const handleScroll = () => {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollPosition < 0) {
      return;
    }

    currentScrollPosition.value = scrollPosition;

    // Only update visibility if scroll distance exceeds threshold
    if (Math.abs(scrollPosition - lastScrollPosition.value) < threshold) {
      return;
    }

    const isScrollingUp = scrollPosition < lastScrollPosition.value;
    
    if (hideOnScrollDown && !isScrollingUp) {
      isVisible.value = false;
    } else if (showOnScrollUp && isScrollingUp) {
      isVisible.value = true;
    }

    lastScrollPosition.value = scrollPosition;
  };

  // Lifecycle management
  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    isVisible,
    currentScrollPosition,
    lastScrollPosition,
    handleScroll
  };
}