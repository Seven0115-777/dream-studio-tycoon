import assert from "node:assert/strict";
import test from "node:test";
import { calculateCompetitionPressure, generateCompetitors } from "../app/competition-system.ts";
import { annualInvestmentAmount, boxOfficeSettlementTarget, buildAudienceScoreCurve, buildContentModel, buildReleaseModel, calculateCareerRewards, determineAwards, investorRevenueShare, projectPaymentDelta, studioReachMultiplier } from "../app/economy.ts";
import { evolveDirectorMarket, evolveGenreMarket } from "../app/market-system.ts";
import { evaluateScript, getScriptQuestionBank, getScriptQuestions } from "../app/script-engine.ts";
import { actorTier, ageAppealDecline, agencyCapacity, buildRookieMarket, currentActorAge, generateTalentNews, isMatureMarketEligible, matureContractQuote, retirementAge, rookieCandidates, rookieCareerSalary, rookieExposureAppealGain, rookiePerformanceFee, talentMarketRoll, talentRenewalQuote, tierOpeningBonus, tierScriptThreshold, trainingCapacity, trainingGain, uniqueGenres } from "../app/talent-system.ts";

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

test("every movie genre has 18 new questions and rotates a six-question paper", () => {
  const bank = getScriptQuestionBank();
  assert.equal(bank.common.length, 6);
  assert.equal(Object.keys(bank.genres).length, 6);
  Object.values(bank.genres).forEach((questions) => assert.equal(questions.length, 23));
  const allQuestions = [...bank.common, ...Object.values(bank.genres).flat()];
  assert.equal(allQuestions.length, 144);
  assert.equal(new Set(allQuestions.map((question) => question.id)).size, 144);
  assert.ok(allQuestions.every((question) => question.options.length === 3));
  assert.notDeepEqual(getScriptQuestions("犯罪悬疑", 2).map((question) => question.id), getScriptQuestions("犯罪悬疑", 3).map((question) => question.id));
});

test("published script scoring formula matches the evaluator", () => {
  const questions = getScriptQuestions("科幻冒险", 4);
  const answers = Object.fromEntries(questions.map((question) => [question.id, question.options[0].id]));
  const report = evaluateScript(answers, questions.map((question) => question.id), "科幻冒险", 8);
  for (const key of ["story", "character", "market", "originality"]) {
    const expected = Math.round(questions.reduce((sum, question) => sum + question.options[0].scores[key], 0) / 6 * 5);
    assert.equal(report[key], expected);
  }
  assert.equal(report.levelBonus, 3);
  assert.equal(report.score, Math.min(98, report.baseScore + 3));
});
