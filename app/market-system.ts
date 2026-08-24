export type MarketGenre = {
  name: string;
  heat: number;
  heatChange?: number;
  marketNote?: string;
};

export type MarketDirector = {
  id: number;
  name: string;
  avatar: string;
  skill: number;
  appeal: number;
  fee: number;
  genres: string[];
  trait: string;
  available?: boolean;
  momentum?: number;
  marketNote?: string;
};

const clamp = (minimum: number, maximum: number, value: number) => Math.max(minimum, Math.min(maximum, value));

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

export function evolveGenreMarket<T extends MarketGenre>(genres: T[], year: number): T[] {
  if (!genres.length) return genres;
  const rankedIndexes = genres.map((_, index) => index).sort((first, second) => genres[first].heat - genres[second].heat);
  const coldCandidates = rankedIndexes.slice(0, Math.min(3, rankedIndexes.length));
  const hotCandidates = rankedIndexes.slice(Math.max(0, rankedIndexes.length - 2));
  const breakoutIndex = coldCandidates[hash(`${year}:genre:breakout`) % coldCandidates.length];
  const coolingIndex = hotCandidates[hash(`${year}:genre:cooling`) % hotCandidates.length];

  return genres.map((genre, index) => {
    const meanReversion = Math.round((78 - genre.heat) * .26);
    const marketShock = hash(`${year}:${genre.name}:heat`) % 13 - 6;
    const rotation = index === breakoutIndex ? 9 : index === coolingIndex ? -7 : 0;
    const rawHeat = clamp(55, 96, genre.heat + meanReversion + marketShock + rotation);
    let nextHeat = genre.heat + clamp(-10, 10, rawHeat - genre.heat);
    if (nextHeat === genre.heat) nextHeat = clamp(55, 96, nextHeat + (hash(`${year}:${genre.name}:direction`) % 2 ? 1 : -1));
    const heatChange = nextHeat - genre.heat;
    const marketNote = heatChange >= 7 ? "年度风口" : heatChange >= 3 ? "热度上升" : heatChange <= -7 ? "明显退潮" : heatChange <= -3 ? "市场降温" : "需求平稳";
    return { ...genre, heat: nextHeat, heatChange, marketNote };
  });
}

export function evolveDirectorMarket<T extends MarketDirector>(directors: T[], year: number, genreNames: string[]): T[] {
  const evolved = directors.map((director) => {
    const skillRoll = hash(`${year}:${director.id}:skill`) % 5 - 2;
    const appealRoll = hash(`${year}:${director.id}:appeal`) % 9 - 4;
    const skillDelta = director.skill >= 93 ? Math.min(0, skillRoll) : director.skill <= 76 ? Math.max(0, skillRoll) : skillRoll;
    const nextSkill = clamp(68, 97, director.skill + skillDelta);
    const nextAppeal = clamp(55, 95, director.appeal + appealRoll);
    const feeRate = (hash(`${year}:${director.id}:fee`) % 21 - 8) / 100;
    let nextGenres = [...director.genres];
    if (genreNames.length && hash(`${year}:${director.id}:style`) % 3 === 0) {
      const replacement = genreNames[hash(`${year}:${director.id}:genre`) % genreNames.length];
      if (replacement !== nextGenres[0]) nextGenres = [nextGenres[0], replacement];
    }
    const momentum = skillDelta + appealRoll;
    const marketNote = momentum >= 4 ? "新作口碑走强" : momentum >= 1 ? "行业评价上升" : momentum <= -4 ? "项目表现承压" : momentum <= -1 ? "市场热度回落" : "状态保持稳定";
    return { ...director, skill: nextSkill, appeal: nextAppeal, fee: clamp(280, 1800, Math.round(director.fee * (1 + feeRate))), genres: nextGenres, momentum, marketNote, available: false };
  });

  const availableIds = new Set([...evolved]
    .sort((first, second) => {
      const firstWasResting = directors.find((item) => item.id === first.id)?.available === false;
      const secondWasResting = directors.find((item) => item.id === second.id)?.available === false;
      const firstRotation = hash(`${year}:${first.id}:schedule`) + (firstWasResting ? 100_000_000 : 0);
      const secondRotation = hash(`${year}:${second.id}:schedule`) + (secondWasResting ? 100_000_000 : 0);
      return secondRotation - firstRotation;
    })
    .slice(0, Math.min(6, evolved.length))
    .map((director) => director.id));

  return evolved.map((director) => ({ ...director, available: availableIds.has(director.id) }));
}
