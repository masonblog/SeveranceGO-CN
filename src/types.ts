export type TerminationReason =
  | 'mutual'
  | 'article40'
  | 'layoff'
  | 'illegal'
  | 'voluntary'
  | 'forced'
  | 'misconduct'
  | 'contract_end'
  | 'other';

export type SalaryBasis = 'previous_calendar_year';

export type AverageSalaryLevel =
  | 'city_official'
  | 'province_official'
  | 'subprovince_region_official'
  | 'national_region_reference';

export type MinimumWageLevel = 'city_or_county_mapped' | 'province_grade_reference';

export interface RegionData {
  province: string;
  city: string;
  averageMonthlySalary: number;
  minimumMonthlyWage: number;
  dataYear: string;
  source: string;
  averageSalaryLevel: AverageSalaryLevel;
  averageSalaryBasis: string;
  averageSalarySourceUrl: string;
  averageSalarySourceName: string;
  minimumWageLevel: MinimumWageLevel;
  minimumWageEffectiveDate: string;
  minimumWageSourceUrl: string;
  minimumWageSourceName: string;
  note?: string;
}

export interface SeveranceForm {
  startDate: string;
  endDate: string;
  hasWrittenContract: boolean;
  contractSignedDate: string;
  previousYearIncome: number;
  province: string;
  city: string;
  averageMonthlySalaryOverride: number | '';
  minimumMonthlyWageOverride: number | '';
  terminationReason: TerminationReason;
  forcedReason: string;
  hasMajorMisconduct: boolean;
  hasPayCutOrTransfer: boolean;
  isMassLayoff: boolean;
  article40NoNotice: boolean;
}

export interface CalculationLine {
  label: string;
  amount: number;
  note: string;
}

export interface CalculationResult {
  totalLow: number;
  totalHigh: number;
  baseMonthlySalary: number;
  adjustedMonthlySalary: number;
  compensationMonths: number;
  workMonths: number;
  workYearsText: string;
  lines: CalculationLine[];
  rules: string[];
  warnings: string[];
  checklist: string[];
  legalBasisVersion: string;
}
