<script setup lang="ts">
import {
  useProjectsStore,
  type Client,
  type Project,
  type ProjectLocation,
} from '@/stores/projects'
import Multiselect from '@vueform/multiselect'
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import DropFile from '@/components/DropFile.vue'
import { api } from '@/api'
import { AppRouteNames, routerPush } from '@/router'
import type { EmployeeInput } from '@/stores/employee.dto'
import {
  validateEmployees,
  type EmployeeValidationResult,
} from '@/utils/validateEmployees'

defineEmits(['close'])

const formRef = useTemplateRef('formRef')
const project: Omit<Project, 'id'> & { employees: EmployeeInput[] } = reactive({
  title: '',
  clients: [],
  locations: [],
  kliemt_support_level: '',
  clearing_point: 'no',
  clearing_point_email: null,
  employee_self_service: 'no',
  language: 'de',
  employees: [],
})
const clients = ref<Client[]>()
const locations = ref<ProjectLocation[]>()

const projectsStore = useProjectsStore()
async function create() {
  if (!formRef.value?.reportValidity()) return
  const { id } = await projectsStore.addProject(project)
  routerPush(AppRouteNames.PROJECT, { id: id.toString() })
}

function removeAllEmployees() {
  project.employees = []
}

const employeeValidation = ref<EmployeeValidationResult>({ isValid: true, errors: [] })

watch(
  () => project.employees,
  (employees) => {
    if (employees.length) {
      employeeValidation.value = validateEmployees(employees)
    } else {
      employeeValidation.value = { isValid: true, errors: [] }
    }
  },
  { deep: true },
)

const canSubmitForm = computed(() => {
  return (
    project.title &&
    project.clients.length &&
    project.locations.length &&
    (project.clearing_point != 'auto' || project.clearing_point_email?.includes('@')) &&
    (project.employees.length === 0 || employeeValidation.value.isValid)
  )
})
const clearingAuto = computed(() => project.clearing_point == 'auto')

api.get<Client[]>('users/clients').then((data) => {
  clients.value = data
})
api.get<ProjectLocation[]>('projects/locations').then((data) => {
  locations.value = data
})
</script>

<template>
  <div class="modal-head">
    <h1>{{ $t('Create project') }}</h1>
    <button class="btn --secondary" @click="$emit('close')">{{ $t('Cancel') }}</button>
    <button class="btn --primary" :disabled="!canSubmitForm" @click="create">
      {{ $t('Create') }}
    </button>
  </div>
  <form ref="formRef" class="modal-form" @submit.prevent="create">
    <label class="col form-group">
      {{ $t('Project Name') }}:
      <input class="input form-control" type="text" v-model="project.title" />
    </label>
    <label class="col form-group">
      {{ $t('Client') }}:
      <Multiselect
        mode="tags"
        class="form-control"
        v-model="project.clients"
        :options="clients"
        label="company_name"
        valueProp="id"
        object
        searchable
        createOption
        :appendNewOption="false"
      />
    </label>
    <label class="col-1-3 form-group">
      {{ $t('Operational Site') }}:
      <Multiselect
        mode="tags"
        class="form-control"
        v-model="project.locations"
        :options="locations"
        label="name"
        valueProp="id"
        object
        searchable
        createOption
        :appendNewOption="false"
      />
    </label>
    <label class="col-1-3 form-group">
      {{ $t('Level of Kliemt support') }}:
      <input class="input form-control" type="text" v-model="project.kliemt_support_level" />
    </label>
    <label class="col-1-3 form-group">
      {{ $t('Language') }}:
      <select class="select form-control" v-model="project.language">
        <option value="de">{{ $t('German') }}</option>
        <option value="en">{{ $t('English') }}</option>
      </select>
    </label>
    <label :class="`${clearingAuto ? 'col-1-3' : 'col'} form-group`">
      {{ $t('Employee self Service') }}:
      <select class="select form-control" v-model="project.employee_self_service">
        <option value="no">{{ $t('No') }}</option>
        <option value="yes">{{ $t('Yes') }}</option>
      </select>
    </label>
    <label :class="`${clearingAuto ? 'col-1-3' : 'col'} form-group`">
      {{ $t('Clearing Point') }}:
      <select class="select form-control" v-model="project.clearing_point">
        <option value="no">{{ $t('No') }}</option>
        <option value="auto">{{ $t('Auto') }}</option>
        <option value="manual">{{ $t('Manual') }}</option>
      </select>
    </label>
    <label class="col-1-3 form-group" v-if="clearingAuto">
      {{ $t('Clearing Point Email') }}:
      <input
        class="input form-control"
        type="email"
        v-model="project.clearing_point_email"
        required
      />
    </label>
    <div class="form-group file-upload">
      {{ $t('Employee data') }}:
      <div v-if="project.employees.length">
        <i18n-t keypath="employees-selected" tag="p">
          <template #count>
            <strong>{{ project.employees.length }}</strong>
          </template>
        </i18n-t>
        <button class="create-project-remove-btn" @click="removeAllEmployees">
          {{ $t('Remove all') }}
        </button>
      </div>
      <div v-if="!employeeValidation.isValid" class="validation-errors">
        <p class="validation-errors-heading">{{ $t('validation-heading') }}</p>
        <ul class="validation-errors-list">
          <li v-for="error in employeeValidation.errors" :key="error.row">
            <strong>{{ $t('Row') || 'Row' }} {{ error.row }} ({{ error.name }}):</strong>
            {{ error.missingFields.map((f) => $t(f)).join(', ') }}
          </li>
        </ul>
      </div>
      <DropFile v-model="project.employees" class="form-control" />
    </div>
  </form>
</template>

<style>
.create-project-remove-btn {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  display: inline;
  text-decoration: underline;
  cursor: pointer;
}
</style>
