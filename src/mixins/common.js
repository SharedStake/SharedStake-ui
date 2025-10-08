/**
 * Common mixins for Vue 2 components
 * Provides reusable functionality across components
 */

import { useWeb3, useUI, useFormValidation, useUtils } from '../composables';

// Web3 mixin
export const web3Mixin = {
  data() {
    return {
      web3Utils: useWeb3(),
      uiUtils: useUI(),
      formUtils: useFormValidation(),
      utils: useUtils()
    };
  },
  methods: {
    formatAddress(address) {
      return this.web3Utils.formatAddress(address);
    },
    formatTokenAmount(amount, decimals = 18, precision = 4) {
      return this.web3Utils.formatTokenAmount(amount, decimals, precision);
    },
    parseTokenAmount(amount, decimals = 18) {
      return this.web3Utils.parseTokenAmount(amount, decimals);
    },
    handleWeb3Error(error, context = 'Web3 operation') {
      return this.web3Utils.handleWeb3Error(error, context);
    },
    isValidAddress(address) {
      return this.web3Utils.isValidAddress(address);
    },
    isValidAmount(amount) {
      return this.web3Utils.isValidAmount(amount);
    },
    getNetworkName(chainId) {
      return this.web3Utils.getNetworkName(chainId);
    }
  }
};

// UI mixin
export const uiMixin = {
  data() {
    return {
      uiUtils: useUI(),
      utils: useUtils()
    };
  },
  methods: {
    showSuccess(message, duration = 5000) {
      this.uiUtils.showSuccess(message, duration);
    },
    showError(message, duration = 8000) {
      this.uiUtils.showError(message, duration);
    },
    showWarning(message, duration = 6000) {
      this.uiUtils.showWarning(message, duration);
    },
    showInfo(message, duration = 5000) {
      this.uiUtils.showInfo(message, duration);
    },
    copyToClipboard(text) {
      return this.uiUtils.copyToClipboard(text);
    },
    formatCurrency(amount, currency = 'USD', precision = 2) {
      return this.uiUtils.formatCurrency(amount, currency, precision);
    },
    formatPercentage(value, precision = 2) {
      return this.uiUtils.formatPercentage(value, precision);
    },
    truncateText(text, maxLength = 50, suffix = '...') {
      return this.uiUtils.truncateText(text, maxLength, suffix);
    }
  }
};

// Form validation mixin
export const formValidationMixin = {
  data() {
    return {
      formUtils: useFormValidation(),
      validationErrors: {}
    };
  },
  methods: {
    validateEmail(email) {
      return this.formUtils.validateEmail(email);
    },
    validateUrl(url) {
      return this.formUtils.validateUrl(url);
    },
    validateNumber(value, min = null, max = null) {
      return this.formUtils.validateNumber(value, min, max);
    },
    validateRequired(value) {
      return this.formUtils.validateRequired(value);
    },
    validateMinLength(value, minLength) {
      return this.formUtils.validateMinLength(value, minLength);
    },
    validateMaxLength(value, maxLength) {
      return this.formUtils.validateMaxLength(value, maxLength);
    },
    validateTokenAmount(amount, balance = null, minAmount = 0) {
      return this.formUtils.validateTokenAmount(amount, balance, minAmount);
    },
    validateAddress(address) {
      return this.formUtils.validateAddress(address);
    },
    validateForm(data, rules) {
      const result = this.formUtils.validateForm(data, rules);
      this.validationErrors = result.errors;
      return result;
    },
    clearValidationErrors() {
      this.validationErrors = {};
    },
    hasValidationError(field) {
      return !!this.validationErrors[field];
    },
    getValidationError(field) {
      return this.validationErrors[field] || '';
    }
  }
};

// Loading state mixin
export const loadingMixin = {
  data() {
    return {
      loading: false,
      loadingText: '',
      loadingStep: null
    };
  },
  methods: {
    setLoading(loading, text = '', step = null) {
      this.loading = loading;
      this.loadingText = text;
      this.loadingStep = step;
    },
    setLoadingText(text) {
      this.loadingText = text;
    },
    setLoadingStep(step) {
      this.loadingStep = step;
    },
    clearLoading() {
      this.loading = false;
      this.loadingText = '';
      this.loadingStep = null;
    }
  }
};

// Responsive mixin
export const responsiveMixin = {
  data() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };
  },
  computed: {
    isMobile() {
      return this.windowWidth < 768;
    },
    isTablet() {
      return this.windowWidth >= 768 && this.windowWidth < 1024;
    },
    isDesktop() {
      return this.windowWidth >= 1024;
    },
    isLargeScreen() {
      return this.windowWidth >= 1280;
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
    }
  }
};

// Scroll mixin
export const scrollMixin = {
  data() {
    return {
      scrollPosition: 0,
      lastScrollPosition: 0,
      scrollDirection: 'down'
    };
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.lastScrollPosition = this.scrollPosition;
      this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      this.scrollDirection = this.scrollPosition > this.lastScrollPosition ? 'down' : 'up';
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    scrollToElement(element, offset = 0) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (element) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({ top: elementPosition, behavior: 'smooth' });
      }
    }
  }
};

// Utility mixin
export const utilityMixin = {
  data() {
    return {
      utils: useUtils()
    };
  },
  methods: {
    generateId(prefix = 'id') {
      return this.utils.generateId(prefix);
    },
    sleep(ms) {
      return this.utils.sleep(ms);
    },
    formatFileSize(bytes) {
      return this.utils.formatFileSize(bytes);
    },
    formatDuration(ms) {
      return this.utils.formatDuration(ms);
    },
    formatRelativeTime(date) {
      return this.utils.formatRelativeTime(date);
    },
    capitalize(str) {
      return this.utils.capitalize(str);
    },
    capitalizeWords(str) {
      return this.utils.capitalizeWords(str);
    },
    camelToKebab(str) {
      return this.utils.camelToKebab(str);
    },
    kebabToCamel(str) {
      return this.utils.kebabToCamel(str);
    },
    randomString(length = 10) {
      return this.utils.randomString(length);
    },
    randomNumber(min = 0, max = 100) {
      return this.utils.randomNumber(min, max);
    },
    shuffleArray(array) {
      return this.utils.shuffleArray(array);
    },
    removeDuplicates(array, key = null) {
      return this.utils.removeDuplicates(array, key);
    },
    getNestedValue(obj, path, defaultValue = null) {
      return this.utils.getNestedValue(obj, path, defaultValue);
    },
    setNestedValue(obj, path, value) {
      return this.utils.setNestedValue(obj, path, value);
    },
    deepMerge(target, source) {
      return this.utils.deepMerge(target, source);
    }
  }
};