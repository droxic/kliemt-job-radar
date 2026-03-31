import type { EmployeeInput } from '@/stores/employee.dto'

export interface EmployeeValidationError {
  /** Spreadsheet row number (1-based, starting from row 6 in the sheet) */
  row: number
  /** Employee name for display, falls back to "Row {row}" if names are missing */
  name: string
  /** List of human-readable i18n keys for the missing mandatory fields */
  missingFields: string[]
}

export interface EmployeeValidationResult {
  isValid: boolean
  errors: EmployeeValidationError[]
}

/** Fields that are always mandatory regardless of dismissal status */
const ALWAYS_REQUIRED_FIELDS: { key: keyof EmployeeInput; label: string }[] = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'to_be_dismissed', label: 'Termination' },
]

/** Fields that are only mandatory when `to_be_dismissed` is true */
const DISMISSAL_REQUIRED_FIELDS: { key: keyof EmployeeInput; label: string }[] = [
  { key: 'termination_date', label: 'Termination Date' },
  { key: 'garden_leave_from', label: 'Garden Leave From' },
  { key: 'severance_total', label: 'Severance Total' },
  { key: 'early_leave', label: 'Early Leave' },
  { key: 'early_leave_from', label: 'Early Leave From' },
  { key: 'remaining_salary_ratio', label: 'Remaining Salary Ratio' },
  { key: 'winding_up', label: 'Winding Up' },
]

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/**
 * For boolean fields parsed via `castToBool`, the raw spreadsheet cell value
 * is stored before casting. However, after `xlsxToEmployees` processes the data,
 * boolean fields will be `false` for both explicit "no" and missing values.
 * We use the `_raw` metadata attached by `xlsxToEmployees` to distinguish these cases.
 */
function isBooleanFieldMissing(
  employee: EmployeeInput,
  key: keyof EmployeeInput,
): boolean {
  const raw = (employee as unknown as Record<string, unknown>)[`_raw_${key}`]
  return raw === undefined || raw === null || raw === ''
}

const BOOLEAN_FIELDS: Set<keyof EmployeeInput> = new Set([
  'to_be_dismissed',
  'early_leave',
  'winding_up',
])

function isFieldMissing(employee: EmployeeInput, key: keyof EmployeeInput): boolean {
  return BOOLEAN_FIELDS.has(key)
    ? isBooleanFieldMissing(employee, key)
    : isEmpty(employee[key])
}

function getMissingFields(
  employee: EmployeeInput,
  fields: { key: keyof EmployeeInput; label: string }[],
): string[] {
  return fields
    .filter(({ key }) => isFieldMissing(employee, key))
    .map(({ label }) => label)
}

export function validateEmployees(employees: EmployeeInput[]): EmployeeValidationResult {
  const errors: EmployeeValidationError[] = []

  employees.forEach((employee, index) => {
    const rowNumber = index + 6

    const missingFields = [
      ...getMissingFields(employee, ALWAYS_REQUIRED_FIELDS),
      ...(employee.to_be_dismissed ? getMissingFields(employee, DISMISSAL_REQUIRED_FIELDS) : []),
    ]

    if (missingFields.length > 0) {
      const firstName = employee.first_name || ''
      const lastName = employee.last_name || ''
      const fullName = `${firstName} ${lastName}`.trim()

      errors.push({
        row: rowNumber,
        name: fullName || `Row ${rowNumber}`,
        missingFields,
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}
