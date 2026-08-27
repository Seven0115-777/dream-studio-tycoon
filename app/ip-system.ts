export type IpRouteId = "original" | "sequel" | "spinoff" | "reboot";

export type FilmHistoryRecord = {
  id?: string;
  year?: number;
  title: string;
  genre?: string;
  gross: number;
  awards: number;
  score?: number;
  quality?: number;
  breakEvenGross?: number;
  directorId?: number;
  castIds?: number[];
  coreStyleId?: string;
  buildName?: string;
  traits?: string[];
  libraryMultiplier?: number;
  route?: IpRouteId;
  seriesId?: string;
  seriesTitle?: string;
  seriesEntry?: number;
  brandHeat?: number;
  fatigue?: number;
};

export type IpProjectSelection = { route: IpRouteId; sourceId: string | null };

export type IpProjectEffects = {
  route: IpRouteId;
  source: FilmHistoryRecord | null;
  openingPower: number;
  qualityBonus: number;
  wordOfMouth: number;
  retention: number;
  returningCastPremiumRate: number;
  returningCastIds: number[];
  returningCastCount: number;
  libraryMultiplier: number;
  expectedScore: number | null;
  projectedFatigue: number;
  inheritedTraits: string[];
  notes: string[];
};

export const ipRoutes: { id: Exclude<IpRouteId, "original">; name: string; summary: string; upside: string; pressure: string }[] = [
  { id: "sequel", name: "正统续集", summary: "延续主线和系列招牌，承接前作核心观众。", upside: "品牌首映号召最高 · 继承2项特性", pressure: "原班主演溢价12% · 前作评分形成期待" },
  { id: "spinoff", name: "角色衍生", summary: "从配角或世界观切入，允许更换叙事中心。", upside: "中等品牌首映号召 · 继承1项特性", pressure: "原班主演溢价5% · 需要重新建立认知" },
  { id: "reboot", name: "重启 / 诗选", summary: "保留题材与品牌伞，重做人物、时代或风格表达。", upside: "显著清理审美疲劳 · 无换角争议", pressure: "品牌首映号召最低 · 不继承旧特性" },
];

const clamp = (minimum: number, maximum: number, value: number) => Math.max(minimum, Math.min(maximum, value));
const safeScore = (film: FilmHistoryRecord) => film.score ?? (film.awards > 0 ? 8.6 : film.gross >= 55000 ? 8.1 : 7.4);
const safeBreakEven = (film: FilmHistoryRecord) => Math.max(1, film.breakEvenGross ?? 40000);

export function filmRecordId(film: FilmHistoryRecord, index = 0) {
  return film.id ?? `legacy-${film.year ?? 0}-${index}-${film.title}`;
}

export function calculateBrandHeat(film: FilmHistoryRecord) {
  if (film.brandHeat !== undefined) return clamp(25, 95, Math.round(film.brandHeat));
  const scoreValue = (safeScore(film) - 7) * 12;
  const returnValue = clamp(-8, 20, (film.gross / safeBreakEven(film) - 1) * 10);
  return clamp(25, 95, Math.round(48 + scoreValue + returnValue + film.awards * 4));
}

export function isIpEligible(film: FilmHistoryRecord) {
  return film.awards > 0 || safeScore(film) >= 8 || film.gross >= 55000 || film.gross >= safeBreakEven(film) * 1.35;
}

export function normalizeFilmHistory(history: FilmHistoryRecord[]) {
  return history.slice(0, 3).map((film, index) => ({
    ...film,
    id: filmRecordId(film, index),
    castIds: film.castIds ?? [],
    traits: film.traits ?? [],
    brandHeat: calculateBrandHeat(film),
    fatigue: clamp(0, 100, film.fatigue ?? 0),
  }));
}

export function eligibleIpSources(history: FilmHistoryRecord[]) {
  const latestBySeries = new Map<string, FilmHistoryRecord>();
  normalizeFilmHistory(history).forEach((film) => {
    const seriesKey = film.seriesId ?? film.id ?? film.title;
    const current = latestBySeries.get(seriesKey);
    const filmEntry = film.seriesEntry ?? 1;
    const currentEntry = current?.seriesEntry ?? 1;
    if (!current || filmEntry > currentEntry || (filmEntry === currentEntry && (film.year ?? 0) > (current.year ?? 0))) {
      latestBySeries.set(seriesKey, film);
    }
  });
  return [...latestBySeries.values()].filter(isIpEligible).sort((first, second) => (second.year ?? 0) - (first.year ?? 0));
}

export function findIpSource(history: FilmHistoryRecord[], sourceId: string | null) {
  if (!sourceId) return null;
  return normalizeFilmHistory(history).find((film) => film.id === sourceId) ?? null;
}

export function resolveIpGenre(source: FilmHistoryRecord | null, currentGenre: string) {
  return source?.genre || currentGenre;
}

export function suggestIpTitle(source: FilmHistoryRecord, route: Exclude<IpRouteId, "original">) {
  const base = source.seriesTitle ?? source.title;
  const suffix = route === "sequel" ? "续章" : route === "spinoff" ? "外传" : "新篇";
  return `${base}：${suffix}`.slice(0, 12);
}

export function resolveIpProjectEffects(
  history: FilmHistoryRecord[],
  selection: IpProjectSelection,
  input: { genre: string; castIds: number[]; coreStyleId?: string | null },
): IpProjectEffects {
  const source = selection.route === "original" ? null : findIpSource(history, selection.sourceId);
  if (!source) return { route: "original", source: null, openingPower: 0, qualityBonus: 0, wordOfMouth: 0, retention: 0, returningCastPremiumRate: 0, returningCastIds: [], returningCastCount: 0, libraryMultiplier: 1, expectedScore: null, projectedFatigue: 0, inheritedTraits: [], notes: ["原创项目不承接既有品牌，也不承担系列期待"] };

  const route = selection.route;
  const brandHeat = calculateBrandHeat(source);
  const sourceFatigue = clamp(0, 100, source.fatigue ?? 0);
  const sameGenre = !source.genre || source.genre === input.genre;
  const repeatedCore = Boolean(source.coreStyleId && input.coreStyleId && source.coreStyleId === input.coreStyleId);
  const returningCastIds = input.castIds.filter((id) => (source.castIds ?? []).includes(id));
  const returningCastCount = returningCastIds.length;
  const traits = source.traits ?? [];

  let openingPower = 0;
  let qualityBonus = 0;
  let wordOfMouth = 0;
  let retention = 0;
  let returningCastPremiumRate = 0;
  let libraryMultiplier = 1;
  let expectedScore = safeScore(source);
  let projectedFatigue = sourceFatigue;
  let inheritedTraits: string[] = [];
  const notes: string[] = [];

  if (route === "sequel") {
    openingPower = 4 + Math.floor(brandHeat / 25) + Math.min(2, returningCastCount);
    returningCastPremiumRate = .12;
    retention = .004;
    libraryMultiplier = 1.05;
    projectedFatigue = clamp(0, 100, sourceFatigue + 14 + (sameGenre ? 6 : 0) + (repeatedCore ? 8 : 0));
    inheritedTraits = traits.slice(0, 2);
    qualityBonus = inheritedTraits.length;
    if (returningCastCount === 0) {
      openingPower -= 2;
      wordOfMouth -= 1;
      notes.push("未启用原班主演：首映号召 -2、口碑 -1");
    } else {
      notes.push(`原班主演回归 ${returningCastCount}/2：首映号召 +${returningCastCount}，回归演员片酬 +12%`);
    }
    notes.push(`前作评分 ${safeScore(source).toFixed(1)} 形成续集期待`);
  } else if (route === "spinoff") {
    openingPower = 2 + Math.floor(brandHeat / 35) + (sameGenre ? 1 : 0);
    returningCastPremiumRate = .05;
    retention = .006;
    libraryMultiplier = 1.04;
    expectedScore = safeScore(source) - .5;
    projectedFatigue = clamp(0, 100, Math.max(0, sourceFatigue - 10) + (sameGenre ? 6 : 2) + (repeatedCore ? 5 : 0));
    inheritedTraits = traits.slice(0, 1);
    qualityBonus = inheritedTraits.length;
    notes.push("衍生路线降低前作期待0.5分，可自由更换叙事中心");
    if (returningCastCount) notes.push(`回归角色 ${returningCastCount} 人：片酬 +5%`);
  } else {
    openingPower = 1 + Math.floor(brandHeat / 45);
    retention = .002;
    libraryMultiplier = 1.02;
    expectedScore = safeScore(source) - 1;
    projectedFatigue = clamp(0, 100, sourceFatigue - 30);
    if (!sameGenre || !repeatedCore) wordOfMouth += 1;
    notes.push("重启路线清理30点系列疲劳，允许彻底换角与改变核心流派");
  }

  if (projectedFatigue >= 65) {
    wordOfMouth -= 2;
    notes.push("系列疲劳达到65：口碑 -2");
  } else if (projectedFatigue >= 40) {
    wordOfMouth -= 1;
    notes.push("系列疲劳达到40：口碑 -1");
  }

  return { route, source, openingPower: clamp(-3, 9, openingPower), qualityBonus, wordOfMouth: clamp(-3, 2, wordOfMouth), retention, returningCastPremiumRate, returningCastIds, returningCastCount, libraryMultiplier, expectedScore: Number(expectedScore.toFixed(1)), projectedFatigue, inheritedTraits, notes };
}

export function expectationWordOfMouth(audienceScore: number, expectedScore: number | null) {
  if (expectedScore === null) return 0;
  const gap = audienceScore - expectedScore;
  return gap >= .35 ? 1 : gap <= -.8 ? -2 : gap <= -.4 ? -1 : 0;
}

export function calculateReturningCastPremium(effects: IpProjectEffects, castFees: { actorId: number; fee: number }[]) {
  return Math.round(castFees.filter((item) => effects.returningCastIds.includes(item.actorId)).reduce((sum, item) => sum + item.fee, 0) * effects.returningCastPremiumRate);
}

export function createFilmHistoryRecord(input: {
  year: number;
  title: string;
  genre: string;
  gross: number;
  awards: number;
  score: number;
  quality: number;
  breakEvenGross: number;
  directorId: number;
  castIds: number[];
  coreStyleId?: string;
  buildName?: string;
  traits: string[];
  libraryMultiplier: number;
  selection: IpProjectSelection;
  effects: IpProjectEffects;
}) {
  const source = input.effects.source;
  const performanceRatio = input.gross / Math.max(1, input.breakEvenGross);
  const expectation = expectationWordOfMouth(input.score, input.effects.expectedScore);
  const previousBrand = source ? calculateBrandHeat(source) : 48;
  const brandDelta = Math.round((input.score - 7.6) * 7 + clamp(-8, 12, (performanceRatio - 1) * 5) + input.awards * 3 + expectation * 2);
  const brandHeat = clamp(25, 95, source ? previousBrand + brandDelta : 48 + brandDelta);
  const fatigue = input.selection.route === "original" ? 0 : clamp(0, 100, input.effects.projectedFatigue + (expectation < 0 ? 6 : expectation > 0 ? -5 : 0));
  const sourceId = source ? filmRecordId(source) : null;
  const seriesId = source ? source.seriesId ?? sourceId ?? undefined : undefined;
  const seriesTitle = source ? source.seriesTitle ?? source.title : undefined;
  const seriesEntry = source ? (source.seriesEntry ?? 1) + 1 : 1;
  return {
    id: `film-${input.year}-${input.title}`,
    year: input.year,
    title: input.title,
    genre: input.genre,
    gross: input.gross,
    awards: input.awards,
    score: input.score,
    quality: input.quality,
    breakEvenGross: input.breakEvenGross,
    directorId: input.directorId,
    castIds: input.castIds,
    coreStyleId: input.coreStyleId,
    buildName: input.buildName,
    traits: input.traits,
    libraryMultiplier: Math.min(1.3, input.libraryMultiplier * input.effects.libraryMultiplier),
    route: input.selection.route,
    seriesId,
    seriesTitle,
    seriesEntry,
    brandHeat,
    fatigue,
  } satisfies FilmHistoryRecord;
}

export function routeName(route: IpRouteId) {
  return route === "sequel" ? "正统续集" : route === "spinoff" ? "角色衍生" : route === "reboot" ? "重启 / 诗选" : "原创项目";
}
