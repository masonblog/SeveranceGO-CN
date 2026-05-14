import { describe, expect, it } from 'vitest';
import { calculateSeverance, getCompensationMonths, getWorkMonths } from './calculator';
import type { RegionData, SeveranceForm } from '../types';

const region: RegionData = {
  province: '测试省',
  city: '测试市',
  averageMonthlySalary: 10000,
  minimumMonthlyWage: 2000,
  dataYear: 'test',
  source: 'test',
};

const baseForm: SeveranceForm = {
  startDate: '2020-01-01',
  endDate: '2023-01-01',
  hasWrittenContract: true,
  contractSignedDate: '2020-01-01',
  previousYearIncome: 120000,
  province: '测试省',
  city: '测试市',
  averageMonthlySalaryOverride: '',
  minimumMonthlyWageOverride: '',
  terminationReason: 'mutual',
  forcedReason: '',
  hasMajorMisconduct: false,
  hasPayCutOrTransfer: false,
  isMassLayoff: false,
  article40NoNotice: false,
  needsConsultation: false,
  phone: '',
  wechat: '',
  consultationNote: '',
};

describe('calculator', () => {
  it('calculates work months and compensation months', () => {
    expect(getWorkMonths('2020-01-01', '2023-01-01')).toBe(37);
    expect(getCompensationMonths(37)).toBe(3.5);
    expect(getCompensationMonths(41)).toBe(3.5);
    expect(getCompensationMonths(42)).toBe(4);
  });

  it('calculates N for mutual termination', () => {
    const result = calculateSeverance(baseForm, region);
    expect(result.lines[0].label).toContain('N');
    expect(result.lines[0].amount).toBe(35000);
  });

  it('calculates 2N for illegal termination', () => {
    const result = calculateSeverance({ ...baseForm, terminationReason: 'illegal' }, region);
    expect(result.lines[0].amount).toBe(70000);
  });

  it('calculates N plus one month in article 40 no-notice scenario', () => {
    const result = calculateSeverance({ ...baseForm, terminationReason: 'article40', article40NoNotice: true }, region);
    expect(result.lines.map((line) => line.amount)).toEqual([35000, 10000]);
  });

  it('does not grant compensation for ordinary voluntary resignation', () => {
    const result = calculateSeverance({ ...baseForm, terminationReason: 'voluntary' }, region);
    expect(result.lines[0].amount).toBe(0);
  });

  it('uses minimum wage floor', () => {
    const result = calculateSeverance({ ...baseForm, previousYearIncome: 12000 }, region);
    expect(result.adjustedMonthlySalary).toBe(2000);
  });

  it('uses three-times-average salary cap', () => {
    const result = calculateSeverance({ ...baseForm, previousYearIncome: 600000 }, region);
    expect(result.adjustedMonthlySalary).toBe(30000);
  });

  it('calculates uncontracted double wage difference', () => {
    const result = calculateSeverance(
      {
        ...baseForm,
        startDate: '2022-01-01',
        endDate: '2022-04-01',
        hasWrittenContract: false,
        terminationReason: 'voluntary',
      },
      region,
    );
    const doubleWageLine = result.lines.find((line) => line.label.includes('未签'));
    expect(doubleWageLine?.amount).toBeGreaterThan(0);
    expect(doubleWageLine?.amount).toBeLessThanOrEqual(30000);
  });

  it('caps uncontracted months near eleven months', () => {
    const result = calculateSeverance(
      {
        ...baseForm,
        startDate: '2021-01-01',
        endDate: '2023-01-01',
        hasWrittenContract: false,
        terminationReason: 'voluntary',
      },
      region,
    );
    const doubleWageLine = result.lines.find((line) => line.label.includes('未签'));
    expect(doubleWageLine?.amount).toBeLessThanOrEqual(110000);
  });
});
