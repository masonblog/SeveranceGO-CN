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

export interface RegionData {
  province: string;
  city: string;
  averageMonthlySalary: number;
  minimumMonthlyWage: number;
  dataYear: string;
  source: string;
  note?: string;
}

export interface SeveranceForm {
  employeeName: string;
  employerName: string;
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
  needsConsultation: boolean;
  phone: string;
  wechat: string;
  consultationNote: string;
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
