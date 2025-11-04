<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Project } from '@/stores/projects'
import PieChart from './PieChart.vue'

const { t } = useI18n()
const { project } = defineProps<{ project: Project }>()
const vlpEligible = computed(() => project.employees.filter(({ vlp_eligible }) => vlp_eligible))
const vlpPie = computed(() => [
  {
    label: t('Eligible'),
    value: vlpEligible.value.length,
    size: project.employees.length > 0 ? vlpEligible.value.length / project.employees.length : 0,
    color: '#b90064',
  },
])
const vlpStatusPie = computed(() => {
  const countByStatus = (filterStatus: string) =>
    vlpEligible.value.filter(({ vlp_status }) => vlp_status == filterStatus).length
  const acceptedCount = countByStatus('accepted')
  const declinedCount = countByStatus('declined')
  const pendingCount = countByStatus('pending')
  return [
    {
      label: t('Accepted'),
      value: acceptedCount,
      size: vlpEligible.value.length > 0 ? acceptedCount / vlpEligible.value.length : 0,
      color: '#5ac251',
    },
    {
      label: t('Declined'),
      value: declinedCount,
      size: vlpEligible.value.length > 0 ? declinedCount / vlpEligible.value.length : 0,
      color: '#e24b58',
    },
    {
      label: t('Pending'),
      value: pendingCount,
      size: vlpEligible.value.length > 0 ? pendingCount / vlpEligible.value.length : 0,
      color: '#cccccc',
    },
  ]
})
const totalSeverenceCost = computed(() =>
  vlpEligible.value
    .filter(({ vlp_status }) => vlp_status == 'accepted')
    .reduce((total, { severance_total }) => total + severance_total, 0),
)
const totalCost = computed(() =>
  vlpEligible.value
    .filter(({ vlp_status }) => vlp_status == 'accepted')
    .reduce(
      (total, e) => total + e.severance_total + e.fixed_monthly_salary_gross * e.termination_period,
      0,
    ),
)
const terminationPie = computed(() => {
  const toBeTerminated = project.employees.filter(({ to_be_dismissed }) => to_be_dismissed)
  const countByStatus = (filterStatus: string) =>
    toBeTerminated.filter(({ termination_status }) => termination_status == filterStatus).length
  const notSentCount = countByStatus('not-sent')
  const deliveredCount = countByStatus('delivered')
  const notDeliveredCount = countByStatus('not-delivered')
  return [
    {
      label: t('Delivered'),
      value: deliveredCount,
      size: toBeTerminated.length > 0 ? deliveredCount / toBeTerminated.length : 0,
      color: '#5ac251',
    },
    {
      label: t('Not Delivered'),
      value: notDeliveredCount,
      size: toBeTerminated.length > 0 ? notDeliveredCount / toBeTerminated.length : 0,
      color: '#e24b58',
    },
    {
      label: t('Not sent'),
      value: notSentCount,
      size: toBeTerminated.length > 0 ? notSentCount / toBeTerminated.length : 0,
      color: '#cccccc',
    },
  ]
})

const windingUpPie = computed(() => {
  const windingUp = project.employees.filter(({ winding_up }) => winding_up)
  const countByStatus = (filterStatus: string | string[]) =>
    windingUp.filter(({ winding_up_status }) =>
      (Array.isArray(filterStatus) ? filterStatus : [filterStatus]).includes(winding_up_status),
    ).length
  const acceptedCount = countByStatus(['signed', 'original-received'])
  const notAcceptedCount = countByStatus('sent') // not accepted - sent
  const notSentCount = countByStatus('not-sent')
  return [
    {
      label: t('Accepted'),
      value: acceptedCount,
      size: windingUp.length > 0 ? acceptedCount / windingUp.length : 0,
      color: '#5ac251',
    },
    {
      label: t('Not accepted'),
      value: notAcceptedCount,
      size: windingUp.length > 0 ? notAcceptedCount / windingUp.length : 0,
      color: '#e24b58',
    },
    {
      label: t('Not sent'),
      value: notSentCount,
      size: windingUp.length > 0 ? notSentCount / windingUp.length : 0,
      color: '#cccccc',
    },
  ]
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('Eligible for VLP') }}</h2>
      <PieChart :segments="vlpPie" class="dashboard-item" />
    </div>
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('VLP Response status') }}</h2>
      <PieChart :segments="vlpStatusPie" class="dashboard-item" />
    </div>
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('Terminations') }}</h2>
      <PieChart :segments="terminationPie" class="dashboard-item" />
    </div>
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('Winding-up agreements') }}</h2>
      <PieChart :segments="windingUpPie" class="dashboard-item" />
    </div>
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('Total Severance Cost') }}</h2>
      <div class="dashboard-big-money">
        {{
          new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
            totalSeverenceCost,
          )
        }}
      </div>
    </div>
    <div class="dashboard-item">
      <h2 class="dashboard-heading">{{ $t('Total Cost') }}</h2>
      <div class="dashboard-big-money">
        {{
          new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalCost)
        }}
      </div>
    </div>
  </div>
</template>

<style>
.dashboard {
  display: flex;
  margin-bottom: 1rem;
}
.dashboard-item {
  flex: 1 0 0%;
  display: flex;
  flex-direction: column;
}
.dashboard-heading {
  font-weight: 300;
  text-align: center;
  font-size: 1.25rem;
  margin-bottom: 0;
}
.dashboard-big-money {
  flex: 1 0 0%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  font-size: 2rem;
  color: var(--color-kliemt);
}
</style>
