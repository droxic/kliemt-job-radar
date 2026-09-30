<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import type { JobRadarEmployeeInput } from '@/stores/employee.dto'

const { projectId } = defineProps<{
  projectId: number
}>()
const emit = defineEmits(['close'])

const formRef = useTemplateRef('formRef')
const projectsStore = useProjectsStore()
const submitting = ref(false)

const employee = reactive<JobRadarEmployeeInput>({
  first_name: '',
  last_name: '',
  job_position: '',
  address_street: '',
  address_street_city: '',
})

const canSubmit = computed(
  () => Boolean(employee.first_name.trim()) && Boolean(employee.last_name.trim()) && !submitting.value,
)

async function add() {
  if (!formRef.value?.reportValidity() || !canSubmit.value) return
  submitting.value = true
  try {
    await projectsStore.addJobRadarEmployee(projectId, {
      first_name: employee.first_name.trim(),
      last_name: employee.last_name.trim(),
      job_position: employee.job_position?.trim() || undefined,
      address_street: employee.address_street?.trim() || undefined,
      address_street_city: employee.address_street_city?.trim() || undefined,
    })
    emit('close')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-head">
    <h1>{{ $t('Add Employee') }}</h1>
    <button class="btn --secondary" @click="$emit('close')">{{ $t('Cancel') }}</button>
    <button class="btn --primary" :disabled="!canSubmit" @click="add">
      {{ $t('Add') }}
    </button>
  </div>
  <form ref="formRef" class="modal-form" @submit.prevent="add">
    <label class="col form-group">
      {{ $t('First Name') }}:
      <input class="input form-control" type="text" v-model="employee.first_name" required />
    </label>
    <label class="col form-group">
      {{ $t('Last Name') }}:
      <input class="input form-control" type="text" v-model="employee.last_name" required />
    </label>
    <label class="col form-group">
      {{ $t('Job Position') }}:
      <input class="input form-control" type="text" v-model="employee.job_position" />
    </label>
    <label class="col form-group">
      {{ $t('Address') }}:
      <input class="input form-control" type="text" v-model="employee.address_street" />
    </label>
    <label class="col form-group">
      {{ $t('City') }}:
      <input class="input form-control" type="text" v-model="employee.address_street_city" />
    </label>
  </form>
</template>
