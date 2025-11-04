export type SpecialProtection =
  | 'no'
  | 'yes-maternity-pregnant-protection'
  | 'yes-parental-leave'
  | 'yes-care-time'
  | 'yes-disability'
  | 'yes-works-council-member'
  | 'yes-representative-for-disabled-persons'
  | 'yes-immission-officer'
  | 'yes-water-protection-officer'
  | 'yes-waste-officer'
  | 'yes-data-protection-officer'
  | 'yes-fixed-term-employee'
  | 'yes-agreed-permanency'
  | 'yes-but-implementation-date'
  | 'yes-elected-representative'
  | 'yes-agreement-related'

export interface EmployeeInput {
  first_name: string
  last_name: string
  address_street: string
  address_street_no: string
  address_street_post_code: string
  address_street_city: string
  email: string
  has_probatory_period_running: boolean
  reasons_for_special_protection: SpecialProtection
  total_annual_salary_gross: number
  fixed_monthly_salary_gross: number
  date_of_entry: Date
  seniority_in_years: number
  date_of_birth: Date
  age: number
  has_spouse: boolean
  number_of_children: number
  has_disability: boolean
  limitation_equal_to_disability: boolean
  disability_degree: number
  to_be_dismissed: boolean
  termination_status?: 'not-applicable' | 'not-sent' | 'sent' | 'delivered' | 'not-delivered'
  termination_period: number
  termination_date: Date
  bonus: number
  bonus_monthly: number
  bonus_payout: number
  surcharges_disability: number
  surcharges_children: number
  surcharges_other: number
  factor: number
  garden_leave_from: Date
  severance_base: number
  severance_total: number
  early_leave: boolean
  early_leave_from: Date
  remaining_salary_ratio: number
  vlp_eligible: boolean
  vlp_status?: 'not-eligible' | 'accepted' | 'declined' | 'pending'
  vlp_contract?: 'not-applicable' | 'not-sent' | 'sent' | 'signed' | 'original-received'
  winding_up: boolean
  winding_up_status?: 'not-applicable' | 'no' | 'not-sent' | 'sent' | 'signed' | 'original-received'
  comments?: string
  deuv_number: string
}

export type Employee = Required<EmployeeInput> & { id?: number }
