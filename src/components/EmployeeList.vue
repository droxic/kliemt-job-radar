<script setup lang="ts">
import { useTemplateRef, computed, ref, type FunctionalComponent, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/user'
import ModalDialog from '@/components/ModalDialog.vue'
import EmployeesUpload from './EmployeesUpload.vue'
import type { Employee } from '@/stores/employee.dto'

import IMaterialSymbolsMapSearchOutline from '~icons/material-symbols/map-search-outline'
import IMaterialSymbolsAlternateEmail from '~icons/material-symbols/alternate-email'
import IMaterialSymbolsWatchCheckOutline from '~icons/material-symbols/watch-check-outline'
import IMaterialSymbolsShieldLockSharp from '~icons/material-symbols/shield-lock-sharp'
import IMaterialSymbolsMoneyBag from '~icons/material-symbols/money-bag'
import IMaterialSymbolsAccessibleSharp from '~icons/material-symbols/accessible-sharp'
import IMaterialSymbolsCalendarMonthSharp from '~icons/material-symbols/calendar-month-sharp'
import IMaterialSymbolsCalendarPersonCheck from '~icons/material-symbols/person-check'
import IMaterialSymbolsChildCareOutline from '~icons/material-symbols/child-care-outline'
import IMaterialSymbolsDiamondOutline from '~icons/material-symbols/diamond-outline'
import IMaterialSymbolsCheckCircleOutline from '~icons/material-symbols/check-circle-outline'
import IMaterialSymbolsCommentSharp from '~icons/material-symbols/comment-sharp'

const { t } = useI18n()
const { projectId } = defineProps<{
  projectId: number
}>()

const authStore = useAuthStore()

const filtersModalRef = useTemplateRef('filtersModalRef')
const columnsModalRef = useTemplateRef('columnsModalRef')
const employeesModalRef = useTemplateRef('employeesModalRef')
const employeeLinkModalRef = useTemplateRef('employeeLinkModalRef')

const projectsStore = useProjectsStore()
const employees = computed<Employee[]>(
  () => projectsStore.projects.find((project) => project.id == projectId)?.employees || [],
)
const employeesFiltered = computed(() => {
  let result = employees.value
  if (filters.search) {
    result = result.filter((employee) =>
      `${employee.first_name} ${employee.last_name} ${employee.email}`
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
  if (filters.garden_leave !== null) {
    result = result.filter(
      ({ garden_leave_from }) => filters.garden_leave == Boolean(garden_leave_from),
    )
  }
  if (sortKey.value !== null) {
    result = result.slice(0).sort((employeeA, employeeB) => {
      if (sortKey.value !== null) {
        const column = columns.find(({ key }) => key == sortKey.value)
        const valueA = sortDir.value ? employeeA[sortKey.value] : employeeB[sortKey.value]
        const valueB = sortDir.value ? employeeB[sortKey.value] : employeeA[sortKey.value]
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
  key: keyof Employee
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
  icon: IMaterialSymbolsCalendarMonthSharp,
  type: 'boolean',
}

const columns: Column[] = [
  { key: 'first_name', title: t('First Name'), type: 'string' },
  { key: 'last_name', title: t('Last Name'), type: 'string' },
  {
    key: 'address_street',
    title: t('Address Street'),
    icon: IMaterialSymbolsMapSearchOutline,
    type: 'string',
  },
  {
    key: 'address_street_no',
    title: t('Address Street No'),
    icon: IMaterialSymbolsMapSearchOutline,
    type: 'string',
  },
  {
    key: 'address_street_post_code',
    title: t('Address Street Post Code'),
    icon: IMaterialSymbolsMapSearchOutline,
    type: 'string',
  },
  {
    key: 'address_street_city',
    title: t('Address Street City'),
    icon: IMaterialSymbolsMapSearchOutline,
    type: 'string',
  },
  { key: 'email', title: 'Email', icon: IMaterialSymbolsAlternateEmail, type: 'string' },
  {
    key: 'has_probatory_period_running',
    title: t('Has Probatory Period Running'),
    icon: IMaterialSymbolsWatchCheckOutline,
    type: 'boolean',
  },
  {
    key: 'reasons_for_special_protection',
    title: t('Reasons For Special Protection'),
    icon: IMaterialSymbolsShieldLockSharp,
    type: 'string',
  },
  {
    key: 'total_annual_salary_gross',
    title: t('Total Annual Salary Gross'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  {
    key: 'fixed_monthly_salary_gross',
    title: t('Fixed Monthly Salary Gross'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  {
    key: 'date_of_entry',
    title: t('Date Of Entry'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'date',
  },
  {
    key: 'seniority_in_years',
    title: t('Seniority In Years'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'number',
  },
  {
    key: 'date_of_birth',
    title: t('Date Of Birth'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'date',
  },
  { key: 'age', title: t('Age'), icon: IMaterialSymbolsCalendarMonthSharp, type: 'number' },
  {
    key: 'has_spouse',
    title: t('Has Spouse'),
    icon: IMaterialSymbolsDiamondOutline,
    type: 'boolean',
  },
  {
    key: 'number_of_children',
    title: t('Number Of Children'),
    icon: IMaterialSymbolsChildCareOutline,
    type: 'number',
  },
  {
    key: 'has_disability',
    title: t('Has Disability'),
    icon: IMaterialSymbolsAccessibleSharp,
    type: 'boolean',
  },
  {
    key: 'limitation_equal_to_disability',
    title: t('Limitation Equal To Disability'),
    icon: IMaterialSymbolsAccessibleSharp,
    type: 'boolean',
  },
  {
    key: 'disability_degree',
    title: t('Disability Degree'),
    icon: IMaterialSymbolsAccessibleSharp,
    type: 'number',
  },
  {
    key: 'to_be_dismissed',
    title: t('Termination'),
    icon: IMaterialSymbolsCheckCircleOutline,
    type: 'boolean',
  },
  {
    key: 'termination_period',
    title: t('Termination Period'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'number',
  },
  {
    key: 'termination_date',
    title: t('Termination Date'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'date',
  },
  { key: 'bonus', title: 'Bonus', icon: IMaterialSymbolsMoneyBag, type: 'currency' },
  {
    key: 'bonus_monthly',
    title: t('Bonus Monthly'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  {
    key: 'bonus_payout',
    title: t('Bonus Payout'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  {
    key: 'surcharges_disability',
    title: t('Surcharges Disability'),
    icon: IMaterialSymbolsAccessibleSharp,
    type: 'currency',
  },
  {
    key: 'surcharges_children',
    title: t('Surcharges Children'),
    icon: IMaterialSymbolsChildCareOutline,
    type: 'currency',
  },
  {
    key: 'surcharges_other',
    title: t('Surcharges Other'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  { key: 'factor', title: t('Factor'), icon: IMaterialSymbolsMoneyBag, type: 'number' },
  {
    key: 'garden_leave_from',
    title: t('Garden Leave From'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'date',
  },
  {
    key: 'severance_base',
    title: t('Severance Base'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  {
    key: 'severance_total',
    title: t('Severance Total'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'currency',
  },
  earlyLeaveColumn,
  {
    key: 'early_leave_from',
    title: t('Early Leave From'),
    icon: IMaterialSymbolsCalendarMonthSharp,
    type: 'date',
  },
  {
    key: 'remaining_salary_ratio',
    title: t('Remaining Salary Ratio'),
    icon: IMaterialSymbolsMoneyBag,
    type: 'number',
  },
  {
    key: 'comments',
    title: t('Employee comments'),
    icon: IMaterialSymbolsCommentSharp,
    type: 'string',
  },
  {
    key: 'vlp_eligible',
    title: t('Eligible For VLP'),
    icon: IMaterialSymbolsCalendarPersonCheck,
    type: 'boolean',
  },
  {
    key: 'winding_up',
    title: t('Winding Up'),
    icon: IMaterialSymbolsCheckCircleOutline,
    type: 'boolean',
  },
  {
    key: 'vlp_contract',
    title: t('VLP Contract'),
    icon: IMaterialSymbolsCalendarPersonCheck,
    options: ['not-applicable', 'not-sent', 'sent', 'signed', 'original-received'],
    type: 'string',
  },
  terminationStatusColumn,
  vlpStatusColumn,
  windingUpStatusColumn,
]
const alwaysOnColumns: Array<keyof Employee> = [
  'first_name',
  'last_name',
  'vlp_eligible',
  'to_be_dismissed',
  'termination_status',
  'vlp_status',
  'vlp_contract',
  'winding_up_status',
]
const activeColumns = ref<Set<keyof Employee>>(new Set(alwaysOnColumns))
function toggleColumn(event: Event, column: keyof Employee) {
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
  garden_leave: boolean | null
}>({
  search: '',
  termination_status: null,
  vlp_status: null,
  winding_up_status: null,
  early_leave: null,
  garden_leave: null,
})

const filteredColumns = computed(() => columns.filter(({ key }) => activeColumns.value.has(key)))
const sortKey = ref<keyof Employee | null>(null)
const sortDir = ref(true)

const selectedEmployee = ref<Employee>()
const employeeUrl = ref<string>('')
async function openEmployeeAccessModal(employee: Employee) {
  selectedEmployee.value = employee
  const buildURL = (url: string) => {
    if (/^(?:[a-z]+:)?\/\//i.test(url)) {
      return url;
    }
    const { protocol, host } = window.location;
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${protocol}//${host}${normalizedUrl}`;
  }
  employeeUrl.value = buildURL(import.meta.env.VITE_VLT_CLIENT_URL)
  employeeLinkModalRef.value?.show()
  const token = await projectsStore.getToken(selectedEmployee.value)
  employeeUrl.value = buildURL(import.meta.env.VITE_VLT_CLIENT_URL + '/?' + token)
}

const dirty = ref(new Map<number, 'loading' | 'error'>())
async function updateEmployee(employee: Employee) {
  const id = employee.id as number
  dirty.value.set(id, 'loading')
  try {
    await projectsStore.updateEmployee(employee)
    dirty.value.delete(id)
  } catch (error) {
    console.error(error)
    dirty.value.set(id, 'error')
  }
}
function employeeRowClass(employee: Employee) {
  const id = employee.id as number
  return dirty.value.has(id) ? `--${dirty.value.get(id)}` : undefined
}
function copyEmployeeUrl() {
  const el = document.querySelector('.employees-list-url-preview') as HTMLInputElement
  el.select()
  document.execCommand('copy')
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
      class="btn --primary --pill"
      @click="employeesModalRef?.show"
      :disabled="!authStore.roles.includes('lawyer')"
    >
      {{ $t('Add Employees') }}
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
          <th>{{ $t('Access') }}</th>
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
            :key="employee.id ?? employee.email"
            :class="employeeRowClass(employee)"
          >
            <td v-for="column in filteredColumns" :key="column.key">
              <template v-if="column.options && authStore.roles.includes('lawyer')">
                <select
                  class="select form-control"
                  v-model="employee[column.key]"
                  @change="updateEmployee(employee)"
                >
                  <option :value="null" disabled>-</option>
                  <option v-for="option in column.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </template>
              <template v-else-if="column.type == 'date'">
                {{ dateFormatter(new Date(employee[column.key] as string)) }}
              </template>
              <template v-else-if="column.type == 'currency'">
                {{ currencyFormatter(employee[column.key] as number) }}
              </template>
              <template v-else-if="column.type == 'boolean'">
                <IMaterialSymbolsCheckCircle v-if="employee[column.key]" />
                <IMaterialSymbolsDoNotDisturbOnOutline v-else />
              </template>
              <template v-else>{{ employee[column.key] }}</template>
            </td>
            <td>
              <button
                :disabled="!employee.vlp_eligible"
                :class="`btn ${employee.vlp_eligible ? '--primary' : '--secondary'} employees-list-link`"
                @click="openEmployeeAccessModal(employee)"
              >
                <IMdiWebCheck /> {{ $t('Access URL') }}
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
      <label class="col form-group">
        Garden leave:
        <select class="select form-control" v-model="filters.garden_leave">
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
  <ModalDialog ref="employeesModalRef">
    <EmployeesUpload :projectId="projectId" @close="employeesModalRef?.hide" />
  </ModalDialog>
  <ModalDialog ref="employeeLinkModalRef">
    <div class="modal-head">
      <h1>{{ $t('Employee Access URL') }}</h1>
      <button class="btn --primary" @click="employeeLinkModalRef?.hide">{{ $t('Close') }}</button>
    </div>
    <div class="modal-main" v-if="selectedEmployee">
      <p>{{ selectedEmployee.first_name }} {{ selectedEmployee.last_name }}:</p>
      <input class="employees-list-url-preview" :value="employeeUrl" />
      <button class="btn --primary" @click="copyEmployeeUrl">
        <IMaterialSymbolsContentCopyOutline />
        {{ $t('Copy URL') }}
      </button>
    </div>
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
