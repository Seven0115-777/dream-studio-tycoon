"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionBar, GameHeader, Metric, ResultStat, ScreenHead as PageHead, SectionTitle, StageProgress } from "./components/mobile-ui";
import { calculateCompetitionPressure, generateCompetitors, type CompetitorMovie } from "./competition-system";
import { annualInvestmentAmount, boxOfficeSettlementTarget, buildContentModel, buildReleaseModel, calculateCareerRewards, projectPaymentDelta, scheduleRiskMultiplier, settleAnnualCompanyCash, studioReachMultiplier, yearlyOperatingCost } from "./economy";
import { evolveDirectorMarket, evolveGenreMarket, type MarketDirector } from "./market-system";
import { evaluateScript, getScriptQuestions, rewriteScript, type RewriteDirection, type ScriptReport } from "./script-engine";
import { deriveScriptBuild, describeBuildChange, ensembleCastOptions, getScriptDownstream, normalizeEnsembleCast, resolveEnsembleCast, resolveEnsembleDownstream, summarizeScriptDownstream, type EnsembleCastId } from "./script-build-system";
import { awardWinCap, calculateLibraryIncome, evaluateAnnualGoal, generateAnnualGoals, generateProductionChain, getProductionChoiceState, judgeAwards, resolveProductionChain, type AwardNomination, type GoalOutcome, type ProductionChoice } from "./game-systems";
import { calculateReturningCastPremium, createFilmHistoryRecord, eligibleIpSources, expectationWordOfMouth, findIpSource, ipRoutes, isIpEligible, normalizeFilmHistory, resolveIpProjectEffects, routeName, suggestIpTitle, type FilmHistoryRecord, type IpProjectSelection, type IpRouteId } from "./ip-system";
import { actorTier, ageAppealDecline, agencyCapacity, buildRookieMarket, currentActorAge, externalAgencyIncome, generateTalentNews, isMatureMarketEligible, matureContractQuote, retirementAge, rookieCandidates, rookieCareerSalary, rookieContractQuote, rookieExposureAppealGain, rookiePerformanceFee, talentMarketRoll, talentRenewalQuote, tierOpeningBonus, tierRank, tierScriptThreshold, trainingCapacity, trainingGain, uniqueGenres, type AgencyActor, type AgencyLedger, type AgencyProfile, type RookieCandidate, type TalentContract } from "./talent-system";

type Genre = { name: string; icon: string; heat: number; color: string; heatChange?: number; marketNote?: string };
type Director = MarketDirector;
type Actor = AgencyActor;
type DailyReport = { day: number; boxOffice: number; change: number | null; audienceScore: number; positiveRate: number; momentum: string; headline: string; audienceReaction: string; internetReaction: string; hotTopic: string };
type PublicityContext = { director: Director; cast: Actor[]; genre: string; quality: number; honors: Record<number, string[]> };
type Result = { quality: number; gross: number; profit: number; score: number; audience: number; days: number[]; monthDays: number[]; weekGross: number; tailGross: number; studioRevenue: number; investorShare?: number; investmentAmount?: number; successBonus: number; breakEvenGross: number; overheadCost: number; dailyReports: DailyReport[]; awards: string[]; nominations?: AwardNomination[]; awardCap?: number; goalOutcome?: GoalOutcome; xpGain: number; reputationGain: number; reachUsed: number; wordOfMouth: number; openingPower: number; retention: number; trend: string; trendNote: string; competitionPressure: number; scheduleRisk?: number; scheduleEfficiency?: number; libraryMultiplier?: number; buildName?: string; filmRecord?: FilmHistoryRecord };
type ActorProfile = AgencyProfile;
type Deal = { fee: number; morale: number; label: string };
type CompanyTab = "roster" | "market" | "rookies";
type SigningTarget = { actor: Actor; origin: "mature" | "rookie"; rookie?: RookieCandidate };
type UtilityRoom = "agency" | null;
type PortraitGroup = "director" | "actor" | "rookie";

const ASSET_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const assetUrl = (path: string) => `${ASSET_BASE}${path}`;
const mobileSceneAssets = [
  "studio-hub-mobile-v1.webp",
  "project-room-mobile-v1.webp",
  "writers-room-mobile-v1.webp",
  "casting-room-mobile-v1.webp",
  "filming-stage-mobile-v1.webp",
  "release-room-mobile-v1.webp",
  "premiere-cinema-full-mobile-v2.webp",
  "talent-agency-mobile-v1.webp",
];

type LocalGameSave = {
  version: 1;
  year: number;
  cash: number;
  studioXp: number;
  reputation: number;
  stage: number;
  title: string;
  genreName: string;
  budgetName: string;
  scriptAnswers: Record<string, string>;
  scriptReport: ScriptReport | null;
  directorId: number | null;
  genreMarket?: Genre[];
  directorPool?: Director[];
  actorPool: Actor[];
  castIds: number[];
  ensembleCastId?: EnsembleCastId;
  deals: Record<number, Deal>;
  eventChoice?: "safe" | "bold" | null;
  productionChoices?: (ProductionChoice | null)[];
  productionLocked?: boolean;
  annualGoalId?: string | null;
  annualGoalLocked?: boolean;
  rewriteCost?: number;
  rewriteMarketDelta?: number;
  slotId: string;
  promoName: string;
  result: Result | null;
  revealedDays: number;
  boxOfficeCashCredited?: number;
  boxOfficeSettlementLocked?: boolean;
  signedTalents: TalentContract[];
  agencyLedger: AgencyLedger | null;
  actorHonors?: Record<number, string[]>;
  investmentClaimedYear?: number | null;
  rookieRefreshYear?: number | null;
  rookieAlumniIds?: number[];
  expiryReminderDismissedYear?: number | null;
  projectCostPaid?: number;
  ipRoute?: IpRouteId;
  ipSourceId?: string | null;
  history: FilmHistoryRecord[];
};

const SAVE_KEY = "dream-studio-save-v1";

const genres: Genre[] = [
  { name: "犯罪悬疑", icon: "⌕", heat: 86, color: "#de542b" },
  { name: "都市爱情", icon: "♡", heat: 72, color: "#d97793" },
  { name: "科幻冒险", icon: "✦", heat: 91, color: "#367f89" },
  { name: "动作战争", icon: "⚑", heat: 82, color: "#936137" },
  { name: "合家欢喜剧", icon: "☺", heat: 77, color: "#da9a2b" },
  { name: "历史传记", icon: "◆", heat: 64, color: "#665890" },
];

const budgets = [
  { name: "小成本", value: 4500, quality: 4, capacity: .88, label: "¥4,500万" },
  { name: "标准制作", value: 10000, quality: 11, capacity: 1, label: "¥1.00亿" },
  { name: "大片级", value: 22000, quality: 19, capacity: 1.12, label: "¥2.20亿" },
];

const directors: Director[] = [
  { id: 1, name: "顾长风", avatar: "顾", skill: 91, appeal: 76, fee: 900, genres: ["犯罪悬疑", "历史传记"], trait: "作者表达", available: true },
  { id: 2, name: "林小满", avatar: "林", skill: 84, appeal: 88, fee: 780, genres: ["都市爱情", "合家欢喜剧"], trait: "观众缘佳", available: true },
  { id: 3, name: "陆之航", avatar: "陆", skill: 87, appeal: 82, fee: 850, genres: ["科幻冒险", "动作战争"], trait: "工业水准", available: true },
  { id: 4, name: "谢闻笙", avatar: "谢", skill: 79, appeal: 69, fee: 520, genres: ["犯罪悬疑", "都市爱情"], trait: "擅长新人", available: true },
  { id: 5, name: "郑北辰", avatar: "郑", skill: 73, appeal: 64, fee: 380, genres: ["动作战争", "合家欢喜剧"], trait: "控本能手", available: true },
  { id: 6, name: "程未央", avatar: "程", skill: 93, appeal: 71, fee: 1100, genres: ["历史传记", "科幻冒险"], trait: "奖项常客", available: true },
  { id: 7, name: "罗静秋", avatar: "罗", skill: 86, appeal: 74, fee: 720, genres: ["都市爱情", "历史传记"], trait: "细腻现实主义", available: false },
  { id: 8, name: "韩砚", avatar: "韩", skill: 82, appeal: 85, fee: 760, genres: ["动作战争", "犯罪悬疑"], trait: "强节奏商业片", available: false },
  { id: 9, name: "叶青禾", avatar: "叶", skill: 88, appeal: 79, fee: 840, genres: ["合家欢喜剧", "都市爱情"], trait: "群像叙事", available: false },
  { id: 10, name: "章启明", avatar: "章", skill: 80, appeal: 81, fee: 680, genres: ["科幻冒险", "犯罪悬疑"], trait: "新锐类型片", available: false },
];

const actors: Actor[] = [
  { id: 1, name: "沉藤", avatar: "沉", gender: "男", acting: 88, appeal: 96, fee: 1200, genres: ["合家欢喜剧", "都市爱情"], tag: "喜剧票房王" },
  { id: 2, name: "黄博", avatar: "博", gender: "男", acting: 94, appeal: 90, fee: 1150, genres: ["犯罪悬疑", "合家欢喜剧"], tag: "国民实力派" },
  { id: 3, name: "许征", avatar: "征", gender: "男", acting: 87, appeal: 86, fee: 980, genres: ["合家欢喜剧", "都市爱情"], tag: "公路喜剧专家" },
  { id: 4, name: "王保强", avatar: "保", gender: "男", acting: 84, appeal: 91, fee: 960, genres: ["合家欢喜剧", "动作战争"], tag: "草根亲和力" },
  { id: 5, name: "雷嘉胤", avatar: "雷", gender: "男", acting: 91, appeal: 84, fee: 880, genres: ["犯罪悬疑", "都市爱情"], tag: "生活流戏骨" },
  { id: 6, name: "张弈", avatar: "弈", gender: "男", acting: 96, appeal: 82, fee: 1050, genres: ["历史传记", "犯罪悬疑"], tag: "奖项收割机" },
  { id: 7, name: "吴景", avatar: "景", gender: "男", acting: 82, appeal: 95, fee: 1250, genres: ["动作战争", "科幻冒险"], tag: "硬派动作巨星" },
  { id: 8, name: "邓昭", avatar: "昭", gender: "男", acting: 86, appeal: 89, fee: 1020, genres: ["合家欢喜剧", "犯罪悬疑"], tag: "全能型明星" },
  { id: 9, name: "刘浩燃", avatar: "燃", gender: "男", acting: 81, appeal: 91, fee: 820, genres: ["犯罪悬疑", "都市爱情"], tag: "青春国民脸" },
  { id: 10, name: "朱奕隆", avatar: "隆", gender: "男", acting: 88, appeal: 88, fee: 900, genres: ["犯罪悬疑", "历史传记"], tag: "沉浸式演员" },
  { id: 11, name: "萧湛", avatar: "湛", gender: "男", acting: 78, appeal: 97, fee: 1100, genres: ["都市爱情", "科幻冒险"], tag: "超高人气偶像" },
  { id: 12, name: "易阳千禧", avatar: "易", gender: "男", acting: 87, appeal: 94, fee: 1080, genres: ["犯罪悬疑", "历史传记"], tag: "新生代领军" },
  { id: 13, name: "周寻", avatar: "寻", gender: "女", acting: 96, appeal: 88, fee: 1100, genres: ["都市爱情", "历史传记"], tag: "灵气实力派" },
  { id: 14, name: "章梓宜", avatar: "宜", gender: "女", acting: 94, appeal: 87, fee: 1120, genres: ["历史传记", "都市爱情"], tag: "国际电影人" },
  { id: 15, name: "龚莉", avatar: "莉", gender: "女", acting: 98, appeal: 85, fee: 1280, genres: ["历史传记", "犯罪悬疑"], tag: "殿堂级演员" },
  { id: 16, name: "姚宸", avatar: "宸", gender: "女", acting: 88, appeal: 83, fee: 760, genres: ["都市爱情", "合家欢喜剧"], tag: "都市剧女王" },
  { id: 17, name: "倪霓", avatar: "霓", gender: "女", acting: 86, appeal: 92, fee: 930, genres: ["都市爱情", "犯罪悬疑"], tag: "银幕质感" },
  { id: 18, name: "周冬羽", avatar: "羽", gender: "女", acting: 93, appeal: 89, fee: 1020, genres: ["都市爱情", "犯罪悬疑"], tag: "青春片实力派" },
  { id: 19, name: "张晓翡", avatar: "翡", gender: "女", acting: 86, appeal: 88, fee: 780, genres: ["合家欢喜剧", "都市爱情"], tag: "温情喜剧王牌" },
  { id: 20, name: "贾翎", avatar: "翎", gender: "女", acting: 82, appeal: 95, fee: 1080, genres: ["合家欢喜剧", "动作战争"], tag: "国民喜剧人" },
  { id: 21, name: "柳依菲", avatar: "柳", gender: "女", acting: 84, appeal: 96, fee: 1180, genres: ["都市爱情", "科幻冒险"], tag: "古典美学名片" },
  { id: 22, name: "杨梓", avatar: "梓", gender: "女", acting: 87, appeal: 93, fee: 980, genres: ["都市爱情", "合家欢喜剧"], tag: "国民度担当" },
  { id: 23, name: "赵俪影", avatar: "俪", gender: "女", acting: 89, appeal: 94, fee: 1050, genres: ["都市爱情", "历史传记"], tag: "收视号召力" },
  { id: 24, name: "唐薇", avatar: "薇", gender: "女", acting: 92, appeal: 81, fee: 900, genres: ["都市爱情", "历史传记"], tag: "文艺片缪斯" },
];

const slots = [
  { id: "spring", name: "春节档", date: "大年初一", boost: 1.28, competition: "激烈", note: "观影需求旺盛，喜剧与大片加成" },
  { id: "may", name: "五一档", date: "5月1日", boost: 1.08, competition: "适中", note: "短假期，人群覆盖均衡" },
  { id: "summer", name: "暑期档", date: "7月18日", boost: 1.18, competition: "较高", note: "年轻观众活跃，类型片强势" },
  { id: "national", name: "国庆档", date: "10月1日", boost: 1.14, competition: "较高", note: "主流观众集中，口碑效应明显" },
];

const marketing = [
  { name: "口碑点映", value: 1200, boost: 1.03, power: 42 },
  { name: "全网宣发", value: 3500, boost: 1.12, power: 72 },
  { name: "现象级攻势", value: 8000, boost: 1.22, power: 98 },
];

const TALENT_COST_SCALE = 1.6;

const stageLabels = ["项目企划", "剧本创作", "组建班底", "拍摄制作", "定档发行", "市场检验", "公司经营"];
const workflowRooms = [
  { code: "PROJECT", name: "电影筹备室", scene: "project", prompt: "确定片名、题材与制作规模", action: "坐到制片桌前" },
  { code: "SCRIPT", name: "剧本创作间", scene: "writers", prompt: "在稿纸上完成故事的关键选择", action: "打开剧本工作台" },
  { code: "CAST", name: "选角会议室", scene: "casting", prompt: "查看导演与演员档案，完成邀约", action: "开始组建主创" },
  { code: "STAGE", name: "主摄影棚", scene: "filming", prompt: "监督拍摄，并处理片场突发事件", action: "进入拍摄现场" },
  { code: "RELEASE", name: "发行宣发部", scene: "release", prompt: "选择档期、研判竞品并制定宣发", action: "打开发行作战台" },
  { code: "PREMIERE", name: "首映电影院", scene: "cinema", prompt: "守候首周票房与真实观众口碑", action: "进入首周直播" },
  { code: "AGENCY", name: "艺人经纪部", scene: "agency", prompt: "完成年度经营并进入下一制片年", action: "打开经纪工作台" },
] as const;

function scriptThreshold(profile: ActorProfile) {
  return tierScriptThreshold(profile.tier);
}

function getActorProfile(actor: Actor) {
  const profile = actor.profile ?? actorProfiles[actor.id];
  return { ...profile, tier: actorTier(actor.acting, actor.appeal) };
}

function actorHonorTitle(actor: Actor, honors: Record<number, string[]>) {
  return honors[actor.id]?.includes("最佳表演") ? actor.gender === "女" ? "影后" : "影帝" : null;
}

function careerStage(profile: ActorProfile, age: number) {
  return age >= 63 ? "淡出期" : age >= 58 ? "资深期" : age >= 52 ? "转型期" : `${profile.career}期`;
}

function actorAge(actor: Actor, year: number, contract?: TalentContract) {
  return currentActorAge(getActorProfile(actor).age, year, contract?.origin === "rookie" ? contract.signedYear : actor.careerStartYear ?? 1);
}

function quoteMultiplier(actor: Actor, scriptScore: number, offerFactor: number) {
  const gap = scriptThreshold(getActorProfile(actor)) - scriptScore;
  const scriptModifier = Math.max(.85, Math.min(1.3, 1 + gap * .015));
  return Number((offerFactor * scriptModifier).toFixed(2));
}

const actorProfiles: Record<number, ActorProfile> = {
  1: { age: 43, tier: "S", career: "巅峰", availability: "档期紧张", risk: 9, archetype: "喜剧核心" },
  2: { age: 45, tier: "S", career: "巅峰", availability: "需协调", risk: 6, archetype: "市井人物" },
  3: { age: 48, tier: "A", career: "转型", availability: "需协调", risk: 8, archetype: "中年喜剧" },
  4: { age: 39, tier: "A", career: "稳定", availability: "档期充裕", risk: 7, archetype: "草根英雄" },
  5: { age: 41, tier: "A", career: "巅峰", availability: "需协调", risk: 5, archetype: "都市中坚" },
  6: { age: 44, tier: "A", career: "巅峰", availability: "档期紧张", risk: 4, archetype: "正剧男主" },
  7: { age: 47, tier: "S", career: "稳定", availability: "档期紧张", risk: 12, archetype: "硬汉领袖" },
  8: { age: 42, tier: "A", career: "稳定", availability: "需协调", risk: 9, archetype: "全能男主" },
  9: { age: 29, tier: "A", career: "上升", availability: "档期充裕", risk: 8, archetype: "青年侦探" },
  10: { age: 34, tier: "A", career: "上升", availability: "需协调", risk: 6, archetype: "沉郁角色" },
  11: { age: 30, tier: "S", career: "巅峰", availability: "档期紧张", risk: 16, archetype: "偶像男主" },
  12: { age: 27, tier: "S", career: "上升", availability: "档期紧张", risk: 10, archetype: "少年成长" },
  13: { age: 42, tier: "S", career: "稳定", availability: "需协调", risk: 5, archetype: "灵气女主" },
  14: { age: 45, tier: "A", career: "转型", availability: "档期充裕", risk: 6, archetype: "大女主" },
  15: { age: 50, tier: "S", career: "巅峰", availability: "档期紧张", risk: 3, archetype: "史诗女主" },
  16: { age: 41, tier: "A", career: "稳定", availability: "档期充裕", risk: 5, archetype: "都市女性" },
  17: { age: 34, tier: "A", career: "巅峰", availability: "需协调", risk: 7, archetype: "魅力女主" },
  18: { age: 31, tier: "A", career: "巅峰", availability: "档期紧张", risk: 7, archetype: "敏感少女" },
  19: { age: 36, tier: "A", career: "上升", availability: "档期充裕", risk: 5, archetype: "温情女主" },
  20: { age: 40, tier: "S", career: "巅峰", availability: "档期紧张", risk: 11, archetype: "喜剧核心" },
  21: { age: 35, tier: "S", career: "巅峰", availability: "档期紧张", risk: 8, archetype: "古典女主" },
  22: { age: 32, tier: "A", career: "巅峰", availability: "需协调", risk: 9, archetype: "邻家女主" },
  23: { age: 37, tier: "S", career: "巅峰", availability: "档期紧张", risk: 6, archetype: "励志女主" },
  24: { age: 43, tier: "A", career: "稳定", availability: "档期充裕", risk: 4, archetype: "文艺女主" },
};

const contractOptions = [
  { id: "economy", name: "压价试探", factor: .9, morale: -5, note: "节省预算，但一线艺人可能拒绝" },
  { id: "standard", name: "标准片酬", factor: 1, morale: 2, note: "尊重市场价，谈判成功率稳定" },
  { id: "premium", name: "诚意邀约", factor: 1.15, morale: 8, note: "提高士气，并能协调紧张档期" },
] as const;

const specialChemistry: Record<string, number> = {
  "1-19": 92, "1-20": 94, "2-3": 93, "2-4": 88, "5-16": 89, "7-20": 86,
  "9-18": 91, "10-17": 87, "11-21": 90, "12-18": 88, "13-24": 86, "19-20": 93,
};

function chemistryScore(first: Actor, second: Actor) {
  const [firstId, secondId] = [first.id, second.id].sort((a, b) => a - b);
  const key = `${firstId}-${secondId}`;
  return specialChemistry[key] ?? 58 + ((firstId * 17 + secondId * 11) % 34);
}

function buildDailyReports(title: string, days: number[], wordOfMouth: number, scoreCurve: number[], context: PublicityContext): DailyReport[] {
  const discussionQuality = wordOfMouth * .7 + context.quality * .3;
  const qualityBand = discussionQuality >= 87 ? "high" : discussionQuality >= 74 ? "mid" : "low";
  const lead = context.cast[0];
  const partner = context.cast[1];
  const strongest = [...context.cast].sort((first, second) => second.acting - first.acting)[0];
  const popular = [...context.cast].sort((first, second) => second.appeal - first.appeal)[0];
  const rookie = context.cast.find((actor) => actor.id >= 100 || actor.appeal < 60);
  const honored = context.cast.find((actor) => actorHonorTitle(actor, context.honors));
  const honoredTitle = honored ? actorHonorTitle(honored, context.honors) : null;
  const castPair = `${lead?.name ?? "主演"}与${partner?.name ?? "搭档"}`;
  const performerPraise = qualityBand === "high" ? "表演层次成为散场后最集中的称赞" : qualityBand === "mid" ? "表演获得认可，但角色完成度评价存在分化" : "个人表演仍有亮点，却难以弥补成片问题";
  const rookieReaction = rookie ? qualityBand === "high" ? `${rookie.name}作为银幕新面孔意外出圈，观众称其与成熟演员对戏毫不怯场。` : qualityBand === "mid" ? `不少观众第一次注意到新人${rookie.name}，镜头表现获得讨论，也有人认为仍显生涩。` : `新人${rookie.name}获得了曝光，但部分观众认为其在关键场面仍需磨炼。` : `${castPair}的对手戏成为观众讨论重点。`;
  const honorReaction = honored && honoredTitle ? qualityBand === "high" ? `${honoredTitle}${honored.name}贡献高完成度表演，多个片段被认为具有再次冲奖实力。` : qualityBand === "mid" ? `${honoredTitle}${honored.name}的发挥维持水准，但影片本身没有完全释放其表演空间。` : `“${honoredTitle}${honored.name}也救不了薄弱成片”成为争议观点，粉丝与路人展开辩论。` : `${strongest?.name ?? "主演"}${performerPraise}。`;
  const directorReaction = qualityBand === "high" ? `${context.director.name}对${context.genre}节奏和演员调度获得好评，导演风格词条进入热榜。` : qualityBand === "mid" ? `网络评价认为${context.director.name}完成了类型基本盘，但部分段落处理偏保守。` : `${context.director.name}的导演调度受到质疑，“这次是否失手”成为讨论焦点。`;
  const audienceLines = [
    `${castPair}首次合体亮相，观众认为${qualityBand === "high" ? "角色关系可信，成片明显超过预期" : qualityBand === "mid" ? "组合完成度稳健，仍有部分磨合痕迹" : "阵容吸引力没有完全转化为角色说服力"}。`,
    rookieReaction,
    `${strongest?.name ?? "主演"}${performerPraise}，关键场面的处理被观众反复提及。`,
    qualityBand === "high" ? `路人观众明显增加，${context.genre}核心受众开始主动推荐。` : qualityBand === "mid" ? `${context.genre}爱好者保持认可，普通观众的推荐意愿较为谨慎。` : `普通观众流失，剩余场次更多依靠演员粉丝与类型受众。`,
    honorReaction,
    qualityBand === "high" ? `${castPair}的关系线带来周末增量，二刷观众开始挖掘表演细节。` : qualityBand === "mid" ? `周末新增观众重点讨论${castPair}的化学反应，整体反馈褒贬并存。` : `周末增量有限，${castPair}相关讨论仍集中在粉丝圈层。`,
    qualityBand === "high" ? `首周收官时，导演与主演阵容共同进入年度惊喜讨论。` : qualityBand === "mid" ? `首周评价基本稳定，阵容表现优于影片破圈程度。` : `首周口碑定型，演员个人讨论度高于影片整体评价。`,
  ];
  const internetLines = [
    directorReaction,
    rookie ? `${rookie.name}相关搜索量快速上升，“新人表现”成为独立讨论分支。` : `${popular?.name ?? "主演"}带动首轮关注，粉丝物料与路人观后感同时增长。`,
    honored && honoredTitle ? `${honoredTitle}${honored.name}的表演片段登上热门，奖项预期与成片质量被放在一起比较。` : `${strongest?.name ?? "主演"}的角色解析帖增多，表演细节成为传播素材。`,
    directorReaction,
    qualityBand === "high" ? `${castPair}对手戏切片开始跨出粉丝圈层，自来水内容占比上升。` : qualityBand === "mid" ? `${castPair}相关切片维持曝光，但讨论尚未形成大规模扩散。` : `演员粉丝努力维护评价，但“阵容大于成片”的观点继续增加。`,
    qualityBand === "high" ? `购票平台关注影片逆跌，${context.director.name}与主演被列为口碑增长核心。` : qualityBand === "mid" ? `周末观影攻略带来温和讨论，阵容仍是主要购票理由。` : `避雷与争议词条增加，演员个人热度未能扭转整体舆情。`,
    qualityBand === "high" ? `首周总结以“导演发挥”“演员出圈”和“口碑长线”为关键词。` : qualityBand === "mid" ? `首周舆情进入平稳期，讨论集中在演员发挥与类型完成度。` : `首周总结以“明星难救剧本”“导演失手”和“高开低走”为关键词。`,
  ];
  const hotTopics = [
    `#${title}首映阵容#`,
    rookie ? `#新人${rookie.name}银幕表现#` : `#${popular?.name ?? title}新片#`,
    honored && honoredTitle ? `#${honoredTitle}${honored.name}演技#` : `#${strongest?.name ?? title}表演#`,
    `#${context.director.name}执导${context.genre}#`,
    `#${castPair}对手戏#`,
    qualityBand === "high" ? `#${title}口碑逆跌#` : qualityBand === "low" ? `#${title}阵容能否救场#` : `#${title}观后感#`,
    `#${title}首周口碑#`,
  ];
  return days.map((boxOffice, index) => {
    const change = index === 0 ? null : Math.round((boxOffice / days[index - 1] - 1) * 100);
    const audienceScore = scoreCurve[index];
    const momentum = change === null ? "首映开画" : change >= 3 ? "强势逆跌" : change >= 0 ? "小幅上涨" : change > -8 ? "平稳回落" : change > -15 ? "明显下跌" : "快速失速";
    const headline = index === 0 ? `《${title}》正式上映，首批观众评价出炉` : change !== null && change >= 0 ? `口碑推动第${index + 1}日票房${change >= 3 ? "逆势上涨" : "保持坚挺"}` : `第${index + 1}日市场热度${change !== null && change <= -15 ? "快速下降" : "逐步释放"}`;
    return { day: index + 1, boxOffice, change, audienceScore, positiveRate: Math.max(45, Math.min(98, Math.round(audienceScore * 10 + (wordOfMouth - 80) * .25))), momentum, headline, audienceReaction: audienceLines[index], internetReaction: internetLines[index], hotTopic: hotTopics[index] };
  });
}

function money(value: number) {
  return value >= 10000 ? `${(value / 10000).toFixed(2)}亿` : `${Math.round(value).toLocaleString("zh-CN")}万`;
}

function StudioRoomButton({ className, code, name, note, disabled, onClick }: { className: string; code: string; name: string; note: string; disabled?: boolean; onClick: () => void }) {
  return <button type="button" className={`studio-room ${className}`} disabled={disabled} onClick={onClick}>
    <span>{disabled ? "LOCKED" : code}</span>
    <b>{name}</b>
    <small>{note}</small>
    <i>{disabled ? "锁" : "→"}</i>
  </button>;
}

export default function Home() {
  const [stage, setStage] = useState(0);
  const [inStudioHub, setInStudioHub] = useState(true);
  const [utilityRoom, setUtilityRoom] = useState<UtilityRoom>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [year, setYear] = useState(1);
  const [cash, setCash] = useState(36000);
  const [studioXp, setStudioXp] = useState(0);
  const [reputation, setReputation] = useState(60);
  const [title, setTitle] = useState("雾港来信");
  const [genreMarket, setGenreMarket] = useState<Genre[]>(genres);
  const [genre, setGenre] = useState(genres[0]);
  const [budget, setBudget] = useState(budgets[1]);
  const [scriptAnswers, setScriptAnswers] = useState<Record<string, string>>({});
  const [scriptReport, setScriptReport] = useState<ScriptReport | null>(null);
  const [scriptFeedback, setScriptFeedback] = useState("");
  const [scriptFeedbackQuestionId, setScriptFeedbackQuestionId] = useState<string | null>(null);
  const [evaluatingScript, setEvaluatingScript] = useState(false);
  const [director, setDirector] = useState<Director | null>(null);
  const [directorPool, setDirectorPool] = useState<Director[]>(directors);
  const [actorPool, setActorPool] = useState<Actor[]>(actors);
  const [cast, setCast] = useState<Actor[]>([]);
  const [ensembleCastId, setEnsembleCastId] = useState<EnsembleCastId>("lean");
  const [deals, setDeals] = useState<Record<number, Deal>>({});
  const [negotiating, setNegotiating] = useState<Actor | null>(null);
  const [negotiationError, setNegotiationError] = useState("");
  const [actorFilter, setActorFilter] = useState<"全部" | "男演员" | "女演员" | "高适配">("全部");
  const [actorQuery, setActorQuery] = useState("");
  const [eventChoice, setEventChoice] = useState<"safe" | "bold" | null>(null);
  const [productionChoices, setProductionChoices] = useState<(ProductionChoice | null)[]>([null, null, null]);
  const [productionLocked, setProductionLocked] = useState(false);
  const [annualGoalId, setAnnualGoalId] = useState<string | null>(null);
  const [annualGoalLocked, setAnnualGoalLocked] = useState(false);
  const [rewriteCost, setRewriteCost] = useState(0);
  const [rewriteMarketDelta, setRewriteMarketDelta] = useState(0);
  const [slot, setSlot] = useState(slots[2]);
  const [promo, setPromo] = useState(marketing[1]);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<FilmHistoryRecord[]>([]);
  const [ipSelection, setIpSelection] = useState<IpProjectSelection>({ route: "original", sourceId: null });
  const [revealedDays, setRevealedDays] = useState(0);
  const [boxOfficeCashCredited, setBoxOfficeCashCredited] = useState(0);
  const [boxOfficeSettlementLocked, setBoxOfficeSettlementLocked] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const liveFeedRef = useRef<HTMLDivElement>(null);
  const [signedTalents, setSignedTalents] = useState<TalentContract[]>([]);
  const [agencyLedger, setAgencyLedger] = useState<AgencyLedger | null>(null);
  const [actorHonors, setActorHonors] = useState<Record<number, string[]>>({});
  const [investmentClaimedYear, setInvestmentClaimedYear] = useState<number | null>(null);
  const [rookieRefreshYear, setRookieRefreshYear] = useState<number | null>(null);
  const [rookieAlumniIds, setRookieAlumniIds] = useState<number[]>([]);
  const [expiryReminderDismissedYear, setExpiryReminderDismissedYear] = useState<number | null>(null);
  const [projectCostPaid, setProjectCostPaid] = useState(0);
  const [companyTab, setCompanyTab] = useState<CompanyTab>("market");
  const [signingTarget, setSigningTarget] = useState<SigningTarget | null>(null);
  const [trainingGenre, setTrainingGenre] = useState<Record<number, string>>({});
  const [companyNotice, setCompanyNotice] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveReady, setSaveReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mobileSceneAssets.forEach((file) => {
        const image = new Image();
        image.decoding = "async";
        image.src = assetUrl(`/images/studio-prototype/mobile/${file}`);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw) return;
        const save = JSON.parse(raw) as LocalGameSave;
        if (save.version !== 1) return;
        const restoredPool = (save.actorPool?.length ? save.actorPool : actors).map((actor) => {
          const currentRookie = rookieCandidates.find((candidate) => candidate.id === actor.id);
          const canonicalActor = actors.find((candidate) => candidate.id === actor.id);
          const rookieContract = save.signedTalents?.find((contract) => contract.actorId === actor.id && contract.origin === "rookie");
          if (currentRookie) return { ...actor, careerStartYear: actor.careerStartYear ?? rookieContract?.signedYear ?? 1, genres: uniqueGenres(actor.genres), potential: Math.max(actor.potential ?? 0, currentRookie.potential), profile: { ...currentRookie.profile, ...actor.profile, age: currentRookie.profile.age } };
          return canonicalActor ? { ...actor, genres: uniqueGenres(actor.genres), tag: canonicalActor.tag } : { ...actor, genres: uniqueGenres(actor.genres) };
        });
        const restoredContracts = (save.signedTalents ?? []).map((contract) => {
          const currentRookie = rookieCandidates.find((candidate) => candidate.id === contract.actorId);
          return currentRookie ? { ...contract, potential: Math.max(contract.potential, currentRookie.potential) } : contract;
        });
        const restoredGenres = save.genreMarket?.length ? save.genreMarket : genres;
        const restoredDirectors = save.directorPool?.length ? save.directorPool : directors;
        setYear(save.year);
        setCash(save.cash);
        setStudioXp(save.studioXp);
        setReputation(save.reputation);
        const restoredStage = Math.min(6, save.stage);
        setStage(restoredStage >= 5 && !save.result ? 0 : restoredStage);
        setTitle(save.title);
        setGenreMarket(restoredGenres);
        setGenre(restoredGenres.find((item) => item.name === save.genreName) ?? restoredGenres[0]);
        setBudget(budgets.find((item) => item.name === save.budgetName) ?? budgets[1]);
        setScriptAnswers(save.scriptAnswers ?? {});
        setScriptReport(save.scriptReport ?? null);
        setDirectorPool(restoredDirectors);
        setDirector(restoredDirectors.find((item) => item.id === save.directorId) ?? null);
        setActorPool(restoredPool);
        setCast((save.castIds ?? []).map((id) => restoredPool.find((actor) => actor.id === id)).filter((actor): actor is Actor => Boolean(actor)));
        setEnsembleCastId(normalizeEnsembleCast(save.ensembleCastId));
        setDeals(save.deals ?? {});
        setEventChoice(save.eventChoice ?? null);
        setProductionChoices(save.productionChoices ?? [save.eventChoice ?? null, null, null]);
        setProductionLocked(save.productionLocked ?? restoredStage >= 4);
        setAnnualGoalId(save.annualGoalId ?? null);
        setAnnualGoalLocked(save.annualGoalLocked ?? Boolean(save.annualGoalId && save.stage > 0));
        setRewriteCost(save.rewriteCost ?? 0);
        setRewriteMarketDelta(save.rewriteMarketDelta ?? 0);
        setSlot(slots.find((item) => item.id === save.slotId) ?? slots[2]);
        setPromo(marketing.find((item) => item.name === save.promoName) ?? marketing[1]);
        setResult(save.result ?? null);
        setRevealedDays(save.revealedDays ?? 0);
        const legacyBoxOfficeSettlement = Boolean(save.result && save.boxOfficeCashCredited === undefined);
        setBoxOfficeCashCredited(save.boxOfficeCashCredited ?? (save.result ? Math.max(0, save.result.studioRevenue - (save.result.investorShare ?? 0) - save.result.successBonus) : 0));
        setBoxOfficeSettlementLocked(save.boxOfficeSettlementLocked ?? legacyBoxOfficeSettlement);
        setAutoPlay(false);
        setSignedTalents(restoredContracts);
        setAgencyLedger(save.agencyLedger ?? null);
        setActorHonors(save.actorHonors ?? {});
        setInvestmentClaimedYear(save.investmentClaimedYear ?? null);
        setRookieRefreshYear(save.rookieRefreshYear ?? null);
        setRookieAlumniIds(save.rookieAlumniIds ?? [...new Set([...(save.signedTalents ?? []).filter((contract) => contract.origin === "rookie").map((contract) => contract.actorId), ...restoredPool.filter((actor) => actor.id >= 100).map((actor) => actor.id)])]);
        setExpiryReminderDismissedYear(save.expiryReminderDismissedYear ?? null);
        setProjectCostPaid(save.projectCostPaid ?? 0);
        const restoredHistory = normalizeFilmHistory(save.history ?? []);
        setHistory(restoredHistory);
        const restoredIpSource = findIpSource(restoredHistory, save.ipSourceId ?? null);
        setIpSelection(restoredIpSource && save.ipRoute && save.ipRoute !== "original" ? { route: save.ipRoute, sourceId: restoredIpSource.id ?? null } : { route: "original", sourceId: null });
      } catch {
        window.localStorage.removeItem(SAVE_KEY);
      } finally {
        setSaveReady(true);
      }
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [stage]);

  useEffect(() => {
    if (stage !== 5 || !workspaceOpen || !result || !autoPlay || revealedDays >= 7) return;
    const timer = window.setTimeout(() => setRevealedDays((value) => Math.min(7, value + 1)), revealedDays === 0 ? 450 : 1550);
    return () => window.clearTimeout(timer);
  }, [stage, workspaceOpen, result, autoPlay, revealedDays]);

  useEffect(() => {
    if (!saveReady || stage !== 5 || !result || boxOfficeSettlementLocked) return;
    const target = boxOfficeSettlementTarget(result.days, revealedDays, result.studioRevenue, result.investorShare, result.successBonus);
    if (target === boxOfficeCashCredited) return;
    // Cash mirrors the externally revealed box-office settlement for the current day.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCash((value) => Math.max(0, value + target - boxOfficeCashCredited));
    setBoxOfficeCashCredited(target);
  }, [boxOfficeCashCredited, boxOfficeSettlementLocked, result, revealedDays, saveReady, stage]);

  useEffect(() => {
    if (stage !== 5 || !workspaceOpen || !result) return;
    const timer = window.setTimeout(() => liveFeedRef.current?.scrollIntoView({ behavior: revealedDays === 0 ? "auto" : "smooth", block: "center" }), 120);
    return () => window.clearTimeout(timer);
  }, [stage, workspaceOpen, result, revealedDays]);

  useEffect(() => {
    if (!saveReady) return;
    const save: LocalGameSave = {
      version: 1,
      year,
      cash,
      studioXp,
      reputation,
      stage,
      title,
      genreName: genre.name,
      genreMarket,
      budgetName: budget.name,
      scriptAnswers,
      scriptReport,
      directorId: director?.id ?? null,
      directorPool,
      actorPool,
      castIds: cast.map((actor) => actor.id),
      ensembleCastId,
      deals,
      eventChoice,
      productionChoices,
      productionLocked,
      annualGoalId,
      annualGoalLocked,
      rewriteCost,
      rewriteMarketDelta,
      slotId: slot.id,
      promoName: promo.name,
      result,
      revealedDays,
      boxOfficeCashCredited,
      boxOfficeSettlementLocked,
      signedTalents,
      agencyLedger,
      actorHonors,
      investmentClaimedYear,
      rookieRefreshYear,
      rookieAlumniIds,
      expiryReminderDismissedYear,
      projectCostPaid,
      ipRoute: ipSelection.route,
      ipSourceId: ipSelection.sourceId,
      history,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [actorHonors, actorPool, agencyLedger, annualGoalId, annualGoalLocked, boxOfficeCashCredited, boxOfficeSettlementLocked, budget.name, cash, cast, deals, director?.id, directorPool, ensembleCastId, eventChoice, expiryReminderDismissedYear, genre.name, genreMarket, history, investmentClaimedYear, ipSelection.route, ipSelection.sourceId, productionChoices, productionLocked, projectCostPaid, promo.name, reputation, result, revealedDays, rewriteCost, rewriteMarketDelta, rookieAlumniIds, rookieRefreshYear, saveReady, scriptAnswers, scriptReport, signedTalents, slot.id, stage, studioXp, title, year]);

  const studioLevel = Math.min(10, 1 + Math.floor(studioXp / 180));
  const studioXpProgress = studioXp % 180;
  const studioReach = studioReachMultiplier(studioLevel, reputation);
  const annualInvestment = annualInvestmentAmount(year);
  const investmentLocked = annualInvestment === 0;
  const investmentClaimed = investmentClaimedYear === year;
  const rosterCapacity = agencyCapacity(studioLevel);
  const yearlyTrainingCapacity = trainingCapacity(studioLevel);
  const signedTalentIds = useMemo(() => new Set(signedTalents.map((contract) => contract.actorId)), [signedTalents]);
  const unavailableRookieIds = useMemo(() => new Set([...signedTalentIds, ...rookieAlumniIds]), [rookieAlumniIds, signedTalentIds]);
  const signedActors = useMemo(() => signedTalents.map((contract) => ({ contract, actor: actorPool.find((actor) => actor.id === contract.actorId) })).filter((item): item is { contract: TalentContract; actor: Actor } => Boolean(item.actor)), [actorPool, signedTalents]);
  const expiringTalents = useMemo(() => signedActors.filter(({ contract }) => contract.contractEndYear === year), [signedActors, year]);
  const showExpiryReminder = inStudioHub && expiringTalents.length > 0 && expiryReminderDismissedYear !== year;
  const usedTrainingSlots = signedTalents.filter((contract) => contract.lastTrainedYear === year).length;
  const annualPayroll = signedTalents.reduce((sum, contract) => sum + contract.annualSalary, 0);
  const negotiatingProfile = negotiating ? getActorProfile(negotiating) : null;
  const signingTargetProfile = signingTarget ? getActorProfile(signingTarget.actor) : null;
  const activeSigningQuote = signingTarget && signingTargetProfile ? signingTarget.origin === "rookie" && signingTarget.rookie ? rookieContractQuote(signingTarget.rookie) : matureContractQuote(signingTarget.actor, signingTargetProfile) : null;
  const matureSigningMarket = useMemo(() => actorPool.filter((actor) => !signedTalentIds.has(actor.id) && (actor.id < 100 || isMatureMarketEligible(actor))).sort((first, second) => ((first.id + year * 3) % 24) - ((second.id + year * 3) % 24)).slice(0, 8), [actorPool, signedTalentIds, year]);
  const availableDirectors = useMemo(() => directorPool.filter((item) => item.available !== false), [directorPool]);
  const marketLeader = useMemo(() => [...genreMarket].sort((first, second) => second.heat - first.heat)[0], [genreMarket]);
  const marketRiser = useMemo(() => [...genreMarket].sort((first, second) => (second.heatChange ?? 0) - (first.heatChange ?? 0))[0], [genreMarket]);
  const rookieMarket = useMemo(() => buildRookieMarket(year, unavailableRookieIds, rookieRefreshYear === year), [rookieRefreshYear, unavailableRookieIds, year]);
  const scriptQuestions = useMemo(() => getScriptQuestions(genre.name, year), [genre.name, year]);
  const scriptBuildPreview = useMemo(() => deriveScriptBuild(scriptAnswers, scriptQuestions as Parameters<typeof deriveScriptBuild>[1], genre.name), [genre.name, scriptAnswers, scriptQuestions]);
  const annualGoalCandidates = useMemo(() => generateAnnualGoals(year, genreMarket), [genreMarket, year]);
  const annualGoal = annualGoalCandidates.find((goal) => goal.id === annualGoalId) ?? null;
  const scriptScore = scriptReport?.score ?? 0;
  const scriptBuild = scriptReport?.build ?? scriptBuildPreview;
  const scriptEffects = getScriptDownstream(scriptReport);
  const availableIpSources = useMemo(() => eligibleIpSources(history), [history]);
  const selectedIpSource = useMemo(() => findIpSource(history, ipSelection.sourceId), [history, ipSelection.sourceId]);
  const ipEffects = useMemo(() => resolveIpProjectEffects(history, ipSelection, { genre: genre.name, castIds: cast.map((actor) => actor.id), coreStyleId: scriptBuild.core?.id }), [cast, genre.name, history, ipSelection, scriptBuild.core?.id]);
  const industryCostIndex = Math.min(1.32, 1 + (year - 1) * .025);
  const currentBudgetCost = Math.round(budget.value * industryCostIndex * scriptEffects.budgetCostMultiplier);
  const currentPromoCost = Math.round(promo.value * industryCostIndex);
  const ensembleActive = scriptEffects.ensemble;
  const selectedEnsembleCast = ensembleCastOptions.find((option) => option.id === ensembleCastId) ?? ensembleCastOptions[0];
  const ensembleCost = ensembleActive ? Math.round(selectedEnsembleCast.cost * industryCostIndex) : 0;
  const castFeeEntries = cast.map((actor) => ({ actorId: actor.id, fee: deals[actor.id]?.fee ?? Math.round(actor.fee * TALENT_COST_SCALE) }));
  const ipCastingPremium = Math.round(calculateReturningCastPremium(ipEffects, castFeeEntries) * scriptEffects.castingCostMultiplier);
  const talentCost = Math.round((Math.round((director?.fee ?? 0) * TALENT_COST_SCALE) + castFeeEntries.reduce((sum, item) => sum + item.fee, 0)) * scriptEffects.castingCostMultiplier) + ensembleCost + ipCastingPremium;
  const totalBeforeRelease = currentBudgetCost + talentCost;
  const productionChain = useMemo(() => generateProductionChain(cast.map((actor) => actor.id), year, { genre: genre.name, budget: budget.name }), [budget.name, cast, genre.name, year]);
  const productionTotals = useMemo(() => resolveProductionChain(productionChain, productionChoices), [productionChain, productionChoices]);
  const scheduleEfficiency = scheduleRiskMultiplier(productionTotals.scheduleRisk);
  const currentEventCost = Math.round(productionTotals.cost * industryCostIndex);
  const overheadCost = Math.round(totalBeforeRelease * .12);
  const totalCost = totalBeforeRelease + overheadCost + currentPromoCost + currentEventCost + rewriteCost;
  const slotCompetitors = useMemo(() => generateCompetitors(slot.id, year, actorPool.map((actor) => ({ id: actor.id, name: actor.name, acting: actor.acting, appeal: actor.appeal, tier: getActorProfile(actor).tier })), cast.map((actor) => actor.id)), [actorPool, cast, slot.id, year]);
  const competitionPressure = calculateCompetitionPressure(slotCompetitors);
  const chemistry = cast.length === 2 ? chemistryScore(cast[0], cast[1]) : null;
  const leadActing = cast.length ? cast.reduce((sum, item) => sum + item.acting + (deals[item.id]?.morale ?? 0) * .2, 0) / cast.length : 0;
  const ensemblePerformance = ensembleActive && director && cast.length === 2 ? resolveEnsembleCast(ensembleCastId, leadActing, chemistry ?? 60, director.skill, director.trait) : null;
  const performanceCoordination = ensemblePerformance?.coordination ?? chemistry ?? 60;
  const ensembleDownstream = resolveEnsembleDownstream(scriptEffects, ensemblePerformance);
  const averageMorale = cast.length ? cast.reduce((sum, actor) => sum + (deals[actor.id]?.morale ?? 0), 0) / cast.length : 0;
  const castTierOpeningBonus = cast.length ? cast.reduce((sum, actor) => sum + tierOpeningBonus(getActorProfile(actor).tier), 0) / cast.length : 0;
  const performanceLead = cast.length ? [...cast].sort((first, second) => second.acting + (deals[second.id]?.morale ?? 0) * .2 - first.acting - (deals[first.id]?.morale ?? 0) * .2)[0] : null;
  const projectedLibraryHistory = useMemo(() => result ? [result.filmRecord ?? { title, gross: result.gross, awards: result.awards.length, libraryMultiplier: result.libraryMultiplier }, ...history].slice(0, 3) : history.slice(0, 3), [history, result, title]);
  const projectedLibraryIncome = calculateLibraryIncome(projectedLibraryHistory);
  const libraryGross = projectedLibraryHistory.reduce((sum, film) => sum + film.gross, 0);
  const libraryAwards = projectedLibraryHistory.reduce((sum, film) => sum + film.awards, 0);
  const revealedReports = result?.dailyReports.slice(0, revealedDays) ?? [];
  const visibleReports = revealedReports.slice(-2);
  const latestReport = revealedReports[revealedReports.length - 1] ?? null;
  const liveWeekGross = revealedReports.reduce((sum, report) => sum + report.boxOffice, 0);

  const fit = useMemo(() => {
    let score = director?.genres.includes(genre.name) ? 12 : 0;
    cast.forEach((actor) => { if (actor.genres.includes(genre.name)) score += 6; });
    return score;
  }, [director, cast, genre]);

  const filteredActors = useMemo(() => actorPool.filter((actor) => {
    const matchesFilter = actorFilter === "全部"
      || (actorFilter === "男演员" && actor.gender === "男")
      || (actorFilter === "女演员" && actor.gender === "女")
      || (actorFilter === "高适配" && actor.genres.includes(genre.name));
    const query = actorQuery.trim().toLowerCase();
    const matchesQuery = !query || `${actor.name}${actor.tag}${actor.genres.join("")}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  }).sort((first, second) => Number(signedTalentIds.has(second.id)) - Number(signedTalentIds.has(first.id)) || Number((selectedIpSource?.castIds ?? []).includes(second.id)) - Number((selectedIpSource?.castIds ?? []).includes(first.id))), [actorFilter, actorPool, actorQuery, genre, selectedIpSource?.castIds, signedTalentIds]);
  const liveTrend = revealedDays === 7 && result ? result.trend : !latestReport ? "等待开画" : latestReport.change !== null && latestReport.change >= 0 ? "口碑发酵" : latestReport.change !== null && latestReport.change <= -12 ? "热度回落" : "市场运行";
  const liveTrendNote = revealedDays === 7 && result ? result.trendNote : !latestReport ? "首日票房、散场声音与网络评价即将同步更新。" : latestReport.change !== null && latestReport.change >= 0 ? `第 ${latestReport.day} 天票房较前一日上涨 ${latestReport.change}%，路人推荐正在转化为购票。` : latestReport.change !== null && latestReport.change <= -12 ? `第 ${latestReport.day} 天跌幅达到 ${Math.abs(latestReport.change)}%，内容口碑暂未承接开画热度。` : `第 ${latestReport.day} 天市场表现保持在常规区间，后续走势仍由口碑决定。`;
  const activeWorkflowRoom = workflowRooms[Math.min(stage, workflowRooms.length - 1)];
  const activeRoom = utilityRoom === "agency" ? workflowRooms[6] : activeWorkflowRoom;

  function openWorkflowRoom() {
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setInStudioHub(false);
  }

  function openAgencyUtility() {
    setCompanyTab(signedTalents.length ? "roster" : "market");
    setCompanyNotice("");
    setUtilityRoom("agency");
    setWorkspaceOpen(false);
    setInStudioHub(false);
  }

  function returnToHub() {
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setInStudioHub(true);
  }

  function handleExpiryReminderNow() {
    setExpiryReminderDismissedYear(year);
    setCompanyTab("roster");
    setCompanyNotice(`${expiringTalents.map(({ actor }) => actor.name).join("、")}的合约将在今年结束前到期，请决定是否续约。`);
    setUtilityRoom("agency");
    setWorkspaceOpen(true);
    setInStudioHub(false);
  }

  function moveToStage(nextStage: number) {
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setStage(nextStage);
  }

  function resetCreativeProjectState() {
    setScriptAnswers({});
    setScriptReport(null);
    setScriptFeedback("");
    setScriptFeedbackQuestionId(null);
    setRewriteCost(0);
    setRewriteMarketDelta(0);
    setDirector(null);
    setCast([]);
    setDeals({});
    setEventChoice(null);
    setProductionChoices([null, null, null]);
    setProductionLocked(false);
  }

  function chooseOriginalProject() {
    setIpSelection({ route: "original", sourceId: null });
    setTitle("未命名计划");
    resetCreativeProjectState();
  }

  function chooseIpSource(source: FilmHistoryRecord) {
    setIpSelection({ route: "sequel", sourceId: source.id ?? null });
    setTitle(suggestIpTitle(source, "sequel"));
    const sourceGenre = genreMarket.find((item) => item.name === source.genre);
    if (sourceGenre) setGenre(sourceGenre);
    resetCreativeProjectState();
  }

  function chooseIpRoute(route: Exclude<IpRouteId, "original">) {
    if (!selectedIpSource) return;
    setIpSelection({ route, sourceId: selectedIpSource.id ?? null });
    setTitle(suggestIpTitle(selectedIpSource, route));
    if (route === "sequel") {
      const sourceGenre = genreMarket.find((item) => item.name === selectedIpSource.genre);
      if (sourceGenre) setGenre(sourceGenre);
    }
    resetCreativeProjectState();
  }

  function commitProjectCost(targetCost: number, nextStage: number) {
    const paymentDelta = projectPaymentDelta(targetCost, projectCostPaid);
    if (paymentDelta > cash) return;
    setCash((value) => value - paymentDelta);
    setProjectCostPaid(targetCost);
    moveToStage(nextStage);
  }

  function requestActor(actor: Actor) {
    if (cast.some((item) => item.id === actor.id)) {
      setCast((current) => current.filter((item) => item.id !== actor.id));
      setDeals((current) => { const next = { ...current }; delete next[actor.id]; return next; });
      setEventChoice(null);
      return;
    }
    const ownedContract = signedTalents.find((contract) => contract.actorId === actor.id);
    if (ownedContract) {
      const threshold = scriptThreshold(getActorProfile(actor));
      const fee = Math.round(actor.fee * TALENT_COST_SCALE * ownedContract.internalRate);
      const morale = scriptScore >= threshold ? 6 : scriptScore >= threshold - 10 ? 1 : -6;
      setCast((current) => {
        const removed = current.length >= 2 ? current[0] : null;
        const next = current.length >= 2 ? [current[1], actor] : [...current, actor];
        setDeals((currentDeals) => {
          const nextDeals = { ...currentDeals, [actor.id]: { fee, morale, label: "旗下艺人内部价" } };
          if (removed) delete nextDeals[removed.id];
          return nextDeals;
        });
        return next;
      });
      setEventChoice(null);
      return;
    }
    const threshold = scriptThreshold(getActorProfile(actor));
    setNegotiationError(scriptScore < threshold - 14 ? `剧本仅 ${scriptScore} 分，${actor.name}的最低阅读标准是 ${threshold - 14} 分。` : "");
    setNegotiating(actor);
  }

  function signActor(actor: Actor, option: typeof contractOptions[number]) {
    const profile = getActorProfile(actor);
    const threshold = scriptThreshold(profile);
    if (scriptScore < threshold - 14) {
      setNegotiationError(`剧本仅 ${scriptScore} 分，低于${profile.tier}级艺人的最低阅读标准 ${threshold - 14} 分。`);
      return;
    }
    const highInterest = scriptScore >= threshold + 8;
    const accepted = highInterest
      || (scriptScore < threshold ? option.id === "premium" : profile.availability === "档期紧张" ? option.id === "premium" : profile.tier === "S" || profile.tier === "SS" ? option.id !== "economy" : true);
    if (!accepted) {
      setNegotiationError(scriptScore < threshold ? `${actor.name}认为剧本吸引力不足，只接受诚意邀约。` : profile.availability === "档期紧张" ? `${actor.name}档期紧张，需要诚意邀约才能协调。` : `${actor.name}团队拒绝了低于市场预期的方案。`);
      return;
    }
    const factor = quoteMultiplier(actor, scriptScore, option.factor);
    const fee = Math.round(actor.fee * factor * TALENT_COST_SCALE);
    const morale = option.morale + (highInterest ? 3 : scriptScore < threshold ? -3 : 0);
    setCast((current) => {
      const removed = current.length >= 2 ? current[0] : null;
      const next = current.length >= 2 ? [current[1], actor] : [...current, actor];
      setDeals((currentDeals) => {
        const nextDeals = { ...currentDeals, [actor.id]: { fee, morale, label: option.name } };
        if (removed) delete nextDeals[removed.id];
        return nextDeals;
      });
      return next;
    });
    setNegotiating(null);
    setNegotiationError("");
    setEventChoice(null);
  }

  function enterCompanyManagement() {
    setCompanyTab(signedTalents.length ? "roster" : "market");
    setCompanyNotice("");
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setStage(6);
  }

  function confirmCompanySigning() {
    if (!signingTarget) return;
    const { actor, origin, rookie } = signingTarget;
    const profile = getActorProfile(actor);
    const quote = origin === "rookie" && rookie ? rookieContractQuote(rookie) : matureContractQuote(actor, profile);
    const firstPayment = quote.signingFee + quote.annualSalary;
    if (signedTalents.length >= rosterCapacity) {
      setCompanyNotice(`经纪部当前只能管理 ${rosterCapacity} 名艺人，提升制片人等级可扩容。`);
      return;
    }
    if (reputation < quote.requiredReputation) {
      setCompanyNotice(`${actor.name}要求行业声望达到 ${quote.requiredReputation}，目前为 ${reputation}。`);
      return;
    }
    if (cash < firstPayment) {
      setCompanyNotice(`签约与首年薪资共需 ¥${money(firstPayment)}，当前资金不足。`);
      return;
    }
    const contract: TalentContract = {
      actorId: actor.id,
      origin,
      signedYear: year,
      contractEndYear: year + 3,
      signingFee: quote.signingFee,
      annualSalary: quote.annualSalary,
      internalRate: quote.internalRate,
      agencyShare: quote.agencyShare,
      loyalty: origin === "rookie" ? 82 : 70,
      potential: rookie?.potential ?? Math.min(99, Math.max(actor.acting, actor.appeal) + 4),
      growth: rookie?.growth ?? 1,
      personality: rookie?.personality ?? profile.archetype,
      lastTrainedYear: -1,
      salaryPaidThrough: year + 1,
      genreProgress: {},
    };
    if (!actorPool.some((item) => item.id === actor.id)) setActorPool((pool) => [...pool, origin === "rookie" ? { ...actor, careerStartYear: year } : actor]);
    if (origin === "rookie") setRookieAlumniIds((current) => current.includes(actor.id) ? current : [...current, actor.id]);
    setSignedTalents((current) => [...current, contract]);
    setCash((value) => value - firstPayment);
    setSigningTarget(null);
    setCompanyTab("roster");
    setCompanyNotice(`已与 ${actor.name} 签订三年合约，首年薪资已经预付。`);
  }

  function trainTalent(actorId: number, type: "acting" | "appeal" | "genre") {
    const contract = signedTalents.find((item) => item.actorId === actorId);
    const actor = actorPool.find((item) => item.id === actorId);
    if (!contract || !actor) return;
    if (contract.lastTrainedYear === year) {
      setCompanyNotice(`${actor.name}本年度已经完成培训。`);
      return;
    }
    if (usedTrainingSlots >= yearlyTrainingCapacity) {
      setCompanyNotice(`本年度 ${yearlyTrainingCapacity} 个培训名额已经用完。`);
      return;
    }
    const cost = type === "acting" ? 600 : type === "appeal" ? 800 : 700;
    if (cash < cost) {
      setCompanyNotice(`本次培训需要 ¥${money(cost)}，当前资金不足。`);
      return;
    }
    const savedTargetGenre = trainingGenre[actorId];
    const targetGenre = savedTargetGenre && !actor.genres.includes(savedTargetGenre) ? savedTargetGenre : genres.find((item) => !actor.genres.includes(item.name))?.name;
    if (type === "genre" && !targetGenre) {
      setCompanyNotice(`${actor.name}已经适配全部电影类型。`);
      return;
    }
    const abilityGain = type === "acting" ? trainingGain(actor.acting, contract) : type === "appeal" ? trainingGain(actor.appeal, contract) : 0;
    if (type !== "genre" && abilityGain === 0) {
      setCompanyNotice(`${actor.name}的${type === "acting" ? "演技" : "号召力"}已经达到潜力上限 ${contract.potential}。`);
      return;
    }
    const previousTier = actorTier(actor.acting, actor.appeal);
    const nextActing = type === "acting" ? Math.min(contract.potential, actor.acting + abilityGain) : actor.acting;
    const nextAppeal = type === "appeal" ? Math.min(contract.potential, actor.appeal + abilityGain) : actor.appeal;
    const nextTier = actorTier(nextActing, nextAppeal);
    setActorPool((pool) => pool.map((item) => {
      if (item.id !== actorId) return item;
      if (type === "acting") return { ...item, acting: Math.min(contract.potential, item.acting + abilityGain) };
      if (type === "appeal") return { ...item, appeal: Math.min(contract.potential, item.appeal + abilityGain) };
      const progress = (contract.genreProgress[targetGenre!] ?? 0) + 60;
      return progress >= 100 ? { ...item, genres: uniqueGenres([...item.genres, targetGenre!]) } : item;
    }));
    setSignedTalents((current) => current.map((item) => {
      if (item.actorId !== actorId) return item;
      const genreProgress = type === "genre" ? { ...item.genreProgress, [targetGenre!]: Math.min(100, (item.genreProgress[targetGenre!] ?? 0) + 60) } : item.genreProgress;
      return { ...item, genreProgress, lastTrainedYear: year, loyalty: Math.min(100, item.loyalty + 2) };
    }));
    if (type === "genre") setTrainingGenre((current) => { const next = { ...current }; delete next[actorId]; return next; });
    setCash((value) => value - cost);
    const tierNotice = previousTier !== nextTier ? ` 综合评级由 ${previousTier} 晋升为 ${nextTier}！` : "";
    setCompanyNotice(type === "acting" ? `${actor.name}完成表演进修，演技 +${abilityGain}。${tierNotice}` : type === "appeal" ? `${actor.name}完成形象经营，号召力 +${abilityGain}。${tierNotice}` : `${actor.name}的${targetGenre}适应度提高了60点。`);
  }

  function settledContractFee(actor: Actor, contract: TalentContract) {
    if (contract.origin !== "rookie" || !result || !cast.some((item) => item.id === actor.id)) return actor.fee;
    const performanceRatio = result.gross / Math.max(1, result.breakEvenGross);
    return rookiePerformanceFee(actor.fee, actorTier(actor.acting, actor.appeal), (contract.filmCredits ?? 0) + 1, performanceRatio);
  }

  function renewTalent(actorId: number) {
    const contract = signedTalents.find((item) => item.actorId === actorId);
    const actor = actorPool.find((item) => item.id === actorId);
    if (!contract || !actor) return;
    const renewal = talentRenewalQuote({ ...actor, fee: settledContractFee(actor, contract) }, contract);
    const renewalFee = renewal.renewalFee;
    if (cash < renewalFee) {
      setCompanyNotice(`续约 ${actor.name} 需要 ¥${money(renewalFee)}。`);
      return;
    }
    setCash((value) => value - renewalFee);
    setSignedTalents((current) => current.map((item) => item.actorId === actorId ? { ...item, annualSalary: renewal.annualSalary, contractEndYear: item.contractEndYear + 3, salaryPaidThrough: Math.max(item.salaryPaidThrough, year + 1), loyalty: Math.min(100, item.loyalty + 8) } : item));
    setCompanyNotice(`已与 ${actor.name} 续约三年，新年薪为 ¥${money(renewal.annualSalary)}。`);
  }

  function dissolveCompanyAndRestart() {
    setSaveReady(false);
    window.localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }

  function claimAnnualInvestment() {
    if (investmentLocked || investmentClaimed) return;
    setInvestmentClaimedYear(year);
    setCash((value) => value + annualInvestment);
  }

  function showScriptPaper(report: ScriptReport | null) {
    setScriptReport(report);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }

  function requestScriptEvaluation() {
    setEvaluatingScript(true);
    try {
      showScriptPaper(evaluateScript(scriptAnswers, scriptQuestions.map((question) => question.id), genre.name, studioLevel));
    } finally {
      setEvaluatingScript(false);
    }
  }

  function selectScriptOption(questionId: string, optionId: string) {
    const before = deriveScriptBuild(scriptAnswers, scriptQuestions as Parameters<typeof deriveScriptBuild>[1], genre.name);
    const nextAnswers = { ...scriptAnswers, [questionId]: optionId };
    const after = deriveScriptBuild(nextAnswers, scriptQuestions as Parameters<typeof deriveScriptBuild>[1], genre.name);
    setScriptAnswers(nextAnswers);
    setScriptFeedback(describeBuildChange(before, after));
    setScriptFeedbackQuestionId(questionId);
    setScriptReport(null);
    setRewriteCost(0);
    setRewriteMarketDelta(0);
  }

  function applyRewrite(direction: RewriteDirection) {
    if (!scriptReport || scriptReport.rewritten) return;
    const rewritten = rewriteScript(scriptReport, direction, false);
    setScriptReport(rewritten.report);
    setRewriteCost(rewritten.cost);
    setRewriteMarketDelta(rewritten.marketHeatDelta);
  }

  function simulate() {
    if (!director || cast.length !== 2) return;
    const outstandingProjectCost = projectPaymentDelta(totalCost, projectCostPaid);
    if (outstandingProjectCost > cash) return;
    const acting = ensemblePerformance?.acting ?? leadActing;
    const leadAppeal = cast.reduce((sum, item) => sum + item.appeal, 0) / cast.length;
    const appeal = ensemblePerformance ? director.appeal * .25 + leadAppeal * .75 * ensembleDownstream.starPowerMultiplier : director.appeal / 3 + leadAppeal * 2 / 3 * scriptEffects.starPowerMultiplier;
    const contentInput = { scriptScore, directorSkill: director.skill, acting, budgetQuality: budget.quality, fit, eventBonus: productionTotals.quality, chemistry: performanceCoordination, morale: averageMorale + productionTotals.morale, directorMatched: director.genres.includes(genre.name), actorFitRate: cast.filter((actor) => actor.genres.includes(genre.name)).length / cast.length, scriptQualityBonus: ensembleDownstream.qualityBonus + ipEffects.qualityBonus, scriptWordOfMouthBonus: ensembleDownstream.wordOfMouthBonus + ipEffects.wordOfMouth };
    const baseContent = buildContentModel(contentInput);
    const expectationDelta = expectationWordOfMouth(baseContent.audienceScore, ipEffects.expectedScore);
    const content = expectationDelta ? buildContentModel({ ...contentInput, scriptWordOfMouthBonus: contentInput.scriptWordOfMouthBonus + expectationDelta }) : baseContent;
    const { quality, wordOfMouth, audienceScore: roundedScore } = content;
    const genreSlotBonus = (slot.id === "spring" && genre.name === "合家欢喜剧") || (slot.id === "summer" && genre.name === "科幻冒险") ? 1.12 : 1;
    const openingPower = Math.min(99, Math.round(appeal * .4 + genre.heat * .2 + promo.power * .25 + studioReach / 1.18 * 100 * .12 + castTierOpeningBonus * scriptEffects.starPowerMultiplier + scriptEffects.openingPower + ipEffects.openingPower));
    const release = buildReleaseModel({ appeal, genreHeat: genre.heat, promoCost: promo.value, promoPower: promo.power, budgetCost: budget.value, budgetCapacity: budget.capacity, slotBoost: slot.boost, studioReach, genreSlotBonus, eventMarket: productionTotals.market + rewriteMarketDelta, wordOfMouth, audienceScore: roundedScore, openingPower, competitionPressure, totalCost, investmentAmount: investmentClaimed ? annualInvestment : 0, scheduleRisk: productionTotals.scheduleRisk, retentionBonus: scriptEffects.retention + ipEffects.retention });
    const { weekDays: days, weekScores, monthDays, weekGross, tailGross, gross, studioRevenue, investorShare, successBonus, profit, breakEvenGross } = release;
    const audience = Math.round(gross * 10000 / 42);
    const trend = days[6] > days[0] * 1.05 ? "口碑逆袭" : days[1] > days[0] && days[6] > days[0] * .72 ? "稳健长线" : days[1] < days[0] * .9 && days[6] < days[0] * .55 ? "高开低走" : "正常回落";
    const scheduleNote = productionTotals.scheduleRisk > 0 ? ` 片场累计 +${productionTotals.scheduleRisk} 档期风险，发行效率降至 ${Math.round(release.scheduleEfficiency * 100)}%。` : " 片场档期风险已控制，不产生额外发行增益。";
    const ipExpectationNote = ipEffects.expectedScore === null ? "" : expectationDelta > 0 ? ` 成片评分超过系列期待 ${ipEffects.expectedScore.toFixed(1)}，IP口碑 +1。` : expectationDelta < 0 ? ` 成片评分未达到系列期待 ${ipEffects.expectedScore.toFixed(1)}，IP口碑 ${expectationDelta}。` : ` 成片评分基本兑现系列期待 ${ipEffects.expectedScore.toFixed(1)}。`;
    const trendNote = `${trend === "口碑逆袭" ? "高口碑抵消同档竞争，路人推荐推动持续增量。" : trend === "高开低走" ? "明星与宣发拉高首日，但剧本口碑未能承接热度。" : trend === "稳健长线" ? "内容、开画与同档竞争较为均衡，首周维持稳定排片。" : "市场热度按常规节奏释放，后续表现由口碑与竞品共同决定。"}${scheduleNote}${ipExpectationNote}`;
    const awardInput = { year, quality, directorSkill: director.skill, fit, acting: leadActing, chemistry: performanceCoordination, audienceScore: roundedScore, pictureBonus: ensembleDownstream.pictureBonus, directorBonus: ensembleDownstream.directorBonus, actingBonus: scriptEffects.awardActing, chemistryBonus: ensemblePerformance?.awardBonus ?? 0 };
    const nominations = judgeAwards(awardInput, slotCompetitors);
    const awardCap = awardWinCap(awardInput);
    const awards = nominations.filter((nomination) => nomination.won).map((nomination) => nomination.category);
    if (awards.includes("最佳表演") && performanceLead?.acting && performanceLead.acting >= 93) setActorHonors((current) => ({ ...current, [performanceLead.id]: [...new Set([...(current[performanceLead.id] ?? []), "最佳表演"])] }));
    const goalOutcome = annualGoal ? evaluateAnnualGoal(annualGoal, { gross, awards: awards.length, totalCost, genre: genre.name, castIds: cast.map((actor) => actor.id), audienceScore: roundedScore, breakEvenGross }) : undefined;
    const careerRewards = calculateCareerRewards(quality, roundedScore, gross / Math.max(1, breakEvenGross), awards.length);
    const xpGain = careerRewards.xpGain + (goalOutcome?.reward.xp ?? 0);
    const reputationGain = careerRewards.reputationGain + (goalOutcome?.reward.reputation ?? 0);
    const dailyReports = buildDailyReports(title, days, wordOfMouth, weekScores, { director, cast, genre: genre.name, quality, honors: actorHonors });
    const filmRecord = createFilmHistoryRecord({ year, title, genre: genre.name, gross, awards: awards.length, score: roundedScore, quality, breakEvenGross, directorId: director.id, castIds: cast.map((actor) => actor.id), coreStyleId: scriptBuild.core?.id, buildName: scriptBuild.buildName, traits: [...new Set([...ipEffects.inheritedTraits, ...scriptBuild.finalTraits])], libraryMultiplier: ensembleDownstream.libraryMultiplier, selection: ipSelection, effects: ipEffects });
    setResult({ quality, gross, profit, score: roundedScore, audience, days, monthDays, weekGross, tailGross, studioRevenue, investorShare, investmentAmount: investmentClaimed ? annualInvestment : 0, successBonus, breakEvenGross, overheadCost, dailyReports, awards, nominations, awardCap, goalOutcome, xpGain, reputationGain, reachUsed: studioReach, wordOfMouth, openingPower, retention: release.retention, trend, trendNote, competitionPressure, scheduleRisk: productionTotals.scheduleRisk, scheduleEfficiency: release.scheduleEfficiency, libraryMultiplier: filmRecord.libraryMultiplier, buildName: scriptBuild.buildName, filmRecord });
    setStudioXp((value) => value + xpGain);
    setReputation((value) => Math.max(0, value + reputationGain));
    setProjectCostPaid(totalCost);
    setCash((value) => Math.max(0, value - outstandingProjectCost + (goalOutcome?.reward.cash ?? 0)));
    setBoxOfficeCashCredited(0);
    setBoxOfficeSettlementLocked(false);
    setRevealedDays(0);
    setAutoPlay(true);
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setStage(5);
  }

  function nextYear() {
    const nextHistory = result ? [result.filmRecord ?? { title, gross: result.gross, awards: result.awards.length, libraryMultiplier: result.libraryMultiplier }, ...history].slice(0, 3) : history.slice(0, 3);
    setHistory(nextHistory);
    const libraryIncome = calculateLibraryIncome(nextHistory);
    const followingYear = year + 1;
    const castIds = new Set(cast.map((actor) => actor.id));
    const performanceRatio = result ? result.gross / Math.max(1, result.breakEvenGross) : 1;
    const rookieExposureByActor = new Map<number, number>();
    const breakoutNotes: string[] = [];
    cast.forEach((actor) => {
      const contract = signedTalents.find((item) => item.actorId === actor.id);
      if (contract?.origin !== "rookie") return;
      const coStarAppeal = Math.max(...cast.filter((item) => item.id !== actor.id).map((item) => item.appeal), actor.appeal);
      const exposureGain = rookieExposureAppealGain(actor.acting, actor.appeal, coStarAppeal, performanceRatio);
      if (!exposureGain) return;
      rookieExposureByActor.set(actor.id, exposureGain);
      breakoutNotes.push(`${actor.name}凭演技 ${actor.acting} 的银幕表现${coStarAppeal > actor.appeal ? "与高人气搭档带来的曝光" : "获得观众关注"}，额外号召力 +${exposureGain}。`);
    });
    const talentNews = generateTalentNews(actorPool, followingYear);
    const newsByActor = new Map(talentNews.map((news) => [news.actorId, news]));
    const retiredIds = new Set(actorPool.filter((actor) => actorAge(actor, followingYear, signedTalents.find((contract) => contract.actorId === actor.id)) >= retirementAge(actor.id)).map((actor) => actor.id));
    const retiredNames = actorPool.filter((actor) => retiredIds.has(actor.id)).map((actor) => actor.name);
    const unlockedGenres = new Map<number, string>();
    const progressedContracts = signedTalents.map((contract) => {
      const actor = actorPool.find((item) => item.id === contract.actorId);
      let genreProgress = contract.genreProgress;
      if (actor && castIds.has(actor.id) && !actor.genres.includes(genre.name)) {
        const progress = (genreProgress[genre.name] ?? 0) + 35;
        genreProgress = { ...genreProgress, [genre.name]: progress };
        if (progress >= 100) unlockedGenres.set(actor.id, genre.name);
      }
      const appeared = castIds.has(contract.actorId);
      return { ...contract, genreProgress, filmCredits: (contract.filmCredits ?? 0) + (appeared ? 1 : 0), careerBoxOffice: (contract.careerBoxOffice ?? 0) + (appeared && result ? result.gross : 0) };
    });
    const expiredContracts = progressedContracts.filter((contract) => contract.contractEndYear < followingYear && !retiredIds.has(contract.actorId));
    const retainedContracts = progressedContracts.filter((contract) => contract.contractEndYear >= followingYear && !retiredIds.has(contract.actorId));
    const expiredRookieIds = new Set(expiredContracts.filter((contract) => contract.origin === "rookie").map((contract) => contract.actorId));
    const externalIncome = progressedContracts.reduce((sum, contract) => {
      const actor = actorPool.find((item) => item.id === contract.actorId);
      if (!actor || contract.signedYear >= year) return sum;
      const fullIncome = externalAgencyIncome(actor, contract);
      return sum + (castIds.has(actor.id) ? Math.round(fullIncome * .35) : fullIncome);
    }, 0);
    const operatingCost = yearlyOperatingCost(studioLevel, signedTalents.length, industryCostIndex);
    const evolvedActorPool = actorPool.filter((actor) => !retiredIds.has(actor.id)).map((actor) => {
      const appeared = cast.some((item) => item.id === actor.id);
      const profile = getActorProfile(actor);
      const contract = progressedContracts.find((item) => item.actorId === actor.id);
      const abilityCap = actor.potential ?? contract?.potential ?? 99;
      const nextAge = actorAge(actor, followingYear, contract);
      const marketRoll = talentMarketRoll(actor.id, followingYear);
      const actingDelta = appeared ? 1 : profile.career === "上升" && marketRoll >= 72 ? 1 : nextAge >= 62 && marketRoll < 45 ? -1 : 0;
      const projectAppealDelta = appeared ? performanceRatio >= 3 ? 5 : performanceRatio >= 1.8 ? 3 : performanceRatio >= 1 ? 1 : performanceRatio < .7 ? -3 : -1 : marketRoll >= 92 ? 3 : marketRoll >= 78 ? 1 : marketRoll < 15 ? -2 : marketRoll < 35 ? -1 : 0;
      const marketFeeRate = appeared ? performanceRatio >= 3 ? .25 : performanceRatio >= 1.8 ? .15 : performanceRatio >= 1 ? .07 : performanceRatio < .7 ? -.1 : -.04 : marketRoll >= 92 ? .14 : marketRoll >= 78 ? .08 : marketRoll >= 55 ? .03 : marketRoll < 15 ? -.1 : marketRoll < 35 ? -.04 : 0;
      const appealDelta = projectAppealDelta + (rookieExposureByActor.get(actor.id) ?? 0) + ageAppealDecline(nextAge) + (newsByActor.get(actor.id)?.appealDelta ?? 0);
      const unlockedGenre = unlockedGenres.get(actor.id);
      const nextActing = Math.max(actor.id >= 100 ? 45 : 65, Math.min(abilityCap, actor.acting + actingDelta));
      const nextAppeal = Math.max(actor.id >= 100 ? 15 : 40, Math.min(abilityCap, actor.appeal + appealDelta));
      const nextTier = actorTier(nextActing, nextAppeal);
      const nextFee = contract?.origin === "rookie" ? appeared ? rookiePerformanceFee(actor.fee, nextTier, contract.filmCredits ?? 1, performanceRatio) : actor.fee : Math.min(5000, Math.max(260, Math.round(actor.fee * (1 + marketFeeRate))));
      return { ...actor, genres: uniqueGenres(unlockedGenre ? [...actor.genres, unlockedGenre] : actor.genres), acting: nextActing, appeal: nextAppeal, fee: nextFee };
    });
    const withdrawnRookieIds = new Set(evolvedActorPool.filter((actor) => expiredRookieIds.has(actor.id) && !isMatureMarketEligible(actor)).map((actor) => actor.id));
    const updatedActorPool = evolvedActorPool.filter((actor) => !withdrawnRookieIds.has(actor.id));
    const updatedContracts = retainedContracts.map((contract) => {
      const actor = updatedActorPool.find((item) => item.id === contract.actorId);
      const annualSalary = contract.origin === "rookie" && actor ? rookieCareerSalary(contract.annualSalary, actor.fee, contract.filmCredits ?? 0) : contract.annualSalary;
      return { ...contract, annualSalary, salaryPaidThrough: contract.salaryPaidThrough < followingYear ? followingYear : contract.salaryPaidThrough };
    });
    const salaryCost = updatedContracts.reduce((sum, contract) => {
      const previous = retainedContracts.find((item) => item.actorId === contract.actorId);
      return previous && previous.salaryPaidThrough < followingYear ? sum + contract.annualSalary : sum;
    }, 0);
    const withdrawnNames = actorPool.filter((actor) => withdrawnRookieIds.has(actor.id)).map((actor) => actor.name);
    const freeMarketNames = expiredContracts.filter((contract) => !withdrawnRookieIds.has(contract.actorId)).map((contract) => actorPool.find((actor) => actor.id === contract.actorId)?.name ?? "未知艺人");
    const tierChanges = updatedActorPool.flatMap((actor) => {
      const previous = actorPool.find((item) => item.id === actor.id);
      if (!previous) return [];
      const before = actorTier(previous.acting, previous.appeal);
      const after = actorTier(actor.acting, actor.appeal);
      if (before === after) return [];
      return [`${actor.name}综合值 ${actor.acting + actor.appeal}，评级由 ${before} ${tierRank(after) > tierRank(before) ? "晋升" : "下调"}为 ${after}。`];
    });
    const appealChanges = updatedActorPool.flatMap((actor) => {
      const previous = actorPool.find((item) => item.id === actor.id);
      const contract = progressedContracts.find((item) => item.actorId === actor.id);
      if (!previous || contract?.origin !== "rookie" || !castIds.has(actor.id)) return [];
      const exposure = rookieExposureByActor.get(actor.id) ?? 0;
      const news = newsByActor.get(actor.id)?.appealDelta ?? 0;
      const net = actor.appeal - previous.appeal;
      return [`${actor.name}号召力 ${previous.appeal} → ${actor.appeal}：银幕曝光 +${exposure}，年度舆情 ${news >= 0 ? "+" : ""}${news}，影片走势与年龄等因素计入后净变化 ${net >= 0 ? "+" : ""}${net}。`];
    });
    const salaryChanges = updatedContracts.flatMap((contract) => {
      const previous = retainedContracts.find((item) => item.actorId === contract.actorId);
      const actor = updatedActorPool.find((item) => item.id === contract.actorId);
      if (!previous || !actor || contract.origin !== "rookie" || contract.annualSalary <= previous.annualSalary) return [];
      return [`${actor.name}累计主演 ${contract.filmCredits ?? 0} 部，年薪由 ¥${money(previous.annualSalary)} 上调至 ¥${money(contract.annualSalary)}。`];
    });
    setSignedTalents(updatedContracts);
    setAgencyLedger({ year, externalIncome, libraryIncome, salaryCost, operatingCost, talentNews, breakoutNotes, appealChanges, salaryChanges, tierChanges, retiredNames, withdrawnNames, expiredNames: freeMarketNames });
    setCash((value) => settleAnnualCompanyCash(value, externalIncome, libraryIncome, salaryCost, operatingCost));
    setActorPool(updatedActorPool);
    const nextGenreMarket = evolveGenreMarket(genreMarket, followingYear);
    const nextDirectorPool = evolveDirectorMarket(directorPool, followingYear, genreMarket.map((item) => item.name));
    setGenreMarket(nextGenreMarket);
    setGenre(nextGenreMarket.find((item) => item.name === genre.name) ?? nextGenreMarket[0]);
    setDirectorPool(nextDirectorPool);
    setYear((value) => value + 1);
    setTitle("未命名计划");
    setIpSelection({ route: "original", sourceId: null });
    setScriptAnswers({});
    setScriptReport(null);
    setScriptFeedback("");
    setScriptFeedbackQuestionId(null);
    setAnnualGoalId(null);
    setAnnualGoalLocked(false);
    setRewriteCost(0);
    setRewriteMarketDelta(0);
    setDirector(null);
    setCast([]);
    setEnsembleCastId("lean");
    setDeals({});
    setEventChoice(null);
    setProductionChoices([null, null, null]);
    setProductionLocked(false);
    setResult(null);
    setProjectCostPaid(0);
    setBoxOfficeCashCredited(0);
    setBoxOfficeSettlementLocked(false);
    setRevealedDays(0);
    setAutoPlay(true);
    setCompanyNotice("");
    setExpiryReminderDismissedYear(null);
    setUtilityRoom(null);
    setWorkspaceOpen(false);
    setInStudioHub(true);
    setStage(0);
  }

  return (
    <main className="app-shell">
      <GameHeader level={studioLevel} year={year} cash={money(cash)} reputation={reputation} xpProgress={studioXpProgress} />
      <StageProgress stage={stage} labels={stageLabels} />
      {inStudioHub ? <section className="studio-hub" aria-label="造梦片场公司总部">
        <div className="studio-hub__shade" />
        <header className="studio-hub__intro">
          <span>DREAM STUDIO · YEAR {String(year).padStart(2, "0")}</span>
          <h1>欢迎回到，<em>造梦片场。</em></h1>
          <p>电影制作按房间依次推进；经纪部与融资中心随时开放，不会改变当前项目进度。</p>
        </header>
        <div className="studio-rooms">
          <StudioRoomButton className="room-current" code={`当前主线 · ${activeWorkflowRoom.code}`} name={activeWorkflowRoom.name} note={`${stageLabels[stage]} · ${activeWorkflowRoom.prompt}`} onClick={openWorkflowRoom} />
          <StudioRoomButton className="room-agency" code="ALWAYS OPEN" name="艺人经纪部" note={`${signedTalents.length}/${rosterCapacity} 位旗下艺人 · 签约与培训`} onClick={openAgencyUtility} />
          <StudioRoomButton className="room-finance" code="ALWAYS OPEN" name="融资中心" note={investmentLocked ? "渠道已开放 · 第2年可正式融资" : investmentClaimed ? `第${year}年融资已完成` : `本年度可融资 ¥${money(annualInvestment)}`} onClick={() => setShowFinance(true)} />
        </div>
        <footer className="studio-hub__status">
          <span><i className="live-dot" /> 公司运转中</span>
          <b>主线锁定 · {activeWorkflowRoom.name}</b>
          <small>完成当前房间后，下一扇门才会开启</small>
        </footer>
      </section> : <>
      <div className="room-scene-nav">
        <button type="button" onClick={returnToHub}>← 返回主片场</button>
        <span>{utilityRoom === "agency" ? "常驻支线" : stageLabels[stage]} · {activeRoom.name}</span>
        <small>《{title || "未命名计划"}》</small>
      </div>
      {!workspaceOpen && <section className={`department-scene department-scene--${activeRoom.scene}`} aria-label={`${activeRoom.name}场景`}>
        <div className="department-scene__copy">
          <span>{activeRoom.code} DEPARTMENT</span>
          <h2>{activeRoom.name}</h2>
          <p>{utilityRoom === "agency" ? "经纪业务不会改变电影制作进度，完成后可随时回到主片场。" : activeRoom.prompt}</p>
          <button type="button" onClick={() => setWorkspaceOpen(true)}>{activeRoom.action}<i>→</i></button>
        </div>
        {activeRoom.scene === "cinema" && result && <div className="cinema-screen-live">
          <span><i className={autoPlay && revealedDays < 7 ? "live-dot" : ""} /> FIRST WEEK LIVE</span>
          <h2>《{title}》</h2>
          <div><b>¥{money(revealedDays === 7 ? result.gross : liveWeekGross)}</b><small>{revealedDays === 7 ? "30日最终票房" : "当前首周累计"}</small></div>
        </div>}
      </section>}
      {workspaceOpen && <div className={`room-operation-shell operation-${activeRoom.scene}`}>
      {activeRoom.scene === "cinema" && result && <section className="operation-cinema-board" aria-label="首周票房即时数据">
        <div className="cinema-screen-live">
          <span><i className={autoPlay && revealedDays < 7 ? "live-dot" : ""} /> FIRST WEEK LIVE</span>
          <h2>《{title}》</h2>
          <div><b>¥{money(revealedDays === 7 ? result.gross : liveWeekGross)}</b><small>{revealedDays === 7 ? "30日最终票房" : "当前首周累计"}</small></div>
          <dl><div><dt>实时评分</dt><dd>{latestReport?.audienceScore ?? "--"}</dd></div><div><dt>上映进度</dt><dd>{revealedDays}/7 天</dd></div><div><dt>市场走势</dt><dd>{liveTrend}</dd></div></dl>
        </div>
      </section>}
      <div className="workspace">
        <section className={`project-board ${!utilityRoom && stage === 5 ? "premiere-live-screen" : ""}`}>
          {!utilityRoom && stage === 0 && (
            <>
              <PageHead code={`PROJECT CONTROL · 00${year}`} title="下一部电影，" accent="由你决定。" sub="从一个好题材开始，组建班底，把它送上大银幕。" stamp="系统待命" />
              {agencyLedger && <>
                <div className="agency-ledger"><span>上一年度公司结算</span><div><b className="positive">+¥{money(agencyLedger.externalIncome)}</b><small>艺人外部工作分成</small></div><div><b className="positive">+¥{money(agencyLedger.libraryIncome ?? 0)}</b><small>片库版权与长尾收益</small></div><div><b className="negative">-¥{money(agencyLedger.salaryCost)}</b><small>新年度艺人薪资</small></div><div><b className="negative">-¥{money(agencyLedger.operatingCost ?? 0)}</b><small>公司运营与团队成本</small></div><p>年度经营净额 {agencyLedger.externalIncome + (agencyLedger.libraryIncome ?? 0) - agencyLedger.salaryCost - (agencyLedger.operatingCost ?? 0) >= 0 ? "+" : "-"}¥{money(Math.abs(agencyLedger.externalIncome + (agencyLedger.libraryIncome ?? 0) - agencyLedger.salaryCost - (agencyLedger.operatingCost ?? 0)))}</p></div>
                {!!agencyLedger.talentNews?.length && <div className="industry-news"><div><span>INDUSTRY WATCH</span><b>年度艺人舆情与市场变动</b></div>{agencyLedger.talentNews.map((news) => {
                  const newsActor = actorPool.find((actor) => actor.id === news.actorId) ?? actors.find((actor) => actor.id === news.actorId) ?? rookieCandidates.find((actor) => actor.id === news.actorId);
                  const toneLabel = news.tone === "negative" ? "负" : news.tone === "positive" ? "升" : "稳";
                  return <article className={news.tone} key={`${agencyLedger.year}-${news.actorId}`}><div className="industry-news-avatar">{newsActor && <PortraitAvatar person={newsActor} group={news.actorId >= 100 ? "rookie" : "actor"} />}<i>{toneLabel}</i></div><div><b>{news.actorName} · {news.title}</b><small>公众号召力 {news.appealDelta >= 0 ? "+" : ""}{news.appealDelta}</small></div></article>;
                })}{agencyLedger.breakoutNotes?.map((note) => <p className="breakout-note" key={note}>新人出圈 · {note}</p>)}{agencyLedger.appealChanges?.map((note) => <p className="appeal-change-note" key={note}>号召结算 · {note}</p>)}{agencyLedger.salaryChanges?.map((note) => <p className="salary-change-note" key={note}>身价成长 · {note}</p>)}{agencyLedger.tierChanges?.map((note) => <p className="tier-change-note" key={note}>评级变动 · {note}</p>)}{!!agencyLedger.retiredNames?.length && <p>{agencyLedger.retiredNames.join("、")}达到职业生涯终点，正式退休。</p>}{!!agencyLedger.expiredNames.length && <p>{agencyLedger.expiredNames.join("、")}合约到期，已进入成型艺人自由市场。</p>}{!!agencyLedger.withdrawnNames?.length && <p>{agencyLedger.withdrawnNames.join("、")}合约到期后尚未达到B级市场门槛，暂时退出公开选角市场。</p>}</div>}
              </>}
              {year > 1 && <div className="market-cycle-banner"><div><span>YEAR {year} MARKET</span><b>年度电影市场重新洗牌</b></div><dl><dt>当前最热</dt><dd>{marketLeader.name} · {marketLeader.heat}</dd><dt>上升最快</dt><dd>{marketRiser.name} · {(marketRiser.heatChange ?? 0) >= 0 ? "+" : ""}{marketRiser.heatChange ?? 0}</dd><dt>可约导演</dt><dd>{availableDirectors.length} / {directorPool.length} 位</dd></dl></div>}
              <SectionTitle number="IP" title="选择本年项目来源" note="原创立项，或延续近三部作品形成跨年度系列" />
              <div className="ip-source-grid">
                <button type="button" className={ipSelection.route === "original" ? "selected" : ""} aria-pressed={ipSelection.route === "original"} onClick={chooseOriginalProject}><span>NEW ORIGINAL</span><b>开发原创项目</b><p>不继承品牌加成，也不承担前作期待与系列疲劳。</p><i>{ipSelection.route === "original" ? "当前项目" : "选择原创"}</i></button>
                {availableIpSources.map((film) => <button type="button" key={film.id} className={ipSelection.sourceId === film.id ? "selected" : ""} aria-pressed={ipSelection.sourceId === film.id} onClick={() => chooseIpSource(film)}><span>IP ASSET · {film.seriesEntry ?? 1} 部</span><b>《{film.seriesTitle ?? film.title}》</b><p>品牌热度 {film.brandHeat} · {film.score === undefined ? "旧片评分已折算" : `前作评分 ${film.score.toFixed(1)}`} · 疲劳 {film.fatigue ?? 0}</p><i>{ipSelection.sourceId === film.id ? "已选为系列母片" : "开发该IP"}</i></button>)}
              </div>
              {!availableIpSources.length && <div className="ip-empty-note"><span>待</span><p>首部电影达到评分8.0、票房5.5亿、回本1.35倍或获得奖项后，将在下一年解锁IP开发。</p></div>}
              {selectedIpSource && ipSelection.route !== "original" && <div className="ip-route-panel"><header><div><span>SERIES DEVELOPMENT</span><b>《{selectedIpSource.seriesTitle ?? selectedIpSource.title}》第 {(selectedIpSource.seriesEntry ?? 1) + 1} 部</b></div><p>品牌热度 {selectedIpSource.brandHeat} · 当前疲劳 {selectedIpSource.fatigue ?? 0}</p></header><div>{ipRoutes.map((route) => <button type="button" key={route.id} className={ipSelection.route === route.id ? "selected" : ""} aria-pressed={ipSelection.route === route.id} onClick={() => chooseIpRoute(route.id)}><span>{route.name}</span><b>{route.summary}</b><small>{route.upside}</small><i>{route.pressure}</i></button>)}</div><p className="ip-route-tip">进入选角后，原班主演回归人数、当前核心流派和题材变化会实时更新系列收益与疲劳。</p></div>}
              <SectionTitle number="委" title="选择年度制片委托" note="三选一，确认后锁定到本片结算" />
              <div className="annual-goal-grid">{annualGoalCandidates.map((goal) => <button type="button" key={goal.id} disabled={annualGoalLocked} className={annualGoalId === goal.id ? "selected" : ""} onClick={() => setAnnualGoalId(goal.id)}><header><span>{"★".repeat(goal.stars)}</span><b>{goal.title}</b></header><p>{goal.description}</p><small>奖励 · ¥{money(goal.reward.cash)} / {goal.reward.xp} XP / {goal.reward.reputation} 声望</small>{annualGoalId === goal.id && <i>{annualGoalLocked ? "目标已锁定" : "已选择 · 开始后锁定"}</i>}</button>)}</div>
              <SectionTitle number="1" title="片名与电影题材" note="市场热度会随档期与年份变化" />
              <label className="title-input"><span>项目片名</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={12} /></label>
              <div className="genre-grid">
                {genreMarket.map((item) => { const sequelGenreLocked = ipSelection.route === "sequel" && Boolean(selectedIpSource?.genre) && item.name !== selectedIpSource?.genre; return <button key={item.name} disabled={sequelGenreLocked} className={`genre-card ${genre.name === item.name ? "selected" : ""}`} onClick={() => { setGenre(item); resetCreativeProjectState(); }} aria-pressed={genre.name === item.name}>
                  <span className="genre-icon" style={{ background: genre.name === item.name ? item.color : undefined }}>{item.icon}</span><strong>{item.name}</strong><small>市场热度 · {item.marketNote ?? "本年行情"}</small><div className="heat-row"><div className="heat"><i style={{ width: `${item.heat}%`, background: item.color }} /></div><b>{item.heat}</b></div>{item.heatChange !== undefined && <span className={`market-shift ${item.heatChange >= 0 ? "up" : "down"}`}>{item.heatChange >= 0 ? "↑" : "↓"}{Math.abs(item.heatChange)}</span>}{genre.name === item.name && <span className="picked">已选择</span>}
                </button>; })}
              </div>
              <SectionTitle number="2" title="制作规模" note={`公司当前可用资金 ¥${money(cash)}`} />
              <div className="budget-choice">{budgets.map((item) => <button key={item.name} className={budget.name === item.name ? "selected" : ""} onClick={() => setBudget(item)}>{item.name}<small>¥{money(Math.round(item.value * industryCostIndex))}</small></button>)}</div>
              <div className="cost-index-note"><span>行业成本指数 ×{industryCostIndex.toFixed(2)}</span><p>场地、器材、保险与人工会随年份上涨；高等级公司也承担更高年度运营成本。</p></div>
              <ActionBar label={annualGoal ? `${routeName(ipSelection.route)} · ${annualGoal.title} · ${title || "未命名"}` : "请先选择年度委托"} detail={`制作预算 ¥${money(currentBudgetCost)} · 确认后立即支付${selectedIpSource ? ` · 品牌热度 ${selectedIpSource.brandHeat}` : ""}${annualGoal ? ` · ${annualGoal.description}` : ""}`} button="开始剧本创作" disabled={!annualGoal || !title.trim() || projectPaymentDelta(currentBudgetCost, projectCostPaid) > cash} onClick={() => { setAnnualGoalLocked(true); commitProjectCost(currentBudgetCost, 1); }} />
            </>
          )}

          {!utilityRoom && stage === 1 && (
            <div className={`script-paper ${scriptReport ? "script-result-paper" : "script-questionnaire-paper"}`}>
              <i className="paper-ornament paper-ornament--tl">❧</i><i className="paper-ornament paper-ornament--tr">❧</i><i className="paper-ornament paper-ornament--bl">❧</i><i className="paper-ornament paper-ornament--br">❧</i>
              <header className="script-paper-head">
                <span>SCRIPT DEVELOPMENT · YEAR {year}</span>
                <h1>《{title}》{scriptReport ? "剧本评估书" : "创作定稿单"}</h1>
                <p>{genre.icon} {genre.name} · {scriptReport ? "制片部内部评估件" : `已完成 ${Object.keys(scriptAnswers).length} / ${scriptQuestions.length} 项创作决策`}</p>
              </header>

              {!scriptReport ? <>
                <div className="script-build-desk">
                  <header><div><small>BUILD DESK</small><b>{scriptBuildPreview.core?.name ?? "先选择核心流派"}</b></div><span>{scriptBuildPreview.core ? scriptBuildPreview.alignedChoices >= 2 ? `核心共鸣 2/2 · 已激活${scriptBuildPreview.alignedChoices > 2 ? ` · 同向强化 ${scriptBuildPreview.alignedChoices} 次` : ""}` : `核心共鸣 ${scriptBuildPreview.alignedChoices}/2 · 形成中` : "等待形成连接"}</span></header>
                  <div className="build-desk-grid"><section><span>核心 / 关键词</span><b>{scriptBuildPreview.core ? `${scriptBuildPreview.core.name} · ${scriptBuildPreview.keywords.join(" / ") || "等待路线牌"}` : "首题将锁定本片核心方向"}</b></section><section><span>已激活组合</span><b>{scriptBuildPreview.activeEngines.join(" / ") || "至少两次同向强化可启动核心引擎"}</b></section><section className={scriptBuildPreview.unresolvedFlaws.length ? "warning" : "resolved"}><span>未解决缺陷</span><b>{scriptBuildPreview.unresolvedFlaws.join(" / ") || "当前没有悬而未决的创作缺口"}</b></section>{scriptBuildPreview.nextConnections.length > 0 && <section><span>下一步可能连接</span><b>{scriptBuildPreview.nextConnections.map((item) => `${item.name}：还缺「${item.missingKeyword}」`).join(" / ")}</b></section>}</div>
                  <p className="build-order-note">效果按 Q1 → Q6 的叙事顺序结算；点击顺序不会改变缺陷先后关系。</p>
                  {scriptFeedback && <p className="build-live-feedback">最新构筑反馈 · {scriptFeedback}</p>}
                </div>
                {selectedIpSource && ipSelection.route !== "original" && <div className="ip-script-inheritance"><span>IP INHERITANCE · {routeName(ipSelection.route)}</span><b>{ipEffects.inheritedTraits.length ? `继承前作：${ipEffects.inheritedTraits.join(" / ")}` : ipSelection.route === "reboot" ? "重启路线主动放弃旧特性，以新核心建立认知" : "前作旧存档未记录成片特性，本部从新核心开始积累"}</b><p>当前核心会与前作比较并影响系列疲劳；预计疲劳 {ipEffects.projectedFatigue}，前作期待评分 {ipEffects.expectedScore?.toFixed(1)}。</p></div>}
                <div className="questionnaire">
                  {scriptQuestions.map((question, questionIndex) => <section className="script-question" key={question.id}>
                    <div className="question-head"><span>Q{questionIndex + 1}</span><div><h2>{question.title}</h2><p>{question.prompt}</p></div></div>
                    <div className="script-options">{question.options.map((option) => {
                      const selected = scriptAnswers[question.id] === option.id;
                      const priorBuild = deriveScriptBuild(scriptAnswers, scriptQuestions.slice(0, questionIndex) as Parameters<typeof deriveScriptBuild>[1], genre.name);
                      const canRepairExistingFlaw = Boolean(option.repairsFlaw && priorBuild.unresolvedFlaws.includes(option.repairsFlaw));
                      const functionLabel = option.routeFunction === "core" ? "核心流派" : option.routeFunction === "venture" ? "冒险牌" : option.routeFunction === "convert" ? "转化牌" : "强化牌";
                      return <button key={option.id} className={selected ? "selected" : ""} onClick={() => selectScriptOption(question.id, option.id)} aria-pressed={selected}><b>{option.label}</b><small>{option.description}</small><span className="option-keyword"><em>#{option.keyword}</em><i>{functionLabel}</i></span>{option.routeFunction === "core" ? <span className="option-tradeoff option-core-effects"><em className="advantage">核心优势 · {option.coreAdvantages}</em><em className="cost">构筑代价 · {option.coreCosts}</em><em>激活条件 · {option.relation}</em></span> : <span className="option-tradeoff"><em>收益 · {option.upside}</em><em>关系 · {option.relation}</em>{option.addsFlaw && <em className="flaw">缺陷 · {option.addsFlaw}</em>}{option.repairsFlaw && <em className="repair">{canRepairExistingFlaw ? "修复" : "结构补强 / 预防"} · {option.repairsFlaw}</em>}</span>}{selected && <i>已勾选</i>}</button>;
                    })}</div>{scriptFeedbackQuestionId === question.id && scriptFeedback && <p className="build-inline-feedback" aria-live="polite">本次选择变化 · {scriptFeedback}</p>}
                  </section>)}
                </div>
                <div className="script-paper-actions">
                  <button className="paper-back" type="button" onClick={() => moveToStage(0)}>返回项目企划</button>
                  <button className="evaluate-script" disabled={Object.keys(scriptAnswers).length !== scriptQuestions.length || evaluatingScript} onClick={requestScriptEvaluation}><span>{evaluatingScript ? "正在送审…" : "确认交稿"}</span><small>{Object.keys(scriptAnswers).length === scriptQuestions.length ? "封存选择并生成剧本评分" : `还需完成 ${scriptQuestions.length - Object.keys(scriptAnswers).length} 道选择`}</small></button>
                </div>
              </> : <>
                <div className="script-result-summary">
                  <div className="script-grade-stamp"><small>FINAL DRAFT</small><b>{scriptReport.grade}</b><span>{scriptReport.score} 分</span></div>
                  <div><span>评审结论</span><h2>{scriptReport.verdict}</h2><p>该评分将影响导演与演员的邀约意愿、报价以及最终成片质量。</p></div>
                </div>
                {scriptReport.build && <div className="final-build-report"><header><span>FINAL BUILD</span><h3>{scriptReport.build.buildName}</h3><p>{scriptReport.build.core?.pitch}</p></header><div><span>引擎</span><b>{scriptReport.build.activeEngines.join(" / ") || "核心引擎未完全启动"}</b></div><div><span>成片特性</span><b>{scriptReport.build.finalTraits.join(" / ") || "基础类型片"}</b></div>{selectedIpSource && ipSelection.route !== "original" && <div><span>IP继承</span><b>{ipEffects.inheritedTraits.join(" / ") || (ipSelection.route === "reboot" ? "重启路线不继承旧特性" : "前作旧存档无可继承特性")} · 疲劳 {ipEffects.projectedFatigue}</b></div>}<div><span>缺陷与冲突</span><b>{[...scriptReport.build.unresolvedFlaws, ...scriptReport.build.conflicts].join(" / ") || "已完成收束"}</b></div><div className="actual-settlement"><span>实际结算</span><b>{summarizeScriptDownstream(scriptReport.build.downstream).join(" · ")}</b></div><ul>{scriptReport.build.appliedEffects.map((effect) => <li key={effect}>{effect}</li>)}</ul></div>}
                <div className="script-dimensions"><h3>剧本质量评估</h3><Metric label="叙事结构" value={scriptReport.story} /><Metric label="人物塑造" value={scriptReport.character} /><Metric label="市场潜力" value={scriptReport.market} /><Metric label="原创表达" value={scriptReport.originality} /><div className="producer-writing-bonus"><span>选择基础分 <b>{scriptReport.baseScore}</b></span><i>+</i><span>Lv.{studioLevel} 制片经验 <b>+{scriptReport.levelBonus}</b></span><strong>最终评分 {scriptReport.score}</strong></div><p>制片经验只提供 0—4 分的温和修正；演员仍会比较最终剧本分数与自己的接戏门槛。</p></div>
                <div className="rewrite-panel"><header><div><span>ONCE PER FILM</span><b>{scriptReport.rewritten ? "本片改稿已完成" : "一次定向改稿机会"}</b></div><small>{scriptReport.rewritten ? `追加成本 ¥${money(rewriteCost)} · 市场热度 ${rewriteMarketDelta >= 0 ? "+" : ""}${rewriteMarketDelta}` : "选择后立即锁定，不能反复刷分"}</small></header><div>{([{ id: "structure", title: "结构重写", effect: "叙事 +7 / 市场 -3", cost: 900 }, { id: "character", title: "人物精修", effect: "人物 +7 / 市场 -2", cost: 700 }, { id: "commercial", title: "商业化改稿", effect: "市场 +8 / 人物 -3 / 原创 -4", cost: 600 }] as const).map((plan) => <button type="button" key={plan.id} disabled={scriptReport.rewritten} onClick={() => applyRewrite(plan.id)}><b>{plan.title}</b><span>{plan.effect}</span><small>追加 ¥{money(plan.cost)}</small></button>)}</div></div>
                <div className="script-paper-actions result-actions">
                  <button className="paper-back" type="button" disabled={scriptReport.rewritten} onClick={() => showScriptPaper(null)}>{scriptReport.rewritten ? "改稿已锁定" : "返回修改"}</button>
                  <button className="paper-confirm" type="button" onClick={() => moveToStage(2)}><span>确认评分，前往选角</span><i>→</i></button>
                </div>
              </>}
            </div>
          )}

          {!utilityRoom && stage === 2 && (
            <>
              <PageHead code="CASTING DATABASE" title="让好剧本找到" accent="对的演员。" sub={`《${title}》——${genre.name}，剧本评分 ${scriptScore}，演员会根据剧本吸引力和自身档期决定报价。`} stamp="检索中" />
              <div className={`script-leverage ${scriptScore >= 84 ? "strong" : scriptScore < 70 ? "weak" : ""}`}><span>{scriptReport?.grade}</span><div><small>剧本吸引力</small><b>{scriptScore} 分 · {scriptReport?.verdict}</b></div><p>{scriptScore >= 84 ? "头部艺人愿意为好角色降低报价。" : scriptScore >= 70 ? "大部分演员可以正常邀约，头部艺人可能要求溢价。" : "高咖演员的邀约难度较高，优先考虑适配型阵容。"}</p></div>
              {selectedIpSource && ipSelection.route !== "original" && <div className="ip-casting-impact"><header><div><span>{routeName(ipSelection.route)} · BRAND {selectedIpSource.brandHeat}</span><b>系列主创策略实时结算</b></div><i>疲劳 {ipEffects.projectedFatigue}</i></header><div><span>品牌开画 <b>{ipEffects.openingPower >= 0 ? "+" : ""}{ipEffects.openingPower}</b></span><span>传承质量 <b>+{ipEffects.qualityBonus}</b></span><span>前作期待 <b>{ipEffects.expectedScore?.toFixed(1)}</b></span><span>回归主演 <b>{ipEffects.returningCastCount}/2</b></span><span>回归溢价 <b>¥{money(ipCastingPremium)}</b></span></div><p>{ipEffects.inheritedTraits.length ? `继承特性：${ipEffects.inheritedTraits.join(" / ")}。这些特性合计提供成片质量 +${ipEffects.qualityBonus}，并写入本部系列资产。` : ipSelection.route === "reboot" ? "重启路线主动放弃旧作特性。" : "前作旧存档没有可继承特性，本部成片后会开始记录。"} {ipEffects.notes.join("；")}</p></div>}
              <SectionTitle number="1" title="选择导演" note="点击卡片签约 1 位导演" />
              <div className="director-market-note"><span>本年度仅展示有档期的导演</span><b>{availableDirectors.length} 位可约 · 技能、号召力、报价与擅长题材会逐年变化</b></div>
              <div className="talent-grid directors">{availableDirectors.map((item) => <TalentCard key={item.id} person={item} selected={director?.id === item.id} onClick={() => setDirector(item)} year={year} />)}</div>
              <SectionTitle number="2" title="选择主演" note={`已签约 ${cast.length}/2 · 点击已签演员可解除合约`} />
              <div className="talent-toolbar">
                <div className="filter-chips">{(["全部", "男演员", "女演员", "高适配"] as const).map((filter) => <button key={filter} className={actorFilter === filter ? "active" : ""} onClick={() => setActorFilter(filter)}>{filter}</button>)}</div>
                <label className="talent-search"><span>⌕</span><input value={actorQuery} onChange={(event) => setActorQuery(event.target.value)} placeholder="搜索艺名、标签或题材" aria-label="搜索演员" /></label>
                <b className="roster-count">{filteredActors.length} / {actorPool.length}</b>
              </div>
              <div className="fictional-note"><b>虚构艺人库</b><span>所有人物均为架空角色，谐音与联想仅用于娱乐，不代表或影射现实人物的真实经历、能力和评价。</span></div>
              {ensembleActive && <div className="ensemble-casting"><header><div><span>ENSEMBLE ENGINE</span><b>选择配角班底</b></div><p>仍只选择两位核心主演 / 叙事锚点；班底以整体配置参与成本、表演与奖项。</p></header><div>{ensembleCastOptions.map((option) => <button type="button" key={option.id} className={ensembleCastId === option.id ? "selected" : ""} onClick={() => setEnsembleCastId(option.id)}><b>{option.name}</b><span>{option.cost ? `追加 ¥${money(Math.round(option.cost * industryCostIndex))}` : "零追加成本"}</span><small>{option.description}</small>{ensembleCastId === option.id && <i>已选择</i>}</button>)}</div>{ensemblePerformance ? <p className="ensemble-preview">群像协调度 {ensemblePerformance.coordination} · 综合表演 {ensemblePerformance.acting.toFixed(1)} · {ensemblePerformance.synergy}</p> : <p className="ensemble-preview">可先选择班底；选定导演和两位叙事锚点后显示协调度、综合表演与导演联动。</p>}</div>}
              <div className="talent-grid">{filteredActors.map((item) => <TalentCard key={item.id} person={item} selected={cast.some((actor) => actor.id === item.id)} onClick={() => requestActor(item)} year={year} deal={deals[item.id]} scriptScore={scriptScore} ownedContract={signedTalents.find((contract) => contract.actorId === item.id)} honorTitle={actorHonorTitle(item, actorHonors) ?? ((selectedIpSource?.castIds ?? []).includes(item.id) ? "前作主演" : undefined)} />)}</div>
              {!filteredActors.length && <div className="empty-roster">没有找到符合条件的演员，换个关键词试试。</div>}
              {cast.length > 0 && <div className="cast-dynamics">
                <div><span>{ensembleActive ? "核心主演 / 叙事锚点" : "已签约主演"}</span><b>{cast.map((actor) => `${actor.name}（${deals[actor.id]?.label}）`).join(" / ")}</b></div>
                <div><span>{ensembleActive ? "群像协调度" : "组合默契"}</span><b>{cast.length === 2 ? performanceCoordination : "待第二位主演"}{cast.length === 2 ? ` · ${performanceCoordination >= 88 ? ensembleActive ? "调度成熟" : "天生搭档" : performanceCoordination >= 74 ? "值得期待" : "首次磨合"}` : ""}</b></div>
                <div><span>平均士气</span><b className={averageMorale >= 0 ? "positive" : "negative"}>{averageMorale >= 0 ? "+" : ""}{averageMorale.toFixed(0)}</b></div>
              </div>}
              <ActionBar label={director ? `${director.name} / ${cast.map((item) => item.name).join("、") || "待选主演"}` : "尚未选择导演"} detail={`剧本 ${scriptScore} 分 · 主创班底 ¥${money(talentCost)}${ipCastingPremium ? `（含IP回归溢价 ¥${money(ipCastingPremium)}）` : ""} · 适配 +${fit}${cast.length === 2 ? ` · ${ensembleActive ? "协调" : "默契"} ${performanceCoordination}` : ""}`} button="开机拍摄" disabled={!director || cast.length !== 2 || projectPaymentDelta(totalBeforeRelease, projectCostPaid) > cash} onClick={() => { setEventChoice(null); commitProjectCost(totalBeforeRelease, 3); }} back={() => moveToStage(1)} />
            </>
          )}

          {!utilityRoom && stage === 3 && (
            <>
              <PageHead code="NOW FILMING" title={`《${title}》`} accent="正式开机。" sub={`${director?.name}执导，${cast.map((item) => item.name).join("、")}${ensembleActive ? `担任叙事锚点，${selectedEnsembleCast.name}共同出演。` : "领衔主演。"}`} stamp="拍摄中" />
              <div className="production-overview">
                <div className="clapperboard-card" role="img" aria-label={`《${title}》拍摄场记板`}>
                  <div className="clapperboard-copy"><span>PRODUCTION</span><h2>{title}</h2><dl><div><dt>SCENE</dt><dd>{String(year).padStart(2, "0")}-{genre.name.slice(0, 2)}</dd></div><div><dt>TAKE</dt><dd>01</dd></div></dl><p>导演 · {director?.name}</p><small>{cast.map((item) => item.name).join(" / ")}</small></div>
                </div>
                <div className="production-stats"><header><div><span>PRODUCTION MONITOR</span><h3>制作状态</h3></div><i><b /> REC</i></header><Metric label="剧本质量" value={scriptScore} /><Metric label="题材适配" value={Math.min(100, 64 + fit)} /><Metric label="班底实力" value={Math.round(((director?.skill ?? 0) + (ensemblePerformance?.acting ?? cast.reduce((sum, item) => sum + item.acting, 0) / 2)) / 2)} /><Metric label={ensembleActive ? "群像协调" : "主演默契"} value={performanceCoordination} /><Metric label="预算保障" value={budget.name === "大片级" ? 94 : budget.name === "标准制作" ? 78 : 61} /><div className="crew-line"><span>DIRECTOR <b>{director?.name}</b></span><span>CAST <b>{cast.map((item) => item.name).join(" / ")}{ensembleActive ? ` + ${selectedEnsembleCast.name}` : ""}</b></span></div></div>
              </div>
              <SectionTitle number="3" title="三段式片场决策" note="开机 → 中期 → 后期，前一选择会改变下一阶段" />
              <p className="production-choice-rule">当前最新阶段可反复改选；选择下一阶段后，前一阶段锁定。后期在点击“完成制作并送审”前仍可调整。</p>
              <div className="production-chain-summary"><div><span>已处理</span><b>{productionTotals.resolved}/3</b></div><div><span>累计质量</span><b>{productionTotals.quality >= 0 ? "+" : ""}{productionTotals.quality}</b></div><div><span>市场热度</span><b>{productionTotals.market >= 0 ? "+" : ""}{productionTotals.market}</b></div><div><span>士气 / 档期风险</span><b>{productionTotals.morale >= 0 ? "+" : ""}{productionTotals.morale} / {productionTotals.scheduleRisk >= 0 ? "+" : ""}{productionTotals.scheduleRisk}</b></div></div>
              <div className="event-chain">{productionChain.map((productionEvent, index) => { const choiceState = productionLocked ? "locked" : getProductionChoiceState(productionChoices, index); const selected = productionChoices[index]; const disabled = choiceState !== "editable"; const status = choiceState === "waiting" ? "等待前序" : choiceState === "locked" ? "已锁定" : selected ? "可改选" : "可选择"; return <div className={`event-card ${disabled ? "locked" : ""}`} key={productionEvent.id}><header><span>0{index + 1}</span><div><small>{productionEvent.stage}阶段</small><b>{productionEvent.title}</b></div><i>{status}</i></header><p>{productionEvent.description}</p>{index > 0 && productionTotals.notes[index - 1] && <div className="causal-note">因上一阶段：{productionTotals.notes[index - 1]}</div>}<div className="event-options">{(["safe", "bold"] as const).map((choice) => <button type="button" disabled={disabled} aria-pressed={selected === choice} key={choice} className={selected === choice ? "selected" : ""} onClick={() => setProductionChoices((current) => current.map((value, choiceIndex) => choiceIndex === index ? choice : value))}><b>{productionEvent[choice].label}</b><small>{productionEvent[choice].hint}{productionEvent[choice].cost ? ` · 基础成本 ¥${money(Math.round(productionEvent[choice].cost * industryCostIndex))}` : ""}</small><em>{productionEvent[choice].consequence}</em></button>)}</div></div>; })}</div>
              <ActionBar label={`${budget.name} · ${genre.name}`} detail={`制作与主创 ¥${money(totalBeforeRelease)} · 完片保险 ¥${money(overheadCost)}${currentEventCost ? ` · 事件追加 ¥${money(currentEventCost)}` : ""}${rewriteCost ? ` · 改稿 ¥${money(rewriteCost)}` : ""}`} button="完成制作并送审" disabled={productionTotals.resolved < 3 || projectPaymentDelta(totalBeforeRelease + overheadCost + currentEventCost + rewriteCost, projectCostPaid) > cash} onClick={() => { setProductionLocked(true); commitProjectCost(totalBeforeRelease + overheadCost + currentEventCost + rewriteCost, 4); }} back={() => moveToStage(2)} />
            </>
          )}

          {!utilityRoom && stage === 4 && (
            <>
              <PageHead code="RELEASE PLAN" title="好电影，还需要一个" accent="好时机。" sub="先预选一个上映档期，可反复比较候选；上映时只会确认当前预选档期。" stamp="待定档" />
              <SectionTitle number="1" title="预选一个上映档期" note="候选可反复比较，最终只确认一个档期" />
              <div className="slot-grid">{slots.map((item) => { const selected = slot.id === item.id; return <button type="button" key={item.id} className={selected ? "selected" : ""} onClick={() => setSlot(item)} aria-pressed={selected}><span>{item.date}</span><strong>{item.name}</strong><small>{item.note}</small><i>{selected ? "已预选" : "点击预选"} · 竞争：{item.competition}</i></button>; })}</div>
              <SectionTitle number="竞" title={`当前预选：${slot.name}同期竞品`} note={`${slotCompetitors.length} 部影片已提前锁定核心排片`} />
              <div className="competition-summary"><div><span>预计观众分流</span><b>-{Math.round(competitionPressure * 100)}%</b></div><p>{slotCompetitors.filter((movie) => movie.tier === "S" || movie.tier === "SS").length ? `本档期有 ${slotCompetitors.filter((movie) => movie.tier === "S" || movie.tier === "SS").length} 部 S/SS 级强敌；高口碑可以在上映后逐步夺回排片。` : "本档期没有S级统治者，仍需警惕同类型影片分流。"}</p></div>
              <div className="competitor-grid">{slotCompetitors.map((movie) => <CompetitorCard key={movie.id} movie={movie} />)}</div>
              <SectionTitle number="2" title="制定宣发计划" note="宣发成本将在上映前支付" />
              <div className="release-key-art"><div className="campaign-poster"><span>{genre.icon}</span><small>星火影业 出品</small><h2>{title}</h2><p>{genre.name}</p></div><div><span>宣发主视觉</span><b>电影海报已移交发行团队</b><p>这张主视觉将在定档官宣、城市路演和影院物料中使用，不再占用拍摄现场的场记信息位。</p></div></div>
              <div className="marketing-grid">{marketing.map((item) => <button key={item.name} className={promo.name === item.name ? "selected" : ""} onClick={() => setPromo(item)}><strong>{item.name}</strong><span>¥{money(Math.round(item.value * industryCostIndex))}</span><small>宣发强度 {item.power} · 首日触达 ×{item.boost.toFixed(2)}</small></button>)}</div>
              <div className="forecast"><span>行业预测</span><b>{scriptScore >= 84 ? "口碑潜力突出" : scriptScore < 70 ? "剧本风险较高" : genre.heat >= 85 ? "热度领先" : "稳健开局"}</b><p>剧本 {scriptScore} · 同档分流 {Math.round(competitionPressure * 100)}% · 档期 ×{slot.boost} · 公司触达 ×{studioReach.toFixed(2)} · 档期风险影响 ×{scheduleEfficiency.toFixed(2)}</p></div>
              {investmentClaimed && <div className="financing-obligation"><span>投</span><div><b>本年度已引入外部投资 ¥{money(annualInvestment)}</b><p>上映后投资方抽取片方34%分账收入的10%，回收上限为 ¥{money(annualInvestment * 1.5)}；剩余收入才进入项目结算。</p></div></div>}
              {selectedIpSource && ipSelection.route !== "original" && <div className="ip-release-brief"><span>IP</span><div><b>{routeName(ipSelection.route)} · 品牌开画 {ipEffects.openingPower >= 0 ? "+" : ""}{ipEffects.openingPower}</b><p>前作期待 {ipEffects.expectedScore?.toFixed(1)} · 系列疲劳 {ipEffects.projectedFatigue} · 回归主演 {ipEffects.returningCastCount}/2。最终口碑会根据成片评分是否兑现期待再结算。</p></div></div>}
              <div className="ticket-formula"><div><span>内容底盘</span><b>剧本 {scriptScore}</b><small>剧本低于65分时，最终观众评分最高只能达到6.5</small></div><div><span>剧本引擎</span><b>{scriptBuild.buildName}</b><small>{summarizeScriptDownstream(scriptBuild.downstream).join(" · ")}</small></div><div><span>主创号召</span><b>{Math.round(((director?.appeal ?? 0) + cast.reduce((sum, actor) => sum + actor.appeal, 0)) / 3)}</b><small>演员评级额外提供开画 +{castTierOpeningBonus.toFixed(1)}，但不能替代口碑</small></div><div><span>发行放大</span><b>×{(slot.boost * promo.boost).toFixed(2)}</b><small>高宣发抬升开画，但投入越高边际收益越低</small></div><div><span>同期竞争</span><b>-{Math.round(competitionPressure * 100)}%</b><small>竞品分流开画观众，并持续争夺排片</small></div><div><span>档期风险影响</span><b>×{scheduleEfficiency.toFixed(2)}</b><small>{productionTotals.scheduleRisk > 0 ? `累计 +${productionTotals.scheduleRisk} 风险，每点降低 2.5% 开画效率，最多降低 10%` : "风险已控制；负风险不会额外提高票房"}</small></div><div className="studio-factor"><span>制片人基本盘</span><b>×{studioReach.toFixed(2)}</b><small>只强化开画，等级与声望影响会逐日衰减</small></div></div>
              <div className="cost-breakdown"><span>制作与主创 <b>¥{money(totalBeforeRelease - ipCastingPremium)}</b></span><span>完片保险与管理 <b>¥{money(overheadCost)}</b></span><span>宣发及片场追加 <b>¥{money(currentPromoCost + currentEventCost)}</b></span>{ipCastingPremium > 0 && <span>IP回归主演溢价 <b>¥{money(ipCastingPremium)}</b></span>}{rewriteCost > 0 && <span>剧本改稿 <b>¥{money(rewriteCost)}</b></span>}<strong>总投资 ¥{money(totalCost)}</strong></div>
              <ActionBar label={`当前预选：${slot.name} · ${promo.name}`} detail={`最终只确认 ${slot.name} · 总投资 ¥${money(totalCost)} · 待支付宣发 ¥${money(Math.max(0, projectPaymentDelta(totalCost, projectCostPaid)))} · 同档分流 ${Math.round(competitionPressure * 100)}%`} button={`确认${slot.name}上映，揭晓票房`} disabled={projectPaymentDelta(totalCost, projectCostPaid) > cash} onClick={simulate} back={() => moveToStage(3)} />
            </>
          )}

          {!utilityRoom && stage === 5 && result && (
            <>
              <PageHead code={`BOX OFFICE TERMINAL · YEAR ${year}`} title={`《${title}》`} accent="首周实时直播" sub={`${slot.name}上映 · ${genre.name} · ${director?.name}执导`} stamp={revealedDays === 7 ? (result.profit >= 0 ? "盈利" : "失利") : revealedDays === 0 ? "等待信号" : `LIVE · D${revealedDays}`} />
              <div className="live-broadcast-console">
                <div className="result-hero"><div><span>{revealedDays === 7 ? "TOTAL 30-DAY BOX OFFICE" : "LIVE WEEK GROSS"}</span><strong>¥{money(revealedDays === 7 ? result.gross : liveWeekGross)}</strong><p>{revealedDays === 7 ? "首周播报结束 · 长尾票房模型已完成" : `院线数据实时接入 · DAY ${revealedDays}/7`}</p></div><div className="score-seal"><b>{latestReport?.audienceScore ?? "--"}</b><span>AUDIENCE</span></div></div>
                <div className="result-grid"><ResultStat label="成片质量" value={`${result.quality}`} unit="/100" /><ResultStat label={revealedDays === 7 ? "30日观影人次" : "当前观影人次"} value={`${((revealedDays === 7 ? result.audience : liveWeekGross * 10000 / 42) / 10000).toFixed(1)}`} unit="万人" /><ResultStat label="今日票房" value={latestReport ? `¥${money(latestReport.boxOffice)}` : "待公布"} unit="" /><ResultStat label="正向口碑" value={latestReport ? `${latestReport.positiveRate}` : "--"} unit="%" /></div>
              </div>
              <div className="rollout-controls"><div className="broadcast-status"><i className={autoPlay && revealedDays < 7 ? "live" : ""} /><span><small>LIVE DATA STREAM</small><b>{revealedDays === 7 ? "七日数据已发布 · 30日片方回款已结清" : revealedDays === 0 ? "等待首日票房出炉" : `第 ${revealedDays} 天票房已同步 · 当日片方回款已入账`}</b></span></div><div className="rollout-buttons"><button onClick={() => setAutoPlay((value) => !value)} disabled={revealedDays >= 7}>{autoPlay ? "暂停直播" : "继续直播"}</button><button onClick={() => { setAutoPlay(false); setRevealedDays((value) => Math.min(7, value + 1)); }} disabled={revealedDays >= 7}>下一天</button><button onClick={() => { setAutoPlay(false); setRevealedDays(7); }} disabled={revealedDays >= 7}>快进首周</button></div></div>
              <div className="live-feed-terminal" ref={liveFeedRef} aria-live="polite">
                <div className="live-feed-head"><div><i className={autoPlay && revealedDays < 7 ? "live" : ""} /><span>SOCIAL PULSE</span></div><b>影院散场与全网舆情</b><em>{revealedDays ? `DAY ${String(revealedDays).padStart(2, "0")}` : "STANDBY"}</em></div>
                <div className="daily-feed">
                  {revealedDays === 0 && <div className="feed-waiting"><i>票</i><div><b>首映场正在进行</b><p>系统将自动推送每日票房、散场反馈与网络热议。</p></div></div>}
                  {!!visibleReports.length && <div className="feed-track" key={revealedDays}>{visibleReports.map((report, index) => <article className={`daily-report ${index === visibleReports.length - 1 ? "latest" : "previous"}`} key={report.day}><div className="report-day"><span>DAY</span><b>{String(report.day).padStart(2, "0")}</b><small>{report.momentum}</small></div><div className="report-main"><header><div><span>单日票房</span><b>¥{money(report.boxOffice)}</b><i className={report.change !== null && report.change >= 0 ? "up" : "down"}>{report.change === null ? "首映日" : `环比 ${report.change >= 0 ? "+" : ""}${report.change}%`}</i></div><div><span>观众评分</span><b>{report.audienceScore}</b><small>正向 {report.positiveRate}%</small></div></header><h3>{report.headline}</h3><div className="reaction-grid"><div><span>散场声音</span><p>{report.audienceReaction}</p></div><div><span>网络舆情</span><p>{report.internetReaction}</p><b>{report.hotTopic}</b></div></div></div></article>)}</div>}
                </div>
              </div>
              <SectionTitle number="DATA" title="首周票房曲线" note="单位：万元" />
              <div className={`trend-summary trend-${revealedDays === 7 ? result.trend : "live"}`}><div><span>{revealedDays === 7 ? "首周走势判定" : "实时走势研判"}</span><b>{liveTrend}</b><p>{liveTrendNote}</p></div><dl><dt>开画能力</dt><dd>{result.openingPower}</dd><dt>档期风险</dt><dd>{(result.scheduleRisk ?? 0) > 0 ? `+${result.scheduleRisk} · ×${(result.scheduleEfficiency ?? 1).toFixed(2)}` : `已控制 · ×${(result.scheduleEfficiency ?? 1).toFixed(2)}`}</dd><dt>同档分流</dt><dd>{Math.round((result.competitionPressure ?? 0) * 100)}%</dd><dt>实时评分</dt><dd>{latestReport?.audienceScore ?? "--"}</dd><dt>评分走势</dt><dd>{latestReport ? `${result.dailyReports[0].audienceScore} → ${latestReport.audienceScore}` : "--"}</dd><dt>正向口碑</dt><dd>{latestReport ? `${latestReport.positiveRate}%` : "--"}</dd></dl></div>
              <div className="score-model-note"><span>评分驱动票房</span><p>剧本、导演、表演与成片质量决定最终评分；宣发和明星号召只负责开画。每日新评分与同期竞品会共同改变次日购票及排片留存。</p></div>
              <div className="box-office-chart">{result.dailyReports.map((report, index) => { const isRevealed = index < revealedDays; return <div key={report.day} className={!isRevealed ? "pending-day" : report.change !== null && report.change >= 0 ? "rising" : "falling"}><b>{isRevealed ? money(report.boxOffice) : "待公布"}</b><em>{isRevealed ? report.change === null ? "首日" : `${report.change >= 0 ? "+" : ""}${report.change}%` : "—"}</em><span style={{ height: isRevealed ? `${32 + report.boxOffice / Math.max(...result.days) * 100}px` : "14px" }} /><small>第{report.day}天</small></div>; })}</div>
              {revealedDays === 7 && <>
                <SectionTitle number="30" title="上映月最终结算" note="后台逐日测算第 1—30 天" />
                <div className="month-settlement"><div><small>首周累计</small><b>¥{money(result.weekGross)}</b><span>直播展示的第 1—7 天</span></div><i>+</i><div><small>长尾票房</small><b>¥{money(result.tailGross)}</b><span>口碑、竞品与周末效应测算第 8—30 天</span></div><i>=</i><div className="month-total"><small>30日最终票房</small><b>¥{money(result.gross)}</b><span>片方回款 ¥{money(result.studioRevenue)}{result.investorShare ? ` · 投资方分成 ¥${money(result.investorShare)}` : ""} · 回本线 ¥{money(result.breakEvenGross)}{result.successBonus ? ` · 税费与主创分成 ¥${money(result.successBonus)}` : ""}</span></div></div>
                <SectionTitle number="结" title="项目与生涯结算" note={`院线分账后片方按 34% 回款${result.investorShare ? "，先结算投资方分成" : ""}，剩余盈利继续结算税费与主创分成`} />
                <div className="growth-result"><div><span>制片人经验</span><b>+{result.xpGain} XP</b><small>当前 Lv.{studioLevel} · {studioXpProgress}/180</small></div><div><span>行业声望</span><b className={result.reputationGain >= 0 ? "positive" : "negative"}>{result.reputationGain >= 0 ? "+" : ""}{result.reputationGain}</b><small>当前声望 {reputation}</small></div><div><span>项目收益</span><b className={result.profit >= 0 ? "positive" : "negative"}>{result.profit >= 0 ? "+" : "-"}¥{money(Math.abs(result.profit))}</b><small>30日票房 ¥{money(result.gross)} · 片方分账 ¥{money(result.studioRevenue)}{result.investorShare ? ` · 投资方分成 -¥${money(result.investorShare)}` : ""}</small></div></div>
                <div className="career-update"><span>艺人动态</span><b>{cast.map((actor) => actor.name).join("、")}获得项目经验；下一年度的号召力和身价将按照票房回本倍数重新评估。自社新人若以高演技搭档高人气演员，还会获得额外曝光成长。</b></div>
                {result.filmRecord && <><SectionTitle number="IP" title={result.filmRecord.route === "original" ? "作品IP潜力" : "系列资产更新"} note={result.filmRecord.route === "original" ? "成功作品会成为下一年度的项目来源" : `《${result.filmRecord.seriesTitle}》第 ${result.filmRecord.seriesEntry} 部`} /><div className={`ip-result-card ${isIpEligible(result.filmRecord) ? "qualified" : "developing"}`}><span>{isIpEligible(result.filmRecord) ? "✓" : "↗"}</span><div><small>{routeName(result.filmRecord.route ?? "original")} · BRAND ASSET</small><b>{result.filmRecord.route === "original" ? isIpEligible(result.filmRecord) ? "IP开发资格已解锁" : "作品尚在积累品牌认知" : `《${result.filmRecord.seriesTitle}》系列继续成长`}</b><p>品牌热度 {result.filmRecord.brandHeat} · 系列疲劳 {result.filmRecord.fatigue} · 片库长尾 ×{(result.filmRecord.libraryMultiplier ?? 1).toFixed(2)}</p></div><strong>{result.filmRecord.route === "original" ? isIpEligible(result.filmRecord) ? "下一年可选择正统续集、角色衍生或重启" : "提高评分、回本倍数或赢得奖项即可解锁" : `第 ${result.filmRecord.seriesEntry} 部已写入系列履历`}</strong></div></>}
                {annualGoal && result.goalOutcome && <><SectionTitle number="委" title="年度委托结算" note={result.goalOutcome.completed ? "目标达成，额外奖励已发放" : "未达成不扣除资源，保留本次经验"} /><div className={`goal-result ${result.goalOutcome.completed ? "complete" : "missed"}`}><span>{result.goalOutcome.completed ? "✓" : "↗"}</span><div><small>{annualGoal.title} · {"★".repeat(annualGoal.stars)}</small><b>{result.goalOutcome.completed ? "委托完成" : "本年惜未完成"}</b><p>{result.goalOutcome.explanation}</p><i>{result.goalOutcome.progressLabel}</i></div><strong>{result.goalOutcome.completed ? `+¥${money(result.goalOutcome.reward.cash)} · +${result.goalOutcome.reward.xp} XP · +${result.goalOutcome.reward.reputation} 声望` : "下一年会刷新三个新目标"}</strong></div></>}
                <SectionTitle number="奖" title="金幕奖提名与获奖" note={`${result.nominations?.filter((item) => item.nominated).length ?? result.awards.length} 项提名 · ${result.awards.length} 项获奖（本片最多 ${result.awardCap ?? Math.max(2, result.awards.length)} 项）`} />
                <div className="awards-row nomination-list">{result.nominations?.map((nomination) => <div className={nomination.won ? "won" : nomination.nominated ? "nominated" : "not-nominated"} key={nomination.category}><span>{nomination.won ? "★" : nomination.nominated ? "◇" : "—"}</span><b>{nomination.category}<i>{nomination.won ? "获奖" : nomination.nominated ? "提名" : "未提名"}</i></b><small>{nomination.note}{nomination.category === "最佳表演" && nomination.won && performanceLead?.acting && performanceLead.acting >= 93 ? ` ${performanceLead.name}解锁${performanceLead.gender === "女" ? "影后" : "影帝"}称号。` : ""}</small></div>) ?? (result.awards.length ? result.awards.map((award) => <div className="won" key={award}><span>★</span><b>{award}</b><small>旧存档奖项记录</small></div>) : <div className="no-award"><span>—</span><b>本届惜未获奖</b><small>完成新一年度作品即可进入提名比较。</small></div>)}</div>
                <div className="year-end"><div><span>经纪业务已解锁</span><b>把电影收益变成公司的长期艺人资产。</b><small>签约成熟艺人，或从新人开始培养下一位明星</small></div><button onClick={enterCompanyManagement}>进入公司经营期 <i>→</i></button></div>
              </>}
            </>
          )}

          {(utilityRoom === "agency" || (stage === 6 && result)) && (
            <>
              <PageHead code="TALENT OPERATIONS TERMINAL" title="把一次成功，变成" accent="长期的明星资产。" sub="签约、培养并经营旗下艺人；高频使用会逐步收回前期投入。" stamp={`ROSTER ${signedTalents.length}/${rosterCapacity}`} />
              <div className="agency-overview">
                <div><span>签约容量</span><b>{signedTalents.length}<small>/{rosterCapacity} 人</small></b><p>Lv.{studioLevel} 经纪部 · {studioLevel < 10 ? `Lv.${Math.min(10, studioLevel + (studioLevel % 2 === 0 ? 1 : 2))} 再扩容` : "已达最高容量"}</p></div>
                <div><span>年度培训</span><b>{usedTrainingSlots}<small>/{yearlyTrainingCapacity} 次</small></b><p>每位艺人每年限训一次</p></div>
                <div><span>固定年薪</span><b>¥{money(annualPayroll)}</b><p>签约时预付首年薪资</p></div>
                <div><span>公司资金</span><b>¥{money(cash)}</b><p>留足下一部电影制作预算</p></div>
                <div className="library-asset-card"><span>近三部片库资产</span><b>¥{money(projectedLibraryIncome)}<small>/ 年</small></b><p>{projectedLibraryHistory.length ? `${projectedLibraryHistory.length} 部 · 累计票房 ¥${money(libraryGross)} · ${libraryAwards} 项奖 · 单片最高900万、片库最高1,800万` : "完成电影后，版权与长尾发行会形成有上限的年度收益"}</p></div>
              </div>
              {!!projectedLibraryHistory.length && <div className="ip-library-list"><header><span>IP & LIBRARY</span><b>近三部作品的系列开发状态</b></header>{projectedLibraryHistory.map((film, index) => <article key={film.id ?? `${film.title}-${index}`}><div><small>{film.seriesId ? `系列第 ${film.seriesEntry ?? 1} 部 · ${routeName(film.route ?? "original")}` : "独立作品"}</small><b>《{film.title}》</b><p>{film.buildName ?? film.genre ?? "影片资产"}</p></div><dl><dt>品牌</dt><dd>{film.brandHeat ?? "待评估"}</dd><dt>疲劳</dt><dd>{film.fatigue ?? 0}</dd><dt>状态</dt><dd>{isIpEligible(film) ? "可开发" : "培养中"}</dd></dl></article>)}</div>}
              <div className="agency-level-track"><span>经纪部随制片人等级自动扩容</span><div><i style={{ width: `${studioLevel / 10 * 100}%` }} /></div><b>Lv.{studioLevel} · {rosterCapacity} 席</b></div>
              <div className="company-tabs" role="tablist" aria-label="公司经营分类">
                <button className={companyTab === "roster" ? "active" : ""} onClick={() => setCompanyTab("roster")}>旗下艺人 <b>{signedTalents.length}</b></button>
                <button className={companyTab === "market" ? "active" : ""} onClick={() => setCompanyTab("market")}>成型艺人</button>
                <button className={companyTab === "rookies" ? "active" : ""} onClick={() => setCompanyTab("rookies")}>新人招募</button>
              </div>
              {companyNotice && <div className="company-notice"><span>经纪部</span><p>{companyNotice}</p><button onClick={() => setCompanyNotice("")} aria-label="关闭提示">×</button></div>}

              {companyTab === "roster" && <div className="agency-section">
                <SectionTitle number="人" title="旗下艺人" note="内部项目价、培训成长与外部经纪收入" />
                {!signedActors.length && <div className="agency-empty"><span>签</span><b>经纪部还没有艺人</b><p>成熟艺人能快速降低电影成本，新人则拥有更长的成长曲线。</p><button onClick={() => setCompanyTab("market")}>前往签约市场</button></div>}
                <div className="owned-roster">{signedActors.map(({ actor, contract }) => {
                  const profile = getActorProfile(actor);
                  const savedTrainingGenre = trainingGenre[actor.id];
                  const selectedGenre = savedTrainingGenre && !actor.genres.includes(savedTrainingGenre) ? savedTrainingGenre : genres.find((item) => !actor.genres.includes(item.name))?.name ?? "";
                  const trained = contract.lastTrainedYear === year;
                  const settledFee = settledContractFee(actor, contract);
                  const internalFee = Math.round(settledFee * TALENT_COST_SCALE * contract.internalRate);
                  const outsideIncome = externalAgencyIncome(actor, contract);
                  const actingTrainingGain = trainingGain(actor.acting, contract);
                  const appealTrainingGain = trainingGain(actor.appeal, contract);
                  const renewal = talentRenewalQuote({ ...actor, fee: settledFee }, contract);
                  return <article className="owned-talent" key={actor.id}>
                    <header><PortraitAvatar person={actor} group={actor.id >= 100 ? "rookie" : "actor"} /><div><b>{actor.name}{actorHonorTitle(actor, actorHonors) ? ` · ${actorHonorTitle(actor, actorHonors)}` : ""}</b><small>{profile.tier}级 · 综合 {actor.acting + actor.appeal} · {contract.origin === "rookie" ? "自社培养" : "成熟艺人"} · {actorAge(actor, year, contract)}岁</small></div><i>{retirementAge(actor.id)}岁退休 · 合约至第 {contract.contractEndYear} 年{contract.contractEndYear === year && <em className="contract-expiry-inline">今年到期</em>}</i></header>
                    <div className="owned-stats"><span>演技 <b>{actor.acting}</b></span><span>号召 <b>{actor.appeal}</b></span><span>潜力 <b>{contract.potential}</b></span><span>忠诚 <b>{contract.loyalty}</b></span></div>
                    <div className="owned-economy"><div><span>自制片内部价</span><b>¥{money(internalFee)}</b><small>市场价 ¥{money(settledFee * TALENT_COST_SCALE)} · 内部率 {Math.round(contract.internalRate * 100)}%{settledFee > actor.fee ? " · 本片后上调" : ""}</small></div><div><span>闲置年预计分成</span><b>¥{money(outsideIncome)}</b><small>公司抽成 {Math.round(contract.agencyShare * 100)}%</small></div><div><span>{contract.origin === "rookie" ? "阶梯年薪" : "固定年薪"}</span><b>¥{money(contract.annualSalary)}</b><small>{contract.origin === "rookie" ? `累计主演 ${(contract.filmCredits ?? 0) + (cast.some((item) => item.id === actor.id) ? 1 : 0)} 部 · 随履历上调` : "下一年度自动结算"}</small></div></div>
                    <div className="genre-chips">{actor.genres.map((item) => <span key={item}>{item}</span>)}{Object.entries(contract.genreProgress).filter(([item, progress]) => !actor.genres.includes(item) && progress > 0).map(([item, progress]) => <span className="learning" key={item}>{item} {Math.min(99, progress)}%</span>)}</div>
                    <div className="training-panel"><div><span>本年度专项培养</span><small>{trained ? "已完成" : `全员可培养 · 尚余 ${yearlyTrainingCapacity - usedTrainingSlots} 次`}</small></div><div className="training-buttons"><button disabled={trained || usedTrainingSlots >= yearlyTrainingCapacity || cash < 600 || actingTrainingGain === 0} onClick={() => trainTalent(actor.id, "acting")}><b>表演进修</b><small>¥600万 · 演技 {actingTrainingGain ? `+${actingTrainingGain}` : "已达上限"}</small></button><button disabled={trained || usedTrainingSlots >= yearlyTrainingCapacity || cash < 800 || appealTrainingGain === 0} onClick={() => trainTalent(actor.id, "appeal")}><b>形象经营</b><small>¥800万 · 号召 {appealTrainingGain ? `+${appealTrainingGain}` : "已达上限"}</small></button><div className="genre-training"><select value={selectedGenre} onChange={(event) => setTrainingGenre((current) => ({ ...current, [actor.id]: event.target.value }))} aria-label={`选择${actor.name}的类型训练方向`}>{genres.filter((item) => !actor.genres.includes(item.name)).map((item) => <option key={item.name}>{item.name}</option>)}</select><button disabled={!selectedGenre || trained || usedTrainingSlots >= yearlyTrainingCapacity || cash < 700} onClick={() => trainTalent(actor.id, "genre")}><b>类型训练</b><small>¥700万 · 适应度 +60</small></button></div></div></div>
                    {contract.contractEndYear <= year + 1 && <button className="renew-button" onClick={() => renewTalent(actor.id)}>续约三年 · ¥{money(renewal.renewalFee)}{contract.origin === "rookie" && renewal.annualSalary > contract.annualSalary ? ` · 新年薪 ¥${money(renewal.annualSalary)}` : ""}</button>}
                  </article>;
                })}</div>
              </div>}

              {companyTab === "market" && <div className="agency-section">
                <SectionTitle number="星" title="成型艺人签约市场" note="前期投入高，连续使用两至三部电影后更划算" />
                <div className="agency-explainer"><b>成熟艺人模式</b><p>支付签约费与首年薪资，获得三年档期优先权、自制片内部价和闲置年度经纪分成。</p></div>
                <div className="signing-grid">{matureSigningMarket.map((actor) => {
                  const profile = getActorProfile(actor);
                  const quote = matureContractQuote(actor, profile);
                  const firstPayment = quote.signingFee + quote.annualSalary;
                  const unavailable = signedTalents.length >= rosterCapacity || cash < firstPayment || reputation < quote.requiredReputation;
                  const currentAge = actorAge(actor, year);
                  return <article className="signing-card" key={actor.id}><header><PortraitAvatar person={actor} group={actor.id >= 100 ? "rookie" : "actor"} /><div><b>{actor.name}{actorHonorTitle(actor, actorHonors) ? ` · ${actorHonorTitle(actor, actorHonors)}` : ""}</b><small>{profile.tier}级 · 综合 {actor.acting + actor.appeal} · {actor.tag}</small></div><i>{currentAge}岁 · {careerStage(profile, currentAge)}</i></header><div className="signing-stats"><span>演技 <b>{actor.acting}</b></span><span>号召 <b>{actor.appeal}</b></span><span>当前身价 <b>¥{money(actor.fee * TALENT_COST_SCALE)}</b></span></div><p>{actor.genres.join(" · ")} · 预计 {retirementAge(actor.id)} 岁退休</p><div className="contract-price"><span>签约费 ¥{money(quote.signingFee)}</span><span>年薪 ¥{money(quote.annualSalary)}</span><b>首期 ¥{money(firstPayment)}</b></div><button disabled={unavailable} onClick={() => setSigningTarget({ actor, origin: "mature" })}>{signedTalents.length >= rosterCapacity ? "签约名额已满" : reputation < quote.requiredReputation ? `需要声望 ${quote.requiredReputation}` : cash < firstPayment ? "公司资金不足" : "查看三年合约"}</button></article>;
                })}</div>
              </div>}

              {companyTab === "rookies" && <div className="agency-section">
                <SectionTitle number="新" title={`第 ${year} 届新人招募`} note="低成本签约，高潜力需要持续培训与作品机会" />
                <div className="agency-explainer rookie"><b>新人培养模式</b><p>签约费接近于零，但初期不能承担票房号召。潜力决定成长上限，培训和参演共同塑造类型路线。</p></div>
                <div className="rookie-refresh-bar">
                  <div><span>SCOUTING REFRESH · 每年一次</span><b>{rookieRefreshYear === year ? "本年度星探名单已刷新" : "观看广告，提高高潜新人出现率"}</b><small>刷新名单固定出现 1 名高潜新人：75% 实力新锐，25% 天赋新星。测试版无需观看广告。</small></div>
                  <button type="button" disabled={rookieRefreshYear === year} onClick={() => { setRookieRefreshYear(year); setCompanyNotice("星探刷新完成：本届名单已保证出现一名实力新锐或天赋新星。本年度不可再次刷新。"); }}>{rookieRefreshYear === year ? "本年已刷新" : "观看广告刷新"}</button>
                </div>
                <div className="signing-grid">{rookieMarket.map((actor) => {
                  const quote = rookieContractQuote(actor);
                  const firstPayment = quote.signingFee + quote.annualSalary;
                  const unavailable = signedTalents.length >= rosterCapacity || cash < firstPayment;
                  const rarityLabel = actor.rarity === "red" ? "天赋新星" : actor.rarity === "gold" ? "实力新锐" : "潜力新人";
                  return <article className={`signing-card rookie-card rarity-${actor.rarity}`} key={actor.id}><header><PortraitAvatar person={actor} group="rookie" /><div><b>{actor.name}</b><small>{actorTier(actor.acting, actor.appeal)}级 · 综合 {actor.acting + actor.appeal} · {actor.tag}</small></div><i><strong className="rookie-rarity">{rarityLabel}</strong>{actor.profile.age}岁</i></header><div className="signing-stats"><span>演技 <b>{actor.acting}</b></span><span>号召 <b>{actor.appeal}</b></span><span>潜力 <b>{actor.potential}</b></span></div><p>{actor.genres.join(" · ")} · 成长速度 +{actor.growth}</p><div className="contract-price"><span>签约费 ¥{money(quote.signingFee)}</span><span>年薪 ¥{money(quote.annualSalary)}</span><b>首期 ¥{money(firstPayment)}</b></div><button disabled={unavailable} onClick={() => setSigningTarget({ actor, rookie: actor, origin: "rookie" })}>{signedTalents.length >= rosterCapacity ? "签约名额已满" : cash < firstPayment ? "公司资金不足" : "纳入新人计划"}</button></article>;
                })}</div>
              </div>}
              <div className="company-danger-zone"><div><span>重新开始</span><b>解散公司并建立全新存档</b><p>将清除资金、等级、电影历史、旗下艺人及全部培养进度。</p></div><button onClick={() => setShowResetConfirm(true)}>解散公司</button></div>
              <ActionBar label={`经纪部 ${signedTalents.length}/${rosterCapacity} · 年薪 ¥${money(annualPayroll)}`} detail={utilityRoom === "agency" ? `电影主线仍停留在「${stageLabels[stage]}」` : "完成年度经营后进入下一制片年"} button={utilityRoom === "agency" ? "返回主片场" : `完成经营，进入第 ${year + 1} 年`} disabled={false} onClick={utilityRoom === "agency" ? returnToHub : nextYear} back={utilityRoom === "agency" ? undefined : () => moveToStage(5)} />
            </>
          )}
        </section>
      </div>
      </div>}
      </>}
      {showExpiryReminder && <div className="modal-backdrop expiry-reminder-backdrop">
        <section className="contract-modal expiry-reminder-modal" role="alertdialog" aria-modal="true" aria-label="艺人合约到期提醒">
          <p className="eyebrow accent">CONTRACT EXPIRY ALERT</p>
          <div className="expiry-reminder-symbol">期</div>
          <h2>艺人合约将在今年到期</h2>
          <p>以下艺人的合约将在制片第 {year} 年结束。若不续约，达到B级市场门槛的艺人会进入自由市场，未达到门槛的自社新人将退出公开选角。</p>
          <div className="expiry-talent-list">{expiringTalents.map(({ actor }) => <span key={actor.id}><PortraitAvatar person={actor} group={actor.id >= 100 ? "rookie" : "actor"} mini /><b>{actor.name}</b></span>)}</div>
          <div className="expiry-reminder-actions"><button type="button" onClick={() => setExpiryReminderDismissedYear(year)}>稍后处理</button><button type="button" onClick={handleExpiryReminderNow}>现在处理</button></div>
        </section>
      </div>}
      {showFinance && <div className="modal-backdrop finance-backdrop">
        <button className="modal-dismiss" type="button" aria-label="关闭融资中心" onClick={() => setShowFinance(false)} />
        <section className="contract-modal finance-modal" role="dialog" aria-modal="true" aria-label="片场融资中心">
          <button className="modal-close" onClick={() => setShowFinance(false)} aria-label="关闭融资中心">×</button>
          <p className="eyebrow accent">CAPITAL ACCESS TERMINAL</p>
          <div className="finance-seal">投</div>
          <h2>第 {year} 制片年融资中心</h2>
          <p>{investmentLocked ? "融资渠道已经设置在主片场；完成首部电影后，第二制片年起可正式引入外部投资。" : investmentClaimed ? `本年度 ¥${money(annualInvestment)} 投资已经到账。` : `本年度可引入 ¥${money(annualInvestment)} 外部投资，不会改变当前电影制作阶段。`}</p>
          <div className="finance-terms"><span>投资方分成 <b>片方回款的10%</b></span><span>最高回收 <b>{investmentLocked ? "第2年公布" : `¥${money(annualInvestment * 1.5)}`}</b></span><span>领取限制 <b>每个制片年一次</b></span></div>
          <button className="finance-claim" type="button" disabled={investmentLocked || investmentClaimed} onClick={() => { claimAnnualInvestment(); setShowFinance(false); }}>{investmentLocked ? "第2制片年解锁融资" : investmentClaimed ? "本年度融资已完成" : `确认融资 +¥${money(annualInvestment)}`}</button>
        </section>
      </div>}
      {negotiating && negotiatingProfile && <div className="modal-backdrop">
        <button className="modal-dismiss" type="button" aria-label="关闭演员谈判" onClick={() => setNegotiating(null)} />
        <section className="contract-modal" role="dialog" aria-modal="true" aria-label={`与${negotiating.name}洽谈片约`}>
          <button className="modal-close" onClick={() => setNegotiating(null)} aria-label="关闭谈判">×</button>
          <p className="eyebrow accent">CONTRACT TALK</p>
          <div className="contract-head"><PortraitAvatar person={negotiating} group={negotiating.id >= 100 ? "rookie" : "actor"} large /><div><h2>邀请 {negotiating.name}</h2><p>{negotiatingProfile.tier}级艺人 · {actorAge(negotiating, year)}岁 · {careerStage(negotiatingProfile, actorAge(negotiating, year))}</p></div></div>
          <div className="contract-intel"><span>综合评级 <b>{negotiatingProfile.tier} · {negotiating.acting + negotiating.appeal}</b></span><span>职业荣誉 <b>{actorHonorTitle(negotiating, actorHonors) ?? "尚无表演称号"}</b></span><span>角色路线 <b>{negotiatingProfile.archetype}</b></span><span>当前档期 <b>{negotiatingProfile.availability}</b></span><span>舆情风险 <b>{negotiatingProfile.risk}%</b></span><span>题材适配 <b>{negotiating.genres.includes(genre.name) ? "高度匹配" : "跨类型挑战"}</b></span><span>剧本评分 <b>{scriptScore} 分</b></span><span>接戏门槛 <b>{scriptThreshold(negotiatingProfile)} 分</b></span></div>
          <div className={`actor-interest-panel ${scriptScore >= scriptThreshold(negotiatingProfile) + 8 ? "hot" : scriptScore < scriptThreshold(negotiatingProfile) ? "cold" : ""}`}><span>演员读本反馈</span><b>{scriptScore < scriptThreshold(negotiatingProfile) - 14 ? "经纪团队暂不接受邀约" : scriptScore >= scriptThreshold(negotiatingProfile) + 8 ? "非常喜欢这个角色，愿意降低片酬" : scriptScore >= scriptThreshold(negotiatingProfile) ? "剧本达到预期，可以正常洽谈" : "剧本吸引力不足，需要提高报价"}</b></div>
          <h3>选择报价策略</h3>
          <div className="contract-options">{contractOptions.map((option) => { const quote = quoteMultiplier(negotiating, scriptScore, option.factor); const locked = scriptScore < scriptThreshold(negotiatingProfile) - 14; return <button key={option.id} disabled={locked} onClick={() => signActor(negotiating, option)}><span>{option.name}</span><b>¥{money(negotiating.fee * quote * TALENT_COST_SCALE)}</b><small>{option.note}</small><i>剧本议价 ×{quote.toFixed(2)} · 士气 {option.morale >= 0 ? "+" : ""}{option.morale}</i></button>; })}</div>
          {negotiationError && <div className="negotiation-error">报价被拒：{negotiationError}</div>}
          <small className="contract-footnote">签约价格将计入制作成本；士气与主演默契会共同影响成片质量。</small>
        </section>
      </div>}
      {signingTarget && signingTargetProfile && activeSigningQuote && <div className="modal-backdrop">
        <button className="modal-dismiss" type="button" aria-label="取消公司签约" onClick={() => setSigningTarget(null)} />
        <section className="contract-modal agency-contract-modal" role="dialog" aria-modal="true" aria-label={`签约${signingTarget.actor.name}`}>
          <button className="modal-close" onClick={() => setSigningTarget(null)} aria-label="取消签约">×</button>
          <p className="eyebrow accent">AGENCY CONTRACT · THREE YEARS</p>
          <div className="contract-head"><PortraitAvatar person={signingTarget.actor} group={signingTarget.actor.id >= 100 ? "rookie" : "actor"} large /><div><h2>签约 {signingTarget.actor.name}</h2><p>{signingTarget.origin === "rookie" ? "新人培养合约" : `${signingTargetProfile.tier}级成熟艺人合约`} · 第 {year + 1}—{year + 3} 制片年</p></div></div>
          <div className="agency-contract-summary"><div><span>签约费</span><b>¥{money(activeSigningQuote.signingFee)}</b></div><div><span>首年固定薪资</span><b>¥{money(activeSigningQuote.annualSalary)}</b></div><div className="contract-total"><span>本次支付</span><b>¥{money(activeSigningQuote.signingFee + activeSigningQuote.annualSalary)}</b></div></div>
          <div className="contract-intel"><span>实时评级 <b>{signingTargetProfile.tier} · 综合 {signingTarget.actor.acting + signingTarget.actor.appeal}</b></span><span>签约声望 <b>{activeSigningQuote.requiredReputation}</b></span><span>自制片项目价 <b>市场报价的 {Math.round(activeSigningQuote.internalRate * 100)}%</b></span><span>外部工作抽成 <b>{Math.round(activeSigningQuote.agencyShare * 100)}%</b></span><span>初始忠诚度 <b>{signingTarget.origin === "rookie" ? 82 : 70}</b></span><span>签约后名额 <b>{signedTalents.length + 1}/{rosterCapacity}</b></span></div>
          <div className="contract-payback"><span>经营提示</span><p>{signingTarget.origin === "rookie" ? "新人短期不会带来明显票房，需要持续培训与参演机会；成长后内部成本优势会逐年扩大。" : "成熟艺人连续用于两至三部自制电影，通常能通过内部片酬差额和闲置年度分成收回签约投入。"}</p></div>
          {companyNotice && <div className="negotiation-error">{companyNotice}</div>}
          <button className="confirm-agency-signing" disabled={cash < activeSigningQuote.signingFee + activeSigningQuote.annualSalary || signedTalents.length >= rosterCapacity || reputation < activeSigningQuote.requiredReputation} onClick={confirmCompanySigning}>确认签约并支付 ¥{money(activeSigningQuote.signingFee + activeSigningQuote.annualSalary)}</button>
          <small className="contract-footnote">合约期满前可续约；不续约且达到B级市场门槛的艺人会回到自由市场。首年薪资已包含在本次支付中。</small>
        </section>
      </div>}
      {showResetConfirm && <div className="modal-backdrop">
        <button className="modal-dismiss" type="button" aria-label="取消解散公司" onClick={() => setShowResetConfirm(false)} />
        <section className="contract-modal reset-modal" role="alertdialog" aria-modal="true" aria-label="确认解散公司">
          <button className="modal-close" onClick={() => setShowResetConfirm(false)} aria-label="取消解散公司">×</button>
          <p className="eyebrow accent">DISSOLVE STUDIO</p>
          <div className="reset-symbol">散</div>
          <h2>确定解散造梦片场？</h2>
          <p>本机上的全部游戏进度将被永久清除，包括制片人等级、资金、历年作品、签约艺人和培训成果。</p>
          <div className="reset-actions"><button onClick={() => setShowResetConfirm(false)}>保留公司</button><button onClick={dissolveCompanyAndRestart}>确认解散并重开</button></div>
        </section>
      </div>}
    </main>
  );
}

function PortraitAvatar({ person, group, large = false, mini = false }: { person: { id: number; name: string; avatar: string }; group: PortraitGroup; large?: boolean; mini?: boolean }) {
  const actorIsFemale = group === "actor" && person.id > 12;
  const rookieAtlasPath = person.id <= 108 ? "/images/portraits/rookies-anime-atlas-v2.webp" : person.id <= 120 ? "/images/portraits/rookies-anime-atlas-v3.webp" : "/images/portraits/rookies-anime-atlas-v4.webp";
  const rookieIndex = person.id <= 108 ? person.id - 101 : person.id <= 120 ? person.id - 109 : person.id - 121;
  const atlasPath = group === "director"
    ? "/images/portraits/directors-anime-atlas-v1.webp"
    : group === "rookie"
      ? rookieAtlasPath
      : actorIsFemale
        ? "/images/portraits/female-actors-anime-atlas-v1.webp"
        : "/images/portraits/male-actors-anime-atlas-v1.webp";
  const atlas = assetUrl(atlasPath);
  const index = group === "director" ? person.id - 1 : group === "rookie" ? rookieIndex : actorIsFemale ? person.id - 13 : person.id - 1;
  const column = index % 4;
  const row = Math.floor(index / 4);
  return <span
    className={`avatar portrait-avatar ${large ? "large" : ""} ${mini ? "mini" : ""}`}
    role="img"
    aria-label={`${person.name}动漫头像`}
    title={person.name}
    style={{
      backgroundImage: `url(${atlas})`,
      backgroundPosition: `${column * 100 / 3}% ${row * 50}%`,
    }}
  />;
}

function CompetitorCard({ movie }: { movie: CompetitorMovie }) {
  return <article className={`competitor-card tier-${movie.tier.toLowerCase()}`}><header><span>{movie.tier}</span><div><b>《{movie.title}》</b><small>{movie.genre}</small></div><i>威胁 {movie.strength}</i></header><div className="competitor-cast">{movie.cast.map((actor) => <span key={actor.id}><PortraitAvatar person={{ ...actor, avatar: actor.name.slice(0, 1) }} group={actor.id >= 100 ? "rookie" : "actor"} mini /><b>{actor.name}</b><small>{actor.tier}级 · 号召 {actor.appeal}</small></span>)}</div><p>预计分流本档期观众 {Math.round(movie.audienceDrain * 100)}%</p></article>;
}

function TalentCard({ person, selected, onClick, year, deal, scriptScore = 100, ownedContract, honorTitle }: { person: Director | Actor; selected: boolean; onClick: () => void; year: number; deal?: Deal; scriptScore?: number; ownedContract?: TalentContract; honorTitle?: string | null }) {
  const isDirector = "skill" in person;
  const profile = isDirector ? null : getActorProfile(person);
  const currentAge = profile ? actorAge(person as Actor, year, ownedContract) : 0;
  const threshold = profile ? scriptThreshold(profile) : 0;
  const locked = !isDirector && !ownedContract && scriptScore < threshold - 14;
  const interest = ownedContract ? "旗下艺人 · 档期优先" : locked ? "暂不读本" : scriptScore >= threshold + 8 ? "强烈兴趣" : scriptScore >= threshold ? "愿意洽谈" : "需要溢价";
  return <button className={`talent-card ${selected ? "selected" : ""} ${locked ? "unavailable" : ""}`} onClick={onClick} aria-pressed={selected}>
    <PortraitAvatar person={person} group={isDirector ? "director" : person.id >= 100 ? "rookie" : "actor"} /><div><strong>{person.name}</strong><small>{isDirector ? person.trait : person.tag}</small></div>
    {isDirector && <div className={`director-momentum ${(person.momentum ?? 0) > 0 ? "up" : (person.momentum ?? 0) < 0 ? "down" : ""}`}><span>{person.marketNote ?? "本年度档期可约"}</span><b>{person.momentum === undefined ? "NEW" : `${person.momentum >= 0 ? "+" : ""}${person.momentum}`}</b></div>}
    {!isDirector && profile && <div className="profile-badges"><i className={`tier tier-${profile.tier.toLowerCase()}`}>{profile.tier}</i><span>综合 {person.acting + person.appeal}</span>{honorTitle && <span className="honor-title">{honorTitle}</span>}<span>{currentAge}岁</span><span className={`career career-${profile.career}`}>{careerStage(profile, currentAge)}</span><span>{retirementAge(person.id)}岁退休</span></div>}
    {!isDirector && <div className={`script-interest ${ownedContract ? "owned" : locked ? "locked" : scriptScore >= threshold + 8 ? "hot" : ""}`}><span>{ownedContract ? `内部价 ${Math.round(ownedContract.internalRate * 100)}%` : `剧本门槛 ${threshold}`}</span><b>{interest}</b></div>}
    <dl><dt>{isDirector ? "执导" : "演技"}</dt><dd>{isDirector ? person.skill : person.acting}</dd><dt>{isDirector ? "导演号召" : "演员号召"}</dt><dd>{person.appeal}</dd></dl>
    <p>{person.genres.join(" · ")}</p><b className="fee">¥{money(deal?.fee ?? person.fee * TALENT_COST_SCALE * (ownedContract?.internalRate ?? 1))}</b>{selected && <i className="check">✓</i>}
  </button>;
}
