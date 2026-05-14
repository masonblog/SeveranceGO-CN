import type { TerminationReason } from '../types';

export const terminationGroups: Array<{
  title: string;
  description: string;
  options: Array<{ value: TerminationReason; label: string; hint: string }>;
}> = [
  {
    title: '公司提出结束劳动关系',
    description: '收到通知、被约谈协商、岗位被撤或公司单方作出决定。',
    options: [
      { value: 'mutual', label: '公司提出协商离职', hint: '双方谈好离职日期和补偿方案。' },
      { value: 'article40', label: '公司说我不适合/客观情况变化', hint: '例如医疗期满、不胜任、岗位或经营条件明显变化。' },
      { value: 'layoff', label: '公司经济性裁员', hint: '公司经营困难、部门撤并或多人同批被裁。' },
      { value: 'illegal', label: '公司直接辞退且理由不清', hint: '没有明确法定理由、程序异常，或你认为解除依据站不住。' },
      { value: 'misconduct', label: '公司以严重违纪辞退', hint: '公司称违反规章制度、旷工、舞弊或造成损失。' },
    ],
  },
  {
    title: '我主动提出离开',
    description: '你提交辞职，或因公司拖欠、降薪、未缴社保等问题被迫离开。',
    options: [
      { value: 'voluntary', label: '普通主动辞职', hint: '个人原因离开，公司没有明显违法情形。' },
      { value: 'forced', label: '因公司问题被迫离职', hint: '例如欠薪、未缴社保、违法调岗降薪、未提供劳动条件。' },
    ],
  },
  {
    title: '合同到期或我还拿不准',
    description: '不是典型辞退或辞职，先按最接近的情况填写。',
    options: [
      { value: 'contract_end', label: '合同到期不续签', hint: '单位不续签，或降低条件续签但你不同意。' },
      { value: 'other', label: '其他/不确定', hint: '情况复杂、说法不一致，先提交线索再判断。' },
    ],
  },
];

export const getTerminationMetadata = (value: TerminationReason) => {
  for (const group of terminationGroups) {
    const option = group.options.find((item) => item.value === value);
    if (option) return { groupTitle: group.title, ...option };
  }

  return { groupTitle: terminationGroups[0].title, ...terminationGroups[0].options[0] };
};
