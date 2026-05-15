import { describe, expect, it } from 'vitest';
import { regions } from './regions';
import type { AverageSalaryLevel, MinimumWageLevel } from '../types';

const averageSalaryLevels = new Set<AverageSalaryLevel>([
  'city_official',
  'province_official',
  'subprovince_region_official',
  'national_region_reference',
]);

const minimumWageLevels = new Set<MinimumWageLevel>(['city_or_county_mapped', 'province_grade_reference']);

describe('regions data', () => {
  it('has complete source metadata for every region', () => {
    for (const region of regions) {
      expect(region.averageMonthlySalary).toBeGreaterThan(0);
      expect(region.minimumMonthlyWage).toBeGreaterThan(0);
      expect(averageSalaryLevels.has(region.averageSalaryLevel)).toBe(true);
      expect(minimumWageLevels.has(region.minimumWageLevel)).toBe(true);
      expect(region.averageSalaryBasis).not.toHaveLength(0);
      expect(region.averageSalarySourceName).not.toHaveLength(0);
      expect(region.averageSalarySourceUrl).toMatch(/^https:\/\//);
      expect(region.minimumWageSourceName).not.toHaveLength(0);
      expect(region.minimumWageSourceUrl).toMatch(/^https:\/\//);
      expect(region.minimumWageEffectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('marks confirmed city and subprovince examples with the expected data levels', () => {
    expect(regions.find((region) => region.province === '北京' && region.city === '北京')?.averageSalaryLevel).toBe(
      'city_official',
    );
    expect(regions.find((region) => region.province === '河北' && region.city === '石家庄')?.averageSalaryLevel).toBe(
      'city_official',
    );
    expect(regions.find((region) => region.province === '广东' && region.city === '广州')?.averageSalaryLevel).toBe(
      'subprovince_region_official',
    );
    expect(regions.find((region) => region.province === '四川' && region.city === '成都')?.averageSalaryLevel).toBe(
      'province_official',
    );
  });
});
