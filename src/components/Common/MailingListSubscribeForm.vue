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
                @input="clearError"
              />
              <button
                type="submit"
                class="submit-button"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Subscribing...' : 'Subscribe' }}
              </button>
            </div>
            <div v-if="error" class="error-message">{{ error }}</div>
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
export default {
  name: 'MailingListSubscribeForm',
  data() {
    return {
      email: '',
      isSubmitting: false,
      submitted: false,
      error: ''
    }
  },
  methods: {
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    clearError() {
      this.error = '';
    },
    async handleSubmit() {
      // Validate email
      if (!this.email) {
        this.error = 'Please enter your email address';
        return;
      }
      
      if (!this.validateEmail(this.email)) {
        this.error = 'Please enter a valid email address';
        return;
      }

      this.isSubmitting = true;
      this.error = '';

      try {
        // For now, we'll use the existing Mailchimp form action
        // In production, you should implement a backend API endpoint
        const formData = new FormData();
        formData.append('EMAIL', this.email);
        formData.append('b_6cb6b636781c4fcc0b7cbccf1_1e3ebab5ba', '');
        
        await fetch(
          'https://sharedstake.us1.list-manage.com/subscribe/post?u=6cb6b636781c4fcc0b7cbccf1&id=1e3ebab5ba',
          {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // Mailchimp doesn't allow CORS
          }
        );
        
        // Since we're using no-cors, we can't read the response
        // We'll assume success if no error is thrown
        this.submitted = true;
        
        // Reset form after 5 seconds
        setTimeout(() => {
          this.submitted = false;
          this.email = '';
        }, 5000);
        
      } catch (error) {
        console.error('Subscription error:', error);
        this.error = 'An error occurred. Please try again later.';
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
}

.subscribe {
  font-size: 18px;
  border: 2px solid #fff;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
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
  padding: 0.75rem 1.5rem;
  margin: 0;
  text-decoration: none;
  font-family: "Roboto", system-ui, -apple-system, sans-serif;
  border: none;
  font-size: 16px;
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
  padding: 0.75rem 2rem;
  transition: all 0.3s ease;
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
  padding: 2rem;
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
  font-size: 14px !important;
  font-weight: 400 !important;
  margin-top: 8px !important;
  opacity: 0.9;
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

@media only screen and (max-width: 768px) {
  .subscribe {
    max-width: 95%;
    font-size: 16px;
  }

  .input-container {
    flex-direction: column;
  }

  .email {
    border-radius: 10px 10px 0 0;
    border: 2px solid #fff;
    width: 100%;
  }

  .submit-button {
    border-radius: 0 0 10px 10px;
    width: 100%;
    border: 2px solid #fff;
    border-top: none;
  }

  input,
  button {
    font-size: 16px;
    padding: 1rem 1.5rem;
  }
}
</style>