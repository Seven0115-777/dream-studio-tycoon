"use client";

import { useMemo, useState } from "react";

type Genre = { name: string; icon: string; heat: number; color: string };
type Director = { id: number; name: string; avatar: string; skill: number; appeal: number; fee: number; genres: string[]; trait: string };
type Actor = { id: number; name: string; avatar: string; acting: number; appeal: number; fee: number; genres: string[]; tag: string };
type Result = { quality: number; gross: number; profit: number; score: number; audience: number; days: number[]; awards: string[] };

const genres: Genre[] = [
  { name: "犯罪悬疑", icon: "⌕", heat: 86, color: "#de542b" },
  { name: "都市爱情", icon: "♡", heat: 72, color: "#d97793" },
  { name: "科幻冒险", icon: "✦", heat: 91, color: "#367f89" },
  { name: "动作战争", icon: "⚑", heat: 82, color: "#936137" },
  { name: "合家欢喜剧", icon: "☺", heat: 77, color: "#da9a2b" },
  { name: "历史传记", icon: "◆", heat: 64, color: "#665890" },
];

const budgets = [
  { name: "小成本", value: 1500, quality: 4, label: "¥1,500万" },
  { name: "标准制作", value: 3500, quality: 11, label: "¥3,500万" },
  { name: "大片级", value: 6500, quality: 19, label: "¥6,500万" },
];

const directors: Director[] = [
  { id: 1, name: "顾长风", avatar: "顾", skill: 91, appeal: 76, fee: 900, genres: ["犯罪悬疑", "历史传记"], trait: "作者表达" },
  { id: 2, name: "林小满", avatar: "林", skill: 84, appeal: 88, fee: 780, genres: ["都市爱情", "合家欢喜剧"], trait: "观众缘佳" },
  { id: 3, name: "陆之航", avatar: "陆", skill: 87, appeal: 82, fee: 850, genres: ["科幻冒险", "动作战争"], trait: "工业水准" },
  { id: 4, name: "谢闻笙", avatar: "谢", skill: 79, appeal: 69, fee: 520, genres: ["犯罪悬疑", "都市爱情"], trait: "擅长新人" },
  { id: 5, name: "郑北辰", avatar: "郑", skill: 73, appeal: 64, fee: 380, genres: ["动作战争", "合家欢喜剧"], trait: "控本能手" },
  { id: 6, name: "程未央", avatar: "程", skill: 93, appeal: 71, fee: 1100, genres: ["历史传记", "科幻冒险"], trait: "奖项常客" },
];

const actors: Actor[] = [
  { id: 1, name: "周既白", avatar: "周", acting: 92, appeal: 86, fee: 950, genres: ["犯罪悬疑", "历史传记"], tag: "实力派" },
  { id: 2, name: "苏晚晴", avatar: "苏", acting: 88, appeal: 91, fee: 980, genres: ["都市爱情", "犯罪悬疑"], tag: "一线女星" },
  { id: 3, name: "江澈", avatar: "江", acting: 79, appeal: 94, fee: 900, genres: ["动作战争", "都市爱情"], tag: "顶流" },
  { id: 4, name: "沈青禾", avatar: "沈", acting: 90, appeal: 74, fee: 620, genres: ["历史传记", "都市爱情"], tag: "学院派" },
  { id: 5, name: "韩野", avatar: "韩", acting: 82, appeal: 78, fee: 560, genres: ["科幻冒险", "动作战争"], tag: "动作演员" },
  { id: 6, name: "乔乐乐", avatar: "乔", acting: 75, appeal: 82, fee: 420, genres: ["合家欢喜剧", "都市爱情"], tag: "喜剧新星" },
  { id: 7, name: "许知微", avatar: "许", acting: 86, appeal: 68, fee: 470, genres: ["犯罪悬疑", "科幻冒险"], tag: "潜力新人" },
  { id: 8, name: "唐一鸣", avatar: "唐", acting: 72, appeal: 76, fee: 320, genres: ["合家欢喜剧", "动作战争"], tag: "综艺红人" },
];

const slots = [
  { id: "spring", name: "春节档", date: "大年初一", boost: 1.28, competition: "激烈", note: "观影需求旺盛，喜剧与大片加成" },
  { id: "may", name: "五一档", date: "5月1日", boost: 1.08, competition: "适中", note: "短假期，人群覆盖均衡" },
  { id: "summer", name: "暑期档", date: "7月18日", boost: 1.18, competition: "较高", note: "年轻观众活跃，类型片强势" },
  { id: "national", name: "国庆档", date: "10月1日", boost: 1.14, competition: "较高", note: "主流观众集中，口碑效应明显" },
];

const marketing = [
  { name: "口碑点映", value: 300, boost: 1.03 },
  { name: "全网宣发", value: 800, boost: 1.12 },
  { name: "现象级攻势", value: 1500, boost: 1.22 },
];

const stageLabels = ["项目企划", "组建班底", "拍摄制作", "定档发行", "市场检验"];

function money(value: number) {
  return value >= 10000 ? `${(value / 10000).toFixed(2)}亿` : `${Math.round(value).toLocaleString("zh-CN")}万`;
}

export default function Home() {
  const [stage, setStage] = useState(0);
  const [year, setYear] = useState(1);
  const [cash, setCash] = useState(12000);
  const [title, setTitle] = useState("雾港来信");
  const [genre, setGenre] = useState(genres[0]);
  const [budget, setBudget] = useState(budgets[1]);
  const [director, setDirector] = useState<Director | null>(null);
  const [cast, setCast] = useState<Actor[]>([]);
  const [eventChoice, setEventChoice] = useState<"safe" | "bold" | null>(null);
  const [slot, setSlot] = useState(slots[2]);
  const [promo, setPromo] = useState(marketing[1]);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<{ title: string; gross: number; awards: number }[]>([]);

  const talentCost = (director?.fee ?? 0) + cast.reduce((sum, item) => sum + item.fee, 0);
  const totalBeforeRelease = budget.value + talentCost;
  const totalCost = totalBeforeRelease + promo.value;

  const fit = useMemo(() => {
    let score = director?.genres.includes(genre.name) ? 12 : 0;
    cast.forEach((actor) => { if (actor.genres.includes(genre.name)) score += 6; });
    return score;
  }, [director, cast, genre]);

  function toggleActor(actor: Actor) {
    setCast((current) => current.some((item) => item.id === actor.id)
      ? current.filter((item) => item.id !== actor.id)
      : current.length < 2 ? [...current, actor] : [current[1], actor]);
  }

  function simulate() {
    if (!director || cast.length !== 2) return;
    const acting = cast.reduce((sum, item) => sum + item.acting, 0) / cast.length;
    const appeal = (director.appeal + cast.reduce((sum, item) => sum + item.appeal, 0)) / 3;
    const eventBonus = eventChoice === "bold" ? 8 : 3;
    const variation = Math.floor(Math.random() * 9) - 3;
    const quality = Math.min(99, Math.round(22 + director.skill * .28 + acting * .24 + budget.quality + fit * .42 + eventBonus + variation));
    const genreSlotBonus = (slot.id === "spring" && genre.name === "合家欢喜剧") || (slot.id === "summer" && genre.name === "科幻冒险") ? 1.12 : 1;
    const rawGross = (quality * 72 + appeal * 41 + genre.heat * 26) * slot.boost * promo.boost * genreSlotBonus;
    const gross = Math.round(rawGross * (.91 + Math.random() * .19));
    const profit = Math.round(gross * .39 - totalCost);
    const score = Math.min(9.8, Math.max(5.2, quality / 10 + (Math.random() * .8 - .35)));
    const audience = Math.round(gross * 10000 / 42);
    const weights = [0.14, 0.17, 0.16, 0.15, 0.14, 0.13, 0.11];
    const days = weights.map((weight, index) => Math.round(gross * weight * (index === 1 ? 1.05 : 1)));
    const awards: string[] = [];
    if (quality >= 88) awards.push("年度最佳影片");
    if (director.skill + fit >= 101) awards.push("最佳导演");
    if (acting >= 88) awards.push("最佳表演");
    if (score >= 8.6) awards.push("观众选择奖");
    setResult({ quality, gross, profit, score: Number(score.toFixed(1)), audience, days, awards });
    setCash(Math.max(0, Math.round(cash - totalCost + gross * .39)));
    setStage(4);
  }

  function nextYear() {
    if (result) setHistory((items) => [{ title, gross: result.gross, awards: result.awards.length }, ...items].slice(0, 3));
    setYear((value) => value + 1);
    setTitle("未命名计划");
    setDirector(null);
    setCast([]);
    setEventChoice(null);
    setResult(null);
    setStage(0);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setStage(0)} aria-label="返回项目企划">
          <span className="brand-mark">片</span><span>造梦片场</span><small>STUDIO TYCOON</small>
        </button>
        <div className="studio-stats"><span>星火影业 · 第 {year} 年</span><b>可用资金 ¥{money(cash)}</b><span className="reputation">声望 {184 + history.length * 82}</span></div>
      </header>

      <div className="workspace">
        <aside className="side-rail">
          <p className="eyebrow">制作流程</p>
          <ol className="steps">
            {stageLabels.map((label, index) => (
              <li key={label} className={index === stage ? "active" : index < stage ? "done" : ""}>
                <i>{index < stage ? "✓" : `0${index + 1}`}</i><span>{label}<small>{["题材与规模", "导演与演员", "质量与事件", "宣发与竞争", "票房与奖项"][index]}</small></span>
              </li>
            ))}
          </ol>
          <div className="company-card"><span>公司声望</span><strong>{history.length ? "上升期厂牌" : "新锐厂牌"}</strong><div className="meter"><i style={{ width: `${34 + history.length * 20}%` }} /></div><small>{history.length ? "市场正在关注你的下一部作品" : "用第一部作品证明自己"}</small></div>
        </aside>

        <section className="project-board">
          <div className="mobile-progress"><span style={{ width: `${(stage + 1) * 20}%` }} /></div>
          {stage === 0 && (
            <>
              <PageHead code={`PROJECT 00${year}`} title="下一部电影，" accent="由你决定。" sub="从一个好题材开始，组建班底，把它送上大银幕。" stamp="企划中" />
              <SectionTitle number="1" title="片名与电影题材" note="市场热度会随档期与年份变化" />
              <label className="title-input"><span>项目片名</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={12} /></label>
              <div className="genre-grid">
                {genres.map((item) => <button key={item.name} className={`genre-card ${genre.name === item.name ? "selected" : ""}`} onClick={() => setGenre(item)} aria-pressed={genre.name === item.name}>
                  <span className="genre-icon" style={{ background: genre.name === item.name ? item.color : undefined }}>{item.icon}</span><strong>{item.name}</strong><small>市场热度</small><div className="heat-row"><div className="heat"><i style={{ width: `${item.heat}%`, background: item.color }} /></div><b>{item.heat}</b></div>{genre.name === item.name && <span className="picked">已选择</span>}
                </button>)}
              </div>
              <SectionTitle number="2" title="制作规模" note={`公司当前可用资金 ¥${money(cash)}`} />
              <div className="budget-choice">{budgets.map((item) => <button key={item.name} className={budget.name === item.name ? "selected" : ""} onClick={() => setBudget(item)}>{item.name}<small>{item.label}</small></button>)}</div>
              <ActionBar label={`${title || "未命名"} · ${genre.name}`} detail={`制作预算 ¥${money(budget.value)}`} button="进入人才数据库" disabled={!title.trim() || budget.value > cash} onClick={() => setStage(1)} />
            </>
          )}

          {stage === 1 && (
            <>
              <PageHead code="CAST & CREW" title="找到这部电影的" accent="灵魂人物。" sub="人才的能力、号召力和题材适配都会影响最终成绩。" stamp="组队中" />
              <SectionTitle number="1" title="选择导演" note="点击卡片签约 1 位导演" />
              <div className="talent-grid directors">{directors.map((item) => <TalentCard key={item.id} person={item} selected={director?.id === item.id} onClick={() => setDirector(item)} />)}</div>
              <SectionTitle number="2" title="选择主演" note={`已选择 ${cast.length}/2 · 选择新演员会替换最早人选`} />
              <div className="talent-grid">{actors.map((item) => <TalentCard key={item.id} person={item} selected={cast.some((actor) => actor.id === item.id)} onClick={() => toggleActor(item)} />)}</div>
              <ActionBar label={director ? `${director.name} / ${cast.map((item) => item.name).join("、") || "待选主演"}` : "尚未选择导演"} detail={`主创片酬 ¥${money(talentCost)} · 题材适配 +${fit}`} button="开机拍摄" disabled={!director || cast.length !== 2 || totalBeforeRelease > cash} onClick={() => setStage(2)} back={() => setStage(0)} />
            </>
          )}

          {stage === 2 && (
            <>
              <PageHead code="NOW FILMING" title={`《${title}》`} accent="正式开机。" sub={`${director?.name}执导，${cast.map((item) => item.name).join("、")}领衔主演。`} stamp="拍摄中" />
              <div className="production-overview">
                <div className="poster-card"><span>{genre.icon}</span><small>星火影业 出品</small><h2>{title}</h2><p>{genre.name}</p></div>
                <div className="production-stats"><h3>制作状态</h3><Metric label="题材适配" value={Math.min(100, 64 + fit)} /><Metric label="班底实力" value={Math.round(((director?.skill ?? 0) + cast.reduce((sum, item) => sum + item.acting, 0) / 2) / 2)} /><Metric label="预算保障" value={budget.name === "大片级" ? 94 : budget.name === "标准制作" ? 78 : 61} /><div className="crew-line"><span>导演 <b>{director?.name}</b></span><span>主演 <b>{cast.map((item) => item.name).join(" / ")}</b></span></div></div>
              </div>
              <SectionTitle number="!" title="片场突发事件" note="你的决定会影响成片质量" />
              <div className="event-card"><div><b>导演提出重拍结局</b><p>试映反馈认为当前结局太保守。导演希望追加两周拍摄，用更大胆的开放式结局收尾。</p></div><div className="event-options"><button className={eventChoice === "safe" ? "selected" : ""} onClick={() => setEventChoice("safe")}><b>按原计划完成</b><small>稳定交片 · 质量 +3</small></button><button className={eventChoice === "bold" ? "selected" : ""} onClick={() => setEventChoice("bold")}><b>支持导演重拍</b><small>承担风险 · 质量 +8</small></button></div></div>
              <ActionBar label={`${budget.name} · ${genre.name}`} detail={`已投入 ¥${money(totalBeforeRelease)}`} button="完成制作并送审" disabled={!eventChoice} onClick={() => setStage(3)} back={() => setStage(1)} />
            </>
          )}

          {stage === 3 && (
            <>
              <PageHead code="RELEASE PLAN" title="好电影，还需要一个" accent="好时机。" sub="选择上映档期和宣发规模，市场会给出最终答案。" stamp="待定档" />
              <SectionTitle number="1" title="选择上映档期" note="热档期拥有更高上限，也意味着更多强敌" />
              <div className="slot-grid">{slots.map((item) => <button key={item.id} className={slot.id === item.id ? "selected" : ""} onClick={() => setSlot(item)}><span>{item.date}</span><strong>{item.name}</strong><small>{item.note}</small><i>竞争：{item.competition}</i></button>)}</div>
              <SectionTitle number="2" title="制定宣发计划" note="宣发成本将在上映前支付" />
              <div className="marketing-grid">{marketing.map((item) => <button key={item.name} className={promo.name === item.name ? "selected" : ""} onClick={() => setPromo(item)}><strong>{item.name}</strong><span>¥{money(item.value)}</span><small>市场触达 ×{item.boost.toFixed(2)}</small></button>)}</div>
              <div className="forecast"><span>行业预测</span><b>{genre.heat >= 85 ? "热度领先" : "稳健开局"}</b><p>题材热度 {genre.heat} · 档期系数 ×{slot.boost} · 主创适配 +{fit}</p></div>
              <ActionBar label={`${slot.name} · ${promo.name}`} detail={`总投资 ¥${money(totalCost)}`} button="全国上映，揭晓票房" disabled={totalCost > cash} onClick={simulate} back={() => setStage(2)} />
            </>
          )}

          {stage === 4 && result && (
            <>
              <PageHead code={`YEAR ${year} FINALE`} title={`《${title}》`} accent="市场成绩单" sub={`${slot.name}上映 · ${genre.name} · ${director?.name}执导`} stamp={result.profit >= 0 ? "盈利" : "失利"} />
              <div className="result-hero"><div><span>累计总票房</span><strong>¥{money(result.gross)}</strong><p className={result.profit >= 0 ? "positive" : "negative"}>项目{result.profit >= 0 ? "盈利" : "亏损"} ¥{money(Math.abs(result.profit))}</p></div><div className="score-seal"><b>{result.score}</b><span>观众评分</span></div></div>
              <div className="result-grid"><ResultStat label="成片质量" value={`${result.quality}`} unit="/100" /><ResultStat label="观影人次" value={`${(result.audience / 10000).toFixed(1)}`} unit="万人" /><ResultStat label="投资回报" value={`${result.profit >= 0 ? "+" : ""}${Math.round(result.profit / totalCost * 100)}`} unit="%" /><ResultStat label="公司余额" value={`¥${money(cash)}`} unit="" /></div>
              <SectionTitle number="票" title="上映首周走势" note="单位：万元" />
              <div className="box-office-chart">{result.days.map((value, index) => <div key={index}><b>{money(value)}</b><span style={{ height: `${32 + value / Math.max(...result.days) * 100}px` }} /><small>第{index + 1}天</small></div>)}</div>
              <SectionTitle number="奖" title="年度电影荣誉" note={result.awards.length ? "评审团已经给出结果" : "继续积累作品与行业声望"} />
              <div className="awards-row">{result.awards.length ? result.awards.map((award) => <div key={award}><span>★</span><b>{award}</b><small>第 {year} 届金幕奖</small></div>) : <div className="no-award"><span>—</span><b>本届惜未获奖</b><small>质量达到 88 或形成突出主创优势可冲击奖项</small></div>}</div>
              <div className="year-end"><div><span>年度结算完成</span><b>{result.profit >= 0 ? "一次漂亮的市场亮相。" : "市场不总是温柔，但经验已经留下。"}</b><small>下一年度市场热度与人才库将重新洗牌</small></div><button onClick={nextYear}>进入第 {year + 1} 年 <i>→</i></button></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function PageHead({ code, title, accent, sub, stamp }: { code: string; title: string; accent: string; sub: string; stamp: string }) {
  return <div className="board-heading"><div><p className="eyebrow accent">{code}</p><h1>{title}<em>{accent}</em></h1><p>{sub}</p></div><div className="draft-stamp">{stamp}<br /><b>SPARK</b></div></div>;
}

function SectionTitle({ number, title, note }: { number: string; title: string; note: string }) {
  return <div className="section-title"><div><span>{number}</span><h2>{title}</h2></div><p>{note}</p></div>;
}

function ActionBar({ label, detail, button, disabled, onClick, back }: { label: string; detail: string; button: string; disabled: boolean; onClick: () => void; back?: () => void }) {
  return <div className="action-bar">{back && <button className="back-button" onClick={back}>← 返回</button>}<div><small>当前项目</small><b>{label}</b><span>{detail}</span></div><button className="primary-action" disabled={disabled} onClick={onClick}>{button}<i>→</i></button></div>;
}

function TalentCard({ person, selected, onClick }: { person: Director | Actor; selected: boolean; onClick: () => void }) {
  const isDirector = "skill" in person;
  return <button className={`talent-card ${selected ? "selected" : ""}`} onClick={onClick} aria-pressed={selected}><span className="avatar">{person.avatar}</span><div><strong>{person.name}</strong><small>{isDirector ? person.trait : person.tag}</small></div><dl><dt>{isDirector ? "执导" : "演技"}</dt><dd>{isDirector ? person.skill : person.acting}</dd><dt>号召</dt><dd>{person.appeal}</dd></dl><p>{person.genres.join(" · ")}</p><b className="fee">¥{money(person.fee)}</b>{selected && <i className="check">✓</i>}</button>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>;
}

function ResultStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div><span>{label}</span><b>{value}<small>{unit}</small></b></div>;
}
