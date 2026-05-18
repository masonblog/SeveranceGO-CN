import { findRegion, getCitiesByProvince, provinces } from '../../src/data/regions';
import { calculateSeverance } from '../../src/lib/calculator';
import { getTerminationMetadata, terminationGroups } from '../../src/lib/termination';
import { validateForm } from '../../src/lib/validation';
import type { CalculationResult, RegionData, SeveranceForm, TerminationReason } from '../../src/types';

const initialForm: SeveranceForm = {
  startDate: '',
  endDate: '',
  hasWrittenContract: true,
  contractSignedDate: '',
  previousYearIncome: 0,
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

const averageSalaryLevelLabels = {
  city_official: '城市官方',
  province_official: '省级官方',
  subprovince_region_official: '省内片区官方',
  national_region_reference: '全国区域参考',
};

const minimumWageLevelLabels = {
  city_or_county_mapped: '城市/区县映射',
  province_grade_reference: '省级档位参考',
};

const fallbackAverageText = {
  province_official: '省级',
  subprovince_region_official: '片区',
  national_region_reference: '国家区域',
};

const money = (amount: number) => `¥${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const numericValue = (value: string) => (value ? Number(value) : 0);
const optionalNumericValue = (value: string) => (value ? Number(value) : '');

const getProvinceIndex = (province: string) => Math.max(0, provinces.indexOf(province));
const getCityIndex = (cityOptions: string[], city: string) => Math.max(0, cityOptions.indexOf(city));

const buildRegionView = (region: RegionData) => ({
  title: `${region.province} · ${region.city}`,
  averageLabel: averageSalaryLevelLabels[region.averageSalaryLevel],
  averageText: `${region.dataYear} 年 ${region.averageSalaryBasis}：${money(region.averageMonthlySalary)} / 月`,
  averageSource: region.averageSalarySourceName,
  minimumLabel: minimumWageLevelLabels[region.minimumWageLevel],
  minimumText: `最低工资标准：${money(region.minimumMonthlyWage)} / 月，生效日 ${region.minimumWageEffectiveDate}`,
  minimumSource: region.minimumWageSourceName,
  caution:
    region.averageSalaryLevel === 'city_official'
      ? ''
      : `未检索到该城市 2024 城市级官方平均工资，当前按 ${fallbackAverageText[region.averageSalaryLevel]}官方口径预填。`,
  note: region.note ?? '',
});

const buildResultView = (result: CalculationResult) => ({
  totalRange: `${money(result.totalLow)} - ${money(result.totalHigh)}`,
  summary: `工作年限：${result.workYearsText}；补偿月数：${result.compensationMonths} 个月`,
  baseMonthlySalary: money(result.baseMonthlySalary),
  adjustedMonthlySalary: money(result.adjustedMonthlySalary),
  lines: result.lines.map((line) => ({ ...line, amountText: money(line.amount) })),
  rules: result.rules,
  warnings: result.warnings,
  checklist: result.checklist,
});

const buildTerminationGroups = (selected: TerminationReason, expandedTitle: string) =>
  terminationGroups.map((group) => {
    const selectedOption = group.options.find((option) => option.value === selected);

    return {
      ...group,
      isExpanded: expandedTitle === group.title,
      isActive: Boolean(selectedOption),
      selectedText: selectedOption ? `已选：${selectedOption.label}` : group.description,
      options: group.options.map((option) => ({
        ...option,
        isSelected: option.value === selected,
        showForcedFollowUp: selected === option.value && option.value === 'forced',
        showArticle40FollowUp: selected === option.value && option.value === 'article40',
      })),
    };
  });

Page({
  data: {
    form: initialForm,
    errors: {} as Record<string, string>,
    provinceOptions: provinces,
    cityOptions: getCitiesByProvince(initialForm.province),
    provinceIndex: getProvinceIndex(initialForm.province),
    cityIndex: 0,
    regionView: buildRegionView(findRegion(initialForm.province, initialForm.city)),
    terminationGroupsView: buildTerminationGroups(initialForm.terminationReason, getTerminationMetadata(initialForm.terminationReason).groupTitle),
    selectedReason: getTerminationMetadata(initialForm.terminationReason),
    resultView: null as ReturnType<typeof buildResultView> | null,
    resultMessage: '请填写必填项并点击“本地计算”。',
  },

  setField(key: keyof SeveranceForm, value: SeveranceForm[keyof SeveranceForm]) {
    const nextForm = { ...this.data.form, [key]: value };
    this.setData({
      form: nextForm,
      resultView: null,
      resultMessage: '信息已更新，请重新点击“本地计算”。',
    });
  },

  refreshRegion(province: string, city: string) {
    const cityOptions = getCitiesByProvince(province);
    const region = findRegion(province, city);
    this.setData({
      cityOptions,
      provinceIndex: getProvinceIndex(province),
      cityIndex: getCityIndex(cityOptions, city),
      regionView: buildRegionView(region),
      resultView: null,
      resultMessage: '地区已更新，请重新点击“本地计算”。',
    });
  },

  onTextInput(event: WechatMiniprogram.Input) {
    const key = event.currentTarget.dataset.key as keyof SeveranceForm;
    this.setField(key, event.detail.value as SeveranceForm[keyof SeveranceForm]);
  },

  onMoneyInput(event: WechatMiniprogram.Input) {
    const key = event.currentTarget.dataset.key as keyof SeveranceForm;
    this.setField(key, numericValue(event.detail.value) as SeveranceForm[keyof SeveranceForm]);
  },

  onOptionalMoneyInput(event: WechatMiniprogram.Input) {
    const key = event.currentTarget.dataset.key as keyof SeveranceForm;
    this.setField(key, optionalNumericValue(event.detail.value) as SeveranceForm[keyof SeveranceForm]);
  },

  onDateChange(event: WechatMiniprogram.PickerChange) {
    const key = event.currentTarget.dataset.key as keyof SeveranceForm;
    this.setField(key, event.detail.value as SeveranceForm[keyof SeveranceForm]);
  },

  onProvinceChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value);
    const province = provinces[index] ?? initialForm.province;
    const [city = ''] = getCitiesByProvince(province);
    const nextForm = { ...this.data.form, province, city };

    this.setData({ form: nextForm });
    this.refreshRegion(province, city);
  },

  onCityChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value);
    const city = this.data.cityOptions[index] ?? this.data.cityOptions[0] ?? '';
    const nextForm = { ...this.data.form, city };

    this.setData({ form: nextForm });
    this.refreshRegion(nextForm.province, city);
  },

  setWrittenContract(event: WechatMiniprogram.BaseEvent) {
    const hasWrittenContract = event.currentTarget.dataset.value === 'true';
    const nextForm = {
      ...this.data.form,
      hasWrittenContract,
      contractSignedDate: hasWrittenContract ? this.data.form.contractSignedDate : '',
    };

    this.setData({
      form: nextForm,
      resultView: null,
      resultMessage: '合同信息已更新，请重新点击“本地计算”。',
    });
  },

  toggleGroup(event: WechatMiniprogram.BaseEvent) {
    const title = event.currentTarget.dataset.title as string;
    const expandedTitle = this.data.terminationGroupsView.find((group) => group.isExpanded)?.title === title ? '' : title;

    this.setData({
      terminationGroupsView: buildTerminationGroups(this.data.form.terminationReason, expandedTitle),
    });
  },

  setTerminationReason(event: WechatMiniprogram.BaseEvent) {
    const terminationReason = event.currentTarget.dataset.value as TerminationReason;
    const metadata = getTerminationMetadata(terminationReason);
    const nextForm = {
      ...this.data.form,
      terminationReason,
      forcedReason: terminationReason === 'forced' ? this.data.form.forcedReason : '',
      article40NoNotice: terminationReason === 'article40' ? this.data.form.article40NoNotice : false,
      hasPayCutOrTransfer: terminationReason === 'forced' ? this.data.form.hasPayCutOrTransfer : false,
      hasMajorMisconduct: terminationReason === 'misconduct',
      isMassLayoff: terminationReason === 'layoff',
    };

    this.setData({
      form: nextForm,
      selectedReason: metadata,
      terminationGroupsView: buildTerminationGroups(terminationReason, metadata.groupTitle),
      resultView: null,
      resultMessage: '离职情况已更新，请重新点击“本地计算”。',
    });
  },

  onSwitchChange(event: WechatMiniprogram.SwitchChange) {
    const key = event.currentTarget.dataset.key as keyof SeveranceForm;
    this.setField(key, event.detail.value as SeveranceForm[keyof SeveranceForm]);
  },

  calculate() {
    const errors = validateForm(this.data.form);
    if (Object.keys(errors).length > 0) {
      this.setData({
        errors,
        resultView: null,
        resultMessage: '请先修正表单中的提示项。',
      });
      wx.showToast({ title: '请修正提示项', icon: 'none' });
      return;
    }

    const region = findRegion(this.data.form.province, this.data.form.city);
    const result = calculateSeverance(this.data.form, region);

    this.setData({
      errors: {},
      resultView: buildResultView(result),
      resultMessage: '',
    });
  },
});
