<script setup lang="ts">
import type { EmployeeInput } from '@/stores/employee.dto'
import { xlsxToEmployees } from '@/utils/xlsx'
import { ref } from 'vue'
const employees = defineModel<EmployeeInput[]>({ default: [] })
const types = [
  '.xls',
  '.xlsx',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const isDragging = ref(false)
function handleInput(event: Event) {
  const fileInput = event.target as HTMLInputElement
  addFiles([...(fileInput.files as FileList)])
  // Resets the file selection
  fileInput.type = 'text'
  fileInput.type = 'file'
}
function dragover(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}
function dragleave() {
  isDragging.value = false
}
function drop(event: DragEvent) {
  event.preventDefault()
  const droppedFiles = event.dataTransfer?.files as FileList
  addFiles([...droppedFiles].filter(({ type }) => types.includes(type)))
  isDragging.value = false
}
function addFiles(newFiles: File[]) {
  for (const file of newFiles) {
    const reader = new FileReader()
    reader.onload = () => {
      employees.value.push(...xlsxToEmployees(reader.result as ArrayBuffer))
    }
    reader.readAsArrayBuffer(file)
  }
}
</script>

<template>
  <div class="drop-file" @dragover="dragover" @dragleave="dragleave" @drop="drop">
    <label :class="['drop-file-label', { '--over': isDragging }]">
      <input
        class="drop-file-input"
        type="file"
        multiple
        @input="handleInput"
        :accept="types.join(',')"
      />
      <div v-if="!isDragging">
        {{ $t('Drop data sheet .xls(x) files here or') }}
        <u>{{ $t('browse from your device') }}</u>
      </div>
      <div v-else>{{ $t('Release to drop files here') }}</div>
    </label>
  </div>
</template>

<style>
.drop-file-label {
  display: block;
  border: 2px dashed var(--color-kliemt);
  border-radius: var(--border-radius);
  text-align: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  padding: 1rem;
}
.drop-file-label.--over {
  background-color: var(--color-input-outline);
}
.drop-file-input {
  position: absolute;
  top: -100%;
  left: -100%;
  visibility: hidden;
}
.drop-file-list {
  margin-bottom: 1rem;
}
.drop-file-list ul {
  list-style: none;
  margin: 0;
  padding: 1rem 0 0;
}
.drop-file-remove-btn {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  display: inline;
  text-decoration: underline;
  cursor: pointer;
}
</style>
