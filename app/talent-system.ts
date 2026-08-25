export type ActorTier = "SS" | "S" | "A" | "B";

export type AgencyProfile = {
  age: number;
  tier: ActorTier;
  career: "上升" | "巅峰" | "稳定" | "转型" | "蓄势";
  availability: "档期充裕" | "需协调" | "档期紧张";
  risk: number;
  archetype: string;
};

export type AgencyActor = {
  id: number;
  name: string;
  avatar: string;
  gender: "男" | "女";
  acting: number;
  appeal: number;
  fee: number;
  genres: string[];
  tag: string;
  profile?: AgencyProfile;
  potential?: number;
  careerStartYear?: number;
};

export type TalentContract = {
  actorId: number;
  origin: "mature" | "rookie";
  signedYear: number;
  contractEndYear: number;
  signingFee: number;
  annualSalary: number;
  internalRate: number;
  agencyShare: number;
  loyalty: number;
  potential: number;
  growth: number;
  personality: string;
  lastTrainedYear: number;
  salaryPaidThrough: number;
  genreProgress: Record<string, number>;
  filmCredits?: number;
  careerBoxOffice?: number;
};

export type AgencyLedger = {
  year: number;
  externalIncome: number;
  salaryCost: number;
  expiredNames: string[];
  operatingCost?: number;
  retiredNames?: string[];
  withdrawnNames?: string[];
  talentNews?: TalentNews[];
  breakoutNotes?: string[];
  tierChanges?: string[];
};

export type TalentNews = {
  actorId: number;
  actorName: string;
  tone: "negative" | "positive" | "neutral";
  title: string;
  appealDelta: number;
};

export type ContractQuote = {
  signingFee: number;
  annualSalary: number;
  internalRate: number;
  agencyShare: number;
  requiredReputation: number;
};

export type RookieRarity = "ordinary" | "gold" | "red";

export type RookieCandidate = AgencyActor & {
  profile: AgencyProfile;
  potential: number;
  growth: number;
  personality: string;
  rarity: RookieRarity;
};

export const rookieCandidates: RookieCandidate[] = [
  { id: 101, name: "林知夏", avatar: "林", gender: "女", acting: 68, appeal: 36, fee: 110, genres: ["都市爱情"], tag: "电影学院应届生", potential: 98, growth: 3, personality: "镜头感强", rarity: "red", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "清醒少女" } },
  { id: 102, name: "陈逐野", avatar: "陈", gender: "男", acting: 65, appeal: 42, fee: 120, genres: ["动作战争"], tag: "武术专业新人", potential: 96, growth: 3, personality: "训练刻苦", rarity: "red", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "热血青年" } },
  { id: 103, name: "苏未眠", avatar: "苏", gender: "女", acting: 72, appeal: 31, fee: 130, genres: ["历史传记"], tag: "舞台剧新人", potential: 99, growth: 2, personality: "表演专注", rarity: "red", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 3, archetype: "古典人物" } },
  { id: 104, name: "周砚声", avatar: "周", gender: "男", acting: 70, appeal: 35, fee: 125, genres: ["犯罪悬疑"], tag: "短片节新面孔", potential: 97, growth: 2, personality: "角色钻研", rarity: "red", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "冷面青年" } },
  { id: 105, name: "乔星澜", avatar: "乔", gender: "女", acting: 62, appeal: 48, fee: 105, genres: ["科幻冒险"], tag: "广告片潜力新人", potential: 94, growth: 3, personality: "观众缘佳", rarity: "gold", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 8, archetype: "未来少女" } },
  { id: 106, name: "陆青川", avatar: "陆", gender: "男", acting: 67, appeal: 39, fee: 115, genres: ["合家欢喜剧"], tag: "喜剧社团主力", potential: 95, growth: 3, personality: "反应敏捷", rarity: "gold", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 7, archetype: "邻家男孩" } },
  { id: 107, name: "叶南枝", avatar: "叶", gender: "女", acting: 69, appeal: 40, fee: 120, genres: ["犯罪悬疑"], tag: "独立电影新人", potential: 92, growth: 2, personality: "气质独特", rarity: "gold", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "神秘女性" } },
  { id: 108, name: "高远舟", avatar: "高", gender: "男", acting: 64, appeal: 45, fee: 100, genres: ["都市爱情"], tag: "校园剧新人", potential: 90, growth: 3, personality: "亲和自然", rarity: "gold", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "青春男主" } },
  { id: 109, name: "沈星遥", avatar: "沈", gender: "女", acting: 55, appeal: 39, fee: 72, genres: ["都市爱情"], tag: "短剧镜头新人", potential: 78, growth: 2, personality: "情绪灵动", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "元气女孩" } },
  { id: 110, name: "江屿白", avatar: "江", gender: "男", acting: 58, appeal: 43, fee: 78, genres: ["犯罪悬疑"], tag: "校园话剧主力", potential: 84, growth: 2, personality: "台词扎实", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "沉静青年" } },
  { id: 111, name: "许栀宁", avatar: "许", gender: "女", acting: 49, appeal: 42, fee: 65, genres: ["合家欢喜剧"], tag: "综艺实习新人", potential: 72, growth: 2, personality: "反应自然", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 7, archetype: "邻家女孩" } },
  { id: 112, name: "顾临川", avatar: "顾", gender: "男", acting: 64, appeal: 45, fee: 92, genres: ["历史传记"], tag: "传统戏曲跨界", potential: 88, growth: 3, personality: "身段出色", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "少年将军" } },
  { id: 113, name: "温以棠", avatar: "温", gender: "女", acting: 59, appeal: 44, fee: 80, genres: ["历史传记"], tag: "古装短片新人", potential: 81, growth: 2, personality: "仪态沉稳", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 3, archetype: "温婉才女" } },
  { id: 114, name: "程野", avatar: "程", gender: "男", acting: 51, appeal: 48, fee: 70, genres: ["动作战争"], tag: "体校表演新人", potential: 75, growth: 3, personality: "执行力强", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 8, archetype: "阳光少年" } },
  { id: 115, name: "夏听澜", avatar: "夏", gender: "女", acting: 63, appeal: 46, fee: 90, genres: ["犯罪悬疑"], tag: "独立短片女主", potential: 86, growth: 2, personality: "眼神有戏", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "冷感少女" } },
  { id: 116, name: "裴知远", avatar: "裴", gender: "男", acting: 56, appeal: 41, fee: 75, genres: ["科幻冒险"], tag: "特效短片演员", potential: 79, growth: 2, personality: "想象力好", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "技术青年" } },
  { id: 117, name: "唐予安", avatar: "唐", gender: "女", acting: 52, appeal: 40, fee: 66, genres: ["都市爱情"], tag: "平面模特转型", potential: 73, growth: 2, personality: "镜头松弛", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 9, archetype: "清甜初恋" } },
  { id: 118, name: "宋行舟", avatar: "宋", gender: "男", acting: 65, appeal: 47, fee: 96, genres: ["犯罪悬疑"], tag: "青年戏剧节新秀", potential: 89, growth: 3, personality: "爆发力强", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "叛逆青年" } },
  { id: 119, name: "黎清和", avatar: "黎", gender: "女", acting: 60, appeal: 43, fee: 82, genres: ["合家欢喜剧"], tag: "喜剧社团新人", potential: 83, growth: 3, personality: "节奏准确", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "机灵女孩" } },
  { id: 120, name: "贺闻川", avatar: "贺", gender: "男", acting: 54, appeal: 44, fee: 73, genres: ["动作战争"], tag: "武行替身转型", potential: 77, growth: 2, personality: "动作利落", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 7, archetype: "硬朗青年" } },
  { id: 121, name: "白露遥", avatar: "白", gender: "女", acting: 48, appeal: 41, fee: 62, genres: ["都市爱情"], tag: "音乐剧学员", potential: 71, growth: 2, personality: "声音清亮", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "文艺少女" } },
  { id: 122, name: "秦越", avatar: "秦", gender: "男", acting: 62, appeal: 45, fee: 88, genres: ["动作战争"], tag: "武术冠军跨界", potential: 85, growth: 3, personality: "身体控制强", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 8, archetype: "孤胆青年" } },
  { id: 123, name: "姜见月", avatar: "姜", gender: "女", acting: 58, appeal: 42, fee: 77, genres: ["历史传记"], tag: "汉服短片新人", potential: 80, growth: 2, personality: "古典气质", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "闺秀才女" } },
  { id: 124, name: "沈照", avatar: "沈", gender: "男", acting: 50, appeal: 46, fee: 68, genres: ["科幻冒险"], tag: "广告片少年", potential: 74, growth: 2, personality: "可塑性强", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 7, archetype: "未来少年" } },
  { id: 125, name: "云舒", avatar: "云", gender: "女", acting: 64, appeal: 44, fee: 93, genres: ["犯罪悬疑"], tag: "悬疑短片新面孔", potential: 87, growth: 3, personality: "表演克制", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 3, archetype: "理性女性" } },
  { id: 126, name: "谢青野", avatar: "谢", gender: "男", acting: 53, appeal: 45, fee: 71, genres: ["合家欢喜剧"], tag: "脱口秀社团新人", potential: 76, growth: 3, personality: "临场机敏", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 9, archetype: "搞怪青年" } },
  { id: 127, name: "阮星眠", avatar: "阮", gender: "女", acting: 59, appeal: 45, fee: 81, genres: ["科幻冒险"], tag: "舞蹈学院新人", potential: 82, growth: 2, personality: "肢体轻盈", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "异星少女" } },
  { id: 128, name: "陆时屿", avatar: "陆", gender: "男", acting: 49, appeal: 43, fee: 64, genres: ["都市爱情"], tag: "校园短片男主", potential: 70, growth: 2, personality: "亲和自然", rarity: "ordinary", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "邻家少年" } },
  { id: 129, name: "林晚晴", avatar: "林", gender: "女", acting: 65, appeal: 46, fee: 95, genres: ["合家欢喜剧"], tag: "儿童剧演员", potential: 88, growth: 3, personality: "感染力强", rarity: "ordinary", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "温暖姐姐" } },
  { id: 130, name: "周既明", avatar: "周", gender: "男", acting: 56, appeal: 44, fee: 76, genres: ["历史传记"], tag: "朗诵比赛新秀", potential: 79, growth: 2, personality: "台词清晰", rarity: "ordinary", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "书生青年" } },
];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

function pickRookie(pool: RookieCandidate[], seed: string, usedIds: Set<number>) {
  const available = pool.filter((candidate) => !usedIds.has(candidate.id));
  if (!available.length) return null;
  return available[hash(seed) % available.length];
}

export function buildRookieMarket(year: number, signedIds: ReadonlySet<number> = new Set(), refreshed = false) {
  const available = rookieCandidates.filter((candidate) => !signedIds.has(candidate.id));
  const byRarity = (rarity: RookieRarity) => available.filter((candidate) => candidate.rarity === rarity);
  const usedIds = new Set<number>();
  const market: RookieCandidate[] = [];
  const addCandidate = (rarity: RookieRarity, seed: string) => {
    const preferred = pickRookie(byRarity(rarity), seed, usedIds);
    const fallback = preferred ?? pickRookie(available, `${seed}:fallback`, usedIds);
    if (fallback) {
      usedIds.add(fallback.id);
      market.push(fallback);
    }
  };

  if (refreshed) {
    const rareRarity: RookieRarity = hash(`${year}:rookie-refresh-rarity`) % 4 === 0 ? "red" : "gold";
    const alternateRarity: RookieRarity = rareRarity === "gold" ? "red" : "gold";
    const rareCandidate = pickRookie(byRarity(rareRarity), `${year}:rookie-refresh-rare`, usedIds)
      ?? pickRookie(byRarity(alternateRarity), `${year}:rookie-refresh-rare-fallback`, usedIds);
    if (rareCandidate) {
      usedIds.add(rareCandidate.id);
      market.push(rareCandidate);
    }
    for (let slot = 1; slot < 4; slot += 1) addCandidate("ordinary", `${year}:rookie-refresh:${slot}`);
    return market;
  }

  const naturalRoll = hash(`${year}:rookie-market-rarity`) % 100;
  const naturalRare: RookieRarity | null = naturalRoll < 90 ? null : naturalRoll < 98 ? "gold" : "red";
  if (naturalRare) addCandidate(naturalRare, `${year}:rookie-market-rare:${naturalRare}`);
  for (let slot = market.length; slot < 4; slot += 1) addCandidate("ordinary", `${year}:rookie-market:${slot}:ordinary`);
  return market;
}

export function actorTier(acting: number, appeal: number): ActorTier {
  const total = acting + appeal;
  return total >= 195 ? "SS" : total >= 182 ? "S" : total >= 175 ? "A" : "B";
}

export function isMatureMarketEligible(actor: Pick<AgencyActor, "acting" | "appeal">) {
  return actor.acting + actor.appeal >= 150;
}

export function tierRank(tier: ActorTier) {
  return tier === "SS" ? 4 : tier === "S" ? 3 : tier === "A" ? 2 : 1;
}

export function tierScriptThreshold(tier: ActorTier) {
  return tier === "SS" ? 88 : tier === "S" ? 84 : tier === "A" ? 74 : 64;
}

export function tierOpeningBonus(tier: ActorTier) {
  return tier === "SS" ? 6 : tier === "S" ? 4 : tier === "A" ? 1 : 0;
}

export function talentMarketRoll(actorId: number, year: number) {
  return hash(`${actorId}:${year}:market`) % 100;
}

export function retirementAge(actorId: number) {
  return 66 + hash(`${actorId}:retirement`) % 5;
}

export function ageAppealDecline(age: number) {
  return age >= 63 ? -3 : age >= 58 ? -2 : age >= 52 ? -1 : 0;
}

export function currentActorAge(baseAge: number, currentYear: number, careerStartYear = 1) {
  return baseAge + Math.max(0, currentYear - careerStartYear);
}

export function uniqueGenres(genres: string[]) {
  return [...new Set(genres)];
}

export function rookiePerformanceFee(currentFee: number, tier: ActorTier, filmCredits: number, performanceRatio: number) {
  if (performanceRatio < .7) return Math.max(80, Math.round(currentFee * .9));
  if (performanceRatio < 1) return Math.max(80, Math.round(currentFee * 1.02));
  const tierBenchmark = tier === "SS" ? 1550 : tier === "S" ? 1100 : tier === "A" ? 720 : 260;
  const hitMultiplier = performanceRatio >= 3 ? 1.25 : performanceRatio >= 1.8 ? 1.12 : 1;
  const experienceWeight = Math.min(.75, .22 + Math.max(1, filmCredits) * .11);
  const targetFee = tierBenchmark * hitMultiplier;
  const performanceFloor = currentFee * (performanceRatio >= 3 ? 1.3 : performanceRatio >= 1.8 ? 1.22 : 1.1);
  return Math.min(4000, Math.max(Math.round(performanceFloor), Math.round(currentFee + (targetFee - currentFee) * experienceWeight)));
}

export function talentRenewalQuote(actor: AgencyActor, contract: TalentContract) {
  if (contract.origin === "mature") return { renewalFee: Math.round(contract.signingFee * .45) + contract.annualSalary, annualSalary: contract.annualSalary };
  const tier = actorTier(actor.acting, actor.appeal);
  const salaryRate = tier === "SS" ? .5 : tier === "S" ? .4 : tier === "A" ? .32 : .25;
  const renewalRate = tier === "SS" ? 1.5 : tier === "S" ? 1.25 : tier === "A" ? 1 : .7;
  const annualSalary = Math.max(contract.annualSalary, Math.round(actor.fee * salaryRate));
  return { renewalFee: Math.round(actor.fee * renewalRate) + annualSalary, annualSalary };
}

export function rookieExposureAppealGain(acting: number, appeal: number, coStarAppeal: number, performanceRatio: number) {
  const actingGain = acting >= 93 ? 5 : acting >= 88 ? 4 : acting >= 82 ? 3 : acting >= 76 ? 2 : 0;
  if (!actingGain) return 0;
  const audienceTransfer = coStarAppeal >= 90 && coStarAppeal - appeal >= 20 ? 2 : coStarAppeal >= 80 && coStarAppeal - appeal >= 15 ? 1 : 0;
  const projectEffect = performanceRatio >= 1.8 ? 2 : performanceRatio >= 1 ? 1 : performanceRatio < .7 ? -1 : 0;
  return Math.max(0, Math.min(9, actingGain + audienceTransfer + projectEffect));
}

export function generateTalentNews(actors: AgencyActor[], year: number): TalentNews[] {
  return [...actors]
    .sort((first, second) => hash(`${year}:news:${first.id}`) - hash(`${year}:news:${second.id}`))
    .slice(0, Math.min(3, actors.length))
    .map((actor, index) => {
      const roll = hash(`${year}:${actor.id}:tone`) % 100;
      if (roll < 50) {
        const appealDelta = -(3 + hash(`${year}:${actor.id}:loss`) % 5);
        const titles = ["旧日争议突然发酵", "品牌合作引发质疑", "片场传闻登上热搜", "公开言论遭遇反噬"];
        return { actorId: actor.id, actorName: actor.name, tone: "negative" as const, title: titles[(roll + index) % titles.length], appealDelta };
      }
      if (roll < 82) {
        const appealDelta = 2 + hash(`${year}:${actor.id}:gain`) % 3;
        const titles = ["公益行动获得好评", "舞台表现意外出圈", "真诚采访收获路人缘", "新造型引发讨论"];
        return { actorId: actor.id, actorName: actor.name, tone: "positive" as const, title: titles[(roll + index) % titles.length], appealDelta };
      }
      return { actorId: actor.id, actorName: actor.name, tone: "neutral" as const, title: "保持低调，年度公众形象平稳", appealDelta: 0 };
    });
}

export function agencyCapacity(level: number) {
  return Math.min(7, 2 + Math.ceil(level / 2));
}

export function trainingCapacity(level: number) {
  return agencyCapacity(level);
}

export function trainingGain(current: number, contract: TalentContract) {
  const gap = Math.max(0, contract.potential - current);
  if (gap === 0) return 0;
  if (contract.origin === "mature") return Math.min(1, gap);
  const base = gap >= 45 ? 11 : gap >= 30 ? 9 : gap >= 20 ? 7 : gap >= 12 ? 5 : gap >= 6 ? 3 : 1;
  return Math.min(gap, base + Math.max(0, contract.growth - 2));
}

export function matureContractQuote(actor: AgencyActor, profile: AgencyProfile): ContractQuote {
  const signingMultiplier = profile.tier === "SS" ? 3 : profile.tier === "S" ? 2.5 : profile.tier === "A" ? 2.1 : 1.6;
  const salaryMultiplier = profile.tier === "SS" ? .5 : profile.tier === "S" ? .4 : profile.tier === "A" ? .32 : .25;
  return {
    signingFee: Math.round(actor.fee * signingMultiplier),
    annualSalary: Math.round(actor.fee * salaryMultiplier),
    internalRate: profile.tier === "SS" ? .45 : profile.tier === "S" ? .4 : profile.tier === "A" ? .35 : .3,
    agencyShare: profile.tier === "SS" ? .18 : profile.tier === "S" ? .22 : profile.tier === "A" ? .28 : .32,
    requiredReputation: profile.tier === "SS" ? 140 : profile.tier === "S" ? 100 : profile.tier === "A" ? 70 : 0,
  };
}

export function rookieContractQuote(actor: RookieCandidate): ContractQuote {
  return {
    signingFee: Math.max(0, Math.round((actor.potential - 88) * 28)),
    annualSalary: Math.round(actor.fee * .9),
    internalRate: .35,
    agencyShare: .35,
    requiredReputation: 0,
  };
}

export function externalAgencyIncome(actor: AgencyActor, contract: TalentContract) {
  const marketFee = actor.fee * 1.6;
  return Math.round(marketFee * (1.15 + actor.appeal / 100) * contract.agencyShare);
}
