<template>
  <div class="relative flex items-center gap-1 p-2 text-xl border border-gray-200 rounded-xl">
    <input
      :value="modelValue"
      class="max-w-xs ml-2 text-white bg-transparent border-none outline-none"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <span class="text-sm">
      {{ tokenName }}
    </span>
    <button
      v-if="showMaxButton"
      class="px-1 py-0.5 text-xs font-semibold bg-white rounded text-brand-primary"
      @click="$emit('max')"
    >
      max
    </button>
  </div>
</template>

<script>
export default {
  name: 'TokenInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    tokenName: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      default: '0.0'
    },
    showMaxButton: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'max']
};
</script>