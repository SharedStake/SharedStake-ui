<template>
  <div class="signup">
    <iframe
      title="SharedStake email updates"
      class="airtable-frame"
      src="https://airtable.com/embed/appLwrNK2W0XvoRUh/pagZv9w6lio5qp40F/form?backgroundColor=gray"
      frameborder="0"
      width="100%"
      height="320"
    />
    <div class="fallback">
      Prefer a full page? Open the
      <a
        href="https://airtable.com/appLwrNK2W0XvoRUh/pagZv9w6lio5qp40F/form"
        target="_blank"
        rel="noopener noreferrer"
      >signup form</a>.
    </div>
  </div>
</template>

<style scoped>
.signup {
  width: 70%;
  margin: 0 auto;
}

.airtable-frame {
  background: transparent;
  border: 2px solid #fff;
  border-radius: 12px;
}

.fallback {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 14px;
  color: #fff;
}

.fallback a {
  color: #fff;
  text-decoration: underline;
}

@media only screen and (max-width: 1270px) {
  .signup {
    width: 95%;
  }

  .airtable-frame {
    height: 360px;
  }
}
</style>
