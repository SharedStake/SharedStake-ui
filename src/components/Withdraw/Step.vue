<template>
  <div class="flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
    <span
      class="flex items-center justify-center w-4 h-4 bg-gray-200 rounded-sm"
      :class="{
        'bg-green-700 text-gray-100': completed,
        'text-gray-900': !completed,
      }"
    >
      {{ step }}
    </span>
    <p :class="{ 'line-through text-gray-400': completed }">{{ title }}</p>
  </div>
</template>

<script>
export default {
  props: {
    step: {
      type: [Number, String],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
