<template>
  <div class="flex_column timeline">
    <!-- Latest update -->
    <vue-timeline-update
      :date="new Date('2021-02-01')"
      title="v2.2.0 - Initial D"
      description="Today I am thrilled to announce the release of Vue.js 2.2.0."
      thumbnail="snowswap.svg"
      category="airdrop"
      icon="code"
      color="red"
    />

    <!-- Another update -->
    <vue-timeline-update
      :date="new Date('2016-11-22')"
      title="v2.1.0 - Hunter X Hunter"
      description="Today I am thrilled to announce the release of Vue.js 2.1.0."
      thumbnail="/images/vuetimeline/hunter_x_hunter.jpg"
      category="announcement"
      icon="code"
      color="turquoise"
    />

    <!-- Yet another update -->
    <vue-timeline-update
      :date="new Date('2016-09-30')"
      title="v2.0.0 - Ghost in the Shell"
      description="Today I am thrilled to announce the release of Vue.js 2.0.0"
      thumbnail="/images/vuetimeline/ghost_in_the_shell.jpg"
      category="announcement"
      icon="code"
      color="white"
      is-last
    />
    <vue-timeline-update
      :date="new Date('2016-09-30')"
      title="v2.0.0 - Ghost in the Shell"
      description="Today I am thrilled to announce the release of Vue.js 2.0.0"
      thumbnail="/images/vuetimeline/ghost_in_the_shell.jpg"
      category="announcement"
      icon="code"
      color="white"
      is-last
    />
    <vue-timeline-update
      :date="new Date('2016-09-30')"
      title="v2.0.0 - Ghost in the Shell"
      description="Today I am thrilled to announce the release of Vue.js 2.0.0"
      thumbnail="/images/vuetimeline/ghost_in_the_shell.jpg"
      category="announcement"
      icon="code"
      color="white"
      is-last
    />
    <vue-timeline-update
      :date="new Date('2016-09-30')"
      title="v2.0.0 - Ghost in the Shell"
      description="Today I am thrilled to announce the release of Vue.js 2.0.0"
      thumbnail="/images/vuetimeline/ghost_in_the_shell.jpg"
      category="announcement"
      icon="code"
      color="white"
      is-last
    />
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.timeline {
  margin-top: 15vh;
  justify-items: flex-start;
}
</style>