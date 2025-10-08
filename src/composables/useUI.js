/**
 * Vue 2 compatible composable for common UI operations
 * Provides utilities for notifications, loading states, and UI interactions
 */
export function useUI() {
  // Helper function to show notifications
  const showNotification = (message, type = 'info', duration = 5000) => {
    // This would integrate with vue-notification
    if (window.Vue && window.Vue.prototype.$notify) {
      window.Vue.prototype.$notify({
        group: 'foo',
        type: type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        text: message,
        duration: duration
      });
    } else {
      // Fallback to console for development
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  };

  // Helper function to show success notification
  const showSuccess = (message, duration = 5000) => {
    showNotification(message, 'success', duration);
  };

  // Helper function to show error notification
  const showError = (message, duration = 8000) => {
    showNotification(message, 'error', duration);
  };

  // Helper function to show warning notification
  const showWarning = (message, duration = 6000) => {
    showNotification(message, 'warn', duration);
  };

  // Helper function to show info notification
  const showInfo = (message, duration = 5000) => {
    showNotification(message, 'info', duration);
  };

  // Helper function to format loading text
  const formatLoadingText = (action, step = null) => {
    if (step) {
      return `${action}... (${step})`;
    }
    return `${action}...`;
  };

  // Helper function to create loading state
  const createLoadingState = (initialState = false) => {
    return {
      loading: initialState,
      loadingText: '',
      loadingStep: null
    };
  };

  // Helper function to update loading state
  const updateLoadingState = (state, loading, text = '', step = null) => {
    state.loading = loading;
    state.loadingText = text;
    state.loadingStep = step;
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard!');
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess('Copied to clipboard!');
        return true;
      } catch (fallbackError) {
        showError('Failed to copy to clipboard');
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount, currency = 'USD', precision = 2) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value, precision = 2) => {
    if (!value) return '0%';
    return `${parseFloat(value).toFixed(precision)}%`;
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50, suffix = '...') => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  };

  // Helper function to debounce function calls
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Helper function to throttle function calls
  const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    formatLoadingText,
    createLoadingState,
    updateLoadingState,
    copyToClipboard,
    formatCurrency,
    formatPercentage,
    truncateText,
    debounce,
    throttle
  };
}