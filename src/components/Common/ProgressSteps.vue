<template>
  <div
    v-if="showProgress"
    class="pb-3 mb-6 border-b border-gray-700"
  >
    <aside class="flex flex-wrap justify-center gap-3 md:gap-6">
      <Step
        v-for="(step, index) in steps"
        :key="index"
        :title="step.title"
        :completed="step.completed"
        :step="index + 1"
      />
    </aside>
  </div>
</template>

<script>
import Step from '../Withdraw/Step.vue';

export default {
  name: 'ProgressSteps',
  components: { Step },
  props: {
    steps: {
      type: Array,
      required: true,
      validator: (steps) => {
        return steps.every(step => 
          typeof step === 'object' && 
          typeof step.title === 'string' && 
          typeof step.completed === 'boolean'
        );
      }
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  }
};
</script>