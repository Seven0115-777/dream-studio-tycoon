export type ReleaseModelInput = {
  appeal: number;
  genreHeat: number;
  promoCost: number;
  promoPower: number;
  budgetCost: number;
  budgetCapacity: number;
  slotBoost: number;
  studioReach: number;
  genreSlotBonus: number;
  eventMarket: number;
  wordOfMouth: number;
  audienceScore: number;
  openingPower: number;
  competitionPressure: number;
  totalCost: number;
  investmentAmount?: number;
};

export type ReleaseModel = {
  openingDay: number;
  weekDays: number[];
  weekScores: number[];
  monthDays: number[];
  weekGross: number;
  tailGross: number;
  gross: number;
  studioRevenue: number;
  investorShare: number;
  successBonus: number;
  profit: number;
  breakEvenGross: number;
  retention: number;
};

export type ContentModelInput = {
  scriptScore: number;
  directorSkill: number;
  acting: number;
  budgetQuality: number;
  fit: number;
  eventBonus: number;
  chemistry: number;
  morale: number;
  directorMatched?: boolean;
  actorFitRate?: number;
};

export type ContentModel = {
  quality: number;
  wordOfMouth: number;
  audienceScore: number;
  scoreCeiling: number;
};

const clamp = (minimum: number, maximum: number, value: number) => Math.max(minimum, Math.min(maximum, value));
const STUDIO_SHARE = .34;

export function annualInvestmentAmount(year: number) {
  const productionYear = Math.max(1, Math.floor(year));
  if (productionYear === 1) return 0;
  return 5000 + Math.floor((productionYear - 2) / 2) * 2000;
}

export function investorRevenueShare(studioRevenue: number, investmentAmount: number) {
  if (studioRevenue <= 0 || investmentAmount <= 0) return 0;
  return Math.min(Math.round(studioRevenue * .1), Math.round(investmentAmount * 1.5));
}

export function studioReachMultiplier(level: number, reputation: number) {
  const producerLevel = clamp(1, 10, Math.floor(level));
  return Number(Math.min(1.18, .84 + producerLevel * .018 + Math.min(.16, Math.max(0, reputation) / 2500)).toFixed(3));
}

export function calculateCareerRewards(quality: number, audienceScore: number, roi: number, awardCount: number) {
  const xpGain = Math.round(20 + quality * .25 + awardCount * 15 + (roi >= 1 ? 15 : 0));
  const roiReputation = roi >= 2 ? 15 : roi >= 1.5 ? 10 : roi >= 1 ? 4 : roi >= .8 ? -7 : roi >= .6 ? -12 : -18;
  const audienceReputation = audienceScore >= 9 ? 10 : audienceScore >= 8.5 ? 7 : audienceScore >= 8 ? 4 : audienceScore >= 7.5 ? 1 : audienceScore >= 7 ? -4 : audienceScore >= 6.5 ? -8 : -12;
  const reputationGain = Math.round(clamp(-25, 35, roiReputation + audienceReputation + awardCount * 5));
  return { xpGain, reputationGain };
}

export function buildContentModel(input: ContentModelInput): ContentModel {
  const actorFitRate = clamp(0, 1, input.actorFitRate ?? 1);
  const effectiveDirectorSkill = input.directorSkill * (input.directorMatched === false ? .8 : 1);
  const effectiveActing = input.acting * (.88 + actorFitRate * .12);
  const mismatchPenalty = (input.directorMatched === false ? 2.5 : 0) + (1 - actorFitRate) * 3.5;
  const chemistryBonus = Math.max(-2, (input.chemistry - 60) * .12);
  const quality = clamp(40, 99, Math.round(4 + input.scriptScore * .38 + effectiveDirectorSkill * .17 + effectiveActing * .15 + input.budgetQuality * .65 + input.fit * .25 + input.eventBonus + chemistryBonus + input.morale * .12 - mismatchPenalty));
  const weakScriptPenalty = Math.max(0, 72 - input.scriptScore) * .9;
  const wordOfMouth = clamp(30, 99, Math.round(input.scriptScore * .4 + effectiveDirectorSkill * .15 + effectiveActing * .15 + quality * .25 + input.chemistry * .05 - weakScriptPenalty - mismatchPenalty * .35));
  const scoreCeiling = input.scriptScore < 65 ? 6.5 : input.scriptScore < 72 ? 7.2 : input.scriptScore < 78 ? 8 : 9.8;
  const audienceScore = Number(clamp(4.5, scoreCeiling, (quality * .45 + wordOfMouth * .55) / 10).toFixed(1));
  return { quality, wordOfMouth, audienceScore, scoreCeiling };
}

export function buildAudienceScoreCurve(audienceScore: number, openingPower: number, wordOfMouth: number) {
  const qualityArc = audienceScore >= 8.5 ? -.9 : audienceScore >= 8 ? -.6 : audienceScore <= 6.2 ? .9 : audienceScore <= 6.8 ? .65 : 0;
  const hypeBias = clamp(-.35, .45, (openingPower - wordOfMouth) * .018);
  const openingScore = clamp(5, 9.7, audienceScore + qualityArc + hypeBias);
  const progress = [0, .18, .35, .52, .68, .84, 1];
  return progress.map((value) => Number((openingScore + (audienceScore - openingScore) * value).toFixed(1)));
}

export function buildReleaseModel(input: ReleaseModelInput): ReleaseModel {
  const frontloadPenalty = input.promoPower >= 90 ? .085 : input.promoPower >= 65 ? .045 : .005;
  const organicBoost = input.promoPower < 55 ? Math.max(0, input.wordOfMouth - 82) * .0045 : 0;
  const openingBase = (input.appeal * 18 + input.genreHeat * 8 + Math.pow(input.promoCost, .75) * 5 + Math.pow(input.budgetCost, .7)) * 1.3;
  const openingPowerFactor = .78 + input.openingPower * .0024;
  const openingDay = Math.max(300, Math.round(openingBase * input.slotBoost * input.studioReach * input.genreSlotBonus * input.budgetCapacity * openingPowerFactor * (1 + input.eventMarket / 100) * (1 - input.competitionPressure * .7)));

  const weekScores = buildAudienceScoreCurve(input.audienceScore, input.openingPower, input.wordOfMouth);
  const weekDays = [openingDay];
  for (let day = 1; day < 7; day += 1) {
    const scoreChange = weekScores[day] - weekScores[day - 1];
    const effectiveCompetition = input.competitionPressure * (1 - Math.max(0, weekScores[day] - 8) * .22);
    const scoreHold = .94 + (weekScores[day] - 7) * .09 - frontloadPenalty + organicBoost + scoreChange * .1 - effectiveCompetition * .12;
    const calendarFactor = day === 5
      ? clamp(.92, 1.07, .96 + (weekScores[day] - 7) * .035 + (input.wordOfMouth - 70) * .0015)
      : day === 6
        ? clamp(.9, 1.04, .95 + (weekScores[day] - 7) * .03 + (input.wordOfMouth - 70) * .001)
        : [1, 1, .995, .99, .985][day];
    const priorReachFactor = 1 + (input.studioReach - 1) * Math.exp(-(day - 1) * .3);
    const nextReachFactor = 1 + (input.studioReach - 1) * Math.exp(-day * .3);
    const reachDecay = nextReachFactor / priorReachFactor;
    const dailyMultiplier = clamp(.68, 1.14, scoreHold * calendarFactor * reachDecay);
    weekDays.push(Math.round(weekDays[day - 1] * dailyMultiplier));
  }

  const monthDays = [...weekDays];
  const tailRetention = clamp(.72, .96, .72 + (input.audienceScore - 6) * .055 + (input.wordOfMouth - 70) * .002 - frontloadPenalty * .35 - input.competitionPressure * .08);
  const calendarFactors = [.84, .88, .93, .97, 1.08, 1.18, 1.02];
  const daySevenBase = weekDays[6];
  for (let day = 7; day < 30; day += 1) {
    const daysIntoTail = day - 6;
    const wordOfMouthLift = input.wordOfMouth >= 90 ? 1 + Math.min(.12, (input.wordOfMouth - 89) * .012) : 1;
    const modeledDemand = daySevenBase * Math.pow(tailRetention, daysIntoTail) * calendarFactors[day % 7] * wordOfMouthLift;
    monthDays.push(Math.max(12, Math.round(modeledDemand)));
  }

  const weekGross = weekDays.reduce((sum, value) => sum + value, 0);
  const gross = monthDays.reduce((sum, value) => sum + value, 0);
  const tailGross = gross - weekGross;
  const studioRevenue = Math.round(gross * STUDIO_SHARE);
  const investorShare = investorRevenueShare(studioRevenue, input.investmentAmount ?? 0);
  const preliminaryProfit = studioRevenue - investorShare - input.totalCost;
  const successBonus = preliminaryProfit > 0 ? Math.round(preliminaryProfit * .48) : 0;
  const profit = preliminaryProfit - successBonus;
  const retention = weekDays.slice(1).reduce((sum, value, index) => sum + value / weekDays[index], 0) / 6;
  const investmentCap = (input.investmentAmount ?? 0) * 1.5;
  const proportionalBreakEven = Math.ceil(input.totalCost / (STUDIO_SHARE * .9));
  const capThresholdGross = investmentCap > 0 ? investmentCap / (STUDIO_SHARE * .1) : 0;
  const breakEvenGross = investmentCap <= 0 ? Math.ceil(input.totalCost / STUDIO_SHARE) : proportionalBreakEven <= capThresholdGross ? proportionalBreakEven : Math.ceil((input.totalCost + investmentCap) / STUDIO_SHARE);
  return { openingDay, weekDays, weekScores, monthDays, weekGross, tailGross, gross, studioRevenue, investorShare, successBonus, profit, breakEvenGross, retention: Math.round(retention * 100) };
}
