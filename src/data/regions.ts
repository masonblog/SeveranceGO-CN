import type { AverageSalaryLevel, MinimumWageLevel, RegionData } from '../types';

const nbsSource = '国家统计局《2024年城镇单位就业人员年平均工资情况》';
const minWageSource = '人社部全国最低工资标准表（截至2026年1月1日）及各地人社/政府公告';
const nbsSourceUrl = 'https://www.stats.gov.cn/sj/zxfb/202505/t20250516_1959826.html';
const mohrssMinWageSourceUrl =
  'https://zwfw.gansu.gov.cn/longnan/tsfw/qyrzyqzq/zczx/xw/art/2026/art_0c16fe86c8cd4e35a89da95a36ebb067.html';

type Area = 'east' | 'central' | 'west' | 'northeast';

interface ProvinceConfig {
  province: string;
  area: Area;
  minimumMonthlyWage: number;
  minimumWageEffectiveDate?: string;
  minimumWageSourceUrl?: string;
  minimumWageLevel?: MinimumWageLevel;
  cities: string[];
}

interface AverageSalaryPreset {
  amount: number;
  sourceName: string;
  sourceUrl: string;
  level: AverageSalaryLevel;
  basis: string;
  description: string;
}

interface MinimumWagePreset {
  amount: number;
  sourceName: string;
  sourceUrl: string;
  level: MinimumWageLevel;
  effectiveDate: string;
  description: string;
}

interface RegionOverride {
  average?: Partial<AverageSalaryPreset> & Pick<AverageSalaryPreset, 'amount' | 'sourceName' | 'sourceUrl' | 'level' | 'basis' | 'description'>;
  minimum?: Partial<MinimumWagePreset> & Pick<MinimumWagePreset, 'amount' | 'sourceName' | 'sourceUrl' | 'level' | 'effectiveDate' | 'description'>;
}

const yearlyToMonthly = (amount: number) => Math.round(amount / 12);

const areaAverageMonthlySalary: Record<Area, AverageSalaryPreset> = {
  east: {
    amount: 11976,
    sourceName: nbsSource,
    sourceUrl: nbsSourceUrl,
    level: 'national_region_reference',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '东部地区城镇非私营单位就业人员年平均工资143712元，折算月均11976元',
  },
  central: {
    amount: 8174,
    sourceName: nbsSource,
    sourceUrl: nbsSourceUrl,
    level: 'national_region_reference',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '中部地区城镇非私营单位就业人员年平均工资98090元，折算月均8174元',
  },
  west: {
    amount: 9198,
    sourceName: nbsSource,
    sourceUrl: nbsSourceUrl,
    level: 'national_region_reference',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '西部地区城镇非私营单位就业人员年平均工资110376元，折算月均9198元',
  },
  northeast: {
    amount: 8241,
    sourceName: nbsSource,
    sourceUrl: nbsSourceUrl,
    level: 'national_region_reference',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '东北地区城镇非私营单位就业人员年平均工资98889元，折算月均8241元',
  },
};

const provinceAverageOverrides: Record<string, AverageSalaryPreset> = {
  山西: {
    amount: yearlyToMonthly(97781),
    sourceName: '山西省统计局数据解读（吕梁市政府转载）',
    sourceUrl: 'https://www.lvliang.gov.cn/zfxxgk/ggsj/sjjd/202506/t20250620_1959745.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '山西省城镇非私营单位就业人员年平均工资97781元，折算月均8148元',
  },
  辽宁: {
    amount: yearlyToMonthly(99069),
    sourceName: '辽宁省人力资源和社会保障厅、辽宁省统计局统计公报摘要（转载）',
    sourceUrl: 'https://www.maigoo.com/news/736808.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '辽宁省城镇非私营单位就业人员年平均工资99069元，折算月均8256元；该来源为转载摘要，后续建议替换为官方原文链接',
  },
  江苏: {
    amount: yearlyToMonthly(129220),
    sourceName: '江苏省统计局《2024年江苏省城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://tj.jiangsu.gov.cn/art/2025/6/19/art_87595_11585848.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '江苏省城镇非私营单位就业人员年平均工资129220元，折算月均10768元',
  },
  浙江: {
    amount: yearlyToMonthly(137239),
    sourceName: '浙江省统计局《浙江省2024年度单位就业人员年平均工资统计公报》',
    sourceUrl: 'https://tjj.zj.gov.cn/art/2025/6/11/art_1229129205_5528012.html',
    level: 'province_official',
    basis: '非私营单位就业人员年平均工资',
    description: '浙江省非私营单位就业人员年平均工资137239元，折算月均11437元',
  },
  安徽: {
    amount: yearlyToMonthly(105416),
    sourceName: '安徽省统计局数据（广德市政府互动回应转载）',
    sourceUrl: 'https://www.guangde.gov.cn/Jczwgk/show/3564527.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '安徽省城镇非私营单位就业人员年平均工资105416元，折算月均8785元',
  },
  福建: {
    amount: yearlyToMonthly(112377),
    sourceName: '福建省统计局《2024年福建省城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://tjj.fujian.gov.cn/xxgk/tjxx/gzqk/202506/t20250612_6924342.htm',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '福建省城镇非私营单位就业人员年平均工资112377元，折算月均9365元',
  },
  山东: {
    amount: yearlyToMonthly(108131),
    sourceName: '山东省统计局《2024年城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://tjj.shandong.gov.cn/art/2025/7/3/art_6109_10318772.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '山东省城镇非私营单位就业人员年平均工资108131元，折算月均9011元',
  },
  河南: {
    amount: yearlyToMonthly(86199),
    sourceName: '河南省统计局《2024年河南省城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://tjj.henan.gov.cn/2025/06-25/3173720.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '河南省城镇非私营单位就业人员年平均工资86199元，折算月均7183元',
  },
  湖南: {
    amount: yearlyToMonthly(97170),
    sourceName: '湖南省统计局《2024年湖南省城镇非私营单位就业人员年平均工资97170元》',
    sourceUrl: 'https://tjj.hunan.gov.cn/hntj/tjfx/jmxx/2025sjjd/202507/t20250722_33746378.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '湖南省城镇非私营单位就业人员年平均工资97170元，折算月均8098元',
  },
  广西: {
    amount: yearlyToMonthly(96547),
    sourceName: '广西壮族自治区统计局《2024年广西城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://tjj.gxzf.gov.cn/qta/sjfbjjda/xwfba/t22621461.shtml',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '广西城镇非私营单位就业人员年平均工资96547元，折算月均8046元',
  },
  海南: {
    amount: yearlyToMonthly(117433),
    sourceName: '海南省统计局《海南省2024年城镇单位就业人员年平均工资情况》',
    sourceUrl: 'https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202507/t20250718_3899217.html',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '海南省城镇非私营单位就业人员年平均工资117433元，折算月均9786元',
  },
  四川: {
    amount: yearlyToMonthly(110177),
    sourceName: '四川省统计局《2024年四川省城镇单位就业人员平均工资数据解读》',
    sourceUrl: 'https://tjj.sc.gov.cn/scstjj/c112118/2025/6/20/f476caad9af8400491990c04f16a4959.shtml',
    level: 'province_official',
    basis: '城镇非私营单位就业人员年平均工资',
    description: '四川省城镇非私营单位就业人员年平均工资110177元，折算月均9181元',
  },
};

const subprovinceAverageOverrides: Record<string, AverageSalaryPreset> = {
  ...Object.fromEntries(
    ['广州', '深圳', '珠海', '佛山', '惠州', '东莞', '中山', '江门', '肇庆'].map((city) => [
      `广东-${city}`,
      {
        amount: yearlyToMonthly(141588),
        sourceName: '广东省统计局《2024年广东城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://stats.gd.gov.cn/tjkx185/content/post_4730845.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '珠三角城镇非私营单位就业人员年平均工资141588元，折算月均11799元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['汕头', '汕尾', '潮州', '揭阳'].map((city) => [
      `广东-${city}`,
      {
        amount: yearlyToMonthly(96854),
        sourceName: '广东省统计局《2024年广东城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://stats.gd.gov.cn/tjkx185/content/post_4730845.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '粤东城镇非私营单位就业人员年平均工资96854元，折算月均8071元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['阳江', '湛江', '茂名'].map((city) => [
      `广东-${city}`,
      {
        amount: yearlyToMonthly(105369),
        sourceName: '广东省统计局《2024年广东城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://stats.gd.gov.cn/tjkx185/content/post_4730845.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '粤西城镇非私营单位就业人员年平均工资105369元，折算月均8781元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['韶关', '河源', '梅州', '清远', '云浮'].map((city) => [
      `广东-${city}`,
      {
        amount: yearlyToMonthly(101732),
        sourceName: '广东省统计局《2024年广东城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://stats.gd.gov.cn/tjkx185/content/post_4730845.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '粤北城镇非私营单位就业人员年平均工资101732元，折算月均8478元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['呼伦贝尔', '兴安盟', '通辽', '赤峰', '锡林郭勒盟'].map((city) => [
      `内蒙古-${city}`,
      {
        amount: yearlyToMonthly(102500),
        sourceName: '内蒙古自治区人民政府《2024年内蒙古城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://www.nmg.gov.cn/tjsj/sjjdfx/202506/t20250624_2745213.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '内蒙古东部地区城镇非私营单位就业人员年平均工资102500元，折算月均8542元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['呼和浩特', '包头', '鄂尔多斯', '乌兰察布'].map((city) => [
      `内蒙古-${city}`,
      {
        amount: yearlyToMonthly(120107),
        sourceName: '内蒙古自治区人民政府《2024年内蒙古城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://www.nmg.gov.cn/tjsj/sjjdfx/202506/t20250624_2745213.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '内蒙古中部地区城镇非私营单位就业人员年平均工资120107元，折算月均10009元',
      },
    ]),
  ),
  ...Object.fromEntries(
    ['巴彦淖尔', '乌海', '阿拉善盟'].map((city) => [
      `内蒙古-${city}`,
      {
        amount: yearlyToMonthly(110058),
        sourceName: '内蒙古自治区人民政府《2024年内蒙古城镇单位就业人员年平均工资情况》',
        sourceUrl: 'https://www.nmg.gov.cn/tjsj/sjjdfx/202506/t20250624_2745213.html',
        level: 'subprovince_region_official',
        basis: '城镇非私营单位分区域就业人员年平均工资',
        description: '内蒙古西部地区城镇非私营单位就业人员年平均工资110058元，折算月均9172元',
      },
    ]),
  ),
};

const cityOverrides: Record<string, RegionOverride> = {
  '北京-北京': {
    average: {
      amount: 11937,
      sourceName: '北京市人力资源和社会保障局《历年北京市全口径城镇单位就业人员平均工资》',
      sourceUrl: 'https://rsj.beijing.gov.cn/bm/ywml/202007/t20200717_1950961.html',
      level: 'city_official',
      basis: '全口径城镇单位就业人员月平均工资',
      description: '2024年全口径城镇单位就业人员月平均工资11937元',
    },
    minimum: {
      amount: 2540,
      sourceName: minWageSource,
      sourceUrl: mohrssMinWageSourceUrl,
      level: 'city_or_county_mapped',
      effectiveDate: '2026-01-01',
      description: '人社部截至2026年1月1日最低工资标准表：北京月最低工资标准2540元',
    },
  },
  '天津-天津': {
    average: {
      amount: yearlyToMonthly(142437),
      sourceName: '天津市统计局《2024年天津市城镇单位就业人员年平均工资情况》',
      sourceUrl: 'https://stats.tj.gov.cn/sy_51953/jjxx/202506/t20250606_6948917.html',
      level: 'city_official',
      basis: '城镇非私营单位就业人员年平均工资',
      description: '城镇非私营单位就业人员年平均工资142437元，折算月均11870元',
    },
  },
  '上海-上海': {
    minimum: {
      amount: 2740,
      sourceName: '上海市人力资源和社会保障局《关于调整本市最低工资标准的通知》',
      sourceUrl: 'https://rsj.sh.gov.cn/cmsres/2c/2c52da60c7ed423c949a1a8524195c92/4221087aea40a7da06e928da75ab2369.pdf',
      level: 'city_or_county_mapped',
      effectiveDate: '2025-07-01',
      description: '上海市月最低工资标准自2025年7月1日起调整为2740元',
    },
  },
  '河北-石家庄': {
    average: {
      amount: yearlyToMonthly(105681),
      sourceName: '石家庄市统计局《2024年石家庄市城镇单位就业人员平均工资》',
      sourceUrl: 'https://www.sjz.gov.cn/columns/8c386b31-ef4d-4b27-8279-d8f526de8191/202506/27/5e28378c-00d2-4270-b732-7ffe759897f0.html',
      level: 'city_official',
      basis: '城镇非私营单位就业人员年平均工资',
      description: '石家庄市（不含辛集市）城镇非私营单位就业人员年平均工资105681元，折算月均8807元',
    },
  },
  '广东-深圳': {
    minimum: {
      amount: 2520,
      sourceName: minWageSource,
      sourceUrl: mohrssMinWageSourceUrl,
      level: 'city_or_county_mapped',
      effectiveDate: '2026-01-01',
      description: '人社部截至2026年1月1日最低工资标准表：深圳月最低工资标准2520元',
    },
  },
  '云南-昆明': {
    minimum: {
      amount: 2070,
      sourceName: '中国就业网转载云南人社调整通知',
      sourceUrl: 'https://chinajob.mohrss.gov.cn/c/2024-08-27/413892.shtml',
      level: 'city_or_county_mapped',
      effectiveDate: '2024-10-01',
      description: '昆明主城区2024年10月起月最低工资2070元',
    },
  },
};

const note =
  '已补全各省级行政区下的地级行政区选项。未检索到城市级2024官方平均工资的城市，会按省级、官方片区或国家区域参考口径预填；最低工资按当前已核验到的人社部全国表及地方公告预置，省内多档地区仍建议按具体区县复核。';

const provinceConfigs: ProvinceConfig[] = [
  { province: '北京', area: 'east', minimumMonthlyWage: 2540, minimumWageEffectiveDate: '2026-01-01', cities: ['北京'] },
  { province: '天津', area: 'east', minimumMonthlyWage: 2320, cities: ['天津'] },
  { province: '上海', area: 'east', minimumMonthlyWage: 2740, minimumWageEffectiveDate: '2025-07-01', cities: ['上海'] },
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
    minimumMonthlyWage: 2660,
    minimumWageEffectiveDate: '2026-01-01',
    cities: ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  },
  {
    province: '浙江',
    area: 'east',
    minimumMonthlyWage: 2660,
    minimumWageEffectiveDate: '2026-01-01',
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
    minimumMonthlyWage: 2500,
    minimumWageEffectiveDate: '2026-01-01',
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
  const average =
    cityOverrides[key]?.average ??
    subprovinceAverageOverrides[key] ??
    provinceAverageOverrides[config.province] ??
    areaAverageMonthlySalary[config.area];
  const minimum =
    cityOverrides[key]?.minimum ?? {
      amount: config.minimumMonthlyWage,
      sourceName: minWageSource,
      sourceUrl: config.minimumWageSourceUrl ?? mohrssMinWageSourceUrl,
      level: config.minimumWageLevel ?? 'province_grade_reference',
      effectiveDate: config.minimumWageEffectiveDate ?? '2026-01-01',
      description: `${config.province}月最低工资标准按当前已核验省级第一档或项目既有档位预置，省内多档地区需按具体区县复核`,
    };
  const source = `平均工资：${average.sourceName}：${average.description}。最低工资：${minimum.sourceName}：${minimum.description}。`;

  return {
    province: config.province,
    city,
    averageMonthlySalary: average.amount,
    minimumMonthlyWage: minimum.amount,
    dataYear: '2024',
    source,
    averageSalaryLevel: average.level,
    averageSalaryBasis: average.basis,
    averageSalarySourceUrl: average.sourceUrl,
    averageSalarySourceName: average.sourceName,
    minimumWageLevel: minimum.level,
    minimumWageEffectiveDate: minimum.effectiveDate,
    minimumWageSourceUrl: minimum.sourceUrl,
    minimumWageSourceName: minimum.sourceName,
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
