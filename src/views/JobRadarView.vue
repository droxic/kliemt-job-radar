<script setup lang="ts">
import type { JobRadarEmployeeView, JobRadarEmployeeSource } from '@/stores/employee.dto'
import { api } from '@/api'
import ExportPdfForm from '@/components/ExportPdfForm.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { useAuthStore } from '@/stores/user'
import {
  displayLabel,
  getJobLocation,
  getJobScore,
  getJobSummary,
  getJobTitle,
  getJobUrl,
  lessRelevantPayloadKeys,
  relevanceLabels,
  relevanceLevel,
  toNonEmptyString,
  truncate,
} from '@/utils/jobResult'
import { computed, ref, useTemplateRef, watch } from 'vue'

type JobRadarResult = {
  rank?: number
  company_name?: string
  final_rank?: number
  listing_url?: string
  role?: string
  location?: string
  [key: string]: unknown
}

type JobRadarAnswer = {
  data_table?: JobRadarResult[]
  explanation_html?: string
  stats?: Record<string, unknown>
  [key: string]: unknown
}

type JobRadarResponse = {
  antwort?: JobRadarAnswer
  Antwort?: JobRadarAnswer
  [key: string]: unknown
}

type PromptRunResult = {
  id: number
  result_index: number
  role: string | null
  company_name: string | null
  location: string | null
  listing_url: string | null
  score: number | null
  result_payload: Record<string, unknown>
}

type PromptRunSummary = {
  id: number
  prompt_text: string
  status: 'succeeded' | 'failed'
  result_count: number
  error_message: string | null
  history_title?: string | null
  created_at: string | Date | null
}

type PromptRunDetail = {
  id: number
  prompt_text: string
  input_data?: string | null
  status: 'succeeded' | 'failed'
  error_message: string | null
  created_at: string | Date | null
  response_payload: unknown
  results: PromptRunResult[]
}

type CuratedMatch = {
  id: number
  prompt_run_result_id: number
  role: string | null
  company_name: string | null
  location: string | null
  listing_url: string | null
  score: number | null
  result_payload?: Record<string, unknown>
  created_at: string | Date | null
}

const props = withDefaults(
  defineProps<{
    projectId?: number
    employees?: JobRadarEmployeeView[]
  }>(),
  {
    projectId: undefined,
    employees: () => [],
  },
)

const isProjectMode = computed(() => typeof props.projectId === 'number')
const employees = computed(() => props.employees)

// Project and manual employees have separate id spaces, so a composite
// `source:id` key is used to identify the selected candidate unambiguously.
const employeeKey = (employee: JobRadarEmployeeView) => `${employee.source}:${employee.id}`
const selectedEmployeeKey = ref<string | null>(null)
const selectedEmployee = computed(() =>
  employees.value.find((employee) => employeeKey(employee) === selectedEmployeeKey.value),
)
const selectedEmployeeId = computed(() => selectedEmployee.value?.id ?? null)
const selectedEmployeeSource = computed<JobRadarEmployeeSource>(
  () => selectedEmployee.value?.source ?? 'project',
)

watch(
  () => props.employees,
  (employees) => {
    if (!employees.length) {
      selectedEmployeeKey.value = null
      return
    }

    const alreadySelected = employees.some(
      (employee) => employeeKey(employee) === selectedEmployeeKey.value,
    )
    if (!alreadySelected) {
      selectedEmployeeKey.value = employeeKey(employees[0])
    }
  },
  { immediate: true, deep: true },
)

const rawDataInput = ref('')
const fixedPrompt = 'Suche passende Jobs für folgende Person:'
// Fixed server-side cap on returned jobs; intentionally not user-configurable.
const maxJobs = 3
const isLoading = ref(false)
const errorMessage = ref('')
const rawResponse = ref<JobRadarResponse | null>(null)
const runs = ref<PromptRunSummary[]>([])
const selectedRunId = ref<number | null>(null)
const selectedRun = ref<PromptRunDetail | null>(null)
const curatedMatches = ref<CuratedMatch[]>([])
const loadingHistory = ref(false)
const loadingCurated = ref(false)
const loadingRun = ref(false)

const answer = computed<JobRadarAnswer | null>(() => {
  if (!rawResponse.value) return null
  if (rawResponse.value.antwort) return rawResponse.value.antwort
  if (rawResponse.value.Antwort) return rawResponse.value.Antwort
  return rawResponse.value as JobRadarAnswer
})

const jobs = computed(() => answer.value?.data_table ?? [])
const explanationHtml = computed(() => answer.value?.explanation_html ?? '')

const runResults = computed(() => selectedRun.value?.results ?? [])
const curatedResultIds = computed(
  () => new Set(curatedMatches.value.map((match) => match.prompt_run_result_id)),
)
const curatedByResultId = computed(
  () => new Map(curatedMatches.value.map((match) => [match.prompt_run_result_id, match])),
)

type JobDetails = {
  title: string
  summary: string | null
  applyUrl: string | null
  score: number | null
  location: string | null
  payload: Record<string, unknown>
  createdAt: unknown
}

const jobDetailsModalRef = useTemplateRef('jobDetailsModalRef')
const selectedJobDetails = ref<JobDetails | null>(null)

const authStore = useAuthStore()
const exportModalRef = useTemplateRef('exportModalRef')

// The letter is only meaningful once the lawyer has curated something to send.
const canExport = computed(
  () =>
    authStore.roles.includes('lawyer') &&
    isProjectMode.value &&
    selectedEmployeeId.value !== null &&
    curatedMatches.value.length > 0,
)

function openExportModal() {
  exportModalRef.value?.show()
}

function closeExportModal() {
  exportModalRef.value?.hide()
}

const selectedJobRelevance = computed(() => relevanceLevel(selectedJobDetails.value?.score))

function getRequestData(): unknown {
  const trimmed = rawDataInput.value.trim()
  return trimmed
}

function getRequestDataString(): string {
  const value = getRequestData()
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function getResultTitle(result: PromptRunResult): string {
  return getJobTitle(result, `Result #${result.result_index + 1}`)
}

function getHistoryTitle(run: PromptRunSummary): string {
  return run.history_title ?? run.prompt_text ?? 'Prompt run'
}

function getCuratedTitle(match: CuratedMatch): string {
  return getJobTitle(match, 'Match')
}

function formatRunDate(value: unknown): string {
  if (value == null) return '-'

  if (typeof value === 'number') {
    if (value <= 0) return '-'
    const millis = value < 1_000_000_000_000 ? value * 1000 : value
    const parsed = new Date(millis)
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString()
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '0') return '-'
    const parsed = new Date(trimmed)
    if (Number.isNaN(parsed.getTime())) return '-'
    if (parsed.getTime() <= 1_000) return '-'
    return parsed.toLocaleString()
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '-' : value.toLocaleString()
  }

  return '-'
}

function formatDetailsValue(value: unknown): string {
  if (value == null) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const selectedJobExtraEntries = computed(() => {
  const payload = selectedJobDetails.value?.payload
  if (!payload) return [] as Array<[string, unknown]>

  return Object.entries(payload).filter(([key, value]) => {
    if (lessRelevantPayloadKeys.has(key)) return false
    if (value == null) return false
    if (typeof value === 'string' && !value.trim()) return false
    return true
  })
})

function openResultDetails(result: PromptRunResult) {
  selectedJobDetails.value = {
    title: getResultTitle(result),
    summary: getJobSummary(result),
    applyUrl: getJobUrl(result),
    score: getJobScore(result),
    location: getJobLocation(result),
    payload: result.result_payload,
    createdAt: selectedRun.value?.created_at ?? null,
  }
  jobDetailsModalRef.value?.show()
}

function openCuratedDetails(match: CuratedMatch) {
  selectedJobDetails.value = {
    title: getCuratedTitle(match),
    summary: getJobSummary(match),
    applyUrl: getJobUrl(match),
    score: getJobScore(match),
    location: getJobLocation(match),
    payload: match.result_payload ?? {},
    createdAt: match.created_at,
  }
  jobDetailsModalRef.value?.show()
}

function closeDetailsModal() {
  jobDetailsModalRef.value?.hide()
  selectedJobDetails.value = null
}

async function submit() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    if (isProjectMode.value && props.projectId && selectedEmployeeId.value) {
      const run = await api.post<PromptRunDetail>('job-radar/runs', {
        project_id: props.projectId,
        employee_id: selectedEmployeeId.value,
        employee_source: selectedEmployeeSource.value,
        prompt: fixedPrompt,
        data: getRequestDataString(),
        max_jobs: maxJobs,
      })

      selectedRun.value = run
      selectedRunId.value = run.id
      await Promise.all([loadRuns(), loadCuratedMatches()])
    } else {
      rawResponse.value = null
      const response = await api.post<JobRadarResponse>('job-radar/process-playground', {
        prompt: fixedPrompt,
        data: getRequestData(),
        max_jobs: maxJobs,
      })
      rawResponse.value = response
    }
  } catch (error) {
    const message =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.body?.message ?? 'Job Radar request failed. Please try again.'
    errorMessage.value = Array.isArray(message) ? message.join(', ') : String(message)
  } finally {
    isLoading.value = false
  }
}

async function loadRuns() {
  if (!isProjectMode.value || !props.projectId || !selectedEmployeeId.value) {
    runs.value = []
    return
  }

  loadingHistory.value = true
  try {
    runs.value = await api.get<PromptRunSummary[]>(
      `job-radar/projects/${props.projectId}/employees/${selectedEmployeeId.value}/runs?source=${selectedEmployeeSource.value}`,
    )

    if (!selectedRunId.value && runs.value.length) {
      selectedRunId.value = runs.value[0].id
      await selectRun(runs.value[0].id)
    } else if (
      selectedRunId.value &&
      !runs.value.some((run) => run.id === selectedRunId.value)
    ) {
      selectedRunId.value = runs.value[0]?.id ?? null
      if (selectedRunId.value) {
        await selectRun(selectedRunId.value)
      } else {
        selectedRun.value = null
      }
    }
  } finally {
    loadingHistory.value = false
  }
}

async function selectRun(runId: number) {
  selectedRunId.value = runId
  loadingRun.value = true
  try {
    const run = await api.get<PromptRunDetail>(`job-radar/runs/${runId}`)
    selectedRun.value = run

    const hydratedInput = toNonEmptyString(run.input_data)
    if (hydratedInput !== null) {
      rawDataInput.value = hydratedInput
    }
  } catch (error) {
    const message =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.body?.message ?? 'Failed to load run details.'
    errorMessage.value = Array.isArray(message) ? message.join(', ') : String(message)
  } finally {
    loadingRun.value = false
  }
}

async function loadCuratedMatches() {
  if (!isProjectMode.value || !props.projectId || !selectedEmployeeId.value) {
    curatedMatches.value = []
    return
  }

  loadingCurated.value = true
  try {
    curatedMatches.value = await api.get<CuratedMatch[]>(
      `job-radar/projects/${props.projectId}/employees/${selectedEmployeeId.value}/curated?source=${selectedEmployeeSource.value}`,
    )
  } finally {
    loadingCurated.value = false
  }
}

async function addToCurated(promptRunResultId: number) {
  if (!isProjectMode.value || !props.projectId || !selectedEmployeeId.value) return

  await api.post(
    `job-radar/projects/${props.projectId}/employees/${selectedEmployeeId.value}/curated?source=${selectedEmployeeSource.value}`,
    {
      prompt_run_result_id: promptRunResultId,
    },
  )
  await loadCuratedMatches()
}

async function removeFromCurated(curatedId: number) {
  await api.delete(`job-radar/curated/${curatedId}`)
  await loadCuratedMatches()
}

async function toggleCurated(promptRunResultId: number, checked: boolean) {
  if (checked) {
    await addToCurated(promptRunResultId)
    return
  }

  const curated = curatedByResultId.value.get(promptRunResultId)
  if (!curated) return
  await removeFromCurated(curated.id)
}

watch(
  [() => props.projectId, selectedEmployeeKey],
  async () => {
    selectedRunId.value = null
    selectedRun.value = null
    if (!isProjectMode.value || !selectedEmployeeId.value) {
      runs.value = []
      curatedMatches.value = []
      return
    }

    await Promise.all([loadRuns(), loadCuratedMatches()])
  },
  { immediate: true },
)
</script>

<template>
  <section class="job-radar">
    <div class="job-radar-header">
      <h1>Job Radar</h1>
      <p>Search and rank job matches with the playground endpoint.</p>
    </div>

    <div v-if="isProjectMode" class="job-radar-project-head">
      <label>
        Employee
        <select v-model="selectedEmployeeKey" class="select form-control">
          <option :value="null" disabled>Select employee</option>
          <option
            v-for="employee in employees"
            :key="employeeKey(employee)"
            :value="employeeKey(employee)"
          >
            {{ employee.first_name }} {{ employee.last_name
            }}<template v-if="employee.job_position"> — {{ employee.job_position }}</template>
          </option>
        </select>
      </label>
      <p v-if="selectedEmployee" class="job-radar-selected-employee">
        Selected: <strong>{{ selectedEmployee.first_name }} {{ selectedEmployee.last_name }}</strong>
      </p>
    </div>

    <form class="job-radar-form" @submit.prevent="submit">
      <label>
        Prompt
        <textarea
          v-model="rawDataInput"
          class="input"
          rows="5"
          placeholder="Suche passende Jobs für folgende Person:"
          required
        />
      </label>

      <button class="btn --primary" type="submit" :disabled="isLoading">
        {{ isLoading ? 'Searching...' : 'Run Job Radar' }}
      </button>
    </form>

    <p v-if="errorMessage" class="job-radar-error">{{ errorMessage }}</p>

    <section v-if="isProjectMode" class="job-radar-workspace">
      <div class="workspace-main">
        <article class="workspace-card workspace-results">
          <h2>Results</h2>
          <p v-if="!selectedRun" class="text-muted">
            Run a prompt or select one from history to view results.
          </p>
          <template v-else>
            <p class="text-muted">
              {{ truncate(selectedRun.prompt_text, 80) }} • {{ formatRunDate(selectedRun.created_at) }}
            </p>
            <p v-if="selectedRun.error_message" class="job-radar-error">
              {{ selectedRun.error_message }}
            </p>
            <p v-if="loadingRun">Loading results...</p>
            <div v-else-if="runResults.length" class="workspace-row-list">
              <button
                v-for="result in runResults"
                :key="result.id"
                type="button"
                class="workspace-row"
                @click="openResultDetails(result)"
              >
                <div class="workspace-row-main">
                  <strong>{{ getResultTitle(result) }}</strong>
                  <span class="text-muted">
                    <template v-if="result.score != null">Match: {{ result.score }}</template>
                    <template v-if="result.location"> • {{ result.location }}</template>
                  </span>
                </div>
                <label class="workspace-row-check" @click.stop>
                  <input
                    type="checkbox"
                    :checked="curatedResultIds.has(result.id)"
                    @change="
                      (event) =>
                        toggleCurated(result.id, (event.target as HTMLInputElement).checked)
                    "
                  />
                </label>
              </button>
            </div>
            <p v-else>No results saved for this run.</p>
          </template>
        </article>
      </div>

      <aside class="workspace-side">
        <article class="workspace-card">
          <h2>Prompt History</h2>
          <p v-if="loadingHistory">Loading...</p>
          <p v-else-if="!runs.length">No prompt history yet.</p>
          <div v-else class="workspace-row-list">
            <button
              v-for="run in runs"
              :key="run.id"
              type="button"
              class="workspace-row workspace-row-history"
              :class="{ active: run.id === selectedRunId }"
              @click="selectRun(run.id)"
            >
              <strong class="workspace-row-title">{{ getHistoryTitle(run) }}</strong>
              <span class="text-muted">Date: {{ formatRunDate(run.created_at) }}</span>
              <span class="text-muted">Matches: {{ run.result_count }}</span>
            </button>
          </div>
        </article>

        <article class="workspace-card">
          <div class="workspace-card-head">
            <h2>Curated List</h2>
            <button
              class="btn --primary --outline --pill workspace-export-btn"
              :disabled="!canExport"
              @click="openExportModal"
            >
              <IMaterialSymbolsDownload /> {{ $t('Export to PDF') }}
            </button>
          </div>
          <p v-if="loadingCurated">Loading...</p>
          <p v-else-if="!curatedMatches.length">No curated matches yet.</p>
          <div v-else class="workspace-row-list">
            <div
              v-for="match in curatedMatches"
              :key="match.id"
              class="workspace-row"
              @click="openCuratedDetails(match)"
              role="button"
              tabindex="0"
              @keydown.enter="openCuratedDetails(match)"
              @keydown.space.prevent="openCuratedDetails(match)"
            >
              <div class="workspace-row-main">
                <strong>{{ getCuratedTitle(match) }}</strong>
                <span class="text-muted">{{ formatRunDate(match.created_at) }}</span>
              </div>
              <button
                type="button"
                class="curated-remove"
                @click.stop="removeFromCurated(match.id)"
              >
                ×
              </button>
            </div>
          </div>
        </article>
      </aside>
    </section>

    <ModalDialog ref="exportModalRef">
      <ExportPdfForm
        v-if="projectId && selectedEmployeeId"
        :key="`${selectedEmployeeSource}:${selectedEmployeeId}`"
        :project-id="projectId"
        :employee-id="selectedEmployeeId"
        :source="selectedEmployeeSource"
        @close="closeExportModal"
      />
    </ModalDialog>

    <ModalDialog ref="jobDetailsModalRef" content-class="job-modal-content">
      <div class="modal-head">
        <h1>Job Details</h1>
        <button class="btn --primary --pill job-modal-close" @click="closeDetailsModal">
          <IMdiClose />
          Close
        </button>
      </div>
      <div v-if="selectedJobDetails" class="modal-main job-modal-main">
        <div class="job-modal-title-row">
          <h3>{{ selectedJobDetails.title }}</h3>
          <span
            v-if="selectedJobRelevance"
            class="job-modal-score-badge"
            :class="`is-${selectedJobRelevance}`"
          >
            Relevance: {{ relevanceLabels[selectedJobRelevance] }}
          </span>
        </div>
        <p v-if="selectedJobDetails.location">Location: {{ selectedJobDetails.location }}</p>
        <p v-if="selectedJobDetails.summary" class="job-summary">
          {{ selectedJobDetails.summary }}
        </p>
        <p v-if="selectedJobDetails.applyUrl" class="job-modal-apply-link">
          <a
            class="job-modal-link"
            :href="String(selectedJobDetails.applyUrl)"
            target="_blank"
            rel="noopener"
          >
            Open job link
          </a>
        </p>
        <p class="text-muted">Date: {{ formatRunDate(selectedJobDetails.createdAt) }}</p>

        <details v-if="selectedJobExtraEntries.length" class="job-modal-more">
          <summary>More details</summary>
          <dl class="job-fields">
            <template v-for="[key, value] in selectedJobExtraEntries" :key="key">
              <dt>{{ displayLabel(key) }}</dt>
              <dd>{{ formatDetailsValue(value) }}</dd>
            </template>
          </dl>
        </details>
      </div>
    </ModalDialog>

    <section v-if="!isProjectMode && answer" class="job-radar-results">
      <h2>Top Matches ({{ jobs.length }})</h2>
      <div v-if="jobs.length" class="job-grid">
        <article v-for="(job, index) in jobs" :key="`${job.listing_url}-${index}`" class="job-card">
          <h3>{{ job.role ?? job.company_name ?? `Result #${index + 1}` }}</h3>
          <p v-if="job.company_name" class="job-company">{{ job.company_name }}</p>
          <p v-if="job.location" class="job-meta">📍 {{ job.location }}</p>
          <p v-if="job.final_rank != null" class="job-score">Relevance: {{ job.final_rank }}</p>
          <a v-if="job.listing_url" :href="String(job.listing_url)" target="_blank" rel="noopener">
            Open listing
          </a>

          <dl class="job-fields">
            <template
              v-for="[key, value] in Object.entries(job)"
              :key="`${String(job.listing_url)}-${key}`"
            >
              <template
                v-if="!['role', 'company_name', 'location', 'final_rank', 'listing_url'].includes(key)"
              >
                <dt>{{ displayLabel(key) }}</dt>
                <dd>{{ value }}</dd>
              </template>
            </template>
          </dl>
        </article>
      </div>
      <p v-else>No ranked jobs returned.</p>

      <article v-if="explanationHtml" class="explanation">
        <h2>Explanation</h2>
        <div v-html="explanationHtml"></div>
      </article>

      <details class="raw-response">
        <summary>Raw response</summary>
        <pre>{{ JSON.stringify(rawResponse, null, 2) }}</pre>
      </details>
    </section>
  </section>
</template>

<style scoped>
.job-radar {
  max-width: 1100px;
  margin: 0 auto;
}

.job-radar-header h1 {
  margin: 0;
  color: var(--color-kliemt);
}

.job-radar-header p {
  margin: 0.5rem 0 1.25rem;
  color: var(--color-text-muted);
}

.job-radar-form {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  background: var(--color-background);
}

.job-radar-form label {
  display: grid;
  gap: 0.5rem;
  font-weight: 600;
}

.job-radar-error {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  border: 1px solid #d9534f;
  background: var(--color-background-error);
}

.job-radar-results {
  margin-top: 1.5rem;
}

.job-radar-project-head {
  margin-bottom: 1rem;
  display: grid;
  gap: 0.5rem;
}

.job-radar-selected-employee {
  margin: 0;
}

.job-radar-workspace {
  margin-top: 1.5rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
}

.workspace-main,
.workspace-side {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.workspace-results {
  min-height: 360px;
}

.workspace-card {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--color-background);
  padding: 1rem;
}

.workspace-card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.workspace-card-head h2 {
  margin-right: auto;
}

.workspace-export-btn {
  background-color: var(--color-background);
  white-space: nowrap;
}

.workspace-export-btn svg {
  vertical-align: middle;
  position: relative;
  top: -0.1em;
}

.workspace-row-list {
  --color-border: var(--color-list-border);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.workspace-row {
  width: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 0.75rem;
  padding: 16px;
  color: inherit;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  transition: background-color 0.5s;
}

.workspace-row:focus-visible {
  outline: 2px solid var(--color-kliemt);
  outline-offset: -2px;
}

.workspace-row:last-child {
  border-bottom: 0;
}

@media (hover: hover) {
  .workspace-row:hover {
    transition: background-color 0s;
    background-color: var(--color-background-accent);
  }
}

.workspace-row.active {
  background-color: var(--color-background-accent);
}

.workspace-row-main {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.workspace-row-main strong {
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.workspace-row-main .text-muted {
  line-height: 1.35;
}

.workspace-row-title {
  width: 100%;
}

.workspace-row-check {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.workspace-row-check input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-kliemt);
}

.workspace-row-history {
  align-items: flex-start;
  flex-direction: column;
  gap: 0.2rem;
}

.curated-remove {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  border-radius: var(--border-radius-pill);
  transition:
    color 0.2s,
    background-color 0.2s;
}

@media (hover: hover) {
  .curated-remove:hover {
    color: var(--color-kliemt);
    background: var(--color-background-focus);
  }
}

.job-modal-main h3 {
  margin-top: 0;
  margin-bottom: 0;
}

.job-modal-main p {
  margin: 0 0 0.55rem;
}

.job-modal-close {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.job-modal-close svg {
  margin-bottom: -0.08em;
}

:deep(.job-modal-content) {
  width: min(92vw, 60rem);
  max-width: 60rem;
}

.job-modal-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(7.5rem, 10%);
  align-items: start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.job-modal-score-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 2.2rem;
  padding: 0.4rem 0.55rem;
  border-radius: var(--border-radius);
  font-weight: 700;
  font-size: 0.82rem;
  line-height: 1.2;
  text-align: center;
  cursor: default;
  pointer-events: none;
  color: #fff;
}

.job-modal-score-badge.is-high {
  background-color: #16a34a;
}

.job-modal-score-badge.is-medium {
  background-color: #d97706;
}

.job-modal-score-badge.is-low {
  background-color: #dc2626;
}

.job-modal-apply-link {
  margin: 0 0 0.75rem;
}

.job-modal-link {
  color: var(--color-kliemt);
  font-weight: 600;
  text-decoration: underline;
}

.job-modal-more {
  margin-top: 1rem;
}

.job-modal-more summary {
  cursor: pointer;
  font-weight: 500;
}

.job-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.job-card {
  padding: 1rem;
  border-radius: var(--border-radius);
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.job-card h3 {
  margin: 0;
}

.job-company,
.job-meta,
.job-score {
  margin: 0.4rem 0;
}

.job-summary {
  margin: 0.5rem 0 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.job-fields {
  margin: 0.75rem 0 0;
}

.job-fields dt {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.job-fields dd {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.explanation {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.raw-response {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.raw-response pre {
  overflow: auto;
}

@media (max-width: 1000px) {
  .job-radar-workspace {
    grid-template-columns: 1fr;
  }
}
</style>
