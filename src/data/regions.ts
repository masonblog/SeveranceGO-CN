import type { RegionData } from '../types';

const nbsSource = '国家统计局《2024年城镇单位就业人员年平均工资情况》';
const minWageSource = '人社部全国最低工资标准表（截至2024年10月1日）及各地人社/政府公告';

type Area = 'east' | 'central' | 'west' | 'northeast';

interface ProvinceConfig {
  province: string;
  area: Area;
  minimumMonthlyWage: number;
  cities: string[];
}

const areaAverageMonthlySalary: Record<Area, { amount: number; source: string }> = {
  east: {
    amount: 11976,
    source: `${nbsSource}：东部地区城镇非私营单位就业人员年平均工资143712元，折算月均11976元`,
  },
  central: {
    amount: 8174,
    source: `${nbsSource}：中部地区城镇非私营单位就业人员年平均工资98090元，折算月均8174元`,
  },
  west: {
    amount: 9198,
    source: `${nbsSource}：西部地区城镇非私营单位就业人员年平均工资110376元，折算月均9198元`,
  },
  northeast: {
    amount: 8241,
    source: `${nbsSource}：东北地区城镇非私营单位就业人员年平均工资98889元，折算月均8241元`,
  },
};

const cityOverrides: Record<string, Partial<RegionData>> = {
  '北京-北京': {
    averageMonthlySalary: 11937,
    source: '北京市人力资源和社会保障局：2024年全口径城镇单位就业人员月平均工资11937元',
  },
  '天津-天津': {
    averageMonthlySalary: 11870,
    source: '天津市统计局：2024年城镇非私营单位就业人员年平均工资142437元，折算月均11870元',
  },
  '四川-成都': {
    averageMonthlySalary: 9181,
    source: '四川省统计局：2024年城镇非私营单位就业人员年平均工资110177元，折算月均9181元',
  },
  '云南-昆明': {
    minimumMonthlyWage: 2070,
    source: '中国就业网转载云南人社调整通知：昆明主城区2024年10月起月最低工资2070元；平均工资暂用国家统计局西部地区2024区域口径',
  },
};

const note =
  '已补全各省级行政区下的地级行政区选项。公开渠道未统一发布城市级2024平均工资的城市，暂用国家统计局2024分区域官方工资口径作为封顶参考；最低工资按省级一档或已检索到的城市档位预置，正式上线前建议按具体区县复核。';

const provinceConfigs: ProvinceConfig[] = [
  { province: '北京', area: 'east', minimumMonthlyWage: 2420, cities: ['北京'] },
  { province: '天津', area: 'east', minimumMonthlyWage: 2320, cities: ['天津'] },
  { province: '上海', area: 'east', minimumMonthlyWage: 2690, cities: ['上海'] },
  { province: '重庆', area: 'west', minimumMonthlyWage: 2100, cities: ['重庆'] },
  {
    province: '河北',
    area: 'east',
    minimumMonthlyWage: 2200,
    cities: ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  },
  {
    province: '山西',
    area: 'central',
    minimumMonthlyWage: 1980,
    cities: ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  },
  {
    province: '内蒙古',
    area: 'west',
    minimumMonthlyWage: 2270,
    cities: ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布', '兴安盟', '锡林郭勒盟', '阿拉善盟'],
  },
  {
    province: '辽宁',
    area: 'northeast',
    minimumMonthlyWage: 2100,
    cities: ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  },
  {
    province: '吉林',
    area: 'northeast',
    minimumMonthlyWage: 1880,
    cities: ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边朝鲜族自治州'],
  },
  {
    province: '黑龙江',
    area: 'northeast',
    minimumMonthlyWage: 2080,
    cities: ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭地区'],
  },
  {
    province: '江苏',
    area: 'east',
    minimumMonthlyWage: 2490,
    cities: ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  },
  {
    province: '浙江',
    area: 'east',
    minimumMonthlyWage: 2490,
    cities: ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  },
  {
    province: '安徽',
    area: 'central',
    minimumMonthlyWage: 2060,
    cities: ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'],
  },
  {
    province: '福建',
    area: 'east',
    minimumMonthlyWage: 2030,
    cities: ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  },
  {
    province: '江西',
    area: 'central',
    minimumMonthlyWage: 1850,
    cities: ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  },
  {
    province: '山东',
    area: 'east',
    minimumMonthlyWage: 2200,
    cities: ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽'],
  },
  {
    province: '河南',
    area: 'central',
    minimumMonthlyWage: 2100,
    cities: ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '济源'],
  },
  {
    province: '湖北',
    area: 'central',
    minimumMonthlyWage: 2210,
    cities: ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施土家族苗族自治州', '仙桃', '潜江', '天门', '神农架林区'],
  },
  {
    province: '湖南',
    area: 'central',
    minimumMonthlyWage: 2100,
    cities: ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西土家族苗族自治州'],
  },
  {
    province: '广东',
    area: 'east',
    minimumMonthlyWage: 2300,
    cities: ['广州', '韶关', '深圳', '珠海', '汕头', '佛山', '江门', '湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  },
  {
    province: '广西',
    area: 'west',
    minimumMonthlyWage: 1990,
    cities: ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  },
  {
    province: '海南',
    area: 'east',
    minimumMonthlyWage: 2010,
    cities: ['海口', '三亚', '三沙', '儋州', '五指山', '琼海', '文昌', '万宁', '东方', '定安', '屯昌', '澄迈', '临高', '白沙黎族自治县', '昌江黎族自治县', '乐东黎族自治县', '陵水黎族自治县', '保亭黎族苗族自治县', '琼中黎族苗族自治县'],
  },
  {
    province: '四川',
    area: 'west',
    minimumMonthlyWage: 2100,
    cities: ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'],
  },
  {
    province: '贵州',
    area: 'west',
    minimumMonthlyWage: 1890,
    cities: ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'],
  },
  {
    province: '云南',
    area: 'west',
    minimumMonthlyWage: 1990,
    cities: ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'],
  },
  {
    province: '西藏',
    area: 'west',
    minimumMonthlyWage: 2100,
    cities: ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里地区'],
  },
  {
    province: '陕西',
    area: 'west',
    minimumMonthlyWage: 2160,
    cities: ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  },
  {
    province: '甘肃',
    area: 'west',
    minimumMonthlyWage: 2020,
    cities: ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏回族自治州', '甘南藏族自治州'],
  },
  {
    province: '青海',
    area: 'west',
    minimumMonthlyWage: 1880,
    cities: ['西宁', '海东', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'],
  },
  {
    province: '宁夏',
    area: 'west',
    minimumMonthlyWage: 2050,
    cities: ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  },
  {
    province: '新疆',
    area: 'west',
    minimumMonthlyWage: 1900,
    cities: ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区', '石河子', '阿拉尔', '图木舒克', '五家渠', '北屯', '铁门关', '双河', '可克达拉', '昆玉', '胡杨河', '新星', '白杨'],
  },
];

const buildRegion = (config: ProvinceConfig, city: string): RegionData => {
  const key = `${config.province}-${city}`;
  const areaAverage = areaAverageMonthlySalary[config.area];
  const override = cityOverrides[key] ?? {};
  const averageMonthlySalary = override.averageMonthlySalary ?? areaAverage.amount;
  const minimumMonthlyWage = override.minimumMonthlyWage ?? config.minimumMonthlyWage;
  const source = override.source
    ? `${override.source}；最低工资：${minWageSource}。`
    : `${areaAverage.source}；最低工资：${minWageSource}。`;

  return {
    province: config.province,
    city,
    averageMonthlySalary,
    minimumMonthlyWage,
    dataYear: '2024',
    source,
    note,
  };
};

export const regions: RegionData[] = provinceConfigs.flatMap((config) =>
  config.cities.map((city) => buildRegion(config, city)),
);

export const provinces = provinceConfigs.map((config) => config.province);

export const getCitiesByProvince = (province: string) =>
  provinceConfigs.find((item) => item.province === province)?.cities ?? [];

export const findRegion = (province: string, city: string) =>
  regions.find((item) => item.province === province && item.city === city) ??
  regions.find((item) => item.province === province) ??
  regions[0];
