import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the visual movie studio hub", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>造梦片场｜电影制作模拟器<\/title>/i);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/i);
  assert.match(html, /class="game-header"/);
  assert.match(html, /class="stage-progress"/);
  assert.match(html, /class="studio-hub"/);
  assert.match(html, /电影筹备室/);
  assert.match(html, /电影制作进度/);
  assert.match(html, /制片人/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the mobile shell separate from simulation systems", async () => {
  const [page, layout, mobileUi, css, economy, scriptEngine, scriptBuildSystem, gameSystems, talentSystem, competitionSystem, marketSystem, staticEntry] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/mobile-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/economy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/script-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/script-build-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/game-systems.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/talent-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/competition-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/market-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../static-site/main.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "\.\/components\/mobile-ui"/);
  assert.match(page, /from "\.\/economy"/);
  assert.match(page, /from "\.\/script-engine"/);
  assert.match(page, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.match(page, /演员评级额外提供开画/);
  assert.match(page, /作为银幕新面孔意外出圈/);
  assert.match(page, /导演调度受到质疑/);
  assert.match(page, /也救不了薄弱成片/);
  assert.match(page, /片场融资中心/);
  assert.match(page, /setCash\(\(value\) => value \+ annualInvestment\)/);
  assert.match(page, /investmentClaimedYear === year/);
  assert.match(page, /第二制片年起可正式引入外部投资/);
  assert.match(page, /每个制片年一次/);
  assert.match(page, /片方回款的10%/);
  assert.match(page, /投资方分成/);
  assert.doesNotMatch(page, /查看完整题库与所有答案分值/);
  assert.doesNotMatch(page, /className="option-score"/);
  assert.match(page, /核心共鸣 2\/2 · 已激活/);
  assert.match(page, /同向强化 \$\{scriptBuildPreview\.alignedChoices\} 次/);
  assert.match(page, /效果按 Q1 → Q6 的叙事顺序结算/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /连接失去|describeBuildChange/);
  assert.doesNotMatch(page, /可修复 ·/);
  assert.match(page, /选择配角班底/);
  assert.match(page, /核心主演 \/ 叙事锚点/);
  assert.ok(page.indexOf("ensemble-casting") < page.indexOf('<div className="talent-grid">{filteredActors'), "ensemble options must appear before the long actor grid");
  assert.doesNotMatch(page, /scriptEffects\.starPowerMultiplier \* ensemblePerformance\.starPowerMultiplier/);
  assert.match(css, /\.script-build-desk/);
  assert.match(css, /\.ensemble-casting button\.selected/);
  assert.match(css, /\.build-desk-grid b \{ color: inherit; font-size: 12px/);
  assert.match(css, /\.option-keyword em, \.option-keyword i, \.option-tradeoff em \{ position: static; color: #285d51; font-size: 10px/);
  assert.match(css, /\.ensemble-casting button small \{ color: #b4cdd1; font-size: 11px/);
  assert.match(css, /\.ensemble-casting > p\.ensemble-preview \{ color: #b9e5eb; font-size: 11px/);
  assert.match(scriptBuildSystem, /export const coreStylesByGenre/);
  assert.match(scriptBuildSystem, /export function resolveEnsembleCast/);
  assert.match(scriptBuildSystem, /export function summarizeScriptDownstream/);
  assert.match(page, /实际结算/);
  assert.doesNotMatch(staticEntry, /api\/script-score/);
  assert.match(page, /三段式片场决策/);
  assert.match(page, /年度制片委托/);
  assert.match(page, /金幕奖提名与获奖/);
  assert.match(page, /disabled=\{annualGoalLocked\}/);
  assert.match(page, /已选择 · 开始后锁定/);
  assert.match(page, /setAnnualGoalLocked\(true\); commitProjectCost\(currentBudgetCost, 1\)/);
  assert.match(page, /本片最多 \$\{result\.awardCap \?\? Math\.max\(2, result\.awards\.length\)\} 项/);
  assert.match(page, /档期风险影响/);
  assert.match(page, /片库版权与长尾收益/);
  assert.match(page, /近三部片库资产/);
  assert.match(page, /const nextHistory = result \?/);
  assert.match(page, /dream-studio-save-v1/);
  assert.match(page, /进入公司经营期/);
  assert.match(page, /确认交稿/);
  assert.match(page, /确认评分，前往选角/);
  assert.match(css, /filming-clapperboard-mobile-v1\.webp/);
  assert.match(css, /premiere-cinema-full-mobile-v2\.webp/);
  assert.match(page, /BOX OFFICE TERMINAL/);
  assert.match(page, /SOCIAL PULSE/);
  assert.match(page, /PROJECT CONTROL/);
  assert.match(page, /CASTING DATABASE/);
  assert.match(page, /《\$\{title\}》——\$\{genre\.name\}，剧本评分/);
  assert.match(page, /commitProjectCost\(currentBudgetCost, 1\)/);
  assert.match(page, /commitProjectCost\(totalBeforeRelease, 3\)/);
  assert.match(page, /setCash\(\(value\) => Math\.max\(0, value - outstandingProjectCost/);
  assert.match(page, /boxOfficeSettlementTarget/);
  assert.match(page, /judgeAwards/);
  assert.match(page, /awards\.includes\("最佳表演"\)/);
  assert.match(page, /setBoxOfficeCashCredited\(target\)/);
  assert.match(page, /CONTRACT EXPIRY ALERT/);
  assert.match(page, /现在处理/);
  assert.match(page, /isMatureMarketEligible/);
  assert.match(page, /person\.id >= 100 \? "rookie" : "actor"/);
  assert.match(page, /TALENT OPERATIONS TERMINAL/);
  assert.match(page, /CAPITAL ACCESS TERMINAL/);
  assert.match(css, /@keyframes feed-rise/);
  assert.match(css, /premiere-live-screen \.awards-row/);
  assert.match(page, /directors-anime-atlas-v1\.webp/);
  assert.match(page, /male-actors-anime-atlas-v1\.webp/);
  assert.match(page, /female-actors-anime-atlas-v1\.webp/);
  assert.match(page, /rookies-anime-atlas-v2\.webp/);
  assert.match(page, /潜力新人/);
  assert.match(page, /实力新锐/);
  assert.match(page, /天赋新星/);
  assert.doesNotMatch(page, /SSR · 红框|SR · 金框|75% 金框|25% 红框/);
  assert.match(page, /mobileSceneAssets/);
  assert.match(page, /动漫头像/);
  assert.match(page, /industry-news-avatar/);
  assert.doesNotMatch(page, /fetch\("\/api\/script-score"/);
  assert.match(page, /import\.meta\.env\.BASE_URL/);
  assert.match(css, /\.talent-card\.selected \.avatar, \.avatar\.large \{ background-color:/);
  assert.match(css, /\.operation-casting \.talent-card\.selected \.avatar \{ background-color:/);
  assert.match(page, /PRODUCTION MONITOR/);
  assert.match(page, /开机 → 中期 → 后期/);
  assert.match(page, /电影海报已移交发行团队/);
  assert.match(page, /旗下艺人内部价/);
  assert.match(page, /解散公司并建立全新存档/);
  assert.match(page, /评分驱动票房/);
  assert.match(page, /只强化开画，等级与声望影响会逐日衰减/);
  assert.match(page, /const \[firstId, secondId\] = \[first\.id, second\.id\]\.sort/);
  assert.match(page, /firstId \* 17 \+ secondId \* 11/);
  assert.match(page, /投入越高边际收益越低/);
  assert.match(page, /年度艺人舆情与市场变动/);
  assert.match(page, /同期竞品/);
  assert.match(page, /行业成本指数/);
  assert.match(page, /年度电影市场重新洗牌/);
  assert.match(page, /本年度仅展示有档期的导演/);
  assert.match(page, /新人出圈/);
  assert.match(page, /评级变动/);
  assert.match(page, /解锁.*影后.*影帝|解锁.*影帝/);
  assert.match(page, /演员评级额外提供开画/);
  assert.match(page, /最终观众评分最高只能达到6\.5/);
  assert.match(mobileUi, /export function GameHeader/);
  assert.match(mobileUi, /制片第 \{year\} 年/);
  assert.match(mobileUi, /export function StageProgress/);
  assert.match(mobileUi, /export function ActionBar/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.room-operation-shell \.project-board \{ width: calc\(100% - 24px\); margin: 12px auto;/);
  assert.match(economy, /buildReleaseModel/);
  assert.match(economy, /export function projectPaymentDelta/);
  assert.match(economy, /export function boxOfficeSettlementTarget/);
  assert.match(economy, /export function determineAwards/);
  assert.match(scriptEngine, /getScriptQuestions/);
  assert.match(scriptEngine, /getScriptQuestionBank/);
  assert.match(scriptEngine, /buildExpansionQuestions/);
  assert.match(scriptEngine, /export function rewriteScript/);
  assert.match(gameSystems, /export function generateAnnualGoals/);
  assert.match(gameSystems, /export function generateProductionChain/);
  assert.match(gameSystems, /export function judgeAwards/);
  assert.match(gameSystems, /export function awardWinCap/);
  assert.match(gameSystems, /export function calculateLibraryIncome/);
  assert.match(economy, /export function scheduleRiskMultiplier/);
  assert.match(economy, /export function yearlyOperatingCost/);
  assert.match(economy, /export function settleAnnualCompanyCash/);
  assert.match(talentSystem, /export function agencyCapacity/);
  assert.match(talentSystem, /export function matureContractQuote/);
  assert.match(talentSystem, /export function trainingGain/);
  assert.match(talentSystem, /export function generateTalentNews/);
  assert.match(talentSystem, /export function retirementAge/);
  assert.match(talentSystem, /export function rookieExposureAppealGain/);
  assert.match(talentSystem, /export function rookiePerformanceFee/);
  assert.match(talentSystem, /export function rookieCareerSalary/);
  assert.match(talentSystem, /export function talentRenewalQuote/);
  assert.match(talentSystem, /export function uniqueGenres/);
  assert.match(talentSystem, /export function actorTier/);
  assert.match(talentSystem, /export function isMatureMarketEligible/);
  assert.match(talentSystem, /export function tierOpeningBonus/);
  assert.match(talentSystem, /profile\.tier === "SS"/);
  assert.match(talentSystem, /export const rookieCandidates/);
  assert.match(competitionSystem, /export function generateCompetitors/);
  assert.match(competitionSystem, /export function calculateCompetitionPressure/);
  assert.match(marketSystem, /export function evolveGenreMarket/);
  assert.match(marketSystem, /export function evolveDirectorMarket/);
});
