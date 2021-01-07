<template>
  <div id="app">
    <transition name="fade" mode="out-in"> <router-view /> </transition>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
<style lang="css">
.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.3s;
  transition-property: opacity;
  transition-timing-function: ease;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
body {
  scroll-behavior: smooth;
  margin: 0;
  padding: 0;
  font-size: 30px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.flex_row {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* align-self: center; */
  justify-content: space-evenly;
}
.flex_column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
}
.bn-onboard-custom.bn-onboard-modal {
  z-index: 990;
}
a {
  text-decoration: none;
  font-family: BrandonGrotesque, sans-serif;
  font-weight: 700;
  font-size: 26px;
  color: #2c3e50;
}
::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #000;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>