export type StudioPathId = "commercial" | "auteur" | "genre" | "talent";

export type StudioPath = {
  id: StudioPathId;
  name: string;
  code: string;
  tagline: string;
  strength: string;
  pressure: string;
};

export type StudioPolicy = {
  id: string;
  pathId: StudioPathId;
  name: string;
  unlockAt: number;
  upside: string;
  pressure: string;
};

export type StrategyContext = {
  budgetName: string;
  genre: string;
  isIp: boolean;
  directorMatched: boolean;
  castAppeal: number;
  hasRookie: boolean;
  signedCastCount: number;
};

export type StudioStrategyEffects = {
  budgetCostMultiplier: number;
  talentCostMultiplier: number;
  operatingCostMultiplier: number;
  qualityBonus: number;
  wordOfMouthBonus: number;
  openingPower: number;
  retentionBonus: number;
  genreHeatBonus: number;
  pictureAwardBonus: number;
  directorAwardBonus: number;
  actingAwardBonus: number;
  libraryMultiplier: number;
  rookieAppealBonus: number;
  activeNotes: string[];
};

export type MarketEra = {
  id: string;
  name: string;
  years: string;
  headline: string;
  rule: string;
};

export type RivalStudio = {
  id: string;
  name: string;
  identity: string;
  genres: string[];
  color: string;
};

export type RivalPlan = RivalStudio & {
  genre: string;
  title: string;
  approach: string;
  pressure: number;
};

export type SeasonStats = {
  startYear: number;
  films: number;
  gross: number;
  awards: number;
  hits: number;
  qualityTotal: number;
};

export type SeasonStanding = {
  id: string;
  name: string;
  films: number;
  gross: number;
  awards: number;
  hits: number;
  averageQuality: number;
  score: number;
  player: boolean;
};

export type SeasonArchiveRecord = {
  startYear: number;
  endYear: number;
  rank: number;
  score: number;
  title: string;
};

export const studioPaths: StudioPath[] = [
  { id: "commercial", name: "商业大片厂", code: "BLOCKBUSTER", tagline: "用规模、明星和档期制造全民事件", strength: "开画与票房爆发更强", pressure: "预算和市场期待同步提高" },
  { id: "auteur", name: "作者电影厂牌", code: "AUTEUR", tagline: "让导演表达成为公司的金字招牌", strength: "成片质量、口碑和奖项更稳", pressure: "首日动员能力偏弱" },
  { id: "genre", name: "类型片工坊", code: "GENRE LAB", tagline: "在两个专精题材里反复打磨配方", strength: "专精题材形成稳定制作优势", pressure: "跨出舒适区会承担口碑风险" },
  { id: "talent", name: "明星经纪帝国", code: "STAR HOUSE", tagline: "把演员生涯和黄金班底变成公司资产", strength: "新人培养与表演奖项更强", pressure: "主创与团队运营成本更高" },
];

export const studioPolicies: StudioPolicy[] = [
  { id: "wide-release", pathId: "commercial", name: "全国铺排", unlockAt: 0, upside: "开画 +3", pressure: "长尾留存 -0.8%" },
  { id: "presale", pathId: "commercial", name: "预售控本", unlockAt: 0, upside: "制作预算 -6%", pressure: "成片质量 -1" },
  { id: "star-vehicle", pathId: "commercial", name: "明星中心制", unlockAt: 0, upside: "高号召主演使开画 +3", pressure: "主创成本 +8%" },
  { id: "franchise-line", pathId: "commercial", name: "系列化产线", unlockAt: 25, upside: "IP质量 +1、开画 +2", pressure: "原创项目预算 +4%" },
  { id: "industrial-scale", pathId: "commercial", name: "工业化大片", unlockAt: 55, upside: "大片级项目质量 +2", pressure: "制作预算 +7%" },
  { id: "market-blitz", pathId: "commercial", name: "饱和营销", unlockAt: 90, upside: "题材市场热度 +5", pressure: "成片口碑 -1" },

  { id: "final-cut", pathId: "auteur", name: "导演终剪权", unlockAt: 0, upside: "成片质量 +2", pressure: "开画 -2" },
  { id: "festival-route", pathId: "auteur", name: "电影节路线", unlockAt: 0, upside: "影片/导演评审各 +4", pressure: "开画 -1" },
  { id: "slow-burn", pathId: "auteur", name: "慢热长线", unlockAt: 0, upside: "口碑 +1、长尾 +1%", pressure: "开画 -3" },
  { id: "lean-craft", pathId: "auteur", name: "小体量美学", unlockAt: 25, upside: "小成本项目质量 +2", pressure: "开画 -1" },
  { id: "director-circle", pathId: "auteur", name: "导演合伙人", unlockAt: 55, upside: "适配导演质量 +1、导演评审 +3", pressure: "主创成本 +6%" },
  { id: "anti-star", pathId: "auteur", name: "去明星化", unlockAt: 90, upside: "非顶流阵容质量 +2", pressure: "高号召阵容开画 -2" },

  { id: "type-bible", pathId: "genre", name: "类型圣经", unlockAt: 0, upside: "专精题材质量 +2", pressure: "制作预算 +4%" },
  { id: "cult-audience", pathId: "genre", name: "核心影迷", unlockAt: 0, upside: "专精题材长尾 +1.2%", pressure: "开画 -2" },
  { id: "genre-star", pathId: "genre", name: "类型明星", unlockAt: 0, upside: "专精题材开画 +2", pressure: "主创成本 +5%" },
  { id: "cross-genre", pathId: "genre", name: "跨类型实验", unlockAt: 25, upside: "非专精题材口碑 +1", pressure: "非专精题材质量 -1" },
  { id: "precision-marketing", pathId: "genre", name: "精准宣发", unlockAt: 55, upside: "专精题材市场热度 +5", pressure: "口碑 -1" },
  { id: "genre-awards", pathId: "genre", name: "类型片冲奖", unlockAt: 90, upside: "专精题材三项评审 +2", pressure: "开画 -1" },

  { id: "rookie-lab", pathId: "talent", name: "新人孵化器", unlockAt: 0, upside: "新人参演质量 +2、成长 +2", pressure: "主创成本 +4%" },
  { id: "golden-pair", pathId: "talent", name: "黄金搭档", unlockAt: 0, upside: "双主演质量 +1、口碑 +1", pressure: "主创成本 +6%" },
  { id: "inhouse-first", pathId: "talent", name: "旗下优先", unlockAt: 0, upside: "使用旗下主演时主创成本 -6%", pressure: "公司运营成本 +5%" },
  { id: "star-service", pathId: "talent", name: "顶流服务制", unlockAt: 25, upside: "高号召主演使开画 +3", pressure: "成片口碑 -1" },
  { id: "performance-school", pathId: "talent", name: "表演训练营", unlockAt: 55, upside: "质量 +1、表演评审 +3", pressure: "开画 -1" },
  { id: "career-library", pathId: "talent", name: "生涯作品库", unlockAt: 90, upside: "片库收益倍率 +8%", pressure: "制作预算 +3%" },
];

export const rivalStudios: RivalStudio[] = [
  { id: "titan", name: "巨幕影业", identity: "大片与头部IP", genres: ["科幻冒险", "动作战争", "犯罪悬疑"], color: "#ff7653" },
  { id: "green", name: "青禾映画", identity: "作者电影与奖项", genres: ["历史传记", "都市爱情", "犯罪悬疑"], color: "#6fc4ae" },
  { id: "joy", name: "欢乐时代", identity: "喜剧与大众市场", genres: ["合家欢喜剧", "都市爱情", "动作战争"], color: "#e2b850" },
];

const emptyEffects = (): StudioStrategyEffects => ({
  budgetCostMultiplier: 1,
  talentCostMultiplier: 1,
  operatingCostMultiplier: 1,
  qualityBonus: 0,
  wordOfMouthBonus: 0,
  openingPower: 0,
  retentionBonus: 0,
  genreHeatBonus: 0,
  pictureAwardBonus: 0,
  directorAwardBonus: 0,
  actingAwardBonus: 0,
  libraryMultiplier: 1,
  rookieAppealBonus: 0,
  activeNotes: [],
});

const clamp = (minimum: number, maximum: number, value: number) => Math.max(minimum, Math.min(maximum, value));

export function policiesForPath(pathId: StudioPathId | null) {
  return pathId ? studioPolicies.filter((policy) => policy.pathId === pathId) : [];
}

export function defaultPoliciesForPath(pathId: StudioPathId) {
  return policiesForPath(pathId).filter((policy) => policy.unlockAt === 0).slice(0, 3).map((policy) => policy.id);
}

export function strategyLevel(xp: number) {
  return xp >= 90 ? 4 : xp >= 55 ? 3 : xp >= 25 ? 2 : 1;
}

export function resolveStudioStrategy(pathId: StudioPathId | null, activePolicyIds: string[], pathXp: number, focusGenres: string[], context: StrategyContext) {
  const effects = emptyEffects();
  if (!pathId) return effects;
  const focus = focusGenres.includes(context.genre);
  if (pathId === "commercial") {
    effects.openingPower += 1;
    effects.budgetCostMultiplier *= 1.03;
    effects.activeNotes.push("商业大片厂：开画 +1、制作预算 +3%");
  } else if (pathId === "auteur") {
    effects.qualityBonus += 1;
    effects.openingPower -= 1;
    effects.activeNotes.push("作者厂牌：质量 +1、开画 -1");
  } else if (pathId === "genre") {
    if (focus) {
      effects.qualityBonus += 1;
      effects.openingPower += 1;
      effects.activeNotes.push("专精题材：质量 +1、开画 +1");
    } else {
      effects.wordOfMouthBonus -= 1;
      effects.activeNotes.push("非专精题材：口碑 -1");
    }
  } else {
    effects.talentCostMultiplier *= 1.04;
    effects.rookieAppealBonus += 1;
    effects.actingAwardBonus += 1;
    effects.activeNotes.push("明星经纪帝国：新人额外成长、主创成本 +4%");
  }

  const activePolicies = studioPolicies.filter((policy) => activePolicyIds.includes(policy.id) && policy.pathId === pathId && pathXp >= policy.unlockAt);
  activePolicies.forEach((policy) => {
    switch (policy.id) {
      case "wide-release": effects.openingPower += 3; effects.retentionBonus -= .008; break;
      case "presale": effects.budgetCostMultiplier *= .94; effects.qualityBonus -= 1; break;
      case "star-vehicle": if (context.castAppeal >= 85) effects.openingPower += 3; effects.talentCostMultiplier *= 1.08; break;
      case "franchise-line": if (context.isIp) { effects.qualityBonus += 1; effects.openingPower += 2; } else effects.budgetCostMultiplier *= 1.04; break;
      case "industrial-scale": if (context.budgetName === "大片级") effects.qualityBonus += 2; effects.budgetCostMultiplier *= 1.07; break;
      case "market-blitz": effects.genreHeatBonus += 5; effects.wordOfMouthBonus -= 1; break;
      case "final-cut": effects.qualityBonus += 2; effects.openingPower -= 2; break;
      case "festival-route": effects.pictureAwardBonus += 4; effects.directorAwardBonus += 4; effects.openingPower -= 1; break;
      case "slow-burn": effects.wordOfMouthBonus += 1; effects.retentionBonus += .01; effects.openingPower -= 3; break;
      case "lean-craft": if (context.budgetName === "小成本") effects.qualityBonus += 2; effects.openingPower -= 1; break;
      case "director-circle": if (context.directorMatched) { effects.qualityBonus += 1; effects.directorAwardBonus += 3; } effects.talentCostMultiplier *= 1.06; break;
      case "anti-star": if (context.castAppeal < 85) effects.qualityBonus += 2; else effects.openingPower -= 2; break;
      case "type-bible": if (focus) effects.qualityBonus += 2; effects.budgetCostMultiplier *= 1.04; break;
      case "cult-audience": if (focus) effects.retentionBonus += .012; effects.openingPower -= 2; break;
      case "genre-star": if (focus) effects.openingPower += 2; effects.talentCostMultiplier *= 1.05; break;
      case "cross-genre": if (!focus) { effects.wordOfMouthBonus += 1; effects.qualityBonus -= 1; } break;
      case "precision-marketing": if (focus) effects.genreHeatBonus += 5; effects.wordOfMouthBonus -= 1; break;
      case "genre-awards": if (focus) { effects.pictureAwardBonus += 2; effects.directorAwardBonus += 2; effects.actingAwardBonus += 2; } effects.openingPower -= 1; break;
      case "rookie-lab": if (context.hasRookie) { effects.qualityBonus += 2; effects.rookieAppealBonus += 2; } effects.talentCostMultiplier *= 1.04; break;
      case "golden-pair": effects.qualityBonus += 1; effects.wordOfMouthBonus += 1; effects.talentCostMultiplier *= 1.06; break;
      case "inhouse-first": if (context.signedCastCount > 0) effects.talentCostMultiplier *= .94; effects.operatingCostMultiplier *= 1.05; break;
      case "star-service": if (context.castAppeal >= 85) effects.openingPower += 3; effects.wordOfMouthBonus -= 1; break;
      case "performance-school": effects.qualityBonus += 1; effects.actingAwardBonus += 3; effects.openingPower -= 1; break;
      case "career-library": effects.libraryMultiplier *= 1.08; effects.budgetCostMultiplier *= 1.03; break;
    }
    effects.activeNotes.push(`${policy.name}：${policy.upside} / ${policy.pressure}`);
  });

  effects.budgetCostMultiplier = clamp(.85, 1.24, effects.budgetCostMultiplier);
  effects.talentCostMultiplier = clamp(.88, 1.26, effects.talentCostMultiplier);
  effects.operatingCostMultiplier = clamp(1, 1.12, effects.operatingCostMultiplier);
  effects.qualityBonus = clamp(-2, 6, effects.qualityBonus);
  effects.wordOfMouthBonus = clamp(-2, 3, effects.wordOfMouthBonus);
  effects.openingPower = clamp(-6, 8, effects.openingPower);
  effects.retentionBonus = clamp(-.012, .025, effects.retentionBonus);
  effects.genreHeatBonus = clamp(0, 7, effects.genreHeatBonus);
  effects.libraryMultiplier = clamp(1, 1.12, effects.libraryMultiplier);
  return effects;
}

export function summarizeStrategyEffects(label: string, effects: StudioStrategyEffects) {
  const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
  const lines: string[] = [];
  const production = [
    effects.qualityBonus ? `质量 ${signed(effects.qualityBonus)}` : "",
    effects.budgetCostMultiplier !== 1 ? `预算 ${signed(Math.round((effects.budgetCostMultiplier - 1) * 100))}%` : "",
    effects.talentCostMultiplier !== 1 ? `主创 ${signed(Math.round((effects.talentCostMultiplier - 1) * 100))}%` : "",
  ].filter(Boolean);
  const market = [
    effects.openingPower ? `开画 ${signed(effects.openingPower)}` : "",
    effects.wordOfMouthBonus ? `口碑 ${signed(effects.wordOfMouthBonus)}` : "",
    effects.genreHeatBonus ? `市场热度 +${effects.genreHeatBonus}` : "",
    effects.retentionBonus ? `长尾 ${signed(Number((effects.retentionBonus * 100).toFixed(1)))}%` : "",
  ].filter(Boolean);
  const awards = effects.pictureAwardBonus + effects.directorAwardBonus + effects.actingAwardBonus;
  const longTerm = [
    awards ? `评审总计 +${awards}` : "",
    effects.libraryMultiplier !== 1 ? `片库 +${Math.round((effects.libraryMultiplier - 1) * 100)}%` : "",
    effects.rookieAppealBonus ? `新人成长 +${effects.rookieAppealBonus}` : "",
    effects.operatingCostMultiplier !== 1 ? `运营成本 +${Math.round((effects.operatingCostMultiplier - 1) * 100)}%` : "",
  ].filter(Boolean);
  if (production.length) lines.push(`${label}制作：${production.join(" · ")}`);
  if (market.length) lines.push(`${label}市场：${market.join(" · ")}`);
  if (longTerm.length) lines.push(`${label}长期：${longTerm.join(" · ")}`);
  return lines.length ? lines : [`${label}：本片没有额外数值修正`];
}

const eras: { start: number; end: number | null; era: MarketEra }[] = [
  { start: 1, end: 2, era: { id: "normal", name: "院线常态", years: "第1—2年", headline: "市场仍以明星、类型和常规宣发为主", rule: "没有额外时代修正，适合建立公司的第一套打法。" } },
  { start: 3, end: 5, era: { id: "word-of-mouth", name: "口碑回潮", years: "第3—5年", headline: "观众开始厌倦只靠明星和预告片制造的首周热度", rule: "所有影片口碑 +1，但开画 -1。" } },
  { start: 6, end: 8, era: { id: "blockbuster-bubble", name: "大片泡沫", years: "第6—8年", headline: "视效大片争夺银幕，工业规模变成市场焦点", rule: "大片级项目开画 +3、预算 +8%；其他规模长尾小幅提高。" } },
  { start: 9, end: 11, era: { id: "new-wave", name: "新人浪潮", years: "第9—11年", headline: "新面孔成为市场话题，老套明星组合吸引力下降", rule: "使用新人时质量 +2、开画 +1；没有新人时开画 -1。" } },
  { start: 12, end: 14, era: { id: "franchise-fatigue", name: "系列疲劳期", years: "第12—14年", headline: "观众对机械续作失去耐心，原创概念重新受追捧", rule: "IP开画 -2、口碑 -1；原创口碑 +1、片库倍率提高。" } },
  { start: 15, end: null, era: { id: "fragmented", name: "分众时代", years: "第15年起", headline: "全民爆款减少，稳定服务核心观众成为长期能力", rule: "所有影片开画 -1、长尾 +0.8%。" } },
];

export function marketEraForYear(year: number) {
  return eras.find((item) => year >= item.start && (item.end === null || year <= item.end))?.era ?? eras[0].era;
}

export function upcomingMarketEra(year: number) {
  return eras.find((item) => item.start === year + 1)?.era ?? null;
}

export function resolveMarketEraEffects(year: number, context: StrategyContext) {
  const effects = emptyEffects();
  const era = marketEraForYear(year);
  if (era.id === "word-of-mouth") {
    effects.wordOfMouthBonus += 1;
    effects.openingPower -= 1;
  } else if (era.id === "blockbuster-bubble") {
    if (context.budgetName === "大片级") {
      effects.openingPower += 3;
      effects.budgetCostMultiplier *= 1.08;
    } else effects.retentionBonus += .005;
  } else if (era.id === "new-wave") {
    if (context.hasRookie) {
      effects.qualityBonus += 2;
      effects.openingPower += 1;
    } else effects.openingPower -= 1;
  } else if (era.id === "franchise-fatigue") {
    if (context.isIp) {
      effects.openingPower -= 2;
      effects.wordOfMouthBonus -= 1;
    } else {
      effects.wordOfMouthBonus += 1;
      effects.libraryMultiplier *= 1.03;
    }
  } else if (era.id === "fragmented") {
    effects.openingPower -= 1;
    effects.retentionBonus += .008;
  }
  effects.activeNotes.push(`${era.name}：${era.rule}`);
  return effects;
}

export function rivalPlansForYear(year: number): RivalPlan[] {
  return rivalStudios.map((studio, index) => {
    const genre = studio.genres[(year + index * 2) % studio.genres.length];
    const titleSeed = ["边界", "回声", "远航", "重逢", "风暴", "旧梦"][(year * 2 + index) % 6];
    const suffix = studio.id === "titan" ? "计划" : studio.id === "green" ? "手记" : "大作战";
    return {
      ...studio,
      genre,
      title: `${titleSeed}${suffix}`,
      approach: studio.id === "titan" ? "抢占头部档期" : studio.id === "green" ? "瞄准口碑与奖项" : "争夺大众观众",
      pressure: studio.id === "titan" ? 5 : studio.id === "green" ? 3 : 4,
    };
  });
}

export function rivalGenrePressure(year: number, genre: string) {
  return rivalPlansForYear(year).filter((plan) => plan.genre === genre).reduce((sum, plan) => sum + plan.pressure, 0);
}

export function emptySeasonStats(startYear = 1): SeasonStats {
  return { startYear, films: 0, gross: 0, awards: 0, hits: 0, qualityTotal: 0 };
}

export function addFilmToSeason(stats: SeasonStats, film: { gross: number; awards: number; quality: number; breakEvenGross: number }) {
  return {
    ...stats,
    films: stats.films + 1,
    gross: stats.gross + Math.max(0, film.gross),
    awards: stats.awards + Math.max(0, film.awards),
    hits: stats.hits + (film.gross >= Math.max(55000, film.breakEvenGross * 1.5) ? 1 : 0),
    qualityTotal: stats.qualityTotal + Math.max(0, film.quality),
  };
}

function rivalSeasonStats(studio: RivalStudio, startYear: number, films: number): SeasonStats {
  let stats = emptySeasonStats(startYear);
  for (let index = 0; index < films; index += 1) {
    const year = startYear + index;
    const studioIndex = rivalStudios.findIndex((item) => item.id === studio.id);
    const wave = ((year * 17 + studioIndex * 23) % 21) - 10;
    const grossBase = studio.id === "titan" ? 72000 : studio.id === "green" ? 45000 : 61000;
    const qualityBase = studio.id === "green" ? 88 : studio.id === "titan" ? 82 : 79;
    const awards = studio.id === "green" ? ((year + studioIndex) % 2 === 0 ? 2 : 1) : (year + studioIndex) % 3 === 0 ? 1 : 0;
    const gross = Math.max(26000, grossBase + wave * 1700);
    stats = addFilmToSeason(stats, { gross, awards, quality: qualityBase + Math.round(wave / 4), breakEvenGross: studio.id === "titan" ? 52000 : 36000 });
  }
  return stats;
}

function seasonScore(stats: SeasonStats) {
  if (!stats.films) return 0;
  const averageQuality = stats.qualityTotal / stats.films;
  return Math.round(stats.gross / 5000 + stats.awards * 16 + stats.hits * 9 + averageQuality * .8);
}

export function buildSeasonStandings(playerStats: SeasonStats): SeasonStanding[] {
  const entries: SeasonStanding[] = [
    { id: "player", name: "造梦片场", ...playerStats, averageQuality: playerStats.films ? Number((playerStats.qualityTotal / playerStats.films).toFixed(1)) : 0, score: seasonScore(playerStats), player: true },
    ...rivalStudios.map((studio) => {
      const stats = rivalSeasonStats(studio, playerStats.startYear, playerStats.films);
      return { id: studio.id, name: studio.name, ...stats, averageQuality: stats.films ? Number((stats.qualityTotal / stats.films).toFixed(1)) : 0, score: seasonScore(stats), player: false };
    }),
  ];
  return entries.sort((first, second) => second.score - first.score || second.gross - first.gross);
}

export function seasonResultTitle(rank: number, stats: SeasonStats) {
  if (rank === 1) return stats.awards >= 5 ? "时代领航者" : stats.hits >= 3 ? "票房王者" : "五年最佳片厂";
  if (rank === 2) return "一线挑战者";
  if (rank === 3) return "特色厂牌";
  return "蓄势重整";
}

export function studioPathXpGain(input: { quality: number; gross: number; breakEvenGross: number; awards: number }) {
  return 16 + (input.quality >= 88 ? 6 : input.quality >= 82 ? 3 : 0) + input.awards * 6 + (input.gross >= input.breakEvenGross * 1.5 ? 5 : input.gross >= input.breakEvenGross ? 2 : 0);
}
