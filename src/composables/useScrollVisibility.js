/**
 * Vue 3 compatible composable for managing element visibility based on scroll direction
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum scroll distance before triggering visibility change (default: 100)
 * @param {boolean} options.hideOnScrollDown - Whether to hide element when scrolling down (default: true)
 * @param {boolean} options.showOnScrollUp - Whether to show element when scrolling up (default: true)
 * @returns {Object} - Object containing scroll visibility utilities
 */
export function useScrollVisibility(options = {}) {
  const {
    threshold = 100,
    hideOnScrollDown = true,
    showOnScrollUp = true
  } = options;

  // Return utility functions that can be used in Vue 3 components
  const createScrollVisibility = () => {
    let isVisible = true;
    let lastScrollPosition = 0;
    let currentScrollPosition = 0;

    const handleScroll = () => {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollPosition < 0) {
        return;
      }

      currentScrollPosition = scrollPosition;

      // Only update visibility if scroll distance exceeds threshold
      if (Math.abs(scrollPosition - lastScrollPosition) < threshold) {
        return;
      }

      const isScrollingUp = scrollPosition < lastScrollPosition;
      
      if (hideOnScrollDown && !isScrollingUp) {
        isVisible = false;
      } else if (showOnScrollUp && isScrollingUp) {
        isVisible = true;
      }

      lastScrollPosition = scrollPosition;
    };

    return {
      get isVisible() { return isVisible; },
      get currentScrollPosition() { return currentScrollPosition; },
      get lastScrollPosition() { return lastScrollPosition; },
      handleScroll
    };
  };

  return {
    createScrollVisibility
  };
}