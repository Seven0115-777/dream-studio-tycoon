export type GoalKind = "boxOffice" | "awards" | "rookie" | "budget" | "coldGenre";

export type GoalReward = { cash: number; xp: number; reputation: number };

export type AnnualGoal = {
  id: string;
  kind: GoalKind;
  title: string;
  description: string;
  target: number;
  targetGenre?: string;
  reward: GoalReward;
  stars: 1 | 2 | 3;
};

export type GoalResultInput = {
  gross: number;
  awards: number;
  totalCost: number;
  genre: string;
  castIds: number[];
};

export type GoalOutcome = {
  completed: boolean;
  progress: number;
  progressLabel: string;
  explanation: string;
  reward: GoalReward;
};

export type LibraryFilm = { title: string; gross: number; awards: number; libraryMultiplier?: number };

export function calculateLibraryIncome(history: LibraryFilm[]) {
  const income = history.slice(0, 3).reduce((sum, film) => {
    const filmIncome = Math.round((Math.max(0, film.gross) * .006 + Math.max(0, film.awards) * 120) * Math.max(1, film.libraryMultiplier ?? 1));
    return sum + Math.min(900, filmIncome);
  }, 0);
  return Math.min(1800, income);
}

const zeroReward: GoalReward = { cash: 0, xp: 0, reputation: 0 };

export function generateAnnualGoals(year: number, genreHeat: { name: string; heat: number }[]): AnnualGoal[] {
  const coldGenre = [...genreHeat].sort((a, b) => a.heat - b.heat || a.name.localeCompare(b.name))[0]?.name ?? "历史传记";
  const pool: AnnualGoal[] = [
    { id: `${year}-box`, kind: "boxOffice", title: "商业回报", description: `30日票房达到 ¥${(5.5 + Math.min(3, (year - 1) * .35)).toFixed(1)}亿`, target: 55000 + Math.min(30000, (year - 1) * 3500), reward: { cash: 1800, xp: 24, reputation: 4 }, stars: 2 },
    { id: `${year}-award`, kind: "awards", title: "金幕冲奖", description: `至少获得 ${year >= 5 ? 2 : 1} 项金幕奖`, target: year >= 5 ? 2 : 1, reward: { cash: 600, xp: 38, reputation: 10 }, stars: 3 },
    { id: `${year}-rookie`, kind: "rookie", title: "新人上桌", description: "使用至少一位新人演员，并让项目票房回本", target: 1, reward: { cash: 1000, xp: 34, reputation: 6 }, stars: 2 },
    { id: `${year}-budget`, kind: "budget", title: "精益制片", description: `总投资不超过 ¥${year <= 2 ? "1.35" : "1.55"}亿，并让项目票房回本`, target: year <= 2 ? 13500 : 15500, reward: { cash: 2200, xp: 20, reputation: 3 }, stars: 2 },
    { id: `${year}-cold`, kind: "coldGenre", title: "逆风突围", description: `拍摄低热题材「${coldGenre}」，且观众评分达到 7.6`, target: 76, targetGenre: coldGenre, reward: { cash: 900, xp: 32, reputation: 8 }, stars: 3 },
  ];
  if (year === 1) return [pool[0], pool[1], pool[3]];
  const start = ((year - 1) * 2) % pool.length;
  return [pool[start], pool[(start + 1) % pool.length], pool[(start + 2) % pool.length]];
}

export function evaluateAnnualGoal(goal: AnnualGoal, input: GoalResultInput & { audienceScore: number; breakEvenGross: number }): GoalOutcome {
  let progress = 0;
  let label = "";
  let completed = false;
  if (goal.kind === "boxOffice") {
    progress = input.gross / goal.target;
    label = `¥${(input.gross / 10000).toFixed(2)}亿 / ¥${(goal.target / 10000).toFixed(2)}亿`;
    completed = input.gross >= goal.target;
  } else if (goal.kind === "awards") {
    progress = input.awards / goal.target;
    label = `${input.awards} / ${goal.target} 项获奖`;
    completed = input.awards >= goal.target;
  } else if (goal.kind === "rookie") {
    const rookieCount = input.castIds.filter((id) => id >= 100).length;
    completed = rookieCount > 0 && input.gross >= input.breakEvenGross;
    progress = (rookieCount > 0 ? .5 : 0) + (input.gross >= input.breakEvenGross ? .5 : Math.min(.49, input.gross / input.breakEvenGross * .5));
    label = `${rookieCount ? `新人 ${rookieCount} 位` : "未使用新人"} · ${input.gross >= input.breakEvenGross ? "已回本" : "未回本"}`;
  } else if (goal.kind === "budget") {
    const underBudget = input.totalCost <= goal.target;
    const brokeEven = input.gross >= input.breakEvenGross;
    completed = underBudget && brokeEven;
    progress = (underBudget ? .5 : Math.max(0, .5 - (input.totalCost - goal.target) / goal.target)) + (brokeEven ? .5 : Math.min(.49, input.gross / input.breakEvenGross * .5));
    label = `投资 ¥${(input.totalCost / 10000).toFixed(2)}亿 · ${brokeEven ? "已回本" : "未回本"}`;
  } else {
    const rightGenre = input.genre === goal.targetGenre;
    completed = rightGenre && input.audienceScore * 10 >= goal.target;
    progress = (rightGenre ? .5 : 0) + Math.min(.5, input.audienceScore * 10 / goal.target * .5);
    label = `${rightGenre ? goal.targetGenre : input.genre} · 评分 ${input.audienceScore.toFixed(1)}`;
  }
  return {
    completed,
    progress: Math.max(0, Math.min(1, progress)),
    progressLabel: label,
    explanation: completed ? `年度委托完成：${goal.title}。公司建立了新的成功样本。` : `年度委托未完成：${label}。方向有效，但还差最后一段执行力。`,
    reward: completed ? goal.reward : zeroReward,
  };
}

export type ProductionChoice = "safe" | "bold";
export type ProductionStage = "开机" | "中期" | "后期";
export type ProductionEffect = {
  label: string;
  hint: string;
  quality: number;
  market: number;
  cost: number;
  morale: number;
  scheduleRisk: number;
  nextQuality: number;
  nextCost: number;
  consequence: string;
};
export type ProductionChainEvent = {
  id: string;
  stage: ProductionStage;
  title: string;
  description: string;
  safe: ProductionEffect;
  bold: ProductionEffect;
};
export type ProductionTotals = { quality: number; market: number; cost: number; morale: number; scheduleRisk: number; resolved: number; notes: string[] };

const productionTemplates: Record<ProductionStage, Omit<ProductionChainEvent, "id" | "stage">[]> = {
  开机: [
    { title: "主景搭建进度落后", description: "美术组给出两种可控方案：缩减镜头规模，或追加夜班保住原设计。", safe: { label: "缩减主景", hint: "零追加 · 控制档期风险", quality: 0, market: 0, cost: 0, morale: 1, scheduleRisk: -1, nextQuality: 0, nextCost: 0, consequence: "精简设计让拍摄回到计划，后续不再承担赶工风险。" }, bold: { label: "追加夜班", hint: "追加 ¥400万 · 质量 +2 · 热度 -2", quality: 2, market: -2, cost: 400, morale: -1, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "资源集中在未曝光的主景，宣传启动略有延后。" } },
    { title: "主演对角色理解出现分歧", description: "围读现场暴露了人物方向问题，现在解决成本最低。", safe: { label: "导演统一表演尺度", hint: "维持质量 · 士气稳定", quality: 0, market: 0, cost: 0, morale: 1, scheduleRisk: 0, nextQuality: 0, nextCost: 0, consequence: "人物方向被及时统一，项目按原计划进入中期。" }, bold: { label: "加做角色工作坊", hint: "追加 ¥350万 · 质量 +2 · 热度 -2", quality: 2, market: -2, cost: 350, morale: 3, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "深度磨合提升表演，但工作坊让前期宣传出现空窗。" } },
    { title: "连续暴雨冲击外景计划", description: "天气预警覆盖原定外景周期，剧组必须在替代场景和等待天光之间选择。", safe: { label: "转入棚内拍摄", hint: "零追加 · 热度 -1 · 档期风险 -1", quality: 0, market: -1, cost: 0, morale: 1, scheduleRisk: -1, nextQuality: 0, nextCost: 0, consequence: "棚拍牺牲少量话题性，但拍摄周期重新可控。" }, bold: { label: "等待天气抢拍实景", hint: "追加 ¥450万 · 质量 +2 · 热度 -3", quality: 2, market: -3, cost: 450, morale: -1, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "实景质感得到保留，但宣传物料交付延后。" } },
    { title: "器材运输报价临时上涨", description: "核心摄影设备因运输紧张涨价，制片组需要决定是否保留原工业方案。", safe: { label: "改用本地设备", hint: "零追加 · 维持质量", quality: 0, market: 0, cost: 0, morale: 0, scheduleRisk: 0, nextQuality: 0, nextCost: 0, consequence: "团队调整分镜适配本地设备，项目按预算推进。" }, bold: { label: "补齐原定设备", hint: "追加 ¥425万 · 质量 +2 · 热度 -2", quality: 2, market: -2, cost: 425, morale: 1, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "工业方案完整保留，但器材延期使物料热度下降。" } },
  ],
  中期: [
    { title: "核心场面试拍反馈分化", description: "内部样片证明概念成立，但节奏和传播性无法同时拉满。", safe: { label: "优先梳理叙事", hint: "质量 +1 · 热度 -1 · 后期质量 +1", quality: 1, market: -1, cost: 0, morale: 1, scheduleRisk: -1, nextQuality: 1, nextCost: 0, consequence: "叙事底盘更稳：后期剪辑质量收益 +1。" }, bold: { label: "强化视觉名场面", hint: "追加 ¥700万 · 质量 +3 · 热度 +4", quality: 3, market: 4, cost: 700, morale: 0, scheduleRisk: 1, nextQuality: 0, nextCost: 300, consequence: "物料提前出圈，但后期制作标准提高，成本 +¥300万。" } },
    { title: "两位主演的即兴片段出圈", description: "宣发组可以克制保密，也可以提前释放角色关系物料。", safe: { label: "保留正片惊喜", hint: "质量 +1 · 档期风险 -1 · 后期质量 +1", quality: 1, market: 0, cost: 0, morale: 1, scheduleRisk: -1, nextQuality: 1, nextCost: 0, consequence: "素材保密完整：后期成片质量收益 +1。" }, bold: { label: "剪出先导特辑", hint: "追加 ¥450万 · 质量 +3 · 热度 +6", quality: 3, market: 6, cost: 450, morale: 2, scheduleRisk: 1, nextQuality: 0, nextCost: 250, consequence: "讨论提前升温，但后期物料标准提高，成本 +¥250万。" } },
    { title: "主演连续夜戏后状态下滑", description: "表演完成度开始波动，继续赶工和调整拍摄顺序会带来不同代价。", safe: { label: "调整通告恢复状态", hint: "质量 +1 · 档期风险 -1 · 后期质量 +1", quality: 1, market: 0, cost: 0, morale: 2, scheduleRisk: -1, nextQuality: 1, nextCost: 0, consequence: "演员状态恢复，后期可多保留一组有效镜头。" }, bold: { label: "增派双组抢拍", hint: "追加 ¥800万 · 质量 +3 · 热度 +5", quality: 3, market: 5, cost: 800, morale: -2, scheduleRisk: 1, nextQuality: 0, nextCost: 250, consequence: "双组素材形成宣传话题，但后期整理追加 ¥250万。" } },
    { title: "核心场地临时收回许可", description: "场地方要求提前结束拍摄，现有镜头还缺少一场关键戏。", safe: { label: "改写为室内场景", hint: "质量 +1 · 热度 -1 · 后期质量 +1", quality: 1, market: -1, cost: 0, morale: 0, scheduleRisk: -1, nextQuality: 1, nextCost: 0, consequence: "改写保证因果完整，后期获得一组可用衔接镜头。" }, bold: { label: "租下场地延时拍摄", hint: "追加 ¥750万 · 质量 +3 · 热度 +4", quality: 3, market: 4, cost: 750, morale: 1, scheduleRisk: 1, nextQuality: 0, nextCost: 200, consequence: "关键场面成为宣传名片，场地与夜班再追加 ¥200万。" } },
  ],
  后期: [
    { title: "首次内部试映完成", description: "观众能看懂故事，但团队必须决定保交付还是继续精修。", safe: { label: "锁定版本按期交付", hint: "维持质量 · 档期风险 -2", quality: 0, market: 0, cost: 0, morale: 1, scheduleRisk: -2, nextQuality: 0, nextCost: 0, consequence: "版本按期锁定，档期风险被压低。" }, bold: { label: "补拍关键转折", hint: "追加 ¥900万 · 质量 +3 · 热度 -1", quality: 3, market: -1, cost: 900, morale: -1, scheduleRisk: 2, nextQuality: 0, nextCost: 0, consequence: "关键转折更完整，但宣发物料延期、上映档期承压。" } },
    { title: "终剪版出现两种方向", description: "短版更商业，长版的人物弧光更完整。", safe: { label: "采用紧凑院线版", hint: "质量 +1 · 热度 +2 · 档期风险 -1", quality: 1, market: 2, cost: 0, morale: 0, scheduleRisk: -1, nextQuality: 0, nextCost: 0, consequence: "商业节奏清晰，发行沟通更顺畅。" }, bold: { label: "保留人物长版", hint: "追加 ¥500万 · 质量 +3 · 热度 +1", quality: 3, market: 1, cost: 500, morale: 2, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "人物完成度提高，但长版发行窗口更紧。" } },
    { title: "原创配乐交付超出预算", description: "临近混录，作曲团队给出基础版本与完整乐团录制两套交付方案。", safe: { label: "采用精简配器", hint: "维持质量 · 零追加 · 档期风险 -1", quality: 0, market: 0, cost: 0, morale: 0, scheduleRisk: -1, nextQuality: 0, nextCost: 0, consequence: "配乐按期交付，情绪功能完整但不追求额外声量。" }, bold: { label: "追加乐团录制", hint: "追加 ¥700万 · 质量 +3 · 热度 -1", quality: 3, market: -1, cost: 700, morale: 1, scheduleRisk: 1, nextQuality: 0, nextCost: 0, consequence: "声音完成度提高，但混录延期错过一轮物料传播。" } },
    { title: "审查意见要求调整关键段落", description: "意见并非不可解决，但删改幅度会影响主题表达和交付时间。", safe: { label: "重剪争议段落", hint: "质量 +1 · 热度 -1 · 档期风险 -2", quality: 1, market: -1, cost: 0, morale: -1, scheduleRisk: -2, nextQuality: 0, nextCost: 0, consequence: "项目顺利取得发行条件，表达变得更克制。" }, bold: { label: "补拍替代叙事", hint: "追加 ¥850万 · 质量 +3 · 热度 -2", quality: 3, market: -2, cost: 850, morale: 0, scheduleRisk: 2, nextQuality: 0, nextCost: 0, consequence: "主题表达被保住，但补拍导致宣传节奏后移。" } },
  ],
};

function stableHash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

export type ProductionContext = { genre?: string; budget?: string };

export function generateProductionChain(castIds: number[], year: number, context: ProductionContext = {}): ProductionChainEvent[] {
  const yearIndex = Math.max(0, Math.floor(year) - 1);
  return (["开机", "中期", "后期"] as ProductionStage[]).map((stage, index) => {
    const templates = productionTemplates[stage];
    const stageSalt = ["weather-47", "crew-131", "post-283"][index];
    const yearOffset = [yearIndex, Math.floor(yearIndex / 4), Math.floor(yearIndex / 2)][index];
    const contextSeed = stableHash(`${stageSalt}:${stage}:${castIds.join("-")}:${context.genre ?? "any"}:${context.budget ?? "any"}`);
    const template = templates[(contextSeed + yearOffset) % templates.length];
    return { ...template, id: `${year}-${index}-${stableHash(template.title)}`, stage };
  });
}

export function resolveProductionChain(events: ProductionChainEvent[], choices: (ProductionChoice | null)[]): ProductionTotals {
  const totals: ProductionTotals = { quality: 0, market: 0, cost: 0, morale: 0, scheduleRisk: 0, resolved: 0, notes: [] };
  let carryQuality = 0;
  let carryCost = 0;
  events.forEach((event, index) => {
    const choice = choices[index];
    if (!choice) return;
    const effect = event[choice];
    totals.quality += effect.quality + carryQuality;
    totals.market += effect.market;
    totals.cost += effect.cost + carryCost;
    totals.morale += effect.morale;
    totals.scheduleRisk += effect.scheduleRisk;
    totals.resolved += 1;
    totals.notes.push(effect.consequence);
    carryQuality = effect.nextQuality;
    carryCost = effect.nextCost;
  });
  return totals;
}

export type AwardCategory = "年度最佳影片" | "最佳导演" | "最佳表演" | "最佳银幕搭档" | "观众选择奖";
export type AwardNomination = { category: AwardCategory; nominated: boolean; won: boolean; playerScore: number; rivalTitle: string; rivalScore: number; note: string };
export type AwardInput = { year: number; quality: number; directorSkill: number; fit: number; acting: number; chemistry: number; audienceScore: number; pictureBonus?: number; directorBonus?: number; actingBonus?: number; chemistryBonus?: number };

export function awardWinCap(input: Pick<AwardInput, "quality" | "acting" | "audienceScore">) {
  return input.quality >= 94 && input.audienceScore >= 9.2 && input.acting >= 94 ? 3 : 2;
}

export function judgeAwards(input: AwardInput, competitors: { title: string; strength: number }[]): AwardNomination[] {
  const categories: { category: AwardCategory; score: number; floor: number }[] = [
    { category: "年度最佳影片", score: input.quality + (input.pictureBonus ?? 0), floor: 82 },
    { category: "最佳导演", score: input.directorSkill + input.fit * .28 + (input.directorBonus ?? 0), floor: 84 },
    { category: "最佳表演", score: input.acting + (input.actingBonus ?? 0), floor: 86 },
    { category: "最佳银幕搭档", score: input.chemistry + (input.chemistryBonus ?? 0), floor: 86 },
    { category: "观众选择奖", score: input.audienceScore * 10, floor: 82 },
  ];
  const provisional = categories.map(({ category, score, floor }, categoryIndex) => {
    const rivals = competitors.map((movie, rivalIndex) => ({
      title: movie.title,
      score: Math.max(76, Math.min(98, movie.strength + ((stableHash(`${input.year}:${category}:${rivalIndex}`) % 13) - 5))),
    })).sort((a, b) => b.score - a.score);
    const rival = rivals[0] ?? { title: "《无名佳作》", score: 88 + categoryIndex };
    const playerScore = Math.round(score * 10) / 10;
    const nominated = playerScore >= floor && playerScore >= rival.score - 6;
    const won = nominated && playerScore > rival.score + (categoryIndex === 0 ? 1 : 0);
    const missNote = playerScore < floor
      ? `距离提名线仍差 ${(floor - playerScore).toFixed(1)}，本届标杆是《${rival.title}》。`
      : `达到基础门槛，但与《${rival.title}》的终选表现仍差 ${(rival.score - playerScore).toFixed(1)}。`;
    return { category, nominated, won, playerScore, rivalTitle: rival.title, rivalScore: rival.score, note: won ? `以 ${playerScore.toFixed(1)} 的评审表现击败《${rival.title}》。` : nominated ? `进入终选，最终以 ${playerScore.toFixed(1)} 比 ${rival.score.toFixed(1)} 惜败《${rival.title}》。` : missNote };
  });
  const winners = provisional.filter((item) => item.won).sort((a, b) => (b.playerScore - b.rivalScore) - (a.playerScore - a.rivalScore)).slice(0, awardWinCap(input)).map((item) => item.category);
  return provisional.map((item) => item.won && !winners.includes(item.category) ? { ...item, won: false, note: `获得提名；评委会最终将席位留给《${item.rivalTitle}》，继续提高该项优势即可冲奖。` } : item);
}
