<script setup lang="ts">
import {
  useProjectsStore,
  type Client,
  type Project,
  type ProjectLocation,
} from '@/stores/projects'
import Multiselect from '@vueform/multiselect'
import { computed, reactive, ref, useTemplateRef } from 'vue'
import { api } from '@/api'
import { AppRouteNames, routerPush } from '@/router'

defineEmits(['close'])

const formRef = useTemplateRef('formRef')
const project: Omit<Project, 'id'> = reactive({
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

const canSubmitForm = computed(() => {
  return (
    project.title &&
    project.clients.length &&
    project.locations.length &&
    (project.clearing_point != 'auto' || project.clearing_point_email?.includes('@'))
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
  </form>
</template>
