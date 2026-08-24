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

export type RookieCandidate = AgencyActor & {
  profile: AgencyProfile;
  potential: number;
  growth: number;
  personality: string;
};

export const rookieCandidates: RookieCandidate[] = [
  { id: 101, name: "林知夏", avatar: "林", gender: "女", acting: 68, appeal: 36, fee: 110, genres: ["都市爱情"], tag: "电影学院应届生", potential: 98, growth: 3, personality: "镜头感强", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 4, archetype: "清醒少女" } },
  { id: 102, name: "陈逐野", avatar: "陈", gender: "男", acting: 65, appeal: 42, fee: 120, genres: ["动作战争"], tag: "武术专业新人", potential: 96, growth: 3, personality: "训练刻苦", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "热血青年" } },
  { id: 103, name: "苏未眠", avatar: "苏", gender: "女", acting: 72, appeal: 31, fee: 130, genres: ["历史传记"], tag: "舞台剧新人", potential: 99, growth: 2, personality: "表演专注", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 3, archetype: "古典人物" } },
  { id: 104, name: "周砚声", avatar: "周", gender: "男", acting: 70, appeal: 35, fee: 125, genres: ["犯罪悬疑"], tag: "短片节新面孔", potential: 97, growth: 2, personality: "角色钻研", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "冷面青年" } },
  { id: 105, name: "乔星澜", avatar: "乔", gender: "女", acting: 62, appeal: 48, fee: 105, genres: ["科幻冒险"], tag: "广告片潜力新人", potential: 94, growth: 3, personality: "观众缘佳", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 8, archetype: "未来少女" } },
  { id: 106, name: "陆青川", avatar: "陆", gender: "男", acting: 67, appeal: 39, fee: 115, genres: ["合家欢喜剧"], tag: "喜剧社团主力", potential: 96, growth: 3, personality: "反应敏捷", profile: { age: 20, tier: "B", career: "蓄势", availability: "档期充裕", risk: 7, archetype: "邻家男孩" } },
  { id: 107, name: "叶南枝", avatar: "叶", gender: "女", acting: 69, appeal: 40, fee: 120, genres: ["犯罪悬疑"], tag: "独立电影新人", potential: 98, growth: 2, personality: "气质独特", profile: { age: 19, tier: "B", career: "蓄势", availability: "档期充裕", risk: 5, archetype: "神秘女性" } },
  { id: 108, name: "高远舟", avatar: "高", gender: "男", acting: 64, appeal: 45, fee: 100, genres: ["都市爱情"], tag: "校园剧新人", potential: 93, growth: 3, personality: "亲和自然", profile: { age: 18, tier: "B", career: "蓄势", availability: "档期充裕", risk: 6, archetype: "青春男主" } },
];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

export function actorTier(acting: number, appeal: number): ActorTier {
  const total = acting + appeal;
  return total >= 195 ? "SS" : total >= 182 ? "S" : total >= 175 ? "A" : "B";
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
