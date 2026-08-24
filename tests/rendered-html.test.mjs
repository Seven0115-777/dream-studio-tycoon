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

test("server-renders the mobile movie studio game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>造梦片场｜电影制作模拟器<\/title>/i);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/i);
  assert.match(html, /class="game-header"/);
  assert.match(html, /class="stage-progress"/);
  assert.match(html, /class="action-bar"/);
  assert.match(html, /电影制作进度/);
  assert.match(html, /制片人/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the mobile shell separate from simulation systems", async () => {
  const [page, layout, mobileUi, css, economy, scriptEngine, talentSystem, competitionSystem, marketSystem] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/mobile-ui.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/economy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/script-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/talent-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/competition-system.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/market-system.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "\.\/components\/mobile-ui"/);
  assert.match(page, /from "\.\/economy"/);
  assert.match(page, /from "\.\/script-engine"/);
  assert.match(page, /window\.scrollTo\(\{ top: 0, left: 0, behavior: "auto" \}\)/);
  assert.match(page, /演员评级额外提供开画/);
  assert.match(page, /作为银幕新面孔意外出圈/);
  assert.match(page, /导演调度受到质疑/);
  assert.match(page, /也救不了薄弱成片/);
  assert.match(page, /年度拉投资广告位/);
  assert.match(page, /setCash\(\(value\) => value \+ annualInvestment\)/);
  assert.match(page, /investmentClaimedYear === year/);
  assert.match(page, /融资渠道将在第二年开放/);
  assert.match(page, /额度每两个制片年提高/);
  assert.match(page, /投资方抽取片方分账10%/);
  assert.match(page, /投资方分成/);
  assert.doesNotMatch(page, /查看完整题库与所有答案分值/);
  assert.doesNotMatch(page, /className="option-score"/);
  assert.match(page, /结算权重 \+20 XP \/ \+12 声望/);
  assert.match(page, /dream-studio-save-v1/);
  assert.match(page, /进入公司经营期/);
  assert.match(page, /旗下艺人内部价/);
  assert.match(page, /解散公司并建立全新存档/);
  assert.match(page, /评分驱动票房/);
  assert.match(page, /只强化开画，等级与声望影响会逐日衰减/);
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
  assert.match(mobileUi, /export function StageProgress/);
  assert.match(mobileUi, /export function ActionBar/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(economy, /buildReleaseModel/);
  assert.match(scriptEngine, /getScriptQuestions/);
  assert.match(scriptEngine, /getScriptQuestionBank/);
  assert.match(scriptEngine, /buildExpansionQuestions/);
  assert.match(talentSystem, /export function agencyCapacity/);
  assert.match(talentSystem, /export function matureContractQuote/);
  assert.match(talentSystem, /export function trainingGain/);
  assert.match(talentSystem, /export function generateTalentNews/);
  assert.match(talentSystem, /export function retirementAge/);
  assert.match(talentSystem, /export function rookieExposureAppealGain/);
  assert.match(talentSystem, /export function rookiePerformanceFee/);
  assert.match(talentSystem, /export function talentRenewalQuote/);
  assert.match(talentSystem, /export function uniqueGenres/);
  assert.match(talentSystem, /export function actorTier/);
  assert.match(talentSystem, /export function tierOpeningBonus/);
  assert.match(talentSystem, /profile\.tier === "SS"/);
  assert.match(talentSystem, /export const rookieCandidates/);
  assert.match(competitionSystem, /export function generateCompetitors/);
  assert.match(competitionSystem, /export function calculateCompetitionPressure/);
  assert.match(marketSystem, /export function evolveGenreMarket/);
  assert.match(marketSystem, /export function evolveDirectorMarket/);
});
