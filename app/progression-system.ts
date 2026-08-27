export type ChapterGoalId = "critics" | "comeback" | "festival";
export type ChapterReleasePlanId = "preview" | "festival-premiere" | "embargo";

export type WordOfMouthProgress = {
  highScoreFilms: number;
  comebackFilms: number;
  awards: number;
  completed: boolean;
  rewardClaimed: boolean;
};

export type ChapterFilmOutcome = {
  audienceScore: number;
  openingPower: number;
  gross: number;
  breakEvenGross: number;
  awards: number;
};

export type ChapterAdvance = {
  progress: WordOfMouthProgress;
  added: number;
  current: number;
  target: number;
  completedNow: boolean;
};

export type AnnualRhythm = {
  eyebrow: string;
  title: string;
  description: string;
  primary: string;
  secondary: string;
  nextUnlock: string;
};

export const emptyWordOfMouthProgress = (): WordOfMouthProgress => ({
  highScoreFilms: 0,
  comebackFilms: 0,
  awards: 0,
  completed: false,
  rewardClaimed: false,
});

export const wordOfMouthGoals = [
  {
    id: "critics" as const,
    name: "评论家路线",
    summary: "在口碑周期中稳定交出高评分作品。",
    rule: "第3—5年累计完成2部观众评分≥8.3的电影",
    target: 2,
    legacy: "完成后：第6年起所有电影口碑力+1",
  },
  {
    id: "comeback" as const,
    name: "逆袭路线",
    summary: "低开高走，用长线口碑翻盘。",
    rule: "完成1部开画力≤80、评分≥8.3且最终回本的电影",
    target: 1,
    legacy: "完成后：第6年起票房长尾留存+0.4%",
  },
  {
    id: "festival" as const,
    name: "影展路线",
    summary: "集中冲击专业荣誉，建立行业声望。",
    rule: "第3—5年累计获得3项金幕奖",
    target: 3,
    legacy: "完成后：第6年起最佳影片、导演评审各+1",
  },
];

export const wordOfMouthReleasePlans = [
  {
    id: "preview" as const,
    name: "提前点映",
    summary: "先让核心观众发酵口碑。",
    wordOfMouth: 1,
    openingPower: -2,
    pictureAwardBonus: 0,
    directorAwardBonus: 0,
    note: "口碑力+1，开画力-2",
  },
  {
    id: "festival-premiere" as const,
    name: "影展首映",
    summary: "牺牲首发声量，优先争取专业评价。",
    wordOfMouth: 0,
    openingPower: -2,
    pictureAwardBonus: 3,
    directorAwardBonus: 3,
    note: "开画力-2，最佳影片/导演评审各+3",
  },
  {
    id: "embargo" as const,
    name: "口碑保密",
    summary: "延后媒体评价，集中制造首日声量。",
    wordOfMouth: -1,
    openingPower: 2,
    pictureAwardBonus: 0,
    directorAwardBonus: 0,
    note: "开画力+2，口碑力-1",
  },
];

export function isWordOfMouthChapterYear(year: number) {
  return year >= 3 && year <= 5;
}

export function strategySlotCapacityForYear(year: number) {
  if (year < 3) return 0;
  return Math.min(3, year - 2);
}

export function annualRhythmForYear(year: number): AnnualRhythm {
  if (year === 2) return {
    eyebrow: "第二年 · 资产起步",
    title: "把第一部成功，变成可以延续的事业。",
    description: "本年主学IP开发；融资与艺人培养作为辅助，不再同时要求你决定全部长期路线。",
    primary: "主目标：尝试原创或开发首个电影IP",
    secondary: "新增工具：融资、艺人培训",
    nextUnlock: "完成第二部电影后，再确立制片厂长期路线",
  };
  if (year === 3) return {
    eyebrow: "第三年 · 口碑回潮 I",
    title: "选择厂牌打法，打响三年口碑战。",
    description: "市场进入口碑回潮期。确立一条章节目标，并用第一个经营策略槽塑造公司风格。",
    primary: "主目标：选择口碑章节路线",
    secondary: "新增能力：1个经营策略槽、发行策略",
    nextUnlock: "第四年开放第2个经营策略槽",
  };
  if (year === 4) return {
    eyebrow: "第四年 · 口碑回潮 II",
    title: "扩大优势，也要补上路线短板。",
    description: "章节进入中盘。第二个策略槽开放，可以强化专长，也可以用组合策略控制风险。",
    primary: "主目标：推进三年章节进度",
    secondary: "新增能力：第2个经营策略槽",
    nextUnlock: "第五年开放最终策略槽并进行章节收官",
  };
  if (year === 5) return {
    eyebrow: "第五年 · 口碑回潮终章",
    title: "用一部代表作，为第一个五年收官。",
    description: "本年同时结算口碑章节与五年影业赛季。最终策略槽开放，让你完成第一套成熟厂牌构筑。",
    primary: "主目标：完成章节目标、冲击赛季排名",
    secondary: "新增能力：第3个经营策略槽",
    nextUnlock: "第六年进入大片竞赛时代",
  };
  if (year >= 6 && year <= 8) return {
    eyebrow: `第${year}年 · 大片竞赛`,
    title: "规模正在成为新的行业门槛。",
    description: "利用已经成型的厂牌与IP资产，在高成本、高首发压力下寻找稳定胜率。",
    primary: "主目标：做大开画，守住投资回报",
    secondary: "长期课题：经营厂牌、IP与艺人资产",
    nextUnlock: year === 8 ? "第九年市场将转向新锐表达" : "下一年大片竞争继续升温",
  };
  if (year >= 9 && year <= 11) return {
    eyebrow: `第${year}年 · 新锐浪潮`,
    title: "观众开始奖励新鲜表达。",
    description: "成熟套路不再通吃。尝试新导演、新演员与跨流派构筑，打开新的成功路径。",
    primary: "主目标：培养新人，尝试非惯用路线",
    secondary: "长期课题：避免厂牌打法固化",
    nextUnlock: year === 11 ? "第十二年将进入系列疲劳期" : "下一年新锐浪潮仍在持续",
  };
  return {
    eyebrow: `第${year}年 · 长线经营`,
    title: "没有永远有效的公式，只有持续进化的片场。",
    description: "根据市场周期调整作品、IP、艺人与厂牌组合，建立能够穿越周期的电影公司。",
    primary: "主目标：顺应市场变化完成年度作品",
    secondary: "长期课题：更新资产与玩法组合",
    nextUnlock: "留意下一轮市场时代预告",
  };
}

export function chapterGoalProgress(goalId: ChapterGoalId, progress: WordOfMouthProgress) {
  if (goalId === "critics") return progress.highScoreFilms;
  if (goalId === "comeback") return progress.comebackFilms;
  return progress.awards;
}

export function advanceWordOfMouthChapter(progress: WordOfMouthProgress, goalId: ChapterGoalId, film: ChapterFilmOutcome): ChapterAdvance {
  const next = { ...progress };
  if (film.audienceScore >= 8.3) next.highScoreFilms += 1;
  if (film.openingPower <= 80 && film.audienceScore >= 8.3 && film.gross >= film.breakEvenGross) next.comebackFilms += 1;
  next.awards += film.awards;
  const goal = wordOfMouthGoals.find((item) => item.id === goalId)!;
  const previousValue = chapterGoalProgress(goalId, progress);
  const current = chapterGoalProgress(goalId, next);
  const completedNow = !progress.completed && current >= goal.target;
  next.completed = progress.completed || completedNow;
  return { progress: next, added: Math.max(0, current - previousValue), current, target: goal.target, completedNow };
}

export function wordOfMouthLegacyEffects(goalId: ChapterGoalId | null, completed: boolean, year: number) {
  const active = completed && year >= 6;
  return {
    wordOfMouth: active && goalId === "critics" ? 1 : 0,
    retention: active && goalId === "comeback" ? .004 : 0,
    pictureAwardBonus: active && goalId === "festival" ? 1 : 0,
    directorAwardBonus: active && goalId === "festival" ? 1 : 0,
  };
}
