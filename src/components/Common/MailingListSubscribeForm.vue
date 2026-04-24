<template>
  <div class="signup">
    <iframe
      title="SharedStake email updates"
      class="airtable-frame"
      src="https://airtable.com/embed/appLwrNK2W0XvoRUh/pagZv9w6lio5qp40F/form?backgroundColor=gray"
      frameborder="0"
      width="100%"
    />
    <div class="fallback">
      Prefer a full page?
      <a
        href="https://airtable.com/appLwrNK2W0XvoRUh/pagZv9w6lio5qp40F/form"
        target="_blank"
        rel="noopener noreferrer"
      >Open the signup form</a>.
    </div>
  </div>
</template>

<style scoped>
.signup {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px;
}

.airtable-frame {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  height: clamp(320px, 50vh, 440px);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
}

.fallback {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.fallback a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: underline;
  transition: color 0.2s;
}

.fallback a:hover {
  color: #fff;
}
</style>
