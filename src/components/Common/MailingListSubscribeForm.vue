<template>
  <div class="mailing-list-container">
    <div id="mc_embed_signup">
      <form
        v-if="!submitted"
        @submit.prevent="handleSubmit"
        class="validate"
        novalidate
      >
        <div id="mc_embed_signup_scroll">
          <div class="subscribe">
            <div class="input-container">
              <input
                type="email"
                v-model="email"
                class="email"
                id="mce-EMAIL"
                placeholder="Enter your email address"
                required
                aria-label="Email address"
                aria-invalid="hasError"
                aria-describedby="error-message"
                @input="clearError"
              />
              <button
                type="submit"
                class="submit-button"
                :disabled="isSubmitting"
                :aria-busy="isSubmitting"
                aria-label="Subscribe to mailing list"
              >
                <span v-if="isSubmitting" class="loading-spinner" aria-hidden="true"></span>
                {{ buttonText }}
              </button>
            </div>
            <div v-if="error" id="error-message" class="error-message" role="alert">{{ error }}</div>
          </div>
        </div>
      </form>
      <div v-else class="success-message">
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <p>Thank you for subscribing!</p>
        <p class="success-subtext">Check your email to confirm your subscription.</p>
      </div>
    </div>
  </div>
</template>

<script>
// Configuration constants
const CONFIG = {
  MAILCHIMP_URL: 'https://sharedstake.us1.list-manage.com/subscribe/post',
  MAILCHIMP_U: '6cb6b636781c4fcc0b7cbccf1',
  MAILCHIMP_ID: '1e3ebab5ba',
  SUCCESS_DISPLAY_DURATION: 5000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

const ERROR_MESSAGES = {
  EMPTY_EMAIL: 'Please enter your email address',
  INVALID_EMAIL: 'Please enter a valid email address',
  SUBMISSION_ERROR: 'An error occurred. Please try again later.'
};

export default {
  name: 'MailingListSubscribeForm',
  
  props: {
    // Allow customization from parent components
    successDuration: {
      type: Number,
      default: CONFIG.SUCCESS_DISPLAY_DURATION
    },
    compactMode: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      email: '',
      isSubmitting: false,
      submitted: false,
      error: ''
    }
  },
  
  computed: {
    // Computed properties for cleaner template
    hasError() {
      return Boolean(this.error);
    },
    buttonText() {
      return this.isSubmitting ? 'Subscribing...' : 'Subscribe';
    },
    isValidEmail() {
      return CONFIG.EMAIL_REGEX.test(this.email);
    }
  },
  
  methods: {
    validateEmail(email) {
      return CONFIG.EMAIL_REGEX.test(email);
    },
    
    clearError() {
      this.error = '';
    },
    
    setError(errorKey) {
      this.error = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.SUBMISSION_ERROR;
    },
    
    resetForm() {
      this.submitted = false;
      this.email = '';
      this.error = '';
    },
    
    async submitToMailchimp() {
      const formData = new FormData();
      formData.append('EMAIL', this.email);
      formData.append(`b_${CONFIG.MAILCHIMP_U}_${CONFIG.MAILCHIMP_ID}`, '');
      
      const url = `${CONFIG.MAILCHIMP_URL}?u=${CONFIG.MAILCHIMP_U}&id=${CONFIG.MAILCHIMP_ID}`;
      
      return fetch(url, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Mailchimp doesn't allow CORS
      });
    },
    
    async handleSubmit() {
      // Clear any existing errors
      this.clearError();
      
      // Validate email
      if (!this.email.trim()) {
        this.setError('EMPTY_EMAIL');
        return;
      }
      
      if (!this.isValidEmail) {
        this.setError('INVALID_EMAIL');
        return;
      }

      this.isSubmitting = true;

      try {
        await this.submitToMailchimp();
        
        // Since we're using no-cors, we can't read the response
        // We'll assume success if no error is thrown
        this.submitted = true;
        
        // Emit success event for parent components
        this.$emit('subscribe-success', this.email);
        
        // Reset form after configured duration
        setTimeout(() => {
          this.resetForm();
        }, this.successDuration);
        
      } catch (error) {
        console.error('Subscription error:', error);
        this.setError('SUBMISSION_ERROR');
        
        // Emit error event for parent components
        this.$emit('subscribe-error', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
</script>

<style scoped>
.mailing-list-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
  box-sizing: border-box;
}

.subscribe {
  font-size: 18px;
  border: 2px solid #fff;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 4px;  /* Add inner padding for better visual balance */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.subscribe:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.input-container {
  display: flex;
  position: relative;
}

input,
button {
  padding: 1rem 1.75rem;  /* Increased padding for better desktop appearance */
  margin: 0;
  text-decoration: none;
  font-family: "Roboto", system-ui, -apple-system, sans-serif;
  border: none;
  font-size: 17px;  /* Slightly larger for desktop */
  transition: all 0.3s ease;
}

.email {
  flex: 1;
  color: #333;
  background: #fff;
  border: 2px solid #fff;
  border-style: solid none solid solid;
  border-radius: 10px 0 0 10px;
  outline: none;
}

.email:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.email::placeholder {
  color: #999;
}

.submit-button {
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 0 10px 10px 0;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 1rem 2.5rem;  /* More padding for better desktop button */
  transition: all 0.3s ease;
  white-space: nowrap;  /* Prevent text wrapping */
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateX(2px);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ff4444;
  font-size: 14px;
  margin-top: 8px;
  padding: 0 12px;
  text-align: left;
  animation: slideIn 0.3s ease;
}

.success-message {
  text-align: center;
  padding: 3rem 2rem;  /* More vertical padding on desktop */
  color: #fff;
  animation: fadeIn 0.5s ease;
}

.success-message .checkmark {
  width: 48px;
  height: 48px;
  color: #4CAF50;
  margin: 0 auto 1rem;
  animation: scaleIn 0.5s ease;
}

.success-message p {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.success-subtext {
  font-size: 14px;
  font-weight: 400;
  margin-top: 8px;
  opacity: 0.9;
}

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* Desktop-first improvements */
@media only screen and (min-width: 769px) {
  .mailing-list-container {
    padding: 0 2rem;  /* Add side padding on desktop */
  }
  
  .subscribe {
    padding: 6px;  /* More inner padding on desktop */
  }
  
  .email {
    font-size: 18px;
  }
  
  .submit-button {
    font-size: 18px;
  }
}

@media only screen and (max-width: 768px) {
  .mailing-list-container {
    padding: 0;
  }

  .subscribe {
    max-width: 100%;
    font-size: 16px;
    margin: 0;
    border-radius: 12px;
    padding: 3px;  /* Less padding on mobile */
  }

  .input-container {
    flex-direction: column;
  }

  .email {
    border-radius: 10px 10px 0 0;
    border: 2px solid #fff;
    width: 100%;
    box-sizing: border-box;
  }

  .submit-button {
    border-radius: 0 0 10px 10px;
    width: 100%;
    border: 2px solid #fff;
    border-top: none;
    box-sizing: border-box;
  }

  input,
  button {
    font-size: 16px;
    padding: 1rem 1.5rem;
  }

  .error-message {
    font-size: 13px;
    padding: 0 8px;
  }

  .success-message {
    padding: 1.5rem 1rem;
  }

  .success-message p {
    font-size: 18px;
  }

  .success-subtext {
    font-size: 13px;
  }
}
</style>