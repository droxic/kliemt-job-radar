import type { EmployeeInput, SpecialProtection } from '@/stores/employee.dto'
import { read } from 'xlsx'

export function xlsxToEmployees(fileData: ArrayBuffer) {
  const workbook = read(fileData, { cellDates: true })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const cellValue = (col: string, row: number) => worksheet[`${col}${row}`]?.v
  const castToBool = (value: string) => value == 'yes'
  const castToReasonForSpecialProtection = (value: string) => {
    const options: { [key in SpecialProtection]: (string | undefined)[] } = {
      no: ['no', 'Nein', undefined],
      'yes-maternity-pregnant-protection': [
        'yes, Maternity protection or pregnant',
        'ja, Mutterschutz oder Schwangerschaft',
      ],
      'yes-parental-leave': ['yes, Parental leave', 'ja, Elternzeit'],
      'yes-care-time': ['yes, Care time', 'ja, Pflegezeit'],
      'yes-disability': [
        'yes, disability/equal to disability',
        'ja, Schwerbehinderung oder Gleichstellung',
      ],
      'yes-works-council-member': [
        'yes, works council member/ Youth and trainee representation',
        'ja, Betriebsratsmitglied oder Jugend- und Auszubildendenvertretung',
      ],
      'yes-representative-for-disabled-persons': [
        'yes, Representative for disabled persons',
        'ja, Schwerbehindertenvertretung',
      ],
      'yes-immission-officer': [
        'yes, Immission control officer/incident commander',
        'ja, Immissionsschutzbeauftragter/Störfallbeauftragter',
      ],
      'yes-water-protection-officer': [
        'yes, Water Protection Officer',
        'ja, Wasserschutzbeauftragter',
      ],
      'yes-waste-officer': ['yes, Waste Management Officer', 'ja, Betriebsbeauftragter für Abfall'],
      'yes-data-protection-officer': [
        'yes, Data Protection Officer',
        'ja, Datenschutzbeauftragter',
      ],
      'yes-fixed-term-employee': ['yes, fixed term employee', 'ja, befristet Beschäftigter'],
      'yes-agreed-permanency': [
        'yes, agreed ordinary permanency',
        'ja, Ausschluss ordentlicher Kündigung vereinbart',
      ],
      'yes-but-implementation-date': [
        'yes, but possible until the implementation date',
        'ja, aber möglich bis zum Umsetzungszeitpunkt',
      ],
      'yes-elected-representative': [
        'yes, elected representative (not works council member)',
        'ja, Mandatsträger (nicht Betriebsratsmitlglied)',
      ],
      'yes-agreement-related': [
        'yes, collective agreement-related protection',
        'ja, Tarifvertragsbedingt',
      ],
    }

    let reason: SpecialProtection
    for (reason in options) {
      if (options[reason].includes(value)) {
        return reason
      }
    }

    return 'no'
  }
  const hasAnyData = (row: number) =>
    cellValue('A', row) || cellValue('B', row) || cellValue('G', row) || cellValue('AL', row)

  const employees: EmployeeInput[] = []
  let row = 6
  while (hasAnyData(row)) {
    const employee: EmployeeInput = {
      // kts
      first_name: cellValue('A', row),
      // kts
      last_name: cellValue('B', row),
      address_street: cellValue('C', row),
      address_street_no: cellValue('D', row),
      address_street_post_code: cellValue('E', row),
      address_street_city: cellValue('F', row),
      email: cellValue('G', row),

      // contractRole: cellValue('H', row),
      // hrAdministrationRole: cellValue('I', row),
      // actualRole: cellValue('J', row),
      // comparableToRole: cellValue('K', row),
      // comparisonGroup: cellValue('L', row),
      // levelOfHierarchy: cellValue('M', row),
      // operatingSite: cellValue('N', row),
      // fte: cellValue('O', row),
      // relocationOptionAvailable: cellValue('P', row),
      // relocationFormulation: cellValue('Q', row),
      // professionalQualificationForJobTitles: cellValue('T', row),
      // hasActiveRegularEmployment: castToBool(cellValue('X', row)),
      // isEmployeeLeasing: castToBool(cellValue('Y', row)),
      // taxClass: cellValue('AE', row),
      // childAllowance: cellValue('AG', row),
      // degreeOfReducedEmployability: cellValue('AK', row),
      // toBeDismissedComments: cellValue('AM', row),
      // isKeyPlayer: castToBool(cellValue('AN', row)),
      // keyPlayerComments: cellValue('AO', row),
      // hasExistingSchemesForSocialSelection: castToBool(cellValue('AP', row)),
      // hasExistingSocialPlans: castToBool(cellValue('AQ', row)),
      // hasExistingReconciliationsOfInterests: castToBool(cellValue('AR', row)),
      // hasRelevantCollectiveBargainingAgreements: castToBool(cellValue('AR', row)),


      // kts,
      has_probatory_period_running: castToBool(cellValue('R', row)),
      // kts,
      reasons_for_special_protection: castToReasonForSpecialProtection(cellValue('S', row)),
      //kts
      total_annual_salary_gross: cellValue('U', row),
      //kts
      fixed_monthly_salary_gross: cellValue('V', row),
      //kts
      date_of_entry: cellValue('Z', row),
      //kts
      seniority_in_years: cellValue('AA', row),
      //kts
      date_of_birth: cellValue('AB', row),
      //kts
      age: cellValue('AC', row),
      //kts
      has_spouse: castToBool(cellValue('AD', row)),
      //kts
      number_of_children: cellValue('AF', row),
      //kts
      has_disability: castToBool(cellValue('AH', row)),
      //kts
      limitation_equal_to_disability: castToBool(cellValue('AI', row)),
      //kts
      disability_degree: cellValue('AJ', row),
      //kts
      to_be_dismissed: castToBool(cellValue('AL', row)),
      //kts
      termination_period: cellValue('AT', row),
      termination_date: cellValue('AU', row),
      bonus: cellValue('AV', row),
      bonus_monthly: cellValue('AW', row),
      bonus_payout: cellValue('AX', row),
      surcharges_disability: cellValue('AY', row),
      surcharges_children: cellValue('AZ', row),
      surcharges_other: cellValue('BA', row),
      factor: cellValue('BB', row),
      garden_leave_from: cellValue('BC', row),
      severance_base: cellValue('BD', row),
      severance_total: cellValue('BE', row),
      early_leave: castToBool(cellValue('BF', row)),
      early_leave_from: cellValue('BG', row),
      remaining_salary_ratio: cellValue('BH', row),
      vlp_eligible: castToBool(cellValue('BI', row)),
      winding_up: castToBool(cellValue('BJ', row)),
      deuv_number: cellValue('W', row),
    }
    // Attach raw cell values for boolean mandatory fields so validation can
    // distinguish "explicitly set to no" from "cell is empty / missing"
    const raw = employee as unknown as Record<string, unknown>;
    raw._raw_to_be_dismissed = cellValue('AL', row);
    raw._raw_early_leave = cellValue('BF', row);
    raw._raw_winding_up = cellValue('BJ', row);
    employees.push(employee)
    row += 1
  }
  return employees
}
