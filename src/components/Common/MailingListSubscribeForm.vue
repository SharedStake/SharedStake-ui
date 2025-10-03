<template>
  <div class="mailing-list-container">
    <div v-if="!submitted" class="subscribe-form">
      <form @submit.prevent="handleSubmit" class="email-form">
        <!-- Honeypot field for bot protection -->
        <div style="position: absolute; left: -5000px" aria-hidden="true">
          <input
            type="text"
            name="b_6cb6b636781c4fcc0b7cbccf1_1e3ebab5ba"
            tabindex="-1"
            v-model="honeypot"
          />
        </div>
        
        <div class="input-container">
          <input
            type="email"
            v-model="email"
            name="EMAIL"
            class="email-input"
            id="mce-EMAIL"
            placeholder="Enter your email address"
            required
            :disabled="loading"
          />
          <button
            type="submit"
            class="submit-button"
            :disabled="loading || !email"
          >
            <span v-if="loading">Subscribing...</span>
            <span v-else>Subscribe</span>
          </button>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
    
    <div v-else class="success-message">
      <div class="success-icon">✓</div>
      <h3>Thank you for subscribing!</h3>
      <p>You'll receive updates from our team soon.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MailingListSubscribeForm',
  data() {
    return {
      email: '',
      honeypot: '',
      loading: false,
      submitted: false,
      error: ''
    }
  },
  methods: {
    async handleSubmit() {
      // Basic validation
      if (!this.email || !this.isValidEmail(this.email)) {
        this.error = 'Please enter a valid email address';
        return;
      }
      
      // Check honeypot
      if (this.honeypot) {
        this.error = 'Bot detected';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      try {
        // Create form data for Mailchimp
        const formData = new FormData();
        formData.append('EMAIL', this.email);
        formData.append('b_6cb6b636781c4fcc0b7cbccf1_1e3ebab5ba', '');
        
        // Submit to Mailchimp
        const response = await fetch('https://sharedstake.us1.list-manage.com/subscribe/post?u=6cb6b636781c4fcc0b7cbccf1&id=1e3ebab5ba', {
          method: 'POST',
          body: formData,
          mode: 'no-cors' // Required for cross-origin requests
        });
        
        // Since we can't read the response due to CORS, we'll assume success
        this.submitted = true;
        
      } catch (err) {
        console.error('Subscription error:', err);
        this.error = 'Failed to subscribe. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  }
}
</script>

<style scoped>
.mailing-list-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.subscribe-form {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #fff;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.subscribe-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.email-form {
  width: 100%;
}

.input-container {
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.email-input {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: #fff;
  color: #333;
  font-size: 16px;
  font-family: "Roboto", sans-serif;
  outline: none;
  transition: all 0.3s ease;
}

.email-input:focus {
  background: #f8f9fa;
  transform: scale(1.02);
}

.email-input::placeholder {
  color: #666;
  font-style: italic;
}

.email-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.submit-button {
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 16px;
  font-weight: 600;
  font-family: "Roboto", sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 6px;
  color: #dc3545;
  font-size: 14px;
  text-align: center;
  animation: shake 0.5s ease-in-out;
}

.success-message {
  text-align: center;
  padding: 30px 20px;
  background: rgba(40, 167, 69, 0.1);
  border: 2px solid rgba(40, 167, 69, 0.3);
  border-radius: 12px;
  color: #28a745;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #28a745;
  animation: bounce 0.6s ease-in-out;
}

.success-message h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #28a745;
}

.success-message p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@media only screen and (max-width: 768px) {
  .mailing-list-container {
    padding: 15px;
  }
  
  .subscribe-form {
    padding: 15px;
  }
  
  .input-container {
    flex-direction: column;
    gap: 0;
  }
  
  .email-input {
    border-radius: 8px 8px 0 0;
    font-size: 16px;
  }
  
  .submit-button {
    border-radius: 0 0 8px 8px;
    padding: 16px;
    font-size: 16px;
  }
  
  .success-message {
    padding: 25px 15px;
  }
  
  .success-icon {
    font-size: 40px;
  }
  
  .success-message h3 {
    font-size: 20px;
  }
}

@media only screen and (max-width: 480px) {
  .mailing-list-container {
    padding: 10px;
  }
  
  .subscribe-form {
    padding: 12px;
  }
  
  .email-input, .submit-button {
    padding: 14px;
    font-size: 15px;
  }
}
</style>