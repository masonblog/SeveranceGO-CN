import { describe, expect, it } from 'vitest';
import { validateForm } from './validation';
import type { SeveranceForm } from '../types';

const validForm: SeveranceForm = {
  startDate: '2020-01-01',
  endDate: '2023-01-01',
  hasWrittenContract: true,
  contractSignedDate: '2020-01-01',
  previousYearIncome: 120000,
  province: '北京',
  city: '北京',
  averageMonthlySalaryOverride: '',
  minimumMonthlyWageOverride: '',
  terminationReason: 'mutual',
  forcedReason: '',
  hasMajorMisconduct: false,
  hasPayCutOrTransfer: false,
  isMassLayoff: false,
  article40NoNotice: false,
};

describe('validateForm', () => {
  it('allows calculation without contact information', () => {
    expect(validateForm(validForm)).toEqual({});
  });

  it('blocks calculation when core required fields are missing', () => {
    const errors = validateForm({
      ...validForm,
      startDate: '',
      endDate: '',
      previousYearIncome: 0,
    });

    expect(errors.startDate).toBeTruthy();
    expect(errors.endDate).toBeTruthy();
    expect(errors.previousYearIncome).toBeTruthy();
  });
});
