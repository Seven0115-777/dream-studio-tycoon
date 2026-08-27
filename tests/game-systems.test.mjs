import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompetitionPressure, generateCompetitors } from "../app/competition-system.ts";
import { annualInvestmentAmount, boxOfficeSettlementTarget, buildAudienceScoreCurve, buildContentModel, buildReleaseModel, calculateCareerRewards, determineAwards, investorRevenueShare, projectPaymentDelta, scheduleRiskMultiplier, settleAnnualCompanyCash, studioReachMultiplier, yearlyOperatingCost } from "../app/economy.ts";
import { evolveDirectorMarket, evolveGenreMarket } from "../app/market-system.ts";
import { evaluateScript, getScriptQuestionBank, getScriptQuestions, rewriteScript } from "../app/script-engine.ts";
import { coreStylesByGenre, deriveScriptBuild, describeBeginnerBuildChange, describeBuildChange, describeCoreStyle, ensembleCastOptions, getScriptDownstream, normalizeEnsembleCast, normalizeSequentialScriptProgress, resolveEnsembleCast, resolveEnsembleDownstream, scriptConnections, scriptQuestionState, summarizeScriptDownstream } from "../app/script-build-system.ts";
import { addFilmToSeason, buildSeasonStandings, defaultPoliciesForPath, emptySeasonStats, marketEraForYear, policiesForPath, resolveMarketEraEffects, resolveStudioStrategy, rivalGenrePressure, rivalPlansForYear, strategyLevel, studioPathXpGain, studioPaths, summarizeStrategyEffects, upcomingMarketEra } from "../app/studio-strategy-system.ts";
import { availableReleaseSlotIds, awardWinCap, calculateLibraryIncome, evaluateAnnualGoal, generateAnnualGoals, generateProductionChain, getProductionChoiceState, judgeAwards, releaseSlotStatus, resolveProductionChain } from "../app/game-systems.ts";
import { calculateReturningCastPremium, createFilmHistoryRecord, eligibleIpSources, expectationWordOfMouth, normalizeFilmHistory, resolveIpGenre, resolveIpProjectEffects } from "../app/ip-system.ts";
import { actorTier, ageAppealDecline, agencyCapacity, buildRookieMarket, currentActorAge, generateTalentNews, isMatureMarketEligible, matureContractQuote, retirementAge, rookieCandidates, rookieCareerSalary, rookieExposureAppealGain, rookiePerformanceFee, talentMarketRoll, talentRenewalQuote, tierOpeningBonus, tierScriptThreshold, trainingCapacity, trainingGain, uniqueGenres } from "../app/talent-system.ts";
import { advanceWordOfMouthChapter, annualRhythmForYear, emptyWordOfMouthProgress, strategySlotCapacityForYear, wordOfMouthGoals, wordOfMouthLegacyEffects, wordOfMouthReleasePlans } from "../app/progression-system.ts";

const releaseBase = {
  appeal: 82,
  genreHeat: 82,
  promoCost: 3500,
  promoPower: 72,
  budgetCost: 10000,
  budgetCapacity: 1,
  slotBoost: 1,
  studioReach: 1,
  genreSlotBonus: 1,
  eventMarket: 0,
  competitionPressure: 0,
  totalCost: 15000,
};

const hitIpSource = {
  id: "film-1-fire",
  year: 1,
  title: "烽火行动",
  genre: "动作",
  gross: 70000,
  awards: 1,
  score: 8.7,
  quality: 89,
  breakEvenGross: 40000,
  castIds: [11, 12],
  coreStyleId: "dual-protagonist",
  traits: ["双雄对决", "终局反转"],
  brandHeat: 72,
  fatigue: 25,
};

test("successful films become IP sources while legacy records receive safe fallbacks", () => {
  const history = normalizeFilmHistory([
    hitIpSource,
    { title: "旧日样片", gross: 20000, awards: 0 },
  ]);
  assert.equal(history.length, 2);
  assert.ok(history.every((film) => film.id && film.castIds && film.traits));
  assert.deepEqual(eligibleIpSources(history).map((film) => film.title), ["烽火行动"]);
});

test("sequel, spinoff and reboot create distinct franchise tradeoffs", () => {
  const history = [hitIpSource];
  const input = { genre: "动作", castIds: [11, 99], coreStyleId: "dual-protagonist" };
  const sequel = resolveIpProjectEffects(history, { route: "sequel", sourceId: hitIpSource.id }, input);
  const spinoff = resolveIpProjectEffects(history, { route: "spinoff", sourceId: hitIpSource.id }, input);
  const reboot = resolveIpProjectEffects(history, { route: "reboot", sourceId: hitIpSource.id }, input);

  assert.ok(sequel.openingPower > spinoff.openingPower && spinoff.openingPower > reboot.openingPower);
  assert.equal(sequel.inheritedTraits.length, 2);
  assert.equal(spinoff.inheritedTraits.length, 1);
  assert.equal(reboot.inheritedTraits.length, 0);
  assert.deepEqual([sequel.qualityBonus, spinoff.qualityBonus, reboot.qualityBonus], [2, 1, 0]);
  assert.ok(sequel.projectedFatigue > spinoff.projectedFatigue);
  assert.ok(reboot.projectedFatigue < hitIpSource.fatigue);
  assert.equal(sequel.returningCastPremiumRate, .12);
  assert.equal(spinoff.returningCastPremiumRate, .05);
  assert.equal(reboot.returningCastPremiumRate, 0);
  assert.equal(calculateReturningCastPremium(sequel, [{ actorId: 11, fee: 4000 }, { actorId: 99, fee: 3000 }]), 480);
});

test("franchise expectations change word of mouth and persist cross-year series state", () => {
  assert.equal(expectationWordOfMouth(9.1, 8.7), 1);
  assert.equal(expectationWordOfMouth(8.2, 8.7), -1);
  assert.equal(expectationWordOfMouth(7.8, 8.7), -2);
  const selection = { route: "sequel", sourceId: hitIpSource.id };
  const effects = resolveIpProjectEffects([hitIpSource], selection, { genre: "动作", castIds: [11, 12], coreStyleId: "dual-protagonist" });
  const record = createFilmHistoryRecord({ year: 2, title: "烽火行动：续章", genre: "动作", gross: 90000, awards: 2, score: 9.1, quality: 93, breakEvenGross: 50000, directorId: 3, castIds: [11, 12], coreStyleId: "dual-protagonist", buildName: "双雄终局", traits: ["双雄对决", "终局反转"], libraryMultiplier: 1.12, selection, effects });
  assert.equal(record.seriesId, hitIpSource.id);
  assert.equal(record.seriesTitle, hitIpSource.title);
  assert.equal(record.seriesEntry, 2);
  assert.ok(record.brandHeat > hitIpSource.brandHeat);
  assert.ok(record.fatigue < effects.projectedFatigue);
  assert.ok(record.libraryMultiplier > 1.12);
});

test("high scores rise while low scores lose box office", () => {
  const high = buildReleaseModel({ ...releaseBase, audienceScore: 9, wordOfMouth: 92, openingPower: 78 });
  const low = buildReleaseModel({ ...releaseBase, audienceScore: 6.1, wordOfMouth: 62, openingPower: 90 });

  assert.ok(high.weekScores[6] - high.weekScores[0] >= 1);
  assert.ok(high.weekDays[6] > high.weekDays[0]);
  assert.ok(low.weekScores[0] - low.weekScores[6] >= 1);
  assert.ok(low.weekDays[6] < low.weekDays[0] * 0.5);
  assert.ok(high.gross > low.gross * 2);
});

test("a bad script caps audience score even with elite cast and maximum production", () => {
  const badStarVehicle = buildContentModel({ scriptScore: 60, directorSkill: 96, acting: 96, budgetQuality: 19, fit: 18, eventBonus: 4, chemistry: 94, morale: 4 });
  const strongStory = buildContentModel({ scriptScore: 88, directorSkill: 82, acting: 78, budgetQuality: 11, fit: 10, eventBonus: 0, chemistry: 72, morale: 0 });
  assert.equal(badStarVehicle.scoreCeiling, 6.5);
  assert.ok(badStarVehicle.audienceScore <= 6.5);
  assert.ok(strongStory.audienceScore > badStarVehicle.audienceScore);
  assert.ok(strongStory.wordOfMouth > badStarVehicle.wordOfMouth);
});

test("score curves reveal hype and word of mouth over seven days", () => {
  assert.deepEqual(buildAudienceScoreCurve(9, 78, 92), [7.8, 8.1, 8.3, 8.4, 8.6, 8.8, 9]);
  assert.deepEqual(buildAudienceScoreCurve(6.1, 90, 62), [7.5, 7.2, 7, 6.7, 6.5, 6.3, 6.1]);
});

test("late-game reach is capped and fades instead of guaranteeing a hit", () => {
  assert.equal(studioReachMultiplier(10, 0), 1.02);
  assert.equal(studioReachMultiplier(10, 75), 1.05);
  assert.equal(studioReachMultiplier(10, 589), 1.18);
  assert.equal(studioReachMultiplier(10, 5000), 1.18);
  const loss = calculateCareerRewards(62, 6.8, .72, 0);
  const hit = calculateCareerRewards(88, 8.8, 1.8, 2);
  assert.ok(loss.reputationGain < 0);
  assert.ok(hit.reputationGain > 0);
  assert.ok(loss.xpGain < hit.xpGain);
});

test("weekend demand does not force weak films into a day-six rebound", () => {
  const weak = buildReleaseModel({ ...releaseBase, audienceScore: 6.8, wordOfMouth: 67, openingPower: 82, studioReach: 1.18 });
  const acclaimed = buildReleaseModel({ ...releaseBase, audienceScore: 9, wordOfMouth: 92, openingPower: 72, studioReach: 1.05 });
  assert.ok(weak.weekDays[5] < weak.weekDays[4]);
  assert.ok(weak.weekDays[6] < weak.weekDays[5]);
  assert.ok(acclaimed.weekDays[5] >= acclaimed.weekDays[4]);
});

test("late-game reputation cannot rescue a mismatched B production from bad economics", () => {
  const mismatched = buildContentModel({ scriptScore: 85, directorSkill: 90, acting: 90, budgetQuality: 19, fit: 0, eventBonus: 0, chemistry: 75, morale: 0, directorMatched: false, actorFitRate: 0 });
  const acclaimed = buildContentModel({ scriptScore: 88, directorSkill: 93, acting: 97, budgetQuality: 19, fit: 24, eventBonus: 0, chemistry: 82, morale: 0, directorMatched: true, actorFitRate: 1 });
  const shared = { genreHeat: 82, promoCost: 8000, promoPower: 98, budgetCost: 22000, budgetCapacity: 1.12, slotBoost: 1.18, studioReach: studioReachMultiplier(10, 589), genreSlotBonus: 1, eventMarket: 0, openingPower: 88, competitionPressure: .15 };
  const weakRelease = buildReleaseModel({ ...shared, appeal: 52, wordOfMouth: mismatched.wordOfMouth, audienceScore: mismatched.audienceScore, totalCost: 44700 });
  const strongRelease = buildReleaseModel({ ...shared, appeal: 95, wordOfMouth: acclaimed.wordOfMouth, audienceScore: acclaimed.audienceScore, totalCost: 49200 });
  assert.ok(weakRelease.profit < 0);
  assert.ok(strongRelease.profit > 0);
  assert.ok(strongRelease.gross > weakRelease.gross * 2);
});

test("annual investment unlocks in year two and grows every two years", () => {
  assert.deepEqual(
    Array.from({ length: 11 }, (_, index) => annualInvestmentAmount(index + 1)),
    [0, 5000, 5000, 7000, 7000, 9000, 9000, 11000, 11000, 13000, 13000],
  );
});

test("funded movies share studio revenue with investors under a capped deal", () => {
  assert.equal(investorRevenueShare(10000, 0), 0);
  assert.equal(investorRevenueShare(10000, 5000), 1000);
  assert.equal(investorRevenueShare(100000, 5000), 7500);
  const independent = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84 });
  const funded = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84, investmentAmount: 5000 });
  assert.equal(funded.gross, independent.gross);
  assert.ok(funded.investorShare > 0 && funded.investorShare <= 7500);
  assert.ok(funded.profit < independent.profit);
  assert.ok(funded.breakEvenGross > independent.breakEvenGross);
});

test("every roster seat has one annual training opportunity", () => {
  for (let level = 1; level <= 10; level += 1) assert.equal(trainingCapacity(level), agencyCapacity(level));
});

test("rookies grow quickly toward potential while mature talent stays stable", () => {
  const rookie = { origin: "rookie", potential: 94, growth: 3 };
  const mature = { origin: "mature", potential: 94, growth: 1 };
  assert.equal(trainingGain(35, rookie), 12);
  assert.equal(trainingGain(68, rookie), 8);
  assert.equal(trainingGain(88, rookie), 4);
  assert.equal(trainingGain(94, rookie), 0);
  assert.equal(trainingGain(88, mature), 1);
});

test("every rookie enters the signing market between ages 18 and 20", () => {
  assert.equal(rookieCandidates.length, 30);
  assert.ok(rookieCandidates.every((rookie) => rookie.profile.age >= 18 && rookie.profile.age <= 20));
  assert.deepEqual(new Set(rookieCandidates.map((rookie) => rookie.profile.age)), new Set([18, 19, 20]));
  const ordinary = rookieCandidates.filter((rookie) => rookie.rarity === "ordinary");
  const gold = rookieCandidates.filter((rookie) => rookie.rarity === "gold");
  const red = rookieCandidates.filter((rookie) => rookie.rarity === "red");
  assert.equal(ordinary.length, 22);
  assert.equal(gold.length, 4);
  assert.equal(red.length, 4);
  assert.ok(ordinary.every((rookie) => rookie.potential >= 70 && rookie.potential <= 89));
  assert.ok(gold.every((rookie) => rookie.potential >= 90 && rookie.potential <= 95));
  assert.ok(red.every((rookie) => rookie.potential >= 95 && rookie.potential <= 99));
  assert.equal(currentActorAge(18, 8, 8), 18);
  assert.equal(currentActorAge(18, 12, 8), 22);
});

test("project payments deduct only the newly committed cumulative cost", () => {
  assert.equal(projectPaymentDelta(10000, 0), 10000);
  assert.equal(projectPaymentDelta(13800, 10000), 3800);
  assert.equal(projectPaymentDelta(12500, 13800), -1300);
});

test("box office cash is credited by revealed day and fully settled on day seven", () => {
  const weekDays = [1000, 900, 800, 700, 600, 500, 400];
  assert.equal(boxOfficeSettlementTarget(weekDays, 0, 5000, 300, 700), 0);
  assert.equal(boxOfficeSettlementTarget(weekDays, 1, 5000, 300, 700), 340);
  assert.equal(boxOfficeSettlementTarget(weekDays, 3, 5000, 300, 700), 918);
  assert.equal(boxOfficeSettlementTarget(weekDays, 7, 5000, 300, 700), 4000);
});

test("every award requires an audience score of at least 8.6", () => {
  const eliteConditions = { quality: 99, directorScore: 125, acting: 95, chemistry: 94 };
  assert.deepEqual(determineAwards({ ...eliteConditions, audienceScore: 8.5 }), []);
  assert.deepEqual(determineAwards({ ...eliteConditions, audienceScore: 8.6 }), ["年度最佳影片", "最佳导演", "最佳表演", "最佳银幕搭档", "观众选择奖"]);
  assert.deepEqual(determineAwards({ quality: 70, directorScore: 80, acting: 70, chemistry: 70, audienceScore: 8.6 }), ["观众选择奖"]);
});

test("former self-trained talent needs a B-level combined score to enter the mature market", () => {
  assert.equal(isMatureMarketEligible({ acting: 74, appeal: 75 }), false);
  assert.equal(isMatureMarketEligible({ acting: 75, appeal: 75 }), true);
});

test("annual scouting favors ordinary rookies while the yearly refresh guarantees one rare card", () => {
  const naturalCounts = { ordinary: 0, gold: 0, red: 0 };
  const naturalYears = { none: 0, gold: 0, red: 0 };
  const refreshCounts = { gold: 0, red: 0 };
  for (let year = 1; year <= 5000; year += 1) {
    const naturalMarket = buildRookieMarket(year);
    assert.equal(naturalMarket.length, 4);
    assert.equal(new Set(naturalMarket.map((rookie) => rookie.id)).size, 4);
    naturalMarket.forEach((rookie) => naturalCounts[rookie.rarity] += 1);
    const naturalRare = naturalMarket.filter((rookie) => rookie.rarity !== "ordinary");
    assert.ok(naturalRare.length <= 1);
    naturalYears[naturalRare.length ? naturalRare[0].rarity : "none"] += 1;

    const refreshedMarket = buildRookieMarket(year, new Set(), true);
    assert.equal(refreshedMarket.length, 4);
    assert.equal(new Set(refreshedMarket.map((rookie) => rookie.id)).size, 4);
    const rare = refreshedMarket.filter((rookie) => rookie.rarity !== "ordinary");
    assert.equal(rare.length, 1);
    refreshCounts[rare[0].rarity] += 1;
  }
  assert.ok(naturalCounts.ordinary > naturalCounts.gold * 5);
  assert.ok(naturalCounts.gold > naturalCounts.red);
  assert.ok(naturalYears.none >= 4400 && naturalYears.none <= 4600);
  assert.ok(naturalYears.gold >= 350 && naturalYears.gold <= 450);
  assert.ok(naturalYears.red >= 70 && naturalYears.red <= 130);
  assert.ok(refreshCounts.gold >= 3650 && refreshCounts.gold <= 3850);
  assert.equal(refreshCounts.gold + refreshCounts.red, 5000);
  const allGoldSigned = new Set(rookieCandidates.filter((rookie) => rookie.rarity === "gold").map((rookie) => rookie.id));
  assert.equal(buildRookieMarket(1, allGoldSigned, true).filter((rookie) => rookie.rarity === "red").length, 1);
  const naturalLineups = new Set(Array.from({ length: 100 }, (_, seed) => buildRookieMarket(1, new Set(), false, seed).map((rookie) => rookie.id).join("-")));
  assert.ok(naturalLineups.size > 20, "fresh saves should not share one fixed first-year rookie list");
  assert.deepEqual(buildRookieMarket(1, new Set(), true, 20260827), buildRookieMarket(1, new Set(), true, 20260827), "a persisted refresh seed must reproduce the same list");
  const refreshLineups = new Set(Array.from({ length: 100 }, (_, seed) => buildRookieMarket(1, new Set(), true, seed).map((rookie) => rookie.id).join("-")));
  assert.ok(refreshLineups.size > 20, "independent refresh seeds should produce varied rookie lists");
});

test("annual rhythm spreads the second-to-fifth-year unlocks instead of stacking them", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(strategySlotCapacityForYear), [0, 0, 1, 2, 3]);
  assert.match(annualRhythmForYear(2).primary, /IP/);
  assert.match(annualRhythmForYear(2).nextUnlock, /第二部电影后/);
  assert.match(annualRhythmForYear(3).secondary, /1个经营策略槽/);
  assert.match(annualRhythmForYear(4).secondary, /第2个经营策略槽/);
  assert.match(annualRhythmForYear(5).secondary, /第3个经营策略槽/);
});

test("the word-of-mouth chapter offers distinct release tradeoffs and one-time progress", () => {
  assert.equal(wordOfMouthGoals.length, 3);
  assert.equal(wordOfMouthReleasePlans.length, 3);
  assert.equal(new Set(wordOfMouthReleasePlans.map((plan) => `${plan.wordOfMouth}/${plan.openingPower}/${plan.pictureAwardBonus}`)).size, 3);
  const start = emptyWordOfMouthProgress();
  const first = advanceWordOfMouthChapter(start, "critics", { audienceScore: 8.4, openingPower: 82, gross: 50000, breakEvenGross: 35000, awards: 1 });
  assert.equal(first.current, 1);
  assert.equal(first.completedNow, false);
  const second = advanceWordOfMouthChapter(first.progress, "critics", { audienceScore: 8.6, openingPower: 78, gross: 60000, breakEvenGross: 40000, awards: 2 });
  assert.equal(second.current, 2);
  assert.equal(second.completedNow, true);
  const afterCompletion = advanceWordOfMouthChapter(second.progress, "critics", { audienceScore: 8.8, openingPower: 76, gross: 70000, breakEvenGross: 40000, awards: 1 });
  assert.equal(afterCompletion.completedNow, false, "a completed chapter cannot grant its first-completion reward again");
});

test("chapter legacies stay dormant until year six and remain route-specific", () => {
  assert.deepEqual(wordOfMouthLegacyEffects("critics", true, 5), { wordOfMouth: 0, retention: 0, pictureAwardBonus: 0, directorAwardBonus: 0 });
  assert.deepEqual(wordOfMouthLegacyEffects("critics", true, 6), { wordOfMouth: 1, retention: 0, pictureAwardBonus: 0, directorAwardBonus: 0 });
  assert.deepEqual(wordOfMouthLegacyEffects("comeback", true, 6), { wordOfMouth: 0, retention: .004, pictureAwardBonus: 0, directorAwardBonus: 0 });
  assert.deepEqual(wordOfMouthLegacyEffects("festival", true, 6), { wordOfMouth: 0, retention: 0, pictureAwardBonus: 1, directorAwardBonus: 1 });
});

test("genre training remains unique and rookie fees catch established stars after hit films", () => {
  assert.deepEqual(uniqueGenres(["科幻冒险", "犯罪悬疑", "科幻冒险"]), ["科幻冒险", "犯罪悬疑"]);
  const firstHit = rookiePerformanceFee(100, "SS", 1, 3);
  const secondHit = rookiePerformanceFee(firstHit, "SS", 2, 3);
  const thirdHit = rookiePerformanceFee(secondHit, "SS", 3, 3);
  assert.ok(firstHit >= 600);
  assert.ok(secondHit > firstHit);
  assert.ok(thirdHit > 1500);
  const firstFlop = rookiePerformanceFee(100, "B", 1, .5);
  const fifthCredit = rookiePerformanceFee(firstFlop, "B", 5, .5);
  assert.ok(firstFlop > 100);
  assert.ok(fifthCredit > firstFlop);
  const firstSalary = rookieCareerSalary(90, firstHit, 1);
  const thirdSalary = rookieCareerSalary(firstSalary, thirdHit, 3);
  assert.ok(firstSalary > 90);
  assert.ok(thirdSalary > firstSalary);
  const contract = { origin: "rookie", signingFee: 100, annualSalary: 100 };
  const renewal = talentRenewalQuote({ acting: 98, appeal: 98, fee: thirdHit }, contract);
  assert.ok(renewal.renewalFee > 2500);
  assert.ok(renewal.annualSalary > contract.annualSalary);
});

test("release slots generate stable competitors and competition reduces gross", () => {
  const talents = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    name: `演员${index + 1}`,
    acting: 80 + index,
    appeal: 82 + index,
    tier: index >= 7 ? "S" : index >= 3 ? "A" : "B",
  }));
  const first = generateCompetitors("summer", 8, talents, [1, 2]);
  const second = generateCompetitors("summer", 8, talents, [1, 2]);
  const pressure = calculateCompetitionPressure(first);
  assert.deepEqual(first, second);
  assert.ok(first.length >= 2 && first.length <= 3);
  assert.ok(pressure >= .08 && pressure <= .3);

  const clearSlot = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84 });
  const crowdedSlot = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84, competitionPressure: pressure });
  assert.ok(crowdedSlot.gross < clearSlot.gross);
});

test("positive schedule risk reduces release efficiency while controlled risk grants no bonus", () => {
  const neutral = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84, scheduleRisk: 0 });
  const delayed = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84, scheduleRisk: 4 });
  const controlled = buildReleaseModel({ ...releaseBase, audienceScore: 8.5, wordOfMouth: 86, openingPower: 84, scheduleRisk: -4 });
  assert.equal(scheduleRiskMultiplier(4), .9);
  assert.equal(scheduleRiskMultiplier(-4), 1);
  assert.ok(delayed.weekGross < neutral.weekGross);
  assert.ok(delayed.gross < neutral.gross);
  assert.equal(controlled.openingDay, neutral.openingDay);
  assert.equal(controlled.gross, neutral.gross);
});

test("annual talent market, public opinion, ageing and retirement are deterministic", () => {
  const actors = Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    name: `艺人${index + 1}`,
    avatar: "艺",
    gender: index % 2 ? "男" : "女",
    acting: 75,
    appeal: 75,
    fee: 800,
    genres: ["犯罪悬疑"],
    tag: "测试艺人",
  }));
  assert.deepEqual(generateTalentNews(actors, 9), generateTalentNews(actors, 9));
  assert.equal(generateTalentNews(actors, 9).length, 3);
  assert.equal(talentMarketRoll(3, 9), talentMarketRoll(3, 9));
  assert.ok(retirementAge(3) >= 66 && retirementAge(3) <= 70);
  assert.equal(ageAppealDecline(51), 0);
  assert.equal(ageAppealDecline(52), -1);
  assert.equal(ageAppealDecline(58), -2);
  assert.equal(ageAppealDecline(63), -3);
});

test("genre heat rotates annually and pulls extreme genres back toward the market", () => {
  const genres = [
    { name: "甲", heat: 96 }, { name: "乙", heat: 88 }, { name: "丙", heat: 78 },
    { name: "丁", heat: 70 }, { name: "戊", heat: 61 }, { name: "己", heat: 55 },
  ];
  const next = evolveGenreMarket(genres, 6);
  assert.deepEqual(next, evolveGenreMarket(genres, 6));
  assert.ok(next.every((item) => item.heat >= 55 && item.heat <= 96));
  assert.ok(next.every((item, index) => item.heat !== genres[index].heat));
  assert.ok(next.some((item) => (item.heatChange ?? 0) >= 3));
  assert.ok(next.some((item) => (item.heatChange ?? 0) <= -3));
});

test("director lineup and attributes change without one permanent market monopoly", () => {
  const genreNames = ["悬疑", "爱情", "科幻", "动作", "喜剧", "历史"];
  const directors = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    name: `导演${index + 1}`,
    avatar: "导",
    skill: 76 + index * 2,
    appeal: 68 + index,
    fee: 500 + index * 50,
    genres: [genreNames[index % genreNames.length], genreNames[(index + 1) % genreNames.length]],
    trait: "测试",
    available: index < 6,
  }));
  const yearTwo = evolveDirectorMarket(directors, 2, genreNames);
  const yearThree = evolveDirectorMarket(yearTwo, 3, genreNames);
  assert.equal(yearTwo.filter((item) => item.available).length, 6);
  assert.equal(yearThree.filter((item) => item.available).length, 6);
  assert.notDeepEqual(yearTwo.filter((item) => item.available).map((item) => item.id), directors.filter((item) => item.available).map((item) => item.id));
  assert.ok(yearTwo.some((item, index) => item.skill !== directors[index].skill || item.appeal !== directors[index].appeal));
  assert.ok(yearTwo.some((item, index) => item.fee !== directors[index].fee || item.genres.join() !== directors[index].genres.join()));
});

test("a skilled rookie gains audience through screen exposure and a popular co-star", () => {
  const soloGain = rookieExposureAppealGain(95, 40, 45, 1.2);
  const starPairGain = rookieExposureAppealGain(95, 40, 92, 1.2);
  const hitGain = rookieExposureAppealGain(95, 40, 92, 2);
  assert.ok(soloGain >= 5);
  assert.ok(starPairGain > soloGain);
  assert.ok(hitGain > starPairGain);
  assert.ok(hitGain <= 9);
  assert.equal(rookieExposureAppealGain(70, 40, 95, 3), 0);
});

test("actor tiers are derived from acting plus appeal with clear boundaries", () => {
  assert.equal(actorTier(87, 87), "B");
  assert.equal(actorTier(88, 87), "A");
  assert.equal(actorTier(91, 90), "A");
  assert.equal(actorTier(91, 91), "S");
  assert.equal(actorTier(97, 97), "S");
  assert.equal(actorTier(98, 97), "SS");
  assert.equal(tierScriptThreshold("SS"), 88);
  assert.ok(tierOpeningBonus("SS") > tierOpeningBonus("S"));
});

test("SS talent requires premium reputation and contract economics", () => {
  const actor = { fee: 1200 };
  const ss = matureContractQuote(actor, { tier: "SS" });
  const s = matureContractQuote(actor, { tier: "S" });
  assert.equal(ss.requiredReputation, 140);
  assert.ok(ss.signingFee > s.signingFee);
  assert.ok(ss.annualSalary > s.annualSalary);
  assert.ok(ss.internalRate > s.internalRate);
});

test("SS competitor movies create the strongest audience diversion", () => {
  const movies = generateCompetitors("spring", 12, Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: `传奇${index + 1}`, acting: 99, appeal: 99, tier: "SS" })), []);
  assert.ok(movies.some((movie) => movie.tier === "SS"));
  assert.ok(movies.filter((movie) => movie.tier === "SS").every((movie) => movie.audienceDrain === .14));
});

test("the 144-card bank feeds five route cards after the fixed core-style choice", () => {
  const bank = getScriptQuestionBank();
  assert.equal(bank.common.length, 6);
  assert.equal(Object.keys(bank.genres).length, 6);
  Object.values(bank.genres).forEach((questions) => assert.equal(questions.length, 23));
  const allQuestions = [...bank.common, ...Object.values(bank.genres).flat()];
  assert.equal(allQuestions.length, 144);
  assert.equal(new Set(allQuestions.map((question) => question.id)).size, 144);
  assert.ok(allQuestions.every((question) => question.options.length === 3));
  assert.notDeepEqual(getScriptQuestions("犯罪悬疑", 2).map((question) => question.id), getScriptQuestions("犯罪悬疑", 3).map((question) => question.id));
  for (const genre of Object.keys(bank.genres)) {
    const firstSix = Array.from({ length: 6 }, (_, index) => getScriptQuestions(genre, index + 1)).flat();
    const firstTwelvePapers = Array.from({ length: 12 }, (_, index) => getScriptQuestions(genre, index + 1).map((question) => question.id).sort().join("|"));
    assert.equal(new Set(firstSix.filter((question) => !question.id.startsWith("common-") && !question.id.startsWith("core-")).map((question) => question.id)).size, 23);
    assert.equal(new Set(firstSix.filter((question) => question.id.startsWith("common-")).map((question) => question.id)).size, 6);
    assert.ok(firstSix.every((question, index) => index % 6 !== 0 || question.id.startsWith("core-")));
    assert.equal(new Set(firstTwelvePapers).size, 12);
  }
});

test("all eighteen core styles are reachable and can activate more than one viable build", () => {
  const styles = Object.values(coreStylesByGenre).flat();
  assert.equal(styles.length, 18);
  assert.equal(new Set(styles.map((style) => style.id)).size, 18);
  assert.deepEqual(styles.map((style) => style.engine).filter((engine) => scriptConnections.some((connection) => connection.name === engine)), []);
  for (const [genre, genreStyles] of Object.entries(coreStylesByGenre)) {
    const questions = getScriptQuestions(genre, 1);
    assert.deepEqual(questions[0].options.map((option) => option.label), genreStyles.map((style) => style.name));
    for (const style of genreStyles) {
      const builds = [];
      for (let combination = 0; combination < 243; combination += 1) {
        let cursor = combination;
        const answers = { [questions[0].id]: style.id };
        for (const question of questions.slice(1)) {
          answers[question.id] = question.options[cursor % 3].id;
          cursor = Math.floor(cursor / 3);
        }
        const report = evaluateScript(answers, questions.map((question) => question.id), genre, 1);
        if (report.build?.activeEngines.includes(style.engine)) builds.push(report.build.buildName);
      }
      assert.ok(builds.length > 1, `${style.name} should have multiple activated builds`);
      assert.ok(new Set(builds).size > 1, `${style.name} should have more than one finished identity`);
    }
  }
});

test("all core cards separate real advantages from construction costs", () => {
  const styles = Object.values(coreStylesByGenre).flat();
  assert.equal(styles.length, 18);
  for (const style of styles) {
    const description = describeCoreStyle(style);
    assert.ok(description.advantages.length > 0);
    assert.ok(description.costs.length > 0);
    assert.doesNotMatch(description.advantages.join(" "), /成本 \+|开画 -|口碑 -|长线留存 -|明星开画权重 -/);
    assert.doesNotMatch(description.costs.join(" "), /成本 -|质量 \+|口碑 \+|开画 \+|长线留存 \+|评审 \+|片库长尾 \+/);
  }
  const hunt = describeCoreStyle(coreStylesByGenre["犯罪悬疑"].find((style) => style.id === "crime-hunt"));
  assert.match(hunt.advantages.join(" "), /开画 \+3|明星开画权重 \+12%/);
  assert.doesNotMatch(hunt.advantages.join(" "), /成本/);
  assert.match(hunt.costs.join(" "), /核心主演成本 \+6%/);
});

test("cross-style connections stay competitive and no core route strictly dominates its genre", () => {
  let competitiveCrossStyles = 0;
  for (const [genre, styles] of Object.entries(coreStylesByGenre)) {
    const questions = getScriptQuestions(genre, 1);
    for (const style of styles) {
      let bestPure = -1;
      let bestCross = -1;
      for (let combination = 0; combination < 243; combination += 1) {
        let cursor = combination;
        const answers = { [questions[0].id]: style.id };
        for (const question of questions.slice(1)) {
          answers[question.id] = question.options[cursor % 3].id;
          cursor = Math.floor(cursor / 3);
        }
        const report = evaluateScript(answers, questions.map((question) => question.id), genre, 1);
        if (report.build.alignedChoices === 5) bestPure = Math.max(bestPure, report.score);
        if (report.build.connections.length && report.build.alignedChoices < 5) bestCross = Math.max(bestCross, report.score);
      }
      if (bestPure < 0 || bestCross >= bestPure) competitiveCrossStyles += 1;
    }
    for (const first of styles) {
      for (const second of styles) {
        if (first === second) continue;
        const a = first.downstream;
        const b = second.downstream;
        const aQuality = a.contentQuality + a.wordOfMouth;
        const bQuality = b.contentQuality + b.wordOfMouth;
        const aMarket = a.openingPower + a.retention * 100 + (a.starPowerMultiplier - 1) * 10;
        const bMarket = b.openingPower + b.retention * 100 + (b.starPowerMultiplier - 1) * 10;
        const aCost = a.budgetCostMultiplier * a.castingCostMultiplier;
        const bCost = b.budgetCostMultiplier * b.castingCostMultiplier;
        const aAwards = a.awardPicture + a.awardDirector + a.awardActing;
        const bAwards = b.awardPicture + b.awardDirector + b.awardActing;
        const dominates = aQuality >= bQuality && aMarket >= bMarket && aCost <= bCost && aAwards >= bAwards
          && (aQuality > bQuality || aMarket > bMarket || aCost < bCost || aAwards > bAwards);
        assert.equal(dominates, false, `${first.name} must not strictly dominate ${second.name}`);
      }
    }
  }
  assert.ok(competitiveCrossStyles >= 12, "cross-style builds should be top-tier options for most cores");
});

test("script builds are deterministic and route cards add, repair and connect flaws", () => {
  const questions = getScriptQuestions("犯罪悬疑", 4);
  let sample;
  for (let combination = 0; combination < 243 && !sample; combination += 1) {
    let cursor = combination;
    const answers = { [questions[0].id]: questions[0].options[1].id };
    for (const question of questions.slice(1)) {
      answers[question.id] = question.options[cursor % 3].id;
      cursor = Math.floor(cursor / 3);
    }
    const build = deriveScriptBuild(answers, questions, "犯罪悬疑");
    if (build.connections.length && build.repairedFlaws.length) sample = { answers, build };
  }
  assert.ok(sample);
  assert.deepEqual(sample.build, deriveScriptBuild(sample.answers, questions, "犯罪悬疑"));
  assert.ok(sample.build.keywords.length >= 3);
  assert.ok(sample.build.connections.length >= 1);
  assert.ok(sample.build.repairedFlaws.length >= 1);
  assert.ok(sample.build.events.some((event) => event.includes("修复") || event.includes("连接")));
});

test("connections merge real downstream tradeoffs with bounded totals", () => {
  let comparison;
  let mostConnections = 0;
  for (const genre of Object.keys(coreStylesByGenre)) {
    const questions = getScriptQuestions(genre, 1);
    const reports = [];
    for (let combination = 0; combination < 729; combination += 1) {
      let cursor = combination;
      const answers = {};
      for (const question of questions) {
        answers[question.id] = question.options[cursor % 3].id;
        cursor = Math.floor(cursor / 3);
      }
      const report = evaluateScript(answers, questions.map((question) => question.id), genre, 1);
      const effects = report.build.downstream;
      mostConnections = Math.max(mostConnections, report.build.connections.length);
      assert.ok(effects.budgetCostMultiplier >= .85 && effects.budgetCostMultiplier <= 1.18);
      assert.ok(effects.castingCostMultiplier >= .92 && effects.castingCostMultiplier <= 1.18);
      assert.ok(effects.contentQuality >= -3 && effects.contentQuality <= 4);
      assert.ok(effects.wordOfMouth >= -3 && effects.wordOfMouth <= 5);
      assert.ok(effects.openingPower >= -5 && effects.openingPower <= 6);
      assert.ok(effects.retention >= -.02 && effects.retention <= .025);
      assert.ok(effects.starPowerMultiplier >= .68 && effects.starPowerMultiplier <= 1.18);
      assert.ok(effects.libraryMultiplier >= 1 && effects.libraryMultiplier <= 1.18);
      reports.push(report);
    }
    if (!comparison) {
      for (const style of coreStylesByGenre[genre]) {
        const plain = reports.find((report) => report.build.core?.id === style.id && report.build.alignedChoices >= 2 && report.build.connections.length === 0);
        const connected = reports.find((report) => report.build.core?.id === style.id && report.build.alignedChoices >= 2 && report.build.connections.length > 0);
        if (plain && connected) comparison = { plain, connected };
      }
    }
  }
  assert.ok(comparison);
  assert.notDeepEqual(comparison.connected.build.downstream, comparison.plain.build.downstream);
  assert.ok(comparison.connected.build.connections.every((connection) => comparison.connected.build.appliedEffects.some((effect) => effect.startsWith(`${connection.name}：`))));
  assert.ok(summarizeScriptDownstream(comparison.connected.build.downstream).some((line) => /成本|质量|口碑|开画|留存|评审|片库|群像/.test(line)));
  assert.ok(mostConnections >= 2, "multi-connection builds should exercise the merge caps");
});

test("build feedback follows the last changed answer and covers every visible change type", () => {
  const base = deriveScriptBuild({}, [], "犯罪悬疑");
  const core = coreStylesByGenre["犯罪悬疑"][0];
  const resonance = { ...base, core, alignedChoices: 1 };
  assert.match(describeBuildChange(base, resonance), /核心流派|共鸣 1\/2/);
  assert.match(describeBuildChange(resonance, { ...resonance, alignedChoices: 2 }), /共鸣 2\/2 已激活/);
  const connected = { ...resonance, connections: [scriptConnections[0]] };
  assert.match(describeBuildChange(resonance, connected), /连接新激活/);
  assert.match(describeBuildChange(connected, resonance), /连接失去/);
  const flawed = { ...resonance, unresolvedFlaws: ["伏笔缺口"] };
  assert.match(describeBuildChange(resonance, flawed), /新增缺陷/);
  assert.match(describeBuildChange(flawed, resonance), /缺陷不再存在/);
  const repaired = { ...resonance, repairedFlaws: ["伏笔缺口"] };
  assert.match(describeBuildChange(flawed, repaired), /缺陷修复/);
  assert.match(describeBuildChange(repaired, flawed), /缺陷重新暴露/);
  const conflicted = { ...resonance, conflicts: ["表达冲突"] };
  assert.match(describeBuildChange(resonance, conflicted), /表达冲突增加/);
  assert.match(describeBuildChange(conflicted, resonance), /表达冲突化解/);
});

test("every IP route inherits its source genre and legacy films archive the current genre", () => {
  assert.equal(resolveIpGenre(hitIpSource, "都市爱情"), "动作");
  assert.equal(resolveIpGenre({ ...hitIpSource, genre: undefined }, "都市爱情"), "都市爱情");
  assert.equal(resolveIpGenre(null, "犯罪悬疑"), "犯罪悬疑");
});

test("four studio identities each offer six bounded tradeoff policies and three opening choices", () => {
  assert.equal(studioPaths.length, 4);
  for (const path of studioPaths) {
    const policies = policiesForPath(path.id);
    assert.equal(policies.length, 6);
    assert.equal(defaultPoliciesForPath(path.id).length, 3);
    assert.ok(policies.every((policy) => policy.upside && policy.pressure));
  }
  assert.deepEqual([0, 25, 55, 90].map(strategyLevel), [1, 2, 3, 4]);
  const context = { budgetName: "大片级", genre: "科幻冒险", isIp: true, directorMatched: true, castAppeal: 90, hasRookie: false, signedCastCount: 1 };
  const commercial = resolveStudioStrategy("commercial", ["wide-release", "star-vehicle", "industrial-scale"], 90, [], context);
  assert.ok(commercial.openingPower > 0 && commercial.qualityBonus > 0);
  assert.ok(commercial.budgetCostMultiplier > 1 && commercial.talentCostMultiplier > 1 && commercial.retentionBonus < 0);
  assert.ok(commercial.openingPower <= 8 && commercial.qualityBonus <= 6);
  assert.ok(summarizeStrategyEffects("厂牌", commercial).some((line) => line.includes("预算") && line.includes("开画")) === false, "separate summaries keep production and market effects readable");
  assert.ok(summarizeStrategyEffects("厂牌", commercial).some((line) => line.includes("预算")));
  assert.ok(summarizeStrategyEffects("厂牌", commercial).some((line) => line.includes("开画")));
  const locked = resolveStudioStrategy("commercial", ["market-blitz"], 20, [], context);
  assert.equal(locked.genreHeatBonus, 0, "locked policies must not apply early");
});

test("genre specialization and market eras change rules without one permanent best answer", () => {
  const focusContext = { budgetName: "标准制作", genre: "犯罪悬疑", isIp: false, directorMatched: true, castAppeal: 76, hasRookie: false, signedCastCount: 0 };
  const focused = resolveStudioStrategy("genre", ["type-bible", "cult-audience", "cross-genre"], 30, ["犯罪悬疑", "科幻冒险"], focusContext);
  const outside = resolveStudioStrategy("genre", ["type-bible", "cult-audience", "cross-genre"], 30, ["都市爱情", "科幻冒险"], focusContext);
  assert.ok(focused.qualityBonus > outside.qualityBonus);
  assert.ok(focused.retentionBonus > outside.retentionBonus);
  assert.ok(outside.wordOfMouthBonus >= 0, "cross-genre experimentation offsets the base outside-focus penalty");
  assert.equal(marketEraForYear(3).name, "口碑回潮");
  assert.equal(upcomingMarketEra(2).name, "口碑回潮");
  const bubbleBig = resolveMarketEraEffects(6, { ...focusContext, budgetName: "大片级" });
  const bubbleSmall = resolveMarketEraEffects(6, { ...focusContext, budgetName: "小成本" });
  assert.ok(bubbleBig.openingPower > bubbleSmall.openingPower);
  assert.ok(bubbleBig.budgetCostMultiplier > bubbleSmall.budgetCostMultiplier);
  assert.ok(bubbleSmall.retentionBonus > 0);
});

test("persistent rivals announce deterministic projects and create visible same-genre pressure", () => {
  const plans = rivalPlansForYear(4);
  assert.deepEqual(plans, rivalPlansForYear(4));
  assert.equal(plans.length, 3);
  assert.equal(new Set(plans.map((plan) => plan.name)).size, 3);
  assert.deepEqual(plans.map((plan) => plan.pressure), [6, 4, 5]);
  assert.ok(plans.every((plan) => plan.genre && plan.title && plan.pressure > 0));
  assert.equal(rivalGenrePressure(4, "不存在的题材"), 0);
  assert.ok(rivalGenrePressure(4, plans[0].genre) >= plans[0].pressure);
});

test("production delays progressively close early release windows while preserving a fallback", () => {
  assert.deepEqual(availableReleaseSlotIds(-3), ["spring", "may", "summer", "national"]);
  assert.deepEqual(availableReleaseSlotIds(0), ["spring", "may", "summer", "national"]);
  assert.deepEqual(availableReleaseSlotIds(1), ["may", "summer", "national"]);
  assert.deepEqual(availableReleaseSlotIds(2), ["summer", "national"]);
  assert.deepEqual(availableReleaseSlotIds(3), ["summer", "national"]);
  assert.deepEqual(availableReleaseSlotIds(4), ["national"]);
  assert.equal(releaseSlotStatus("spring", 1).available, false);
  assert.equal(releaseSlotStatus("national", 99).available, true);
});

test("five-film seasons reward balanced long-term performance and keep rivals competitive", () => {
  let stats = emptySeasonStats(1);
  for (let year = 1; year <= 5; year += 1) {
    stats = addFilmToSeason(stats, { gross: 52000 + year * 7000, awards: year % 2, quality: 80 + year, breakEvenGross: 40000 });
  }
  assert.equal(stats.films, 5);
  const standings = buildSeasonStandings(stats);
  assert.equal(standings.length, 4);
  assert.equal(new Set(standings.map((entry) => entry.id)).size, 4);
  assert.ok(standings.every((entry) => entry.films === 5 && entry.score > 0));
  assert.ok(standings.some((entry) => entry.player));
  assert.ok(studioPathXpGain({ quality: 90, gross: 70000, breakEvenGross: 40000, awards: 2 }) > studioPathXpGain({ quality: 70, gross: 30000, breakEvenGross: 40000, awards: 0 }));
});

test("beginner feedback reveals one plain-language consequence only after commitment", () => {
  const base = deriveScriptBuild({}, [], "犯罪悬疑");
  const core = coreStylesByGenre["犯罪悬疑"][0];
  const chosenCore = { ...base, core };
  assert.equal(describeBeginnerBuildChange(base, chosenCore), "故事方向确定为「本格推理」，接下来用选择让它逐渐成型。");
  assert.match(describeBeginnerBuildChange(chosenCore, { ...chosenCore, activeEngines: [core.engine] }), /核心路线已经成型/);
  assert.match(describeBeginnerBuildChange(chosenCore, { ...chosenCore, unresolvedFlaws: ["伏笔缺口"] }), /后面仍有机会补救/);
  assert.doesNotMatch(describeBeginnerBuildChange(chosenCore, { ...chosenCore, alignedChoices: 1 }), /\+\d|成本|开画|评审/);
});

test("script questions advance sequentially and old partial saves cannot skip ahead", () => {
  const ids = ["q1", "q2", "q3", "q4", "q5", "q6"];
  assert.deepEqual(normalizeSequentialScriptProgress(ids, { q1: "a", q3: "c" }), { answers: { q1: "a" }, committedCount: 0 });
  assert.deepEqual(normalizeSequentialScriptProgress(ids, { q1: "a", q2: "b" }, 1), { answers: { q1: "a", q2: "b" }, committedCount: 1 });
  assert.deepEqual(normalizeSequentialScriptProgress(ids, Object.fromEntries(ids.map((id) => [id, "a"]))).committedCount, 5);
  assert.deepEqual([0, 1, 2].map((index) => scriptQuestionState(index, 1)), ["locked", "current", "upcoming"]);
});

test("editing an earlier answered card distinguishes lost recipes, removed risks and reexposed flaws", () => {
  const found = { lostConnection: false, removedRisk: false, reexposed: false, repaired: false };
  for (const genre of Object.keys(coreStylesByGenre)) {
    for (let year = 1; year <= 4; year += 1) {
      const questions = getScriptQuestions(genre, year);
      for (let combination = 0; combination < 243; combination += 1) {
        let cursor = combination;
        const answers = { [questions[0].id]: questions[0].options[0].id };
        for (const question of questions.slice(1)) {
          answers[question.id] = question.options[cursor % 3].id;
          cursor = Math.floor(cursor / 3);
        }
        const before = deriveScriptBuild(answers, questions, genre);
        for (const question of questions.slice(1)) {
          for (const option of question.options) {
            if (answers[question.id] === option.id) continue;
            const after = deriveScriptBuild({ ...answers, [question.id]: option.id }, questions, genre);
            const feedback = describeBuildChange(before, after);
            if (feedback.includes("连接失去")) found.lostConnection = true;
            if (feedback.includes("缺陷不再存在")) found.removedRisk = true;
            if (feedback.includes("缺陷重新暴露")) found.reexposed = true;
            if (feedback.includes("缺陷修复")) found.repaired = true;
          }
        }
        if (Object.values(found).every(Boolean)) break;
      }
      if (Object.values(found).every(Boolean)) break;
    }
    if (Object.values(found).every(Boolean)) break;
  }
  assert.deepEqual(found, { lostConnection: true, removedRisk: true, reexposed: true, repaired: true });
});

test("flaw repairs resolve only earlier narrative flaws and hints exclude active connections", () => {
  const coreOption = { id: "crime-deduction", profile: "core", keyword: "公平线索", connectionKey: "公平线索", alignment: ["crime-deduction"], routeFunction: "core", relation: "核心" };
  const repairOption = { id: "repair", profile: "story", keyword: "证据链", connectionKey: "严密因果", alignment: ["crime-deduction"], routeFunction: "reinforce", repairsFlaw: "伏笔缺口", relation: "补强" };
  const flawOption = { id: "flaw", profile: "risky", keyword: "身份反转", connectionKey: "强反转", alignment: [], routeFunction: "venture", addsFlaw: "伏笔缺口", relation: "冒险" };
  const coreQuestion = { id: "core", options: [coreOption] };
  const repairQuestion = { id: "repair-q", options: [repairOption] };
  const flawQuestion = { id: "flaw-q", options: [flawOption] };
  const answers = { core: coreOption.id, "repair-q": repairOption.id, "flaw-q": flawOption.id };
  const repairFirst = deriveScriptBuild(answers, [coreQuestion, repairQuestion, flawQuestion], "犯罪悬疑");
  assert.deepEqual(repairFirst.unresolvedFlaws, ["伏笔缺口"]);
  const flawFirst = deriveScriptBuild(answers, [coreQuestion, flawQuestion, repairQuestion], "犯罪悬疑");
  assert.deepEqual(flawFirst.unresolvedFlaws, []);
  assert.deepEqual(flawFirst.repairedFlaws, ["伏笔缺口"]);
  assert.ok(flawFirst.nextConnections.every((hint) => !flawFirst.connections.some((connection) => connection.name === hint.name) && hint.missingKeyword));
});

test("genre-specific keywords keep shared connection keys without repeating visible copy", () => {
  const balanced = (genre) => Array.from({ length: 12 }, (_, year) => getScriptQuestions(genre, year + 1)).flatMap((questions) => questions.flatMap((question) => question.options)).find((option) => option.profile === "balanced");
  const crime = balanced("犯罪悬疑");
  const love = balanced("都市爱情");
  const comedy = balanced("合家欢喜剧");
  assert.ok(crime && love && comedy);
  assert.equal(crime.connectionKey, "关系网络");
  assert.equal(love.connectionKey, "关系网络");
  assert.notEqual(crime.keyword, love.keyword);
  assert.notEqual(love.keyword, comedy.keyword);
});

test("ensemble casts keep two leads while offering three viable cost and coordination profiles", () => {
  assert.deepEqual(ensembleCastOptions.map((option) => option.id), ["lean", "veteran", "rookie"]);
  assert.equal(normalizeEnsembleCast(undefined), "lean");
  assert.equal(getScriptDownstream({}).ensemble, false);
  assert.equal(getScriptDownstream({}).budgetCostMultiplier, 1);
  const lean = resolveEnsembleCast("lean", 90, 80, 84, "工业水准");
  const veteran = resolveEnsembleCast("veteran", 90, 80, 84, "工业水准");
  const rookieWeak = resolveEnsembleCast("rookie", 90, 80, 79, "控本能手");
  const rookieCoach = resolveEnsembleCast("rookie", 90, 80, 79, "擅长新人");
  assert.equal(lean.option.cost, 0);
  assert.ok(veteran.option.cost > rookieCoach.option.cost);
  assert.ok(veteran.acting > lean.acting);
  assert.ok(rookieCoach.acting > rookieWeak.acting);
  assert.ok(rookieCoach.coordination > rookieWeak.coordination);
  assert.equal(lean.acting, Math.round((90 * .55 + 72 * .25 + 84 * .2) * 10) / 10);
  assert.ok(lean.ensembleEffectScale < rookieCoach.ensembleEffectScale);
  assert.ok(rookieCoach.ensembleEffectScale < veteran.ensembleEffectScale);
  assert.ok(lean.starPowerMultiplier > rookieCoach.starPowerMultiplier && rookieCoach.starPowerMultiplier > veteran.starPowerMultiplier);
  const ensembleCore = coreStylesByGenre["历史传记"].find((style) => style.id === "history-ensemble").downstream;
  const leanEffects = resolveEnsembleDownstream(ensembleCore, lean);
  const veteranEffects = resolveEnsembleDownstream(ensembleCore, veteran);
  const rookieEffects = resolveEnsembleDownstream(ensembleCore, rookieCoach);
  assert.ok(leanEffects.pictureBonus < rookieEffects.pictureBonus && rookieEffects.pictureBonus <= veteranEffects.pictureBonus);
  assert.ok(leanEffects.libraryMultiplier < rookieEffects.libraryMultiplier && rookieEffects.libraryMultiplier <= veteranEffects.libraryMultiplier);
  assert.ok(veteranEffects.qualityBonus > leanEffects.qualityBonus);
  assert.ok([leanEffects, veteranEffects, rookieEffects].every((effect) => effect.pictureBonus <= 6 && effect.libraryMultiplier <= 1.18));
});

test("activated build traits change content, release, awards and library economics", () => {
  const questions = getScriptQuestions("犯罪悬疑", 1);
  let report;
  for (let combination = 0; combination < 243 && !report; combination += 1) {
    let cursor = combination;
    const answers = { [questions[0].id]: "crime-social" };
    for (const question of questions.slice(1)) {
      answers[question.id] = question.options[cursor % 3].id;
      cursor = Math.floor(cursor / 3);
    }
    const candidate = evaluateScript(answers, questions.map((question) => question.id), "犯罪悬疑", 1);
    if (candidate.build?.activeEngines.includes("群像余震")) report = candidate;
  }
  assert.ok(report);
  const effects = getScriptDownstream(report);
  assert.equal(effects.ensemble, true);
  const baseContent = buildContentModel({ scriptScore: 82, directorSkill: 85, acting: 84, budgetQuality: 11, fit: 12, eventBonus: 0, chemistry: 80, morale: 0 });
  const traitContent = buildContentModel({ scriptScore: 82, directorSkill: 85, acting: 84, budgetQuality: 11, fit: 12, eventBonus: 0, chemistry: 80, morale: 0, scriptQualityBonus: effects.contentQuality, scriptWordOfMouthBonus: effects.wordOfMouth });
  assert.ok(traitContent.wordOfMouth > baseContent.wordOfMouth);
  const baseRelease = buildReleaseModel({ ...releaseBase, audienceScore: 8.4, wordOfMouth: 86, openingPower: 80 });
  const traitRelease = buildReleaseModel({ ...releaseBase, audienceScore: 8.4, wordOfMouth: 86, openingPower: 80, retentionBonus: .02 });
  assert.ok(traitRelease.gross > baseRelease.gross);
  const awardBase = judgeAwards({ year: 3, quality: 86, directorSkill: 86, fit: 12, acting: 86, chemistry: 84, audienceScore: 8.6 }, [{ title: "竞品", strength: 88 }]);
  const awardTrait = judgeAwards({ year: 3, quality: 86, directorSkill: 86, fit: 12, acting: 86, chemistry: 84, audienceScore: 8.6, pictureBonus: effects.awardPicture, directorBonus: effects.awardDirector }, [{ title: "竞品", strength: 88 }]);
  assert.ok(awardTrait[0].playerScore > awardBase[0].playerScore);
  assert.ok(calculateLibraryIncome([{ title: "群像片", gross: 70000, awards: 0, libraryMultiplier: effects.libraryMultiplier }]) > calculateLibraryIncome([{ title: "普通片", gross: 70000, awards: 0 }]));
});

test("script evaluation publishes dimensions, tags and the rebalanced final score", () => {
  const questions = getScriptQuestions("科幻冒险", 4);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.options[0].id]));
  const report = evaluateScript(answers, questions.map((question) => question.id), "科幻冒险", 8);
  for (const key of ["story", "character", "market", "originality"]) {
    const expected = Math.round(questions.reduce((sum, question) => sum + question.options[0].scores[key], 0) / 6 * 5);
    assert.equal(report[key], expected);
  }
  assert.equal(report.levelBonus, 3);
  assert.equal(report.score, Math.min(94, report.baseScore + 3));
  assert.ok(report.tags.length > 0);
  assert.ok(report.risks.length > 0);
});

test("annual goal offers are deterministic, varied and evaluate their real conditions", () => {
  const market = [
    { name: "悬疑", heat: 88 }, { name: "爱情", heat: 72 }, { name: "历史", heat: 55 },
  ];
  assert.deepEqual(generateAnnualGoals(4, market), generateAnnualGoals(4, market));
  const allKinds = new Set(Array.from({ length: 5 }, (_, index) => generateAnnualGoals(index + 1, market)).flat().map((goal) => goal.kind));
  assert.equal(allKinds.size, 5);
  const goals = generateAnnualGoals(1, market);
  assert.equal(goals.length, 3);
  const commercial = goals.find((goal) => goal.kind === "boxOffice");
  assert.ok(commercial);
  const completed = evaluateAnnualGoal(commercial, { gross: commercial.target + 1, awards: 0, totalCost: 12000, genre: "悬疑", castIds: [1, 2], audienceScore: 8, breakEvenGross: 40000 });
  assert.equal(completed.completed, true);
  assert.ok(completed.reward.xp > 0);
});

test("level-one script combinations match the intended grade distribution", () => {
  const genres = ["犯罪悬疑", "都市爱情", "科幻冒险", "动作战争", "合家欢喜剧", "历史传记"];
  const counts = { D: 0, C: 0, B: 0, A: 0, S: 0 };
  let total = 0;
  let minimum = 100;
  let maximum = 0;
  for (const genre of genres) {
    for (let year = 1; year <= 12; year += 1) {
      const questions = getScriptQuestions(genre, year);
      for (let combination = 0; combination < 729; combination += 1) {
        let cursor = combination;
        const answers = {};
        for (const question of questions) {
          answers[question.id] = question.options[cursor % 3].id;
          cursor = Math.floor(cursor / 3);
        }
        const report = evaluateScript(answers, questions.map((question) => question.id), genre, 1);
        counts[report.grade] += 1;
        minimum = Math.min(minimum, report.score);
        maximum = Math.max(maximum, report.score);
        total += 1;
      }
    }
  }
  const ratio = (grades) => grades.reduce((sum, grade) => sum + counts[grade], 0) / total;
  assert.ok(ratio(["C", "D"]) >= .18 && ratio(["C", "D"]) <= .25);
  assert.ok(ratio(["B"]) >= .45 && ratio(["B"]) <= .55);
  assert.ok(ratio(["A"]) >= .2 && ratio(["A"]) <= .3);
  assert.ok(ratio(["S"]) >= .035 && ratio(["S"]) <= .07);
  assert.equal(minimum, 55);
  assert.equal(maximum, 94);
});

test("script rewrite is a one-use improvement with a visible cost and tradeoff", () => {
  const questions = getScriptQuestions("犯罪悬疑", 2);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.options[1].id]));
  const report = evaluateScript(answers, questions.map((question) => question.id), "犯罪悬疑", 1);
  const rewrite = rewriteScript(report, "structure");
  assert.ok(rewrite.cost > 0);
  assert.ok(rewrite.report.story > report.story);
  assert.ok(rewrite.report.market < report.market);
  assert.equal(rewrite.report.rewritten, true);
  assert.ok(rewrite.report.build.events.at(-1).includes("改稿"));
  assert.notDeepEqual(rewrite.report.build.keywords, report.build.keywords);
  assert.throws(() => rewriteScript(rewrite.report, "commercial"), /只能进行一次/);
});

test("production contexts produce broad chain coverage without breaking tradeoff bands", () => {
  const genres = ["犯罪悬疑", "都市爱情", "科幻冒险", "动作战争", "合家欢喜剧", "历史传记"];
  const budgets = ["小成本", "标准制作", "大片级"];
  const chains = genres.flatMap((genre) => budgets.flatMap((budget) => Array.from({ length: 12 }, (_, yearIndex) => generateProductionChain([3, 8], yearIndex + 1, { genre, budget }))));
  assert.equal(new Set(chains.flat().map((event) => event.title)).size, 12);
  for (const genre of genres) {
    const annualSignatures = Array.from({ length: 12 }, (_, yearIndex) => generateProductionChain([3, 8], yearIndex + 1, { genre, budget: "标准制作" }).map((event) => event.title).join("|"));
    assert.ok(new Set(annualSignatures).size >= 8);
    assert.equal(new Set(annualSignatures.slice(0, 4)).size, 4);
  }
  const combinations = Array.from({ length: 8 }, (_, mask) => [0, 1, 2].map((index) => mask & (1 << index) ? "bold" : "safe"));
  for (const chain of chains) {
    assert.equal(chain.length, 3);
    const outcomes = combinations.map((choices) => ({ choices, ...resolveProductionChain(chain, choices) }));
    const allSafe = outcomes.find((outcome) => outcome.choices.every((choice) => choice === "safe"));
    const allBold = outcomes.find((outcome) => outcome.choices.every((choice) => choice === "bold"));
    assert.ok(allSafe.quality >= 2 && allSafe.quality <= 3);
    assert.equal(allSafe.cost, 0);
    assert.ok(allBold.quality > allSafe.quality);
    assert.ok(allBold.cost > 0 && allBold.scheduleRisk > 0);
    outcomes.filter((outcome) => outcome !== allSafe && outcome !== allBold).forEach((outcome) => assert.ok(outcome.quality >= 3 && outcome.quality <= 7));
    for (const first of outcomes) {
      for (const second of outcomes) {
        if (first === second) continue;
        const dominates = first.quality >= second.quality && first.market >= second.market && first.cost <= second.cost && first.scheduleRisk <= second.scheduleRisk
          && (first.quality > second.quality || first.market > second.market || first.cost < second.cost || first.scheduleRisk < second.scheduleRisk);
        assert.equal(dominates, false, `${first.choices.join("/")} must not strictly dominate ${second.choices.join("/")}`);
      }
    }
  }
});

test("only the latest production decision stays editable until the next stage locks it", () => {
  assert.deepEqual([0, 1, 2].map((index) => getProductionChoiceState([null, null, null], index)), ["editable", "waiting", "waiting"]);
  assert.deepEqual([0, 1, 2].map((index) => getProductionChoiceState(["safe", null, null], index)), ["editable", "editable", "waiting"]);
  assert.deepEqual([0, 1, 2].map((index) => getProductionChoiceState(["bold", "safe", null], index)), ["locked", "editable", "editable"]);
  assert.deepEqual([0, 1, 2].map((index) => getProductionChoiceState(["bold", "safe", "bold"], index)), ["locked", "locked", "editable"]);
  assert.equal(getProductionChoiceState(["safe", null, "bold"], 0), "locked", "later legacy decisions also lock earlier stages");
});

test("library income is capped, includes the just-finished film, and offsets but does not erase later operating pressure", () => {
  const empty = calculateLibraryIncome([]);
  const weak = calculateLibraryIncome([{ title: "小片", gross: 1000, awards: 0 }]);
  const steadyLibrary = [
    { title: "甲", gross: 70000, awards: 0 },
    { title: "乙", gross: 70000, awards: 0 },
    { title: "丙", gross: 70000, awards: 0 },
  ];
  const steadyIncome = calculateLibraryIncome(steadyLibrary);
  const topIncome = calculateLibraryIncome([
    { title: "传奇一", gross: 200000, awards: 5 },
    { title: "传奇二", gross: 180000, awards: 4 },
    { title: "传奇三", gross: 160000, awards: 3 },
    { title: "不会计入", gross: 999999, awards: 9 },
  ]);
  assert.equal(empty, 0);
  assert.equal(calculateLibraryIncome([{ title: "未发行", gross: -500, awards: 0 }]), 0);
  assert.ok(weak > 0 && weak < 20);
  assert.equal(steadyIncome, 1260);
  assert.equal(topIncome, 1800);
  for (let year = 5; year <= 10; year += 1) {
    const operatingCost = yearlyOperatingCost(3, 0, Math.min(1.32, 1 + (year - 1) * .025));
    assert.ok(steadyIncome >= operatingCost * .5);
    assert.ok(steadyIncome < operatingCost);
  }
  const cashWithoutLibrary = settleAnnualCompanyCash(10000, 500, 0, 600, 2200);
  const cashWithLibrary = settleAnnualCompanyCash(10000, 500, steadyIncome, 600, 2200);
  assert.equal(cashWithLibrary - cashWithoutLibrary, steadyIncome);
  const priorHistory = steadyLibrary.slice(0, 2);
  const justFinished = { title: "新片", gross: 80000, awards: 1 };
  assert.equal(calculateLibraryIncome([justFinished, ...priorHistory]), Math.round(80000 * .006 + 120) + 420 * 2);
});

test("award judging compares rivals, explains misses and caps wins at three", () => {
  const rivals = [{ title: "强敌甲", strength: 93 }, { title: "强敌乙", strength: 90 }];
  const weak = judgeAwards({ year: 1, quality: 70, directorSkill: 75, fit: 0, acting: 78, chemistry: 70, audienceScore: 7.1 }, rivals);
  const strongInput = { year: 4, quality: 90, directorSkill: 90, fit: 18, acting: 94, chemistry: 90, audienceScore: 8.9 };
  const eliteInput = { year: 1, quality: 99, directorSkill: 99, fit: 24, acting: 99, chemistry: 99, audienceScore: 9.9 };
  const strong = judgeAwards(strongInput, rivals);
  const elite = judgeAwards(eliteInput, rivals);
  assert.equal(weak.filter((award) => award.won).length, 0);
  assert.ok(weak.every((award) => award.note.includes("《")));
  assert.equal(awardWinCap(strongInput), 2);
  assert.equal(awardWinCap(eliteInput), 3);
  assert.ok(strong.filter((award) => award.won).length <= awardWinCap(strongInput));
  assert.ok(elite.filter((award) => award.won).length <= awardWinCap(eliteInput));
  assert.ok(elite.some((award) => award.nominated));
});
