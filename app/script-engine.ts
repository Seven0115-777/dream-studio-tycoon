import { decorateRouteOption, deriveScriptBuild, describeCoreStyle, getCoreStyles, scoreScriptBuild, type BuildOptionMeta, type ScriptBuild } from "./script-build-system.ts";

export type ScriptScores = { story: number; character: number; market: number; originality: number };
export type ScriptOption = { id: string; label: string; description: string; scores: ScriptScores; profile: string; upside: string; tradeoff: string; coreAdvantages?: string; coreCosts?: string } & Partial<BuildOptionMeta>;
export type ScriptQuestion = { id: string; title: string; prompt: string; options: ScriptOption[] };
export type ScriptReport = ScriptScores & { baseScore: number; levelBonus: number; score: number; grade: string; verdict: string; tags: string[]; risks: string[]; build?: ScriptBuild; rewritten?: boolean; rewriteDirection?: RewriteDirection };
export type RewriteDirection = "structure" | "character" | "commercial";
export type RewriteResult = { report: ScriptReport; cost: number; marketHeatDelta: number; timeCost: string };

const profiles = {
  story: { story: 20, character: 12, market: 14, originality: 16 },
  character: { story: 12, character: 20, market: 13, originality: 15 },
  market: { story: 14, character: 11, market: 20, originality: 12 },
  original: { story: 14, character: 13, market: 10, originality: 20 },
  balanced: { story: 18, character: 18, market: 18, originality: 18 },
  emotional: { story: 14, character: 20, market: 16, originality: 11 },
  spectacle: { story: 12, character: 9, market: 20, originality: 14 },
  risky: { story: 16, character: 10, market: 10, originality: 20 },
  safe: { story: 13, character: 13, market: 18, originality: 9 },
} satisfies Record<string, ScriptScores>;

type Profile = keyof typeof profiles;
const profileFeedback: Record<Profile, { upside: string; tradeoff: string; craft: number }> = {
  story: { upside: "因果严密", tradeoff: "人物温度中等", craft: 1 },
  character: { upside: "角色驱动", tradeoff: "商业节奏偏慢", craft: 1 },
  market: { upside: "大众入口", tradeoff: "原创辨识度偏低", craft: 1 },
  original: { upside: "新鲜表达", tradeoff: "理解门槛提高", craft: -1 },
  balanced: { upside: "完成度均衡", tradeoff: "缺少单项爆点", craft: 4 },
  emotional: { upside: "情绪后劲", tradeoff: "结构效率下降", craft: 0 },
  spectacle: { upside: "视听奇观", tradeoff: "人物空间受压", craft: -3 },
  risky: { upside: "争议话题", tradeoff: "受众明显分化", craft: -5 },
  safe: { upside: "接受度稳定", tradeoff: "创作锐度不足", craft: -4 },
};
const o = (id: string, label: string, description: string, profile: Profile): ScriptOption => ({ id, label, description, scores: profiles[profile], profile, upside: profileFeedback[profile].upside, tradeoff: profileFeedback[profile].tradeoff });
const q = (id: string, title: string, prompt: string, options: ScriptOption[]): ScriptQuestion => ({ id, title, prompt, options });

const commonQuestions: ScriptQuestion[] = [
  q("common-opening", "观众入口", "电影开场如何让观众迅速进入故事？", [o("co-a", "先抛出无法忽略的事件", "用明确危机建立目标与节奏。", "market"), o("co-b", "先让观众爱上一个人", "从人物日常与欲望建立共情。", "character"), o("co-c", "先展示一个陌生世界", "用独特规则和氛围制造好奇。", "original")]),
  q("common-flaw", "主角缺口", "什么会让主角不只是一个完成任务的工具？", [o("cf-a", "他会做出代价高昂的错误", "错误推动情节，也暴露人物弱点。", "story"), o("cf-b", "他最渴望的恰好是最害怕的", "让外部目标与内心冲突互相拉扯。", "character"), o("cf-c", "他拥有不可靠的认知", "观众需要重新判断所见的一切。", "risky")]),
  q("common-relation", "关系引擎", "哪种人物关系负责持续制造戏剧张力？", [o("cr-a", "目标一致、方法相反的搭档", "合作与冲突可以同时推进。", "balanced"), o("cr-b", "彼此亏欠又无法和解的亲人", "让每次选择都带着情感旧账。", "emotional"), o("cr-c", "随时可能互相背叛的同盟", "用利益变化维持悬念。", "story")]),
  q("common-turn", "中段换轨", "电影过半时，哪种变化最值得重新定义故事？", [o("ct-a", "任务成功，却造成更大灾难", "让胜利成为下一阶段的代价。", "story"), o("ct-b", "主角发现自己一直站错了边", "重构人物立场和前半段意义。", "character"), o("ct-c", "世界规则突然露出第二层", "提高新鲜感，但需要提前埋设线索。", "original")]),
  q("common-climax", "高潮选择", "最终高潮最应该兑现什么？", [o("cc-a", "全片最大的视觉奇观", "用规模和节奏完成市场承诺。", "spectacle"), o("cc-b", "主角最困难的一次价值选择", "让行动证明人物是否真正改变。", "character"), o("cc-c", "前文所有伏笔同时闭环", "用严密回收带来智力满足。", "story")]),
  q("common-ending", "散场余味", "字幕升起后，你希望观众带走什么？", [o("ce-a", "完整胜利与强烈释放", "提供明确、易传播的情绪出口。", "safe"), o("ce-b", "胜利伴随不可逆的代价", "让满足感中保留人物伤痕。", "emotional"), o("ce-c", "关键答案留给观众判断", "鼓励讨论与二刷，但存在分化风险。", "risky")]),
];

const baseGenreQuestions: Record<string, ScriptQuestion[]> = {
  "犯罪悬疑": [
    q("crime-case", "案件核心", "什么样的案件最能支撑整部悬疑电影？", [o("ci-a", "密闭空间中的不可能犯罪", "依靠规则、公平线索与推理闭环。", "story"), o("ci-b", "牵出城市利益网的旧案", "案件逐层扩张到更大的社会结构。", "balanced"), o("ci-c", "主角可能就是凶手", "以身份错位挑战观众判断。", "risky")]),
    q("crime-clue", "线索规则", "观众应该如何接触真相？", [o("cl-a", "关键线索全部提前出现", "允许观众与侦探公平竞赛。", "story"), o("cl-b", "线索藏在人物情绪与谎言里", "真相来自关系裂缝而非物证。", "character"), o("cl-c", "用多视角呈现互相矛盾的事实", "强化讨论度与重看价值。", "original")]),
    q("crime-detective", "调查者代价", "调查真相会让主角失去什么？", [o("cd-a", "职业与名誉", "外部压力清晰，节奏更类型化。", "market"), o("cd-b", "最信任的人", "真相直接撕裂核心关系。", "emotional"), o("cd-c", "对正义的原有信念", "让破案成为价值观重建。", "character")]),
    q("crime-villain", "反派位置", "反派最有力量的形态是什么？", [o("cv-a", "始终领先一步的天才罪犯", "建立鲜明对抗与明星角色。", "market"), o("cv-b", "与主角互为镜像的执念者", "让双方选择彼此映照。", "character"), o("cv-c", "没有具体面孔的利益系统", "把犯罪根源放进社会规则。", "original")]),
    q("crime-reveal", "真相揭晓", "最终反转怎样才不只是一次吓人？", [o("cq-a", "改变凶手身份", "直观有力，但必须保证线索公平。", "safe"), o("cq-b", "改变案件发生的真正原因", "让人物动机重新解释全部行为。", "story"), o("cq-c", "真相逼主角成为共犯", "把答案转化为道德选择。", "character")]),
  ],
  "都市爱情": [
    q("love-meet", "相遇方式", "两位主角如何产生第一股吸引力？", [o("lm-a", "一次充满误解的偶遇", "轻快易懂，迅速建立互动。", "market"), o("lm-b", "共同完成一件困难的事", "让感情从行动与信任中生长。", "balanced"), o("lm-c", "多年后重逢，身份已经对调", "天然携带旧情与时间差。", "emotional")]),
    q("love-barrier", "爱情阻力", "真正阻止他们在一起的是什么？", [o("lb-a", "现实城市与生活选择", "工作、住房和迁徙构成具体压力。", "balanced"), o("lb-b", "两人截然不同的亲密方式", "冲突来自性格，不依赖误会。", "character"), o("lb-c", "一段不能公开的共同秘密", "增加类型感和剧情推进力。", "story")]),
    q("love-chemistry", "银幕化学", "哪种互动最能让观众相信爱情？", [o("lc-a", "高密度斗嘴与反差笑点", "节奏明快，利于片段传播。", "market"), o("lc-b", "在细小生活习惯中彼此照顾", "用细节累积真实感。", "character"), o("lc-c", "在危险或压力下互相托底", "用行动证明关系重量。", "story")]),
    q("love-separation", "关系断裂", "两人的最低谷应该来自哪里？", [o("ls-a", "一个可以解释却没有解释的误会", "戏剧性直接，但需要避免强行。", "safe"), o("ls-b", "他们都没有错，却无法拥有同一种未来", "成熟现实，情绪后劲更强。", "emotional"), o("ls-c", "其中一人主动牺牲关系成全对方", "强化角色弧光与泪点。", "character")]),
    q("love-ending", "爱情结局", "这段关系最终如何落地？", [o("le-a", "跨越阻碍后坚定相拥", "完成浪漫承诺，受众接受度高。", "market"), o("le-b", "彼此改变后体面告别", "不以在一起作为唯一答案。", "original"), o("le-c", "多年后留下克制的再会可能", "保留遗憾与想象空间。", "emotional")]),
  ],
  "科幻冒险": [
    q("scifi-rule", "世界规则", "科幻设定首先要让观众理解什么？", [o("sr-a", "一条简单且不可违背的规则", "便于理解，也能持续制造冲突。", "balanced"), o("sr-b", "一套完整可信的未来社会", "让技术与制度共同塑造生活。", "original"), o("sr-c", "一个人人都想体验的奇观", "优先兑现大银幕吸引力。", "spectacle")]),
    q("scifi-cost", "技术代价", "核心科技为什么不是免费的愿望机？", [o("st-a", "每次使用都会消耗生命", "代价直观，选择具有紧迫感。", "market"), o("st-b", "它会逐渐改写使用者的人格", "让科技问题进入人物内部。", "balanced"), o("st-c", "它的便利建立在看不见的群体牺牲上", "扩展为社会伦理冲突。", "original")]),
    q("scifi-team", "冒险队伍", "谁最适合进入未知区域？", [o("sa-a", "各有专长的任务小队", "目标明确，适合工业化冒险节奏。", "safe"), o("sa-b", "关系破裂的一家人", "外部探险同步修复家庭关系。", "balanced"), o("sa-c", "人类与不可信任的人工智能", "合作本身就是持续悬念。", "original")]),
    q("scifi-threat", "终极威胁", "怎样的敌人最能体现科幻主题？", [o("sth-a", "压倒性的外星文明", "规模明确，强调生存与奇观。", "spectacle"), o("sth-b", "以保护人类为名的算法", "冲突来自效率与自由。", "balanced"), o("sth-c", "未来的主角回头阻止现在的自己", "把时空概念转成人物对抗。", "risky")]),
    q("scifi-finale", "科幻高潮", "最后二十分钟应该把什么推到极致？", [o("sf-a", "跨星球或跨维度的终极行动", "用视听规模完成类型承诺。", "spectacle"), o("sf-b", "必须舍弃科技才能拯救世界", "让主题通过选择落地。", "balanced"), o("sf-c", "揭示所谓现实只是更大实验", "制造强讨论，但需要严谨铺垫。", "risky")]),
  ],
  "动作战争": [
    q("action-mission", "任务目标", "什么任务能让动作场面始终有意义？", [o("am-a", "在倒计时内营救关键人物", "目标直观，天然适合紧张节奏。", "market"), o("am-b", "护送一个立场敌对的证人", "行动与关系冲突同步推进。", "balanced"), o("am-c", "阻止己方正在执行的错误命令", "让战斗承载道德困境。", "character")]),
    q("action-style", "动作风格", "影片的核心动作名片是什么？", [o("as-a", "真实近身战与长镜头", "强调演员身体表现与临场感。", "character"), o("as-b", "大规模载具追逐与爆破", "提供强烈影院奇观。", "spectacle"), o("as-c", "利用特殊地形进行战术博弈", "靠空间规则制造新鲜打法。", "original")]),
    q("action-enemy", "敌我对照", "对手为什么值得被记住？", [o("ae-a", "他拥有更强的资源与火力", "威胁清晰，升级路径明确。", "safe"), o("ae-b", "他曾与主角接受同样训练", "技巧相似，信念相反。", "character"), o("ae-c", "双方都认为自己在阻止战争", "让胜负之外存在立场碰撞。", "balanced")]),
    q("action-sacrifice", "战场代价", "哪种牺牲最能避免廉价煽情？", [o("ac-a", "配角为任务主动留下断后", "经典有效，需要充分建立关系。", "emotional"), o("ac-b", "主角完成任务却永远失去身份", "让英雄选择产生长期后果。", "character"), o("ac-c", "胜利迫使队伍放弃原本守护的东西", "把战略成功变成价值失败。", "original")]),
    q("action-finale", "终局战役", "最后一战怎样兼顾规模与人物？", [o("af-a", "多线战场同时收束", "规模宏大，强调团队协作。", "spectacle"), o("af-b", "从大部队战争收缩到两人决斗", "让宏大冲突落回个人选择。", "balanced"), o("af-c", "主角拒绝完成必胜但错误的攻击", "以克制行动完成英雄弧光。", "character")]),
  ],
  "合家欢喜剧": [
    q("comedy-engine", "喜剧发动机", "笑料如何在整部电影中持续产生？", [o("cm-a", "小人物被迫扮演不属于自己的身份", "误会不断升级，结构清晰。", "market"), o("cm-b", "性格完全相反的人必须共同完成任务", "冲突可持续，也能建立感情。", "balanced"), o("cm-c", "全城都遵守一条荒诞规则", "用世界设定制造独特笑点。", "original")]),
    q("comedy-character", "喜剧人物", "主角最有价值的可笑之处是什么？", [o("ch-a", "过度自信却总是判断错误", "行动积极，失败可以不断升级。", "story"), o("ch-b", "嘴硬刻薄但极度渴望被需要", "笑点背后保留情感缺口。", "character"), o("ch-c", "一本正经地相信荒唐原则", "反差鲜明，容易形成记忆点。", "original")]),
    q("comedy-rhythm", "笑点节奏", "怎样安排笑料才不会只像段子合集？", [o("cy-a", "三次重复，每次后果升级", "建立预期后再打破预期。", "story"), o("cy-b", "用人物关系变化自然生成笑点", "笑过之后关系也向前推进。", "character"), o("cy-c", "密集制造适合传播的金句与名场面", "市场效率高，但需要控制割裂感。", "market")]),
    q("comedy-heart", "情感底盘", "观众笑完以后为什么还会在意人物？", [o("che-a", "一家人重新学会坦诚", "覆盖面广，适合合家欢。", "emotional"), o("che-b", "失败者终于接受不完美的自己", "人物成长与喜剧反差统一。", "character"), o("che-c", "陌生人临时组成一个荒唐家庭", "群像关系带来温暖和新鲜感。", "balanced")]),
    q("comedy-finale", "喜剧高潮", "结尾怎样同时兑现笑点与情感？", [o("cj-a", "所有谎言在同一场合集中爆炸", "用高密度误会完成大笑点。", "market"), o("cj-b", "主角用最笨拙的方式说出真心", "让人物缺点转化为情感表达。", "emotional"), o("cj-c", "看似失败，荒诞规则却意外成全所有人", "用反逻辑完成惊喜闭环。", "original")]),
  ],
  "历史传记": [
    q("history-view", "历史视角", "从谁的眼睛进入这段历史？", [o("hv-a", "站在事件中心的关键人物", "信息清晰，满足观众认知预期。", "safe"), o("hv-b", "被正史忽略的身边人", "以小人物折射宏大变化。", "original"), o("hv-c", "晚年主人公回望年轻自己", "记忆偏差可以制造人物层次。", "character")]),
    q("history-truth", "史实边界", "史实与戏剧冲突时如何选择？", [o("ht-a", "严格遵循记录，用细节制造张力", "可信度高，考验叙事组织。", "story"), o("ht-b", "合并次要人物，保留历史结果", "提升节奏，同时守住事实底线。", "balanced"), o("ht-c", "公开采用一种有争议的新解释", "讨论度高，也承担评价风险。", "risky")]),
    q("history-conflict", "时代压力", "时代如何真正进入人物命运？", [o("hc-a", "一次重大历史事件改变所有关系", "规模与个人命运直接连接。", "spectacle"), o("hc-b", "制度让每个正确选择都付出代价", "压力持续存在，不依赖单一反派。", "story"), o("hc-c", "主人公逐渐成为自己曾反对的人", "时代通过人物异化被看见。", "character")]),
    q("history-human", "伟人弱点", "怎样避免把传主拍成没有温度的雕像？", [o("hh-a", "让他在私人关系中不断失败", "公众成就与私人缺口形成反差。", "character"), o("hh-b", "保留一次影响深远的错误判断", "不回避复杂性，也推动剧情。", "balanced"), o("hh-c", "从对手视角重新审视他的功绩", "打破单一叙事，增加讨论。", "original")]),
    q("history-ending", "历史落点", "影片应该在哪个时刻结束？", [o("he-a", "最著名的成就完成之时", "提供明确高潮与认知满足。", "market"), o("he-b", "成就之后无人看见的代价", "把历史评价落回人的命运。", "emotional"), o("he-c", "切到今天，展示影响仍在继续", "建立当代连接与主题余响。", "original")]),
  ],
};

type ExpansionFlavor = {
  key: string;
  promise: string;
  protagonist: string;
  pressure: string;
  relationship: string;
  setPiece: string;
  image: string;
  theme: string;
  audience: string;
};

const expansionFlavors: Record<string, ExpansionFlavor> = {
  "犯罪悬疑": { key: "crime", promise: "追查真相时不断推翻已有判断", protagonist: "背负秘密的调查者", pressure: "证据消失与嫌疑人反制", relationship: "调查者与核心嫌疑人的危险信任", setPiece: "公开场合中的证据重构", image: "反复出现却含义变化的物证", theme: "真相与正义是否总是一致", audience: "推理爱好者与社会议题观众" },
  "都市爱情": { key: "love", promise: "让亲密关系在现实选择中逐步生长", protagonist: "害怕承诺却渴望被理解的都市人", pressure: "工作、迁徙与不同人生规划", relationship: "彼此吸引却表达方式相反的恋人", setPiece: "城市公共空间中的情感摊牌", image: "记录两人关系变化的日常物件", theme: "相爱是否意味着选择同一种生活", audience: "情侣观众与都市情感受众" },
  "科幻冒险": { key: "scifi", promise: "用清晰规则把未知世界变成生死选择", protagonist: "必须质疑自身文明的探索者", pressure: "资源耗尽与未知规则升级", relationship: "人类与非人伙伴的脆弱联盟", setPiece: "规则彻底失效的跨维度行动", image: "持续变化的未来科技界面", theme: "技术进步是否等于人类进步", audience: "类型片观众与大银幕奇观受众" },
  "动作战争": { key: "action", promise: "让每次行动升级都改变任务与立场", protagonist: "服从命令却开始怀疑目标的行动者", pressure: "倒计时、火力差距与错误命令", relationship: "立场冲突却必须互相托付的战友", setPiece: "多目标同时失控的终局行动", image: "从完整到残破的任务标记", theme: "胜利能否证明手段正确", audience: "动作类型受众与团队英雄故事观众" },
  "合家欢喜剧": { key: "comedy", promise: "让人物缺点持续制造笑料并最终完成成长", protagonist: "总用错误方法解决问题的小人物", pressure: "谎言升级与家庭任务同时失控", relationship: "互相嫌弃却不得不合作的临时家人", setPiece: "所有误会在大型活动中集中爆发", image: "每次出现都更加荒唐的生活道具", theme: "承认不完美是否比成功更重要", audience: "家庭观众与轻松喜剧受众" },
  "历史传记": { key: "history", promise: "让时代洪流通过人物选择被真实感知", protagonist: "功绩与私人缺口并存的历史人物", pressure: "制度、战争与公共责任的挤压", relationship: "传主与见证者之间不断变化的评价", setPiece: "个人决定改变公共历史的关键时刻", image: "跨越年代并见证代价的历史物件", theme: "后世应如何评价复杂的历史选择", audience: "历史受众与人物传记观众" },
};

function buildExpansionQuestions(genre: string, flavor: ExpansionFlavor): ScriptQuestion[] {
  const make = (number: number, title: string, prompt: string, options: [string, string, Profile][]) => q(`${flavor.key}-extra-${number}`, title, prompt, options.map(([label, description, profile], index) => o(`${flavor.key}-x${number}-${index + 1}`, label, description, profile)));
  return [
    make(1, "类型承诺", `《${genre}》最早应该怎样兑现“${flavor.promise}”的观影承诺？`, [["前三分钟给出明确钩子", "先建立观众期待，再逐步增加复杂度。", "market"], ["从人物困境自然引出类型事件", "让类型刺激同时服务人物弧光。", "balanced"], ["故意延迟兑现并制造陌生感", "挑战惯例，但需要更强的氛围控制。", "risky"]]),
    make(2, "主角起点", `${flavor.protagonist}在故事开始时最需要隐藏什么？`, [["一次改变命运的错误", "秘密能够持续推动因果与选择。", "story"], ["不愿承认的情感需求", "让外部行动暴露内部缺口。", "character"], ["与世界规则冲突的特殊身份", "强化设定钩子与讨论空间。", "original"]]),
    make(3, "明确目标", "主角进入第二幕以后，观众最应该清楚哪件事？", [["必须完成的具体任务", "清晰目标保证叙事推进效率。", "story"], ["失败将失去的核心关系", "把风险转化为情感代价。", "emotional"], ["成功后可能得到的巨大回报", "增强爽感预期与市场吸引力。", "market"]]),
    make(4, "压力升级", `${flavor.pressure}应该如何逐级加码？`, [["每次升级都缩短解决时间", "用明确倒计时维持紧迫感。", "market"], ["每次解决问题都制造新后果", "让升级来自人物行为与因果。", "story"], ["压力逐渐改变主角的价值判断", "让外部危机进入人物内部。", "character"]]),
    make(5, "核心关系", `${flavor.relationship}怎样避免只承担功能？`, [["双方掌握彼此需要的信息", "关系变化会直接推动剧情。", "balanced"], ["双方都在隐瞒无法原谅的真相", "用秘密维持情感张力。", "emotional"], ["双方对同一目标拥有相反解释", "把主题争论放进人物对话。", "character"]]),
    make(6, "对手策略", "主要对手第一次真正占据上风，应该依靠什么？", [["提前预判主角的行动", "证明对手具备持续威胁。", "story"], ["利用主角最在意的人", "让冲突直接触碰人物软肋。", "emotional"], ["展示更有诱惑力的价值方案", "避免对手沦为纯粹障碍。", "original"]]),
    make(7, "场景名片", `${flavor.setPiece}最重要的设计原则是什么？`, [["空间规则清晰并持续升级", "让观众理解行动与危险。", "story"], ["优先创造一眼可传播的画面", "强化预告片与短视频传播效率。", "spectacle"], ["关键动作同时改变人物关系", "避免场面结束后故事原地踏步。", "balanced"]]),
    make(8, "视觉母题", `${flavor.image}应该怎样贯穿电影？`, [["每次出现都补充一层信息", "让视觉线索承担叙事功能。", "story"], ["随人物心境改变呈现方式", "用影像替代解释性对白。", "character"], ["只在关键节点制造强烈奇观", "控制出现次数，保留视觉冲击。", "spectacle"]]),
    make(9, "配角功能", "最重要的配角应该为主角提供什么？", [["主角不具备的行动能力", "提高任务变化和团队效率。", "safe"], ["一面揭示主角缺点的镜子", "通过对照深化人物。", "character"], ["一条能够反转主线的独立目标", "增加叙事层次与不可预测性。", "original"]]),
    make(10, "中点胜利", "电影中点如果让主角获得一次胜利，这次胜利应该隐藏什么？", [["胜利使用了错误方法", "后果能够自然引爆后半程。", "story"], ["胜利伤害了最重要的关系", "让情绪代价超过任务收益。", "emotional"], ["胜利证明世界规则并不可靠", "重新打开类型想象空间。", "risky"]]),
    make(11, "最低谷", "主角彻底失败时，哪种损失最有力量？", [["失去完成目标的最后资源", "让终局必须依靠新方法。", "story"], ["被最信任的人否定", "迫使人物直面自己的缺点。", "character"], ["公众认知与个人真相完全相反", "增强社会讨论与传播话题。", "original"]]),
    make(12, "主题争论", `关于“${flavor.theme}”，影片应如何表达立场？`, [["让主角在行动中给出答案", "主题通过选择落地而非说教。", "balanced"], ["让不同人物都拥有成立的理由", "保留复杂性与讨论空间。", "original"], ["提供明确积极的价值结论", "降低理解门槛并扩大受众。", "safe"]]),
    make(13, "信息控制", "关键背景信息应该在什么时候交给观众？", [["行动需要时立即说明", "保证理解效率与商业节奏。", "market"], ["先展示后果，再逐步解释原因", "制造悬念并鼓励主动推理。", "story"], ["始终只让观众知道主角所知", "强化代入，但限制叙事视野。", "character"]]),
    make(14, "节奏呼吸", "连续高强度情节之间应该加入什么？", [["短暂但会改变关系的安静场面", "为人物和情绪提供积累。", "emotional"], ["一段补足规则的信息场景", "让下一轮升级更容易理解。", "balanced"], ["新的笑点或奇观刺激", "维持娱乐密度与注意力。", "market"]]),
    make(15, "观众预期", `${flavor.audience}最不能接受哪种创作问题？`, [["类型承诺迟迟不兑现", "优先保证核心观影需求。", "market"], ["人物只为反转而失去逻辑", "保护角色动机与可信度。", "character"], ["设定看似新鲜却没有主题用途", "让原创表达与故事互相支撑。", "original"]]),
    make(16, "高潮代价", "终局行动成功以后，主角必须承担什么？", [["失去最初想获得的奖励", "用代价证明人物真正改变。", "character"], ["承担无法撤销的现实后果", "让高潮选择具有重量。", "story"], ["暂时不付代价，提供完整释放", "强化爽感与大众满足。", "safe"]]),
    make(17, "最后镜头", "影片最后一个镜头最适合完成什么？", [["回收开场出现的重要意象", "形成结构闭环与完成感。", "story"], ["停留在人物细微但明确的变化", "把余味落到角色身上。", "emotional"], ["抛出世界仍在变化的新信息", "增加讨论和续作想象。", "risky"]]),
    make(18, "传播记忆", "如果观众只能向朋友描述一个亮点，你希望是什么？", [["一个从未见过的视听场面", "强化大银幕价值与物料传播。", "spectacle"], ["一个令人共情的人物选择", "依靠情绪形成长期口碑。", "emotional"], ["一个简洁有力的高概念钩子", "便于推荐和市场定位。", "market"]]),
  ];
}

const genreQuestions: Record<string, ScriptQuestion[]> = Object.fromEntries(Object.entries(baseGenreQuestions).map(([genre, questions]) => [genre, [...questions, ...buildExpansionQuestions(genre, expansionFlavors[genre])]]));

export const scriptScoreProfiles = profiles;

export function getScriptQuestionBank() {
  return { common: commonQuestions, genres: genreQuestions };
}

const hash = (value: string) => [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
const deterministicOrder = <T extends { id: string }>(items: T[], seed: string) => [...items].sort((first, second) => hash(`${seed}:${first.id}`) - hash(`${seed}:${second.id}`) || first.id.localeCompare(second.id));

export function getScriptQuestions(genre: string, year: number): ScriptQuestion[] {
  const specificPool = genreQuestions[genre] ?? genreQuestions["犯罪悬疑"];
  const specificOrder = deterministicOrder(specificPool, `${genre}:specific-order`);
  const commonOrder = deterministicOrder(commonQuestions, `${genre}:common-order`);
  const safeYear = Math.max(1, Math.floor(year));
  const specificStart = ((safeYear - 1) * 4) % specificOrder.length;
  const commonStart = (safeYear - 1) % commonOrder.length;
  const specific = Array.from({ length: 4 }, (_, index) => specificOrder[(specificStart + index) % specificOrder.length]);
  const routeQuestions = [specific[0], commonOrder[commonStart], specific[1], specific[2], specific[3]].map((question) => ({ ...question, options: question.options.map((option) => decorateRouteOption(genre, option)) }));
  const coreQuestion: ScriptQuestion = {
    id: `core-${getCoreStyles(genre)[0].id.split("-")[0]}`,
    title: "核心流派",
    prompt: `这部${genre}首先要向观众做出哪一种核心承诺？`,
    options: getCoreStyles(genre).map((style) => {
      const description = describeCoreStyle(style);
      return {
        id: style.id,
        label: style.name,
        description: style.pitch,
        scores: profiles.balanced,
        profile: "core",
        upside: description.advantages.join(" · "),
        tradeoff: description.costs.join(" · "),
        coreAdvantages: description.advantages.join(" · "),
        coreCosts: description.costs.join(" · "),
        keyword: style.keyword,
        connectionKey: style.keyword,
        alignment: [style.id],
        routeFunction: "core" as const,
        relation: `确定「${style.engine}」引擎；后续至少两次同向强化后激活`,
      };
    }),
  };
  return [coreQuestion, ...routeQuestions];
}

function levelWritingBonus(level: number) {
  return level >= 10 ? 4 : level >= 8 ? 3 : level >= 5 ? 2 : level >= 2 ? 1 : 0;
}

export function evaluateScript(answers: Record<string, string>, questionIds: string[], genre: string, studioLevel: number): ScriptReport {
  const routeBank = [...commonQuestions, ...(genreQuestions[genre] ?? genreQuestions["犯罪悬疑"])].map((question) => ({ ...question, options: question.options.map((option) => decorateRouteOption(genre, option)) }));
  const currentCore = getScriptQuestions(genre, 1)[0];
  const questionMap = new Map([currentCore, ...routeBank].map((question) => [question.id, question]));
  const selected = questionIds.map((id) => {
    const question = questionMap.get(id);
    return question?.options.find((option) => option.id === answers[id]);
  }).filter((option): option is ScriptOption => Boolean(option));
  if (selected.length !== questionIds.length || questionIds.length !== 6) throw new Error("请完成全部六道剧本选择");

  const totals: ScriptScores = { story: 0, character: 0, market: 0, originality: 0 };
  selected.forEach((option) => (Object.keys(totals) as (keyof ScriptScores)[]).forEach((key) => { totals[key] += option.scores[key]; }));
  const dimensions = (Object.keys(totals) as (keyof ScriptScores)[]).reduce((report, key) => ({ ...report, [key]: Math.round(totals[key] / selected.length * 5) }), {} as ScriptScores);
  const buildQuestions = questionIds.map((id) => questionMap.get(id)).filter((question): question is ScriptQuestion => Boolean(question));
  const build = deriveScriptBuild(answers, buildQuestions as Parameters<typeof deriveScriptBuild>[1], genre);
  const dimensionAverage = (dimensions.story + dimensions.character + dimensions.market + dimensions.originality) / 4;
  const baseScore = scoreScriptBuild(build, dimensionAverage);
  const levelBonus = levelWritingBonus(studioLevel);
  const score = Math.min(94, baseScore + levelBonus);
  const grade = score >= 90 ? "S" : score >= 82 ? "A" : score >= 72 ? "B" : score >= 62 ? "C" : "D";
  return { ...dimensions, baseScore, levelBonus, score, grade, verdict: `${build.buildName} · ${score >= 90 ? "年度级潜力" : score >= 82 ? "头部项目潜质" : score >= 72 ? "构筑完整，可以推进" : score >= 62 ? "存在亮点，仍需补强" : "核心表达尚未闭环"}`, tags: [...new Set([...build.finalTraits, ...selected.map((option) => option.upside)])].slice(0, 4), risks: [...new Set([...build.unresolvedFlaws, ...build.conflicts, ...selected.map((option) => option.tradeoff)])].slice(0, 4), build };
}

function gradeFor(score: number) {
  return score >= 90 ? "S" : score >= 82 ? "A" : score >= 72 ? "B" : score >= 62 ? "C" : "D";
}

export function rewriteScript(report: ScriptReport, direction: RewriteDirection, alreadyUsed = false): RewriteResult {
  if (alreadyUsed || report.rewritten) throw new Error("每部影片只能进行一次改稿");
  const plans = {
    structure: { story: 7, character: 0, market: -3, originality: 0, score: 4, cost: 900, marketHeatDelta: -2, timeCost: "追加两周", label: "结构重写" },
    character: { story: 0, character: 7, market: -2, originality: 0, score: 3, cost: 700, marketHeatDelta: -1, timeCost: "追加十天", label: "人物精修" },
    commercial: { story: 0, character: -3, market: 8, originality: -4, score: 2, cost: 600, marketHeatDelta: 3, timeCost: "追加一周", label: "商业化改稿" },
  } as const;
  const plan = plans[direction];
  const score = Math.min(94, report.score + plan.score);
  const repairedTarget = direction === "structure" ? "伏笔缺口" : direction === "character" ? "人物单薄" : "表达套路";
  const build = report.build ? {
    ...report.build,
    keywords: [...new Set([...report.build.keywords, plan.label])],
    unresolvedFlaws: report.build.unresolvedFlaws.filter((flaw) => flaw !== repairedTarget),
    repairedFlaws: [...new Set([...report.build.repairedFlaws, ...(report.build.unresolvedFlaws.includes(repairedTarget) ? [repairedTarget] : [])])],
    finalTraits: [...new Set([...report.build.finalTraits, plan.label])],
    events: [...report.build.events, report.build.unresolvedFlaws.includes(repairedTarget) ? `改稿修复：${repairedTarget}` : `改稿补强：${plan.label}`],
    buildName: `${report.build.core?.name ?? "剧本"}·${plan.label}`,
  } : undefined;
  return {
    report: {
      ...report,
      story: Math.max(0, Math.min(100, report.story + plan.story)),
      character: Math.max(0, Math.min(100, report.character + plan.character)),
      market: Math.max(0, Math.min(100, report.market + plan.market)),
      originality: Math.max(0, Math.min(100, report.originality + plan.originality)),
      score,
      grade: gradeFor(score),
      verdict: build ? `${build.buildName} · ${score >= 90 ? "年度级潜力" : score >= 82 ? "头部项目潜质" : "完成定向补强"}` : score >= 90 ? "年度级潜力剧本" : score >= 82 ? "具备头部项目潜质" : score >= 72 ? "结构完整，可以推进" : score >= 62 ? "存在亮点，但需要明星托举" : "创作方向仍需打磨",
      tags: [...new Set([...(report.tags ?? []), plan.label])].slice(0, 4),
      risks: [...new Set([...(report.risks ?? []), `${plan.timeCost} · 市场热度 ${plan.marketHeatDelta >= 0 ? "+" : ""}${plan.marketHeatDelta}`])].slice(0, 4),
      rewritten: true,
      rewriteDirection: direction,
      build,
    },
    cost: plan.cost,
    marketHeatDelta: plan.marketHeatDelta,
    timeCost: plan.timeCost,
  };
}
