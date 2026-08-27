export type RouteFunction = "core" | "reinforce" | "convert" | "venture";

export type ScriptDownstream = {
  budgetCostMultiplier: number;
  castingCostMultiplier: number;
  contentQuality: number;
  wordOfMouth: number;
  openingPower: number;
  retention: number;
  starPowerMultiplier: number;
  awardPicture: number;
  awardDirector: number;
  awardActing: number;
  libraryMultiplier: number;
  ensemble: boolean;
};

export type CoreStyle = {
  id: string;
  genre: string;
  name: string;
  pitch: string;
  keyword: string;
  engine: string;
  trait: string;
  preferredProfiles: string[];
  conflictProfiles: string[];
  downstream: ScriptDownstream;
  effects: string[];
};

export type BuildOptionMeta = {
  keyword: string;
  connectionKey: string;
  alignment: string[];
  routeFunction: RouteFunction;
  addsFlaw?: string;
  repairsFlaw?: string;
  relation: string;
};

export type BuildOptionShape = BuildOptionMeta & { id: string; profile: string };
export type BuildQuestionShape = { id: string; options: BuildOptionShape[] };

export type ScriptConnection = { id: string; name: string; keywords: [string, string]; trait: string; downstream: Partial<ScriptDownstream>; effects: string[] };
export type ScriptBuild = {
  core: CoreStyle | null;
  keywords: string[];
  connections: ScriptConnection[];
  activeEngines: string[];
  unresolvedFlaws: string[];
  repairedFlaws: string[];
  conflicts: string[];
  finalTraits: string[];
  buildName: string;
  alignedChoices: number;
  closure: boolean;
  downstream: ScriptDownstream;
  appliedEffects: string[];
  nextConnections: { name: string; missingKeyword: string }[];
  events: string[];
};

const neutralDownstream: ScriptDownstream = {
  budgetCostMultiplier: 1,
  castingCostMultiplier: 1,
  contentQuality: 0,
  wordOfMouth: 0,
  openingPower: 0,
  retention: 0,
  starPowerMultiplier: 1,
  awardPicture: 0,
  awardDirector: 0,
  awardActing: 0,
  libraryMultiplier: 1,
  ensemble: false,
};

const d = (values: Partial<ScriptDownstream>): ScriptDownstream => ({ ...neutralDownstream, ...values });
const core = (genre: string, id: string, name: string, pitch: string, keyword: string, engine: string, trait: string, preferredProfiles: string[], conflictProfiles: string[], downstream: Partial<ScriptDownstream>, effects: string[]): CoreStyle => ({
  genre, id, name, pitch, keyword, engine, trait, preferredProfiles, conflictProfiles, downstream: d(downstream), effects,
});

export const coreStylesByGenre: Record<string, CoreStyle[]> = {
  "犯罪悬疑": [
    core("犯罪悬疑", "crime-deduction", "本格推理", "让观众与侦探公平竞赛，所有答案都藏在镜头里。", "公平线索", "严密诡计", "封闭空间", ["story", "balanced", "safe"], ["spectacle"], { budgetCostMultiplier: .92, contentQuality: 1, wordOfMouth: 2, openingPower: -1, awardPicture: 1 }, ["场景成本 -8%", "口碑 +2，但更依赖主演默契"]),
    core("犯罪悬疑", "crime-social", "社会派悬疑", "从案件切开城市结构，让每个配角都握着一块真相。", "现实切面", "群像余震", "群像叙事", ["original", "character", "balanced"], ["safe"], { ensemble: true, starPowerMultiplier: .75, openingPower: -2, wordOfMouth: 2, awardPicture: 3, awardDirector: 3, libraryMultiplier: 1.08 }, ["启用配角班底", "最佳影片/导演评审 +3", "片库长尾 +8%"]),
    core("犯罪悬疑", "crime-hunt", "猫鼠追凶", "把调查者与对手都拍成明星角色，以追逐不断交换优势。", "双雄对峙", "猎手换位", "明星角色", ["market", "character", "story"], ["safe"], { castingCostMultiplier: 1.06, openingPower: 3, starPowerMultiplier: 1.12, awardActing: 2 }, ["核心主演成本 +6%", "明星首映号召权重提高", "表演评审 +2"]),
  ],
  "都市爱情": [
    core("都市爱情", "love-concept", "高概念爱情", "用一句话能讲清的奇遇，制造浪漫传播钩子。", "爱情设定", "命运回环", "非线性结构", ["market", "original", "story"], ["safe"], { openingPower: 3, wordOfMouth: -1, awardDirector: 1, retention: .005 }, ["首映话题 +3", "导演评审 +1", "若收束不足口碑承压"]),
    core("都市爱情", "love-reality", "现实关系", "把住房、工作与迁徙写进感情选择。", "现实压力", "生活剖面", "现实议题", ["character", "balanced", "original"], ["spectacle"], { openingPower: -2, wordOfMouth: 2, awardPicture: 3, libraryMultiplier: 1.08 }, ["首映号召 -2、口碑 +2", "最佳影片评审 +3", "片库长尾 +8%"]),
    core("都市爱情", "love-healing", "治愈成长", "让关系成为两个人重新面对自己的契机。", "共同成长", "温柔回声", "开放结局", ["emotional", "character", "safe"], ["risky"], { wordOfMouth: 2, retention: .012, awardActing: 2, openingPower: -1 }, ["口碑与长线留存提高", "表演评审 +2", "首映号召略慢"]),
  ],
  "科幻冒险": [
    core("科幻冒险", "scifi-hard", "硬核科幻", "用可验证的规则推动每次选择，设定本身就是冲突。", "科学规则", "规则奇点", "封闭空间", ["story", "original", "balanced"], ["safe"], { budgetCostMultiplier: .94, contentQuality: 2, wordOfMouth: 1, awardDirector: 2 }, ["制作成本 -6%", "内容质量 +2", "导演评审 +2"]),
    core("科幻冒险", "scifi-spectacle", "奇观冒险", "以从未见过的世界和大场面兑现银幕价值。", "未知奇观", "银幕跃迁", "奇观驱动", ["spectacle", "market", "original"], ["safe"], { budgetCostMultiplier: 1.08, contentQuality: 2, openingPower: 4, starPowerMultiplier: .92 }, ["制作成本 +8%", "质量 +2、首映号召 +4", "单明星作用略降"]),
    core("科幻冒险", "scifi-human", "人文寓言", "让未来技术照见今天的人与制度。", "人性命题", "文明镜像", "现实议题", ["character", "original", "emotional"], ["spectacle"], { openingPower: -2, wordOfMouth: 3, awardPicture: 3, libraryMultiplier: 1.1 }, ["口碑 +3", "最佳影片评审 +3", "片库长尾 +10%"]),
  ],
  "动作战争": [
    core("动作战争", "action-tactical", "特种行动", "以空间、装备与时间差构成可读的战术博弈。", "战术协同", "零点行动", "封闭空间", ["story", "market", "balanced"], ["emotional"], { budgetCostMultiplier: .94, contentQuality: 1, openingPower: 2, wordOfMouth: 1 }, ["制作成本 -6%", "质量 +1、首映号召 +2", "强调团队默契"]),
    core("动作战争", "action-epic", "战争史诗", "用多线战场呈现集体命运，而非只追随一个英雄。", "多线战场", "众生战线", "群像叙事", ["spectacle", "balanced", "emotional"], ["safe"], { ensemble: true, starPowerMultiplier: .72, budgetCostMultiplier: 1.05, contentQuality: 2, awardPicture: 3, awardDirector: 3 }, ["启用配角班底", "制作成本 +5%、质量 +2", "最佳影片/导演评审 +3"]),
    core("动作战争", "action-revenge", "孤胆复仇", "围绕一个不可替代的明星角色推进高强度行动。", "复仇执念", "孤锋燃点", "明星角色", ["character", "market", "spectacle"], ["balanced"], { castingCostMultiplier: 1.08, starPowerMultiplier: 1.14, openingPower: 4, awardActing: 2, wordOfMouth: -1 }, ["核心主演成本 +8%", "首映号召 +4", "表演评审 +2但口碑 -1"]),
  ],
  "合家欢喜剧": [
    core("合家欢喜剧", "comedy-farce", "疯狂闹剧", "让误会与行动后果层层升级，最终在同一场面爆炸。", "连锁误会", "失控狂欢", "强反转", ["market", "story", "risky"], ["emotional"], { openingPower: 4, wordOfMouth: -1, retention: -.005, starPowerMultiplier: .95 }, ["首映讨论 +4", "伏笔不足会伤口碑", "单明星作用略降"]),
    core("合家欢喜剧", "comedy-family", "温情家庭", "让笑点来自家人之间真实又别扭的相处。", "家庭旧账", "合家回声", "群像叙事", ["emotional", "character", "balanced"], ["risky"], { ensemble: true, starPowerMultiplier: .78, wordOfMouth: 2, retention: .012, awardPicture: 2 }, ["启用配角班底", "口碑与长线提高", "最佳影片评审 +2"]),
    core("合家欢喜剧", "comedy-road", "公路喜剧", "让一段不断变化的旅程重组临时家庭。", "旅途搭档", "沿途变奏", "系列化世界观", ["balanced", "market", "character"], ["safe"], { budgetCostMultiplier: .97, openingPower: 2, libraryMultiplier: 1.12, retention: .006 }, ["制作成本 -3%、首映号召 +2", "片库长尾 +12%", "适合系列开发"]),
  ],
  "历史传记": [
    core("历史传记", "history-power", "权谋传记", "让制度与选择互相绞紧，以胜负展示人物代价。", "权力棋局", "暗线合围", "非线性结构", ["story", "original", "character"], ["safe"], { contentQuality: 1, wordOfMouth: 1, awardDirector: 3, openingPower: -1 }, ["质量/口碑 +1", "导演评审 +3", "首映号召略慢"]),
    core("历史传记", "history-ensemble", "时代群像", "以多个人的命运拼成时代，而两位核心主演负责锚定叙事。", "时代众生", "群像史潮", "群像叙事", ["balanced", "original", "emotional"], ["market"], { ensemble: true, starPowerMultiplier: .7, wordOfMouth: 2, awardPicture: 4, awardDirector: 3, libraryMultiplier: 1.1 }, ["启用配角班底", "最佳影片 +4/导演 +3", "片库长尾 +10%"]),
    core("历史传记", "history-portrait", "人物史诗", "把时代压在一个人的选择上，塑造不可替代的表演角色。", "命运肖像", "一生回望", "明星角色", ["character", "emotional", "story"], ["spectacle"], { castingCostMultiplier: 1.05, starPowerMultiplier: 1.08, awardActing: 4, wordOfMouth: 1, openingPower: 1 }, ["核心主演成本 +5%", "表演评审 +4", "口碑/首映号召 +1"]),
  ],
};

const keywordByProfile: Record<string, string> = {
  story: "严密因果", character: "人物弧光", market: "大众钩子", original: "陌生规则", balanced: "关系网络",
  emotional: "情绪余震", spectacle: "奇观场面", risky: "强反转", safe: "完整收束",
};

const genreKeywordByProfile: Record<string, Record<string, string>> = {
  "犯罪悬疑": { story: "证据链", character: "执念裂痕", market: "追凶钩子", original: "多视角真相", balanced: "嫌疑人网络", emotional: "正义余震", spectacle: "犯罪场面", risky: "身份反转", safe: "真相闭环" },
  "都市爱情": { story: "关系因果", character: "亲密弧光", market: "浪漫钩子", original: "爱情设定", balanced: "生活关系", emotional: "情感余韵", spectacle: "都市奇遇", risky: "关系反转", safe: "情感落点" },
  "科幻冒险": { story: "规则因果", character: "人性弧光", market: "概念钩子", original: "未来规则", balanced: "团队网络", emotional: "文明余响", spectacle: "星际奇观", risky: "认知反转", safe: "规则闭环" },
  "动作战争": { story: "战术因果", character: "英雄弧光", market: "行动钩子", original: "战场新规", balanced: "小队协同", emotional: "牺牲余波", spectacle: "战场奇观", risky: "阵营反转", safe: "任务收束" },
  "合家欢喜剧": { story: "笑料因果", character: "成长弧光", market: "传播笑点", original: "荒诞规则", balanced: "家庭关系", emotional: "温情余韵", spectacle: "喜剧场面", risky: "误会反转", safe: "合家收束" },
  "历史传记": { story: "史实因果", character: "命运弧光", market: "时代钩子", original: "争议视角", balanced: "人物网络", emotional: "时代余响", spectacle: "历史场面", risky: "史观反转", safe: "史诗收束" },
};

const functionByProfile: Record<string, RouteFunction> = {
  story: "reinforce", character: "reinforce", balanced: "reinforce", emotional: "reinforce", safe: "reinforce",
  market: "convert", original: "convert", spectacle: "venture", risky: "venture",
};

const flawByProfile: Record<string, string | undefined> = { risky: "伏笔缺口", spectacle: "人物单薄", market: "表达套路" };
const repairByProfile: Record<string, string | undefined> = { story: "伏笔缺口", character: "人物单薄", emotional: "人物单薄", original: "表达套路", safe: "结构松散", balanced: "结构松散" };

export const scriptConnections: ScriptConnection[] = [
  { id: "clue-turn", name: "反转闭环", keywords: ["严密因果", "强反转"], trait: "强反转", downstream: { openingPower: 2, wordOfMouth: 1, retention: -.005 }, effects: ["首映讨论 +2、口碑 +1", "反转前置使长线留存 -0.5%"] },
  { id: "people-heart", name: "众生余震", keywords: ["关系网络", "情绪余震"], trait: "群像叙事", downstream: { ensemble: true, budgetCostMultiplier: 1.03, starPowerMultiplier: .9, awardPicture: 1, awardDirector: 1 }, effects: ["启用群像班底、影片/导演评审 +1", "班底成本 +3%、明星首映号召权重下降"] },
  { id: "character-heart", name: "人物回响", keywords: ["人物弧光", "情绪余震"], trait: "开放结局", downstream: { openingPower: -1, wordOfMouth: 2, retention: .008 }, effects: ["口碑 +2、长线留存 +0.8%", "首映话题 -1"] },
  { id: "world-logic", name: "规则回收", keywords: ["陌生规则", "严密因果"], trait: "系列化世界观", downstream: { openingPower: -1, wordOfMouth: 1, libraryMultiplier: 1.06 }, effects: ["口碑 +1、片库长尾 +6%", "设定解释使首映号召 -1"] },
  { id: "market-spectacle", name: "银幕名片", keywords: ["大众钩子", "奇观场面"], trait: "奇观驱动", downstream: { budgetCostMultiplier: 1.06, openingPower: 3, wordOfMouth: -1 }, effects: ["首映话题 +3", "制作成本 +6%、人物口碑 -1"] },
  { id: "market-character", name: "明星角色", keywords: ["大众钩子", "人物弧光"], trait: "明星角色", downstream: { castingCostMultiplier: 1.04, starPowerMultiplier: 1.08, openingPower: 2, awardActing: 1 }, effects: ["明星首映号召权重提高、表演评审 +1", "核心主演成本 +4%"] },
  { id: "closure-heart", name: "完整余味", keywords: ["完整收束", "情绪余震"], trait: "现实议题", downstream: { openingPower: -1, wordOfMouth: 1, awardPicture: 1, libraryMultiplier: 1.03 }, effects: ["口碑/影片评审 +1、长尾 +3%", "克制收束使首映号召 -1"] },
];

const clamp = (minimum: number, maximum: number, value: number) => Math.max(minimum, Math.min(maximum, value));

export function mergeScriptDownstreams(...effects: Partial<ScriptDownstream>[]): ScriptDownstream {
  return effects.reduce<ScriptDownstream>((total, effect) => ({
    budgetCostMultiplier: clamp(.85, 1.18, total.budgetCostMultiplier * (effect.budgetCostMultiplier ?? 1)),
    castingCostMultiplier: clamp(.92, 1.18, total.castingCostMultiplier * (effect.castingCostMultiplier ?? 1)),
    contentQuality: clamp(-3, 4, total.contentQuality + (effect.contentQuality ?? 0)),
    wordOfMouth: clamp(-3, 5, total.wordOfMouth + (effect.wordOfMouth ?? 0)),
    openingPower: clamp(-5, 6, total.openingPower + (effect.openingPower ?? 0)),
    retention: clamp(-.02, .025, total.retention + (effect.retention ?? 0)),
    starPowerMultiplier: clamp(.68, 1.18, total.starPowerMultiplier * (effect.starPowerMultiplier ?? 1)),
    awardPicture: clamp(0, 5, total.awardPicture + (effect.awardPicture ?? 0)),
    awardDirector: clamp(0, 5, total.awardDirector + (effect.awardDirector ?? 0)),
    awardActing: clamp(0, 5, total.awardActing + (effect.awardActing ?? 0)),
    libraryMultiplier: clamp(1, 1.18, total.libraryMultiplier * (effect.libraryMultiplier ?? 1)),
    ensemble: total.ensemble || Boolean(effect.ensemble),
  }), neutralDownstream);
}

export function getCoreStyles(genre: string) {
  return coreStylesByGenre[genre] ?? coreStylesByGenre["犯罪悬疑"];
}

export function describeCoreStyle(style: CoreStyle) {
  const effect = style.downstream;
  const percent = (value: number) => Math.round(Math.abs(value - 1) * 100);
  const signed = (value: number) => `${value > 0 ? "+" : ""}${Number(value.toFixed(2))}`;
  const advantages: string[] = [];
  const costs: string[] = [];
  if (effect.ensemble) advantages.push("解锁群像班底");
  if (effect.budgetCostMultiplier < 1) advantages.push(`制作成本 -${percent(effect.budgetCostMultiplier)}%`);
  if (effect.budgetCostMultiplier > 1) costs.push(`制作成本 +${percent(effect.budgetCostMultiplier)}%`);
  if (effect.castingCostMultiplier < 1) advantages.push(`核心主演成本 -${percent(effect.castingCostMultiplier)}%`);
  if (effect.castingCostMultiplier > 1) costs.push(`核心主演成本 +${percent(effect.castingCostMultiplier)}%`);
  if (effect.contentQuality > 0) advantages.push(`成片质量 ${signed(effect.contentQuality)}`);
  if (effect.contentQuality < 0) costs.push(`成片质量 ${signed(effect.contentQuality)}`);
  if (effect.wordOfMouth > 0) advantages.push(`口碑 ${signed(effect.wordOfMouth)}`);
  if (effect.wordOfMouth < 0) costs.push(`口碑 ${signed(effect.wordOfMouth)}`);
  if (effect.openingPower > 0) advantages.push(`首映号召 ${signed(effect.openingPower)}`);
  if (effect.openingPower < 0) costs.push(`首映号召 ${signed(effect.openingPower)}`);
  if (effect.retention > 0) advantages.push(`长线留存 +${Number((effect.retention * 100).toFixed(1))}%`);
  if (effect.retention < 0) costs.push(`长线留存 ${Number((effect.retention * 100).toFixed(1))}%`);
  if (effect.starPowerMultiplier > 1) advantages.push(`明星首映号召权重 +${percent(effect.starPowerMultiplier)}%`);
  if (effect.starPowerMultiplier < 1) costs.push(`明星首映号召权重 -${percent(effect.starPowerMultiplier)}%`);
  if (effect.awardPicture > 0) advantages.push(`影片评审 +${effect.awardPicture}`);
  if (effect.awardDirector > 0) advantages.push(`导演评审 +${effect.awardDirector}`);
  if (effect.awardActing > 0) advantages.push(`表演评审 +${effect.awardActing}`);
  if (effect.libraryMultiplier > 1) advantages.push(`片库长尾 +${percent(effect.libraryMultiplier)}%`);
  return {
    advantages: advantages.length ? advantages : ["无额外数值优势"],
    costs: costs.length ? costs : ["无额外数值代价"],
  };
}

export function decorateRouteOption<T extends { profile: string }>(genre: string, option: T): T & BuildOptionMeta {
  const styles = getCoreStyles(genre);
  const connectionKey = keywordByProfile[option.profile] ?? "类型质感";
  const keyword = genreKeywordByProfile[genre]?.[option.profile] ?? connectionKey;
  const routeFunction = functionByProfile[option.profile] ?? "reinforce";
  return {
    ...option,
    keyword,
    connectionKey,
    routeFunction,
    alignment: styles.filter((style) => style.preferredProfiles.includes(option.profile)).map((style) => style.id),
    addsFlaw: flawByProfile[option.profile],
    repairsFlaw: repairByProfile[option.profile],
    relation: routeFunction === "venture" ? "高收益，但需要后续牌修复缺陷" : routeFunction === "convert" ? "可跨核心路线形成新连接" : "稳定强化当前完成度",
  };
}

export function deriveScriptBuild(answers: Record<string, string>, questions: BuildQuestionShape[], genre: string): ScriptBuild {
  const selected = questions.map((question) => question.options.find((option) => option.id === answers[question.id])).filter((option): option is BuildOptionShape => Boolean(option));
  const styles = getCoreStyles(genre);
  const coreOption = selected.find((option) => option.routeFunction === "core");
  const selectedCore = styles.find((style) => style.id === coreOption?.alignment[0]) ?? null;
  const routeOptions = selected.filter((option) => option.routeFunction !== "core");
  const keywords = [...new Set([...(selectedCore ? [selectedCore.keyword] : []), ...routeOptions.map((option) => option.keyword)])];
  const connectionKeys = [...new Set(routeOptions.map((option) => option.connectionKey))];
  const activeFlaws = new Set<string>();
  const repaired = new Set<string>();
  const eventNotes: string[] = [];
  let runningAlignment = 0;
  routeOptions.forEach((option) => {
    if (option.alignment.includes(selectedCore?.id ?? "")) runningAlignment += 1;
    if (option.repairsFlaw && activeFlaws.has(option.repairsFlaw)) {
      activeFlaws.delete(option.repairsFlaw);
      repaired.add(option.repairsFlaw);
      eventNotes.push(`缺陷修复：${option.repairsFlaw}`);
      return;
    }
    if (option.addsFlaw) {
      activeFlaws.add(option.addsFlaw);
      eventNotes.push(`新增缺陷：${option.addsFlaw}`);
      return;
    }
    if (option.alignment.includes(selectedCore?.id ?? "")) {
      eventNotes.push(runningAlignment >= 2 ? `核心共鸣已激活：${option.keyword}` : `连接形成：${option.keyword}（共鸣 1/2）`);
      return;
    }
    eventNotes.push(`跨流派连接：${option.keyword}`);
  });
  const unresolvedFlaws = [...activeFlaws];
  const repairedFlaws = [...repaired];
  const connections = scriptConnections.filter((connection) => connection.keywords.every((keyword) => connectionKeys.includes(keyword)));
  const nextConnections = scriptConnections.flatMap((connection) => {
    if (connections.includes(connection)) return [];
    const missing = connection.keywords.filter((keyword) => !connectionKeys.includes(keyword));
    if (missing.length !== 1) return [];
    const missingProfile = Object.entries(keywordByProfile).find(([, keyword]) => keyword === missing[0])?.[0];
    return [{ name: connection.name, missingKeyword: genreKeywordByProfile[genre]?.[missingProfile ?? ""] ?? missing[0] }];
  });
  const alignedChoices = selectedCore ? routeOptions.filter((option) => option.alignment.includes(selectedCore.id)).length : 0;
  const conflicts = selectedCore ? [...new Set(routeOptions.filter((option) => selectedCore.conflictProfiles.includes(option.profile)).map((option) => `「${keywordByProfile[option.profile]}」偏离${selectedCore.name}核心`))] : [];
  const closure = Boolean(routeOptions.at(-1)?.repairsFlaw || ["story", "character", "balanced", "emotional", "safe"].includes(routeOptions.at(-1)?.profile ?? ""));
  const activeEngines = selectedCore && alignedChoices >= 2 ? [selectedCore.engine, ...connections.map((connection) => connection.name)] : connections.map((connection) => connection.name);
  const finalTraits = [...new Set([...(selectedCore && alignedChoices >= 2 ? [selectedCore.trait] : []), ...connections.map((connection) => connection.trait)])];
  const suffix = connections[0]?.name ?? (activeEngines[0] ?? "未定稿");
  const buildName = selectedCore ? `${selectedCore.name}·${suffix}` : "尚未确定核心流派";
  const coreActivated = Boolean(selectedCore && alignedChoices >= 2);
  const downstream = mergeScriptDownstreams(...(coreActivated && selectedCore ? [selectedCore.downstream] : []), ...connections.map((connection) => connection.downstream));
  const coreDescription = selectedCore ? describeCoreStyle(selectedCore) : null;
  const appliedEffects = [...(coreActivated && selectedCore && coreDescription ? [`${selectedCore.name}优势：${coreDescription.advantages.join("、")}`, `${selectedCore.name}代价：${coreDescription.costs.join("、")}`] : []), ...connections.flatMap((connection) => connection.effects.map((effect) => `${connection.name}：${effect}`))];
  return {
    core: selectedCore,
    keywords,
    connections,
    activeEngines,
    unresolvedFlaws,
    repairedFlaws,
    conflicts,
    finalTraits,
    buildName,
    alignedChoices,
    closure,
    downstream,
    appliedEffects,
    nextConnections,
    events: eventNotes,
  };
}

export function scoreScriptBuild(build: ScriptBuild, dimensionAverage: number) {
  const engineBonus = build.core && build.alignedChoices >= 2 ? 6 : 0;
  const connectionBonus = Math.min(9, build.connections.length * 3);
  const closureBonus = build.closure ? 3 : -2;
  const dimensionAdjustment = Math.max(-2, Math.min(2, Math.round((dimensionAverage - 70) / 9)));
  const craftScore = Math.max(55, Math.min(94, Math.round(61 + build.alignedChoices * 3 + engineBonus + connectionBonus + closureBonus + dimensionAdjustment - build.unresolvedFlaws.length * 5 - build.conflicts.length * 3)));
  if (craftScore <= 66) return 55 + Math.round((craftScore - 55) * 16 / 11);
  if (craftScore <= 80) return 72 + Math.round((craftScore - 67) * 9 / 13);
  if (craftScore >= 86 && build.alignedChoices >= 4) return 90 + Math.min(4, Math.round((craftScore - 86) * 4 / 7));
  return 82 + Math.min(7, Math.round((craftScore - 81) * 7 / 12));
}

export function describeBuildChange(before: ScriptBuild, after: ScriptBuild) {
  const notes: string[] = [];
  const addedConnections = after.connections.filter((connection) => !before.connections.some((item) => item.id === connection.id));
  const lostConnections = before.connections.filter((connection) => !after.connections.some((item) => item.id === connection.id));
  const addedFlaws = after.unresolvedFlaws.filter((flaw) => !before.unresolvedFlaws.includes(flaw));
  const removedFlaws = before.unresolvedFlaws.filter((flaw) => !after.unresolvedFlaws.includes(flaw));
  const newlyRepairedFlaws = after.repairedFlaws.filter((flaw) => !before.repairedFlaws.includes(flaw));
  const reexposedFlaws = addedFlaws.filter((flaw) => before.repairedFlaws.includes(flaw) && !after.repairedFlaws.includes(flaw));
  const newRiskFlaws = addedFlaws.filter((flaw) => !reexposedFlaws.includes(flaw));
  const removedRiskFlaws = removedFlaws.filter((flaw) => !newlyRepairedFlaws.includes(flaw));
  const addedConflicts = after.conflicts.filter((conflict) => !before.conflicts.includes(conflict));
  const resolvedConflicts = before.conflicts.filter((conflict) => !after.conflicts.includes(conflict));
  if (after.core?.id !== before.core?.id) notes.push(after.core ? `核心流派改为「${after.core.name}」；共鸣 0/2` : "核心流派尚未确定");
  if (after.alignedChoices !== before.alignedChoices && after.core) notes.push(after.alignedChoices >= 2 ? `核心共鸣 2/2 已激活；同向强化 ${after.alignedChoices} 次` : `连接形成；核心共鸣 ${after.alignedChoices}/2`);
  if (addedConnections.length) notes.push(`连接新激活：${addedConnections.map((connection) => connection.name).join("、")}`);
  if (lostConnections.length) notes.push(`连接失去：${lostConnections.map((connection) => connection.name).join("、")}`);
  if (newRiskFlaws.length) notes.push(`新增缺陷：${newRiskFlaws.join("、")}`);
  if (reexposedFlaws.length) notes.push(`缺陷重新暴露：${reexposedFlaws.join("、")}`);
  if (newlyRepairedFlaws.length) notes.push(`缺陷修复：${newlyRepairedFlaws.join("、")}`);
  if (removedRiskFlaws.length) notes.push(`撤掉风险源，缺陷不再存在：${removedRiskFlaws.join("、")}`);
  if (addedConflicts.length) notes.push(`表达冲突增加：${addedConflicts.join("、")}`);
  if (resolvedConflicts.length) notes.push(`表达冲突化解：${resolvedConflicts.join("、")}`);
  return notes.join("；") || "本次选择调整了关键词，但未改变已激活组合。";
}

export function describeBeginnerBuildChange(before: ScriptBuild, after: ScriptBuild) {
  if (after.core?.id !== before.core?.id) return after.core ? `故事方向确定为「${after.core.name}」，接下来用选择让它逐渐成型。` : "故事方向尚未确定。";
  const newEngine = after.activeEngines.find((engine) => !before.activeEngines.includes(engine));
  if (newEngine) return `核心路线已经成型：解锁「${newEngine}」。`;
  const newConnection = after.connections.find((connection) => !before.connections.some((item) => item.id === connection.id));
  if (newConnection) return `发现意外组合：形成「${newConnection.name}」。`;
  const repairedFlaw = after.repairedFlaws.find((flaw) => !before.repairedFlaws.includes(flaw));
  if (repairedFlaw) return `前面的风险得到补救：「${repairedFlaw}」已解决。`;
  const newFlaw = after.unresolvedFlaws.find((flaw) => !before.unresolvedFlaws.includes(flaw));
  if (newFlaw) return `这个选择埋下了「${newFlaw}」风险，后面仍有机会补救。`;
  if (after.alignedChoices > before.alignedChoices) return "这个选择呼应了核心方向，路线变得更清晰。";
  return "故事获得了新的侧重，真正效果将在定稿时揭晓。";
}

export function normalizeSequentialScriptProgress(questionIds: string[], answers: Record<string, string>, savedCommittedCount?: number) {
  const normalizedAnswers: Record<string, string> = {};
  for (const questionId of questionIds) {
    if (!answers[questionId]) break;
    normalizedAnswers[questionId] = answers[questionId];
  }
  const answeredCount = Object.keys(normalizedAnswers).length;
  const lastQuestionIndex = Math.max(0, questionIds.length - 1);
  const inferredCommittedCount = Math.max(0, answeredCount - 1);
  const committedCount = Math.max(0, Math.min(lastQuestionIndex, answeredCount, savedCommittedCount ?? inferredCommittedCount));
  return { answers: normalizedAnswers, committedCount };
}

export function scriptQuestionState(questionIndex: number, committedCount: number) {
  return questionIndex < committedCount ? "locked" : questionIndex === committedCount ? "current" : "upcoming";
}

export function summarizeScriptDownstream(effect: ScriptDownstream) {
  const signed = (value: number) => `${value >= 0 ? "+" : ""}${Number(value.toFixed(2))}`;
  const summary: string[] = [];
  if (effect.budgetCostMultiplier !== 1) summary.push(`制作成本 ×${effect.budgetCostMultiplier.toFixed(2)}`);
  if (effect.castingCostMultiplier !== 1) summary.push(`主创成本 ×${effect.castingCostMultiplier.toFixed(2)}`);
  if (effect.contentQuality) summary.push(`成片质量 ${signed(effect.contentQuality)}`);
  if (effect.wordOfMouth) summary.push(`口碑 ${signed(effect.wordOfMouth)}`);
  if (effect.openingPower) summary.push(`首映号召 ${signed(effect.openingPower)}`);
  if (effect.retention) summary.push(`长线留存 ${signed(effect.retention * 100)}%`);
  if (effect.starPowerMultiplier !== 1) summary.push(`明星首映号召权重 ×${effect.starPowerMultiplier.toFixed(2)}`);
  if (effect.awardPicture) summary.push(`影片评审 ${signed(effect.awardPicture)}`);
  if (effect.awardDirector) summary.push(`导演评审 ${signed(effect.awardDirector)}`);
  if (effect.awardActing) summary.push(`表演评审 ${signed(effect.awardActing)}`);
  if (effect.libraryMultiplier !== 1) summary.push(`片库收益 ×${effect.libraryMultiplier.toFixed(2)}`);
  if (effect.ensemble) summary.push("启用群像班底");
  return summary.length ? summary : ["中性结算，无额外修正"];
}

export function getScriptDownstream(report?: { build?: { downstream?: ScriptDownstream } } | null): ScriptDownstream {
  return report?.build?.downstream ? { ...neutralDownstream, ...report.build.downstream } : neutralDownstream;
}

export type EnsembleCastId = "lean" | "veteran" | "rookie";
export type EnsembleCastOption = { id: EnsembleCastId; name: string; cost: number; baseActing: number; awardBonus: number; description: string };

export const ensembleCastOptions: EnsembleCastOption[] = [
  { id: "lean", name: "精简群像", cost: 0, baseActing: 72, awardBonus: 0, description: "零追加 · 班底72 · 质量+0 · 群像奖项/长尾发挥65%。" },
  { id: "veteran", name: "实力派群像", cost: 1200, baseActing: 90, awardBonus: 3, description: "追加成本最高 · 班底90 · 质量+2 · 群像评审+3 · 增益发挥110%。" },
  { id: "rookie", name: "新人群像", cost: 300, baseActing: 78, awardBonus: 1, description: "低成本 · 班底78 · 质量+1 · 群像评审+1；擅长新人导演额外强化。" },
];

export function normalizeEnsembleCast(id?: string | null): EnsembleCastId {
  return ensembleCastOptions.some((option) => option.id === id) ? id as EnsembleCastId : "lean";
}

export function resolveEnsembleCast(id: EnsembleCastId | string | null | undefined, leadActing: number, chemistry: number, directorSkill: number, directorTrait = "") {
  const option = ensembleCastOptions.find((candidate) => candidate.id === normalizeEnsembleCast(id)) ?? ensembleCastOptions[0];
  const rookieDirector = option.id === "rookie" && directorTrait.includes("擅长新人");
  const supportingActing = option.baseActing + (rookieDirector ? 10 : option.id === "rookie" && directorSkill < 82 ? -5 : 0);
  const acting = leadActing * .55 + supportingActing * .25 + directorSkill * .2;
  const coordination = chemistry * .55 + supportingActing * .25 + directorSkill * .2 + (rookieDirector ? 4 : option.id === "veteran" ? 2 : 0);
  return {
    option,
    acting: Math.round(acting * 10) / 10,
    coordination: Math.max(40, Math.min(99, Math.round(coordination))),
    awardBonus: option.awardBonus + (rookieDirector ? 2 : 0),
    qualityBonus: option.id === "veteran" ? 2 : rookieDirector ? 2 : option.id === "rookie" ? 1 : 0,
    starPowerMultiplier: option.id === "lean" ? .86 : option.id === "veteran" ? .8 : .83,
    ensembleEffectScale: option.id === "lean" ? .65 : option.id === "veteran" ? 1.1 : rookieDirector ? 1.05 : .85,
    synergy: rookieDirector ? "擅长新人联动：班底表演 +10、协调 +4、群像增益发挥105%" : option.id === "veteran" ? "实力派稳定：质量 +2、群像评审 +3、增益发挥110%" : option.id === "rookie" ? "导演技能不足82时班底表演 -5；群像增益发挥85%" : "零追加成本；群像奖项与长尾增益发挥65%",
  };
}

export function resolveEnsembleDownstream(effect: ScriptDownstream, performance?: { ensembleEffectScale: number; qualityBonus: number; awardBonus: number; starPowerMultiplier: number } | null) {
  const scale = performance?.ensembleEffectScale ?? 1;
  return {
    qualityBonus: clamp(-3, 6, effect.contentQuality * scale + (performance?.qualityBonus ?? 0)),
    wordOfMouthBonus: clamp(-3, 5, effect.wordOfMouth * scale),
    pictureBonus: clamp(0, 6, effect.awardPicture * scale + (performance?.awardBonus ?? 0)),
    directorBonus: clamp(0, 6, effect.awardDirector * scale + (performance?.awardBonus ?? 0)),
    libraryMultiplier: clamp(1, 1.18, 1 + (effect.libraryMultiplier - 1) * scale),
    starPowerMultiplier: performance?.starPowerMultiplier ?? effect.starPowerMultiplier,
  };
}
