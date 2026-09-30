<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue'
import { api } from '@/api'
import type { JobRadarEmployeeSource } from '@/stores/employee.dto'

const { projectId, employeeId, source } = defineProps<{
  projectId: number
  employeeId: number
  source: JobRadarEmployeeSource
}>()
const emit = defineEmits(['close'])

/** Prefill returned by `GET job-radar/.../letter-defaults`. */
type LetterDefaults = {
  employee_name: string
  recipient_name: string
  recipient_address_lines: string[]
  termination_date: string | null
  our_reference: string | null
  dispatch_method: string
  curated_count: number
  sender: {
    name: string
    phone: string | null
    email: string | null
    address_lines: string[]
  }
}

const formRef = useTemplateRef('formRef')
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const curatedCount = ref(0)
const employeeName = ref('')
const senderName = ref('')

const form = reactive({
  recipient_type: 'employee' as 'employee' | 'lawyer',
  salutation: 'neutral' as 'herr' | 'frau' | 'neutral',
  recipient_name: '',
  recipient_address: '',
  sender_address: '',
  dispatch_method: '',
  our_reference: '',
  termination_date: '',
  application_deadline: '',
  include_competitor_clause: false,
})

// The application deadline is optional: a letter can be drafted before the
// date is decided, and the PDF then carries the template's own placeholder.
const canSubmit = computed(
  () => !loading.value && !submitting.value && Boolean(form.recipient_name.trim()),
)

onMounted(async () => {
  try {
    const defaults = await api.get<LetterDefaults>(
      `job-radar/projects/${projectId}/employees/${employeeId}/letter-defaults?source=${source}`,
    )

    employeeName.value = defaults.employee_name
    curatedCount.value = defaults.curated_count
    senderName.value = defaults.sender.name
    form.recipient_name = defaults.recipient_name
    form.recipient_address = defaults.recipient_address_lines.join('\n')
    form.sender_address = defaults.sender.address_lines.join('\n')
    form.dispatch_method = defaults.dispatch_method
    form.our_reference = defaults.our_reference ?? ''
    form.termination_date = defaults.termination_date ?? ''
  } catch (error) {
    errorMessage.value =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.body?.message ?? 'Failed to load letter defaults.'
  } finally {
    loading.value = false
  }
})

/** Splits a textarea into non-empty, trimmed address lines. */
function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

async function submit() {
  if (!formRef.value?.reportValidity() || !canSubmit.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    // mande cannot stream binaries, so the download goes through raw fetch —
    // same approach as the employee URL CSV export.
    const token = localStorage.getItem('access_token')
    const response = await fetch(
      `/api/job-radar/projects/${projectId}/employees/${employeeId}/export-pdf?source=${source}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_type: form.recipient_type,
          salutation: form.salutation,
          recipient_name: form.recipient_name.trim(),
          recipient_address_lines: toLines(form.recipient_address),
          sender_address_lines: toLines(form.sender_address),
          dispatch_method: form.dispatch_method.trim() || undefined,
          our_reference: form.our_reference.trim() || undefined,
          termination_date: form.termination_date || undefined,
          application_deadline: form.application_deadline || undefined,
          include_competitor_clause: form.include_competitor_clause,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filenameFrom(response) ?? 'Stellenangebote.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    emit('close')
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Export failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

/** Prefer the server's filename so the naming stays in one place. */
function filenameFrom(response: Response): string | null {
  const disposition = response.headers.get('Content-Disposition')
  if (!disposition) return null
  const match = /filename="([^"]+)"/.exec(disposition)
  return match ? match[1] : null
}
</script>

<template>
  <div class="modal-head">
    <h1>{{ $t('Export to PDF') }}</h1>
    <button class="btn --secondary" @click="$emit('close')">{{ $t('Cancel') }}</button>
    <button class="btn --primary" :disabled="!canSubmit" @click="submit">
      {{ submitting ? $t('Exporting...') : $t('Export') }}
    </button>
  </div>

  <p v-if="loading" class="export-note">{{ $t('Loading...') }}</p>
  <p v-else class="export-note">
    {{ $t('export-pdf-summary', { count: curatedCount, name: employeeName }) }}
    <br />
    <small>{{ $t('export-pdf-sender', { name: senderName }) }}</small>
  </p>
  <p v-if="errorMessage" class="export-error">{{ errorMessage }}</p>

  <form v-if="!loading" ref="formRef" class="modal-form" @submit.prevent="submit">
    <label class="col form-group">
      {{ $t('Recipient') }}:
      <select class="select form-control" v-model="form.recipient_type">
        <option value="employee">{{ $t('The employee') }}</option>
        <option value="lawyer">{{ $t("The employee's lawyer") }}</option>
      </select>
    </label>
    <label class="col form-group">
      {{ $t('Salutation') }}:
      <select class="select form-control" v-model="form.salutation">
        <option value="neutral">{{ $t('Sehr geehrte/r Herr/Frau') }}</option>
        <option value="herr">{{ $t('Sehr geehrter Herr') }}</option>
        <option value="frau">{{ $t('Sehr geehrte Frau') }}</option>
      </select>
    </label>
    <label class="col form-group">
      {{ $t('Recipient Name') }}:
      <input class="input form-control" type="text" v-model="form.recipient_name" required />
    </label>
    <label class="col form-group">
      {{ $t('Dispatch Method') }}:
      <input class="input form-control" type="text" v-model="form.dispatch_method" />
    </label>
    <label class="form-group export-full">
      {{ $t('Recipient Address') }}:
      <textarea class="input form-control" rows="4" v-model="form.recipient_address" />
    </label>
    <label class="form-group export-full">
      {{ $t('Sender Address') }}:
      <textarea class="input form-control" rows="3" v-model="form.sender_address" />
      <small>{{ $t('sender-address-hint') }}</small>
    </label>
    <label class="col form-group">
      {{ $t('Our Reference') }}:
      <input class="input form-control" type="text" v-model="form.our_reference" />
    </label>
    <label class="col form-group">
      {{ $t('Termination Date') }}:
      <input class="input form-control" type="date" v-model="form.termination_date" />
    </label>
    <label class="col form-group">
      {{ $t('Application Deadline') }}:
      <input class="input form-control" type="date" v-model="form.application_deadline" />
    </label>
    <label class="form-group export-full export-checkbox">
      <input type="checkbox" v-model="form.include_competitor_clause" />
      {{ $t('Include the non-compete waiver paragraph') }}
    </label>
  </form>
</template>

<style scoped>
.export-note {
  padding: 1rem 2rem 0;
  color: var(--color-text-muted);
}
.export-error {
  padding: 0.5rem 2rem 0;
  color: #dc2626;
}
.export-full {
  width: 100%;
}
.export-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.export-checkbox input {
  width: auto;
}
</style>
