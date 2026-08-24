import type { ActorTier } from "./talent-system";

export type CompetitionTalent = {
  id: number;
  name: string;
  acting: number;
  appeal: number;
  tier: ActorTier;
};

export type CompetitorMovie = {
  id: string;
  title: string;
  genre: string;
  cast: CompetitionTalent[];
  strength: number;
  tier: ActorTier;
  audienceDrain: number;
};

const genres = ["犯罪悬疑", "都市爱情", "科幻冒险", "动作战争", "合家欢喜剧", "历史传记"];

const titleParts: Record<string, [string[], string[]]> = {
  犯罪悬疑: [["暗河", "迷城", "无声", "深巷", "逆证"], ["追凶", "来客", "真相", "回响", "边缘"]],
  都市爱情: [["春日", "晚风", "心动", "漫长", "此刻"], ["来信", "相遇", "以后", "距离", "告白"]],
  科幻冒险: [["星海", "深空", "黎明", "异星", "量子"], ["远征", "边界", "回航", "纪元", "信标"]],
  动作战争: [["烽火", "孤勇", "长夜", "绝地", "铁血"], ["突围", "防线", "行动", "营救", "决战"]],
  合家欢喜剧: [["好运", "热辣", "欢乐", "奇妙", "疯狂"], ["一家人", "假期", "计划", "大赢家", "旅行团"]],
  历史传记: [["山河", "长安", "风云", "大地", "岁月"], ["往事", "传奇", "之路", "长歌", "丰碑"]],
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

export function generateCompetitors(slotId: string, year: number, talents: CompetitionTalent[], excludedIds: number[]) {
  const available = talents.filter((talent) => !excludedIds.includes(talent.id)).sort((first, second) => hash(`${slotId}:${year}:${first.id}`) - hash(`${slotId}:${year}:${second.id}`));
  const count = 2 + hash(`${slotId}:${year}:count`) % 2;
  const movies: CompetitorMovie[] = [];
  for (let index = 0; index < count; index += 1) {
    const cast = available.slice(index * 2, index * 2 + 2);
    if (cast.length < 2) break;
    const genre = genres[hash(`${slotId}:${year}:${index}:genre`) % genres.length];
    const [prefixes, suffixes] = titleParts[genre];
    const title = `${prefixes[hash(`${year}:${index}:prefix`) % prefixes.length]}${suffixes[hash(`${slotId}:${index}:suffix`) % suffixes.length]}`;
    const tierBonus = cast.reduce((sum, talent) => sum + (talent.tier === "SS" ? 6 : talent.tier === "S" ? 4 : talent.tier === "A" ? 2 : 0), 0) / cast.length;
    const strength = Math.round(cast.reduce((sum, talent) => sum + talent.appeal * .62 + talent.acting * .38, 0) / cast.length + tierBonus);
    const tier = strength >= 96 ? "SS" : strength >= 91 ? "S" : strength >= 84 ? "A" : "B";
    const audienceDrain = tier === "SS" ? .14 : tier === "S" ? .11 : tier === "A" ? .07 : .04;
    movies.push({ id: `${slotId}-${year}-${index}`, title, genre, cast, strength, tier, audienceDrain });
  }
  return movies;
}

export function calculateCompetitionPressure(movies: CompetitorMovie[]) {
  return Math.min(.3, movies.reduce((sum, movie) => sum + movie.audienceDrain, 0));
}
