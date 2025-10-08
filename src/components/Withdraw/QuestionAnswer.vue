<template>
  <div class="py-3 border-t border-gray-700">
    <h3 class="mb-2 text-xl font-medium text-gray-300">
      <slot name="question" />
    </h3>
    <p class="pl-2 text-base text-gray-200">
      <slot name="answer" />
    </p>
  </div>
</template>
