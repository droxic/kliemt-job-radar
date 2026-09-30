<script setup lang="ts">
import { useTemplateRef, computed, ref, type FunctionalComponent, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/user'
import ModalDialog from '@/components/ModalDialog.vue'
import AddEmployeeForm from './AddEmployeeForm.vue'
import type { JobRadarEmployeeView } from '@/stores/employee.dto'

import IMaterialSymbolsCalendarPersonCheck from '~icons/material-symbols/person-check'
import IMaterialSymbolsCheckCircleOutline from '~icons/material-symbols/check-circle-outline'

const { t } = useI18n()
const { projectId } = defineProps<{
  projectId: number
}>()

const authStore = useAuthStore()

const filtersModalRef = useTemplateRef('filtersModalRef')
const columnsModalRef = useTemplateRef('columnsModalRef')
const addEmployeeModalRef = useTemplateRef('addEmployeeModalRef')

const projectsStore = useProjectsStore()
const employees = computed<JobRadarEmployeeView[]>(
  () => projectsStore.jobRadarEmployees[projectId] || [],
)
const employeesFiltered = computed(() => {
  let result = employees.value
  if (filters.search) {
    result = result.filter((employee) =>
      `${employee.first_name} ${employee.last_name} ${employee.job_position ?? ''}`
        .toLocaleLowerCase()
        .includes(filters.search.toLocaleLowerCase()),
    )
  }
  if (filters.vlp_status) {
    result = result.filter(({ vlp_status }) => vlp_status == filters.vlp_status)
  }
  if (filters.termination_status) {
    result = result.filter(
      ({ termination_status }) => termination_status == filters.termination_status,
    )
  }
  if (filters.winding_up_status) {
    result = result.filter(
      ({ winding_up_status }) => winding_up_status == filters.winding_up_status,
    )
  }
  if (filters.early_leave !== null) {
    result = result.filter(({ early_leave }) => early_leave == filters.early_leave)
  }
  if (sortKey.value !== null) {
    result = result.slice(0).sort((employeeA, employeeB) => {
      if (sortKey.value !== null) {
        const column = columns.find(({ key }) => key == sortKey.value)
        const valueA = sortDir.value
          ? getColumnValue(employeeA, sortKey.value)
          : getColumnValue(employeeB, sortKey.value)
        const valueB = sortDir.value
          ? getColumnValue(employeeB, sortKey.value)
          : getColumnValue(employeeA, sortKey.value)
        switch (column?.type) {
          case 'number':
          case 'currency':
            return (valueA as number) - (valueB as number)
          case 'date':
            if (valueA instanceof Date && valueB instanceof Date) {
              return valueA.getTime() - valueB.getTime()
            } else if (valueA instanceof Date) {
              return 1
            } else if (valueB instanceof Date) {
              return -1
            } else {
              return 0
            }
          case 'boolean':
            return valueA == valueB ? 0 : valueA ? 1 : -1
          case 'string':
            return (valueA?.toString() ?? '').localeCompare(valueB?.toString() ?? '')
        }
      }
      return 0
    })
  }
  return result
})

const dateFormatter = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

const currencyFormatter = (value: number) => {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  })
  return formatter.format(value)
}

type Column = {
  key: keyof JobRadarEmployeeView
  title: string
  icon?: FunctionalComponent
  type: 'currency' | 'number' | 'string' | 'date' | 'boolean'
  options?: string[]
}

const terminationStatusColumn: Column = {
  key: 'termination_status',
  title: t('Termination Status'),
  icon: IMaterialSymbolsCheckCircleOutline,
  options: ['not-applicable', 'not-sent', 'sent', 'delivered', 'not-delivered'],
  type: 'string',
}

const vlpStatusColumn: Column = {
  key: 'vlp_status',
  title: t('VLP Status'),
  icon: IMaterialSymbolsCalendarPersonCheck,
  options: ['not-eligible', 'accepted', 'declined', 'pending'],
  type: 'string',
}
const windingUpStatusColumn: Column = {
  key: 'winding_up_status',
  title: t('Winding-up Status'),
  icon: IMaterialSymbolsCheckCircleOutline,
  options: ['not-applicable', 'no', 'not-sent', 'sent', 'signed', 'original-received'],
  type: 'string',
}
const earlyLeaveColumn: Column = {
  key: 'early_leave',
  title: t('Early Leave'),
  icon: IMaterialSymbolsCheckCircleOutline,
  type: 'boolean',
}

const columns: Column[] = [
  { key: 'first_name', title: 'Vorname', type: 'string' },
  { key: 'last_name', title: 'Nachname', type: 'string' },
  { key: 'job_position', title: 'Job Position', type: 'string' },
  { key: 'address_street_city', title: 'City', type: 'string' },
]
const alwaysOnColumns: Array<keyof JobRadarEmployeeView> = [
  'first_name',
  'last_name',
  'job_position',
  'address_street_city',
]
const activeColumns = ref<Set<keyof JobRadarEmployeeView>>(new Set(alwaysOnColumns))
function toggleColumn(event: Event, column: keyof JobRadarEmployeeView) {
  if ((event.target as HTMLInputElement).checked) {
    activeColumns.value.add(column)
  } else {
    activeColumns.value.delete(column)
  }
}
const filters = reactive<{
  search: string
  termination_status: string | null
  vlp_status: string | null
  winding_up_status: string | null
  early_leave: boolean | null
}>({
  search: '',
  termination_status: null,
  vlp_status: null,
  winding_up_status: null,
  early_leave: null,
})

const filteredColumns = computed(() => columns.filter(({ key }) => activeColumns.value.has(key)))
const sortKey = ref<keyof JobRadarEmployeeView | null>(null)
const sortDir = ref(true)

function getJobPosition(employee: JobRadarEmployeeView): string {
  return employee.job_position?.trim() || '-'
}

function getColumnValue(employee: JobRadarEmployeeView, key: keyof JobRadarEmployeeView): unknown {
  if (key === 'job_position') {
    return getJobPosition(employee)
  }

  return employee[key]
}

function formatDateValue(value: unknown): string {
  if (value instanceof Date) {
    return dateFormatter(value)
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '-' : dateFormatter(parsed)
  }
  return '-'
}

const exporting = ref(false)
async function exportEmployeeUrls() {
  exporting.value = true
  try {
    await projectsStore.exportEmployeeUrls(projectId)
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    exporting.value = false
  }
}

async function deleteManual(employee: JobRadarEmployeeView) {
  if (employee.source !== 'manual') return
  if (!window.confirm(t('Remove this manually added employee?'))) return
  await projectsStore.deleteJobRadarEmployee(projectId, employee.id)
}
</script>

<template>
  <div class="employees-list-head">
    <input
      class="input"
      type="search"
      v-model="filters.search"
      placeholder="Search"
      aria-label="Search"
    />
    <button class="btn --primary --outline --pill" @click="filtersModalRef?.show">
      <IMdiSlider /> {{ $t('Filter') }}
    </button>
    <button class="btn --primary --outline --pill" @click="columnsModalRef?.show">
      <IMdiFormatColumns /> {{ $t('Columns') }}
    </button>
    <button
      class="btn --primary --outline --pill"
      @click="exportEmployeeUrls"
      :disabled="!authStore.roles.includes('lawyer') || employees.length === 0 || exporting"
    >
      <IMaterialSymbolsDownload /> {{ exporting ? $t('Exporting...') : $t('Export URLs') }}
    </button>
    <button
      class="btn --primary --pill"
      @click="addEmployeeModalRef?.show"
      :disabled="!authStore.roles.includes('lawyer')"
    >
      {{ $t('Add Employee') }}
    </button>
  </div>
  <div class="employees-list-wrapper">
    <table class="employees-list">
      <thead v-if="employeesFiltered.length">
        <tr>
          <th
            v-for="column in filteredColumns"
            :key="column.key"
            :class="{ '--sort-active': sortKey == column.key }"
          >
            <component :is="column.icon" v-if="column.icon" />
            {{ column.title }}
            <span class="employees-list-sort">
              <IMdiChevronUpDown
                v-if="sortKey != column.key"
                @click="((sortKey = column.key), (sortDir = true))"
              />
              <IMdiChevronUp v-else-if="sortDir" @click="sortDir = false" />
              <IMdiChevronDown v-else @click="((sortKey = null), (sortDir = true))" />
            </span>
          </th>
          <th class="employees-list-actions-col"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="employees.length == 0">
          <td>{{ $t('There are no employees for this project') }}</td>
        </tr>
        <tr v-else-if="employeesFiltered.length == 0">
          <td>{{ $t('No employees found, adjust your search criteria') }}</td>
        </tr>
        <template v-else>
          <tr
            v-for="employee in employeesFiltered"
            :key="`${employee.source}-${employee.id}`"
          >
            <td v-for="column in filteredColumns" :key="column.key">
              <template v-if="column.type == 'date'">
                {{ formatDateValue(getColumnValue(employee, column.key)) }}
              </template>
              <template v-else-if="column.type == 'currency'">
                {{ currencyFormatter(Number(getColumnValue(employee, column.key) ?? 0)) }}
              </template>
              <template v-else-if="column.type == 'boolean'">
                <IMaterialSymbolsCheckCircle v-if="Boolean(getColumnValue(employee, column.key))" />
                <IMaterialSymbolsDoNotDisturbOnOutline v-else />
              </template>
              <template v-else>{{ getColumnValue(employee, column.key) }}</template>
            </td>
            <td class="employees-list-actions-col">
              <button
                v-if="employee.source === 'manual' && authStore.roles.includes('lawyer')"
                class="employees-list-delete"
                :title="$t('Delete')"
                @click="deleteManual(employee)"
              >
                <IMaterialSymbolsDeleteOutline />
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
  <ModalDialog ref="filtersModalRef">
    <div class="modal-head">
      <h1>{{ $t('Filters') }}</h1>
      <button class="btn --primary" @click="filtersModalRef?.hide">{{ $t('Close') }}</button>
    </div>
    <div class="modal-form">
      <label class="col form-group">
        {{ vlpStatusColumn.title }}
        <select class="select form-control" v-model="filters.vlp_status">
          <option :value="null">{{ $t('All') }}</option>
          <option v-for="option in vlpStatusColumn.options" :key="option">{{ option }}</option>
        </select>
      </label>
      <label class="col form-group">
        {{ terminationStatusColumn.title }}
        <select class="select form-control" v-model="filters.termination_status">
          <option :value="null">{{ $t('All') }}</option>
          <option v-for="option in terminationStatusColumn.options" :key="option">
            {{ option }}
          </option>
        </select>
      </label>
      <label class="col form-group">
        {{ windingUpStatusColumn.title }}
        <select class="select form-control" v-model="filters.winding_up_status">
          <option :value="null">{{ $t('All') }}</option>
          <option v-for="option in windingUpStatusColumn.options" :key="option">
            {{ option }}
          </option>
        </select>
      </label>
      <label class="col form-group">
        {{ earlyLeaveColumn.title }}
        <select class="select form-control" v-model="filters.early_leave">
          <option :value="null">{{ $t('All') }}</option>
          <option :value="true">{{ $t('Yes') }}</option>
          <option :value="false">{{ $t('No') }}</option>
        </select>
      </label>
    </div>
  </ModalDialog>
  <ModalDialog ref="columnsModalRef">
    <div class="modal-head">
      <h1>{{ $t('Columns') }}</h1>
      <button class="btn --primary" @click="columnsModalRef?.hide">{{ $t('Close') }}</button>
    </div>
    <div class="employees-list-columns-list">
      <label v-for="column in columns" :key="column.key">
        <input
          type="checkbox"
          :checked="activeColumns.has(column.key)"
          @change="(event) => toggleColumn(event, column.key)"
          :disabled="alwaysOnColumns.includes(column.key)"
        />
        <component :is="column.icon" />
        {{ column.title }}
      </label>
    </div>
  </ModalDialog>
  <ModalDialog ref="addEmployeeModalRef">
    <AddEmployeeForm :projectId="projectId" @close="addEmployeeModalRef?.hide" />
  </ModalDialog>
</template>

<style>
.employees-list-head {
  display: flex;
}
.employees-list-head input[type='search'] {
  width: 20rem;
  max-width: 100%;
}
.employees-list-head .btn {
  margin-left: 1rem;
}
.employees-list-head .btn:last-child {
  margin-left: auto;
}
.employees-list-head .btn svg {
  vertical-align: middle;
  position: relative;
  top: -0.1em;
}
.employees-list-head .btn.--primary.--outline {
  background-color: var(--color-background);
}
.employees-list-wrapper {
  margin-top: 1rem;
  width: 100%;
  overflow: auto;
  --color-border: var(--color-list-border);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-background);
}
.employees-list {
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 100%;
}
.employees-list th {
  white-space: nowrap;
  font-weight: 500;
  padding: 1.5rem 1rem;
  text-align: left;
  background: var(--color-background-accent);

  &.--sort-active {
    background: var(--color-background-focus);
  }
}
.employees-list td {
  padding: 1rem;
  background: var(--color-background);
}
.employees-list-actions-col {
  width: 3rem;
  text-align: center;
}
.employees-list-delete {
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
  border-radius: var(--border-radius);
}
.employees-list-delete svg {
  vertical-align: middle;
}
@media (hover: hover) {
  .employees-list-delete:hover {
    color: var(--color-kliemt);
    background: var(--color-background-focus);
  }
}
.employees-list tr.--error td {
  background: var(--color-background-error);
}
/* @keyframes employees-loading-bg-loop {
  0% {
    background-color: var(--color-background);
  }
  50% {
    background-color: var(--color-background-loading);
  }
  100% {
    background-color: var(--color-background);
  }
}
.employees-list tr.--loading td {
  animation: employees-loading-bg-loop 1s infinite;
} */
.employees-list th svg {
  vertical-align: middle;
}
@media (min-width: 600px) {
  .employees-list-wrapper {
    max-height: calc(100vh - var(--header-height) - 5.2rem);
    min-height: 20rem;
  }
  .employees-list th {
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .employees-list tr > *:nth-child(1) {
    position: sticky;
    left: 0;
  }
  .employees-list tr > *:nth-child(2) {
    position: sticky;
    left: 10rem;
  }
  .employees-list tr > th:nth-child(1),
  .employees-list tr > th:nth-child(2) {
    z-index: 2;
  }
  .employees-list tr > td:nth-child(1),
  .employees-list tr > td:nth-child(2) {
    z-index: 1;
  }
  .employees-list tr > *:nth-child(1)::after,
  .employees-list tr > *:nth-child(2)::after {
    content: '';
    display: block;
    width: 8rem;
    height: 1px;
    margin-top: -1px;
  }
}
.employees-list-columns-list {
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
}
.employees-list-columns-list label {
  display: block;
  width: 50%;
  padding: 0.25rem 0;
}
.employees-list-columns-list svg {
  margin: 0 0.25rem -0.3rem;
}
.employees-list-sort {
  color: var(--color-text-muted);
  cursor: pointer;
  .--sort-active & {
    color: var(--color-kliemt);
  }
}
.employees-list-link {
  white-space: nowrap;
  & svg {
    margin-bottom: -0.2em;
  }
}
.employees-list-url-preview {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}
</style>
