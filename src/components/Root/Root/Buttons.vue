<template>
  <transition-group
    name="button"
    class="flex_row Buttons"
    :id="buttons.length == 1 ? 'OneButton' : ''"
  >
    <div v-for="i in buttons" class="flex_row" v-bind:key="i">
      <Button :msg="i" class="Element" v-bind:id="i" @click.native="clicked(i)">
        <div v-if="buttons.length == 1">
          <Arrow :direction="'left'" :size="28" />
        </div>
      </Button>
    </div>
  </transition-group>
</template>

<script>
import Arrow from "../../../assets/svg/arrow";
import Button from "./Button.vue";
export default {
  name: "Buttons",
  props: {
    route: String,
  },
  components: {
    Button,
    Arrow,
  },
  data: function () {
    return {
      initButtons: ["Stake", "Stats", "Earn", "Dao", "Info"],
      buttons: this.initButtons,
    };
  },
  methods: {
    async clicked(i) {
      if (this.buttons.length == 1) {
        this.$router.push("/");
        return;
      }
      this.$router.push(i.toLowerCase());
    },
  },
  created: function () {
    if (this.route == "/") this.buttons = this.initButtons;
    else {
      this.buttons = [this.route];
    }
  },
  watch: {
    route(to) {
      if (to == "/") this.buttons = this.initButtons;
      else {
        this.buttons = [to];
      }
    },
  },
};
</script>

<style scoped>
.Buttons {
  cursor: pointer;
  height: 100%;
  text-align: center;
  background: #1d3c7a;
}
.Element {
  width: calc(100vw / 7);
  height: 100vh;
  transition: transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out,
    background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  z-index: 11;
}
@media (hover: hover) {
  .Element:hover {
    z-index: 11;
    transform: translateX(-10px) scale(0.95);
  }
}
#Stake {
  background: #fafafa;
  color: #007bff;
}
#Stake:hover {
  color: #fafafa;
  background: #007bff;
  box-shadow: 5px 0 10px 2px #007bff3d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
}

#Info {
  background: #fafafa;
  color: #00d395;
}
#Info:hover {
  color: #fafafa;
  background: #00d395;
  box-shadow: 5px 0 10px 2px #00d3953d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
}

#Earn {
  background: #fafafa;
  color: #ff007a;
}
#Earn:hover {
  color: #fafafa;
  background: #ff007a;
  box-shadow: 5px 0 10px 2px #ff007a3d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
}

#Stats {
  background: #fafafa;
  color: #6a6a6a;
}
#Stats:hover {
  color: #fafafa;
  background: #6a6a6a;
  box-shadow: 5px 0 10px 2px #6a6a6a3d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
}

#Dao {
  background: #fafafa;
  color: #dc6be5;
}
#Dao:hover {
  color: #fafafa;
  background: #dc6be5;
  box-shadow: 5px 0 10px 2px #dd6be53d, 10px 10px 10px 2px rgba(0, 0, 0, 0.204);
}
@media only screen and (max-width: 600px) {
  .Buttons {
    flex-direction: column;
    width: 100%;
  }
  .Element {
    width: 100%;
    height: calc(100vh / 7);
  }
  #OneButton {
    max-height: calc(100vh / 7);
    width: 100%;
  }
  .flex_row {
    width: 100%;
  }
}
</style>