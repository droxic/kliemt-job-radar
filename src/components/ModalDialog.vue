<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

function show() {
  isOpen.value = true
}
function hide() {
  isOpen.value = false
}
defineExpose({ show, hide })
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop"></div>
  <div v-if="isOpen" class="modal">
    <div class="modal-content">
      <slot />
    </div>
  </div>
</template>

<style>
.modal {
  position: fixed;
  z-index: 1001;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}
.modal-backdrop {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-modal-backdrop);
}
.modal-content {
  margin: 5rem auto;
  max-width: 40rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  border-radius: var(--border-radius);
}
.modal-head {
  display: flex;
  background: var(--color-modal-heading-background);
  padding: 1rem 2rem;
}
.modal-head h1 {
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  margin-right: auto;
}
.modal-head .btn {
  margin-left: 0.5rem;
}
.modal-main {
  padding: 1rem 2rem;
}
.modal-form {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}
.modal-form .col {
  width: 50%;
}
.modal-form .col-1-3 {
  width: 33.333333%;
}
.modal-form .col-1-4 {
  width: 25%;
}
.modal-form .file-upload {
  width: 100%;
}
.modal-form .file-upload small {
  display: block;
  margin-top: 0.5rem;
}
.modal-form .form-group {
  padding: 1rem 0.5rem;
}
.modal-form .form-control {
  margin-top: 1rem;
}
</style>
