import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';

function installHideOriginalReplyStyle(): void {
  const host_document = window.parent?.document ?? document;
  const style_id = 'apocalypse-dawn-hide-original-reply-style';
  if (host_document.getElementById(style_id)) return;

  const style = host_document.createElement('style');
  style.id = style_id;
  style.textContent = `
    .mes:has(.TH-render) .mes_text > :not(.TH-render) {
      display: none !important;
    }
  `;
  host_document.head.appendChild(style);
}

function asNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

const warmaid_rank_steps = [
  { name: '新手', need: 10 },
  { name: '入门', need: 50 },
  { name: '标准', need: 100 },
  { name: '熟练', need: 500 },
  { name: '专业', need: 1000 },
  { name: '精锐', need: 2000 },
  { name: '传奇', need: 6000 },
] as const;

function reconcileGrowthLevel(stat_data: any): void {
  if (!stat_data || typeof stat_data !== 'object') return;

  const profession = String(_.get(stat_data, '界面.建卡.职业', ''));
  const is_warmaid = profession === '战姬' || String(_.get(stat_data, '主角.档案.身份路径', '')).includes('战姬');
  const is_authority = profession === '权柄使役者' || String(_.get(stat_data, '主角.档案.身份路径', '')).includes('权柄');

  if (is_warmaid) {
    let level = _.clamp(asNumber(_.get(stat_data, '主角.成长.战姬老练等级', 1), 1), 1, warmaid_rank_steps.length);
    let shards = Math.max(0, asNumber(_.get(stat_data, '主角.成长.魔力碎片', 0), 0));

    // 严格按“击落/掉落碎片”推进升级：每次达到阈值即消耗并晋阶。
    while (level < warmaid_rank_steps.length) {
      const need = warmaid_rank_steps[level - 1].need;
      if (shards < need) break;
      shards -= need;
      level += 1;
    }

    _.set(stat_data, '主角.成长.战姬老练等级', level);
    _.set(stat_data, '主角.成长.魔力碎片', shards);
    _.set(
      stat_data,
      '主角.成长.下一级所需魔力碎片',
      level < warmaid_rank_steps.length ? warmaid_rank_steps[level - 1].need : 0,
    );
  }

  if (is_authority) {
    const shard = Math.max(0, asNumber(_.get(stat_data, '主角.成长.权柄碎片', 0), 0));
    const has_origin = Boolean(_.get(stat_data, '主角.成长.权柄本源', false));

    let level = 1; // 信徒
    if (shard >= 50) level = 2; // 书写者
    if (shard >= 100) level = 3; // 编织者
    if (shard >= 1000 && has_origin) level = 4; // 权柄之主

    _.set(stat_data, '主角.成长.权柄使役者等级', level);
  }
}

function trimBattleLogs(stat_data: any, keep = 3): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  const logs = _.get(stat_data, '战场日志', {});
  if (!_.isObjectLike(logs)) {
    _.set(stat_data, '战场日志', {});
    return;
  }
  const entries = Object.entries(logs as Record<string, string>);
  if (entries.length <= keep) return;
  _.set(stat_data, '战场日志', Object.fromEntries(entries.slice(-keep)));
}

function ensureAirCombatData(stat_data: any): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  if (!_.isObjectLike(_.get(stat_data, '界面.空战反馈'))) {
    _.set(stat_data, '界面.空战反馈', { 待反馈: false, 摘要: '', 时间戳: 0 });
  }
  if (!_.isObjectLike(_.get(stat_data, '主角.战术.词条区'))) {
    _.set(stat_data, '主角.战术.词条区', {});
  }
  if (!_.isObjectLike(_.get(stat_data, '主角.战术.空战'))) {
    _.set(stat_data, '主角.战术.空战', {
      菜单开启: false,
      流程阶段: '遭遇',
      天气: '天气晴朗',
      天气判定值: 11,
      天气命中修正: 5,
      天气探测修正: 0,
      天气移速倍率: 1,
      空域层: '标准空域',
      格距米: 500,
      我方单位: { 侦察型: 0, 轻型: 0, 中型: 0, 重型: 0, 要塞型: 0, 其他: 0 },
      敌方单位: { 侦察型: 0, 轻型: 0, 中型: 0, 重型: 0, 要塞型: 0, 其他: 0 },
      我方制空点: 0,
      敌方制空点: 0,
      制空修正: 0,
      重武器命中条件: '无',
      触发突袭轮: false,
      突袭来源: '无',
      当前行动序列: [],
      台风眼格: [],
      侦查单位类型: '侦察型',
      侦查目标类型: '轻型',
      侦查结果: 0,
      目标隐匿剩余: 0,
      我方闪避值: 3,
      敌方闪避值: 3,
      我方近失叠加命中: 0,
      敌方近失叠加命中: 0,
      最近命中详情: '',
      我方总耐久: 100,
      敌方总耐久: 100,
      已结算回合: 0,
      最近结算摘要: '',
    });
  } else {
    const air = _.get(stat_data, '主角.战术.空战');
    _.defaultsDeep(air, {
      菜单开启: false,
      流程阶段: '遭遇',
      天气: '天气晴朗',
      天气判定值: 11,
      天气命中修正: 5,
      天气探测修正: 0,
      天气移速倍率: 1,
      空域层: '标准空域',
      格距米: 500,
      我方单位: { 侦察型: 0, 轻型: 0, 中型: 0, 重型: 0, 要塞型: 0, 其他: 0 },
      敌方单位: { 侦察型: 0, 轻型: 0, 中型: 0, 重型: 0, 要塞型: 0, 其他: 0 },
      我方制空点: 0,
      敌方制空点: 0,
      制空修正: 0,
      重武器命中条件: '无',
      触发突袭轮: false,
      突袭来源: '无',
      当前行动序列: [],
      台风眼格: [],
      侦查单位类型: '侦察型',
      侦查目标类型: '轻型',
      侦查结果: 0,
      目标隐匿剩余: 0,
      我方闪避值: 3,
      敌方闪避值: 3,
      我方近失叠加命中: 0,
      敌方近失叠加命中: 0,
      最近命中详情: '',
      我方总耐久: 100,
      敌方总耐久: 100,
      已结算回合: 0,
      最近结算摘要: '',
    });
  }
}

const battle_activate_pattern = /空战|超视距空战|偷袭|攻击|灵装化后攻击|异种进攻/i;
const battle_action_pattern = /攻击|射击|开火|突击|轰炸|压制|反击|偷袭|超视距空战|异种进攻|近战/i;
const battle_end_pattern = /战斗结束|结束空战|脱离接触|脱战|全歼|击退|撤退|撤离/i;

function getWeaponLevel(stat_data: any): number {
  const weapons = _.get(stat_data, '主角.装备.武器', {});
  if (!_.isObjectLike(weapons)) return 1;
  const first = Object.values(weapons as Record<string, any>)[0];
  return Math.max(1, asNumber(_.get(first, '等级', 1), 1));
}

function buildAirBattleSummary(stat_data: any, end_reason: string): string {
  const air = _.get(stat_data, '主角.战术.空战', {});
  const logs = Object.entries(_.get(stat_data, '战场日志', {})).slice(-3).map(([k, v]) => `${k}:${v}`).join('；');
  return `空战结算(${end_reason})：回合${asNumber(air.已结算回合, 0)}，天气=${air.天气}(命中修正${asNumber(air.天气命中修正, 0)})，制空权=${_.get(stat_data, '主角.战术.制空权', '争夺中')}，我方耐久=${asNumber(air.我方总耐久, 0)}，敌方耐久=${asNumber(air.敌方总耐久, 0)}，最近日志=${logs}。请严格按此结果叙事。`;
}

function startAirBattleIfTriggered(stat_data: any, content: string): boolean {
  ensureAirCombatData(stat_data);
  if (!battle_activate_pattern.test(content)) return false;

  const in_battle = Boolean(_.get(stat_data, '主角.战术.是否战斗中', false));
  if (in_battle) return true;

  _.set(stat_data, '主角.战术.战斗模式', '空战');
  _.set(stat_data, '主角.战术.是否战斗中', true);
  _.set(stat_data, '主角.战术.空战.菜单开启', true);
  _.set(stat_data, '主角.战术.空战.流程阶段', '遭遇');
  _.set(stat_data, '主角.战术.空战.已结算回合', 0);

  const threat = String(_.get(stat_data, '世界.战区威胁等级', '中'));
  const enemy_hp = threat === '极危' ? 180 : threat === '高' ? 140 : threat === '中' ? 110 : 90;
  _.set(stat_data, '主角.战术.空战.我方总耐久', asNumber(_.get(stat_data, '主角.资源.当前生命', 100), 100));
  _.set(stat_data, '主角.战术.空战.敌方总耐久', Math.max(30, asNumber(_.get(stat_data, '主角.战术.空战.敌方总耐久', enemy_hp), enemy_hp)));

  const source =
    /超视距空战/i.test(content) ? '超视距空战突袭'
      : /偷袭/i.test(content) ? '偷袭得手'
        : /异种进攻/i.test(content) ? '异种进攻遭遇'
          : '常规遭遇';
  const ambush = /超视距空战|偷袭/i.test(content);
  _.set(stat_data, '主角.战术.空战.触发突袭轮', ambush);
  _.set(stat_data, '主角.战术.空战.突袭来源', ambush ? source : '无');
  if (ambush) {
    _.set(stat_data, '主角.资源.行动点', asNumber(_.get(stat_data, '主角.资源.行动点', 1), 1) + 1);
  }

  _.set(stat_data, `战场日志.空战开始-${Date.now()}`, `空战激活词命中：${source}`);
  trimBattleLogs(stat_data, 3);
  return true;
}

function resolveAirCombatRound(stat_data: any, content: string): boolean {
  ensureAirCombatData(stat_data);
  if (_.get(stat_data, '主角.战术.战斗模式', '非战斗') !== '空战') return false;
  if (!Boolean(_.get(stat_data, '主角.战术.是否战斗中', false))) return false;
  if (!battle_action_pattern.test(content) && !battle_end_pattern.test(content)) return false;

  const air = _.get(stat_data, '主角.战术.空战');
  let self_hp = asNumber(_.get(air, '我方总耐久', _.get(stat_data, '主角.资源.当前生命', 100)), 100);
  let enemy_hp = asNumber(_.get(air, '敌方总耐久', 100), 100);
  const weather_mod = _.clamp(Math.trunc(asNumber(_.get(air, '天气命中修正', 0), 0) / 10), -2, 2);
  const sup_mod = _.clamp(asNumber(_.get(air, '制空修正', 0), 0), -1, 1);
  const weapon_lv = getWeaponLevel(stat_data);
  const heavy_condition = String(_.get(air, '重武器命中条件', ''));
  const need_assist = /需侦察|需.*辅助/.test(heavy_condition);
  const has_assist = asNumber(_.get(air, '我方单位.侦察型', 0), 0) > 0 || asNumber(_.get(air, '我方单位.轻型', 0), 0) > 0;

  const self_near_miss_stack = asNumber(_.get(air, '我方近失叠加命中', 0), 0);
  const enemy_near_miss_stack = asNumber(_.get(air, '敌方近失叠加命中', 0), 0);
  const enemy_dodge = asNumber(_.get(air, '敌方闪避值', 3), 3);
  const self_dodge = asNumber(_.get(air, '我方闪避值', 3), 3);
  const full_auto = /全自动|连续射击|连发/.test(content);

  const calcSingleShot = (hit_bonus: number, dodge_value: number, base_damage_mult = 1): { diff: number; damage: number; note: string; near_miss: boolean; invalid: boolean } => {
    const hit_roll = rollD6() + hit_bonus;
    const diff = hit_roll - dodge_value;
    const base_damage = Math.max(1, (rollD6() + weapon_lv) * base_damage_mult);
    if (diff > 6) return { diff, damage: base_damage + weapon_lv * rollD10(), note: '致命攻击', near_miss: false, invalid: false };
    if (diff > 4) return { diff, damage: base_damage, note: '命中', near_miss: false, invalid: false };
    if (diff > 2) return { diff, damage: Math.max(1, Math.floor(base_damage / 2)), note: '基本命中', near_miss: false, invalid: false };
    if (diff > 1) return { diff, damage: Math.max(1, weapon_lv * _.random(1, 2)), note: '擦弹', near_miss: false, invalid: false };
    if (diff === 1 || diff === 0) return { diff, damage: 0, note: '近失弹', near_miss: true, invalid: false };
    return { diff, damage: 0, note: '无效攻击', near_miss: false, invalid: true };
  };

  let dealt = 0;
  let diff = 0;
  let self_hit_note = '';
  if (need_assist && !has_assist) {
    self_hit_note = '重武器缺乏侦察/轻型辅助，命中无效';
  } else {
    const hit_bonus_base = weather_mod + sup_mod + self_near_miss_stack;
    const first_shot = calcSingleShot(hit_bonus_base, enemy_dodge);
    diff = first_shot.diff;
    dealt += first_shot.damage;
    self_hit_note = first_shot.note;
    _.set(air, '我方近失叠加命中', first_shot.near_miss ? self_near_miss_stack + 10 : 0);

    if (full_auto) {
      let shot_index = 1;
      let expected_next_bonus = hit_bonus_base - 10;
      while (shot_index < 6 && expected_next_bonus + 6 >= enemy_dodge) {
        const shot = calcSingleShot(expected_next_bonus, enemy_dodge);
        dealt += shot.damage;
        self_hit_note += ` / 连射${shot_index + 1}:${shot.note}`;
        if (shot.near_miss) _.set(air, '我方近失叠加命中', asNumber(_.get(air, '我方近失叠加命中', 0), 0) + 10);
        if (!shot.invalid) diff = shot.diff;
        shot_index += 1;
        expected_next_bonus -= 10;
      }
    }
  }
  enemy_hp = Math.max(0, enemy_hp - dealt);

  const enemy_hit = calcSingleShot(Math.max(0, -sup_mod) + enemy_near_miss_stack, self_dodge);
  const enemy_diff = enemy_hit.diff;
  const taken = enemy_hit.damage;
  _.set(air, '敌方近失叠加命中', enemy_hit.near_miss ? enemy_near_miss_stack + 10 : 0);
  self_hp = Math.max(0, self_hp - taken);

  _.set(stat_data, '主角.资源.当前生命', self_hp);
  _.set(air, '我方总耐久', self_hp);
  _.set(air, '敌方总耐久', enemy_hp);
  _.set(air, '已结算回合', asNumber(_.get(air, '已结算回合', 0), 0) + 1);
  const round_summary = `回合${_.get(air, '已结算回合', 0)}：我方${self_hit_note}(差值${diff})造成${dealt}；敌方${enemy_hit.note}(差值${enemy_diff})造成${taken}`;
  _.set(air, '最近命中详情', round_summary);
  _.set(air, '最近结算摘要', round_summary);
  _.set(stat_data, `战场日志.空战回合-${Date.now()}`, round_summary);
  trimBattleLogs(stat_data, 3);

  const end_by_text = battle_end_pattern.test(content);
  const end_by_hp = self_hp <= 0 || enemy_hp <= 0;
  if (!(end_by_text || end_by_hp)) return true;

  _.set(stat_data, '主角.战术.是否战斗中', false);
  _.set(stat_data, '主角.战术.战斗模式', '非战斗');
  _.set(air, '流程阶段', '空战结算');
  const reason = self_hp <= 0 ? '我方崩溃' : enemy_hp <= 0 ? '敌方被歼灭' : '战术脱离';
  const summary = buildAirBattleSummary(stat_data, reason);
  _.set(stat_data, '界面.空战反馈', {
    待反馈: true,
    摘要: summary,
    时间戳: Date.now(),
  });
  _.set(stat_data, '世界.近期事务.空战结算', summary);
  _.set(stat_data, `战场日志.空战结束-${Date.now()}`, summary);
  trimBattleLogs(stat_data, 3);
  return true;
}

function extractDisplayText(content: string): string {
  const without_update = content
    .replace(/<update(?:variable)?>[\s\S]*?<\/update(?:variable)?>/gim, '')
    .replace(/<update(?:variable)?>[\s\S]*$/gim, '');

  const without_placeholder = without_update
    .replace(/<StatusPlaceHolderImpl\/>/gim, '')
    .replace(/<OnStageCharacters>[\s\S]*?<\/OnStageCharacters>/gim, '')
    .replace(/<NpcRelationHints>[\s\S]*?<\/NpcRelationHints>/gim, '');

  let text = without_placeholder.replace(/```[\s\S]*?\$\('body'\)\.load\([\s\S]*?```/gim, '');

  const content_match = text.match(/<content>([\s\S]*?)<\/content>/im);
  if (content_match?.[1]) {
    text = content_match[1];
  } else {
    text = text
      .replace(/<(?:think|thinking|context|disclaimer|tucao|current_event|progress)[^>]*>[\s\S]*?<\/(?:think|thinking|context|disclaimer|tucao|current_event|progress)>/gim, '')
      .replace(/<(?:think|thinking|context|disclaimer|tucao|current_event|progress)[^>]*\/>/gim, '');
  }

  text = text
    .replace(/```[\s\S]*?```/gim, '')
    .replace(/<\|im_end\|>/gim, '')
    .replace(/<\/?[^>\n]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

type OnStageCharacter = {
  姓名: string;
  好感度: number;
  态度: string;
  内心想法: string;
  基础属性: Record<string, number>;
  更新时间: number;
};

type NpcRelationHint = {
  姓名: string;
  标签: string[];
};

const npc_name_stop_words = new Set([
  '写卡助手', '主角', '玩家', '你们', '我们', '他们', '她们', '众人', '新人', '新生', '学员',
  '守卫', '后勤员', '教官', '校长', '学院', '战姬', '异种', '系统', '任务', '空战', '地面战',
  '行政楼', '塔楼', '林荫道', '广场', '战场', '回复', '楼层', '变量', '日志', '世界', '主状态栏',
]);
const npc_name_bad_prefix = /^(对着|朝着|向着|就在|站在|位于|那个|这个|那位|这位|新来的|那个谁)/;
const npc_name_bad_contains = /(写卡助手|主角|玩家|新生|学员|守卫|后勤员|教官|校长|学院|任务|系统|状态栏|日志|空战|地面战|高空|低空|云层|标准空域|湍流层|交锋区|前线|中线|后卫|三点钟|六点钟)/;

function normalizeNpcName(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/^[“"《【\[\(]+|[”"》】\]\)]+$/g, '')
    .replace(/[，。！？；：、,\.\?!;:]/g, '')
    .trim();
}

function isLikelyNpcName(name: string, excluded: Set<string>): boolean {
  if (!name) return false;
  if (excluded.has(name)) return false;
  if (npc_name_stop_words.has(name)) return false;
  if (npc_name_bad_contains.test(name)) return false;
  if (npc_name_bad_prefix.test(name)) return false;
  if (/[0-9０-９一二三四五六七八九十百千万]/.test(name)) return false;
  if (/(的|了|着|在|中|上|下)$/.test(name)) return false;
  if (!/^[\u4e00-\u9fa5·]{2,6}$/.test(name)) return false;
  if (/(学院|战姬|异种|系统|任务|队|组|区域|阵线)$/.test(name)) return false;
  return true;
}

function sanitizeOnStageCharacters(list: OnStageCharacter[], excluded: Set<string>): OnStageCharacter[] {
  return list.filter(v => isLikelyNpcName(String(v?.姓名 ?? ''), excluded));
}

function extractNameContext(text: string, name: string): string {
  const lines = String(text ?? '').split(/[\n。！？]/).map(v => v.trim()).filter(Boolean);
  const hit = lines.find(v => v.includes(name));
  if (!hit) return '';
  return hit.slice(0, 48);
}

function inferAttitudeByContext(context: string): string {
  const t = String(context ?? '');
  if (/敌视|厌恶|愤怒|杀意/.test(t)) return '敌视';
  if (/警惕|戒备|冷淡|防备|审视/.test(t)) return '警惕';
  if (/友好|善意|微笑|点头|温和/.test(t)) return '友好';
  if (/亲密|信任|依赖|靠近/.test(t)) return '亲近';
  return '中立';
}

function refreshOnStageThoughtsByAiText(stat_data: any, ai_content: string): void {
  const list = Array.isArray(_.get(stat_data, '界面.在场角色')) ? (_.get(stat_data, '界面.在场角色') as OnStageCharacter[]) : [];
  if (list.length === 0) return;
  const text = extractDisplayText(String(ai_content ?? ''));
  if (!text) return;

  const next = list.map(char => {
    const name = String(char?.姓名 ?? '');
    if (!name || !text.includes(name)) return char;
    const context = extractNameContext(text, name);
    return {
      ...char,
      态度: inferAttitudeByContext(context) || String(char.态度 ?? '中立'),
      内心想法: context ? `本回合：${context}` : `本回合：${name}未显著外露想法。`,
      更新时间: Date.now(),
    };
  });
  _.set(stat_data, '界面.在场角色', next);
}

function inferOnStageCharactersFromText(content: string, options?: { exclude_names?: string[]; old_onstage?: OnStageCharacter[] }): OnStageCharacter[] {
  const text = extractDisplayText(String(content ?? ''));
  if (!text) return [];

  const excluded = new Set<string>(options?.exclude_names ?? []);
  const old_onstage = options?.old_onstage ?? [];
  const old_map = new Map(old_onstage.map(v => [v.姓名, v]));
  const score = new Map<string, number>();

  const pushScore = (raw_name: string, delta: number) => {
    const name = normalizeNpcName(raw_name);
    if (!isLikelyNpcName(name, excluded)) return;
    score.set(name, (score.get(name) ?? 0) + delta);
  };

  // 明确命名：名叫/被称为/称作/叫做
  for (const m of text.matchAll(/(?:名叫|叫做|被称为|称作|称为)([\u4e00-\u9fa5·]{2,6})/g)) {
    pushScore(m[1], 3);
  }
  // 叙事动作：X说/问/道/看向/转身/停下
  for (const m of text.matchAll(/([\u4e00-\u9fa5·]{2,6})(?:说|问|道|看向|看了|望向|转身|停下|点头|皱眉|回应|示意|开口|轻声|沉声|抬手|抬头|侧过头|挑了挑眉|笑了笑|叹了口气)/g)) {
    pushScore(m[1], 2);
  }
  // 人名后接标点并继续动作/对白（弱到中信号）
  for (const m of text.matchAll(/([\u4e00-\u9fa5·]{2,6})[，、]\s*(?:[“"「『]|又|便|就|正|轻|冷|低|抬|看|说|问|道)/g)) {
    pushScore(m[1], 1.6);
  }
  // 文本出现次数（极弱信号，防止噪音词累计）
  for (const m of text.matchAll(/([\u4e00-\u9fa5·]{2,6})/g)) {
    pushScore(m[1], 0.05);
  }

  // 老角色被提及也应计入“在场”
  for (const name of old_map.keys()) {
    if (text.includes(name)) score.set(name, Math.max(score.get(name) ?? 0, 2));
  }

  const result: OnStageCharacter[] = [];
  for (const [name, s] of score.entries()) {
    if (s < 2.8) continue;
    const old = old_map.get(name);
    const context = extractNameContext(text, name);
    result.push({
      姓名: name,
      好感度: clampAffection(old?.好感度 ?? 0, 0),
      态度: old?.态度 || inferAttitudeByContext(context),
      内心想法: old?.内心想法 || (context ? `从当前楼层推断：${context}` : '从当前楼层推断中。'),
      基础属性: _.isObjectLike(old?.基础属性) ? _.cloneDeep(old?.基础属性) : {},
      更新时间: Date.now(),
    });
  }
  return result;
}

function parseOnStageCharacters(content: string): OnStageCharacter[] | undefined {
  const match = content.match(/<OnStageCharacters>([\s\S]*?)<\/OnStageCharacters>/im);
  if (!match?.[1]) return undefined;

  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return undefined;

    return parsed
      .filter(item => _.isObjectLike(item))
      .map(item => {
        const attrs = _.isObjectLike((item as any).基础属性) ? (item as any).基础属性 as Record<string, unknown> : {};
        const normalized_attrs = Object.fromEntries(
          Object.entries(attrs).map(([k, v]) => [k, asNumber(v, 0)]),
        ) as Record<string, number>;
        return {
          姓名: String((item as any).姓名 ?? '未命名'),
          好感度: _.clamp(asNumber((item as any).好感度, 0), -200, 1000),
          态度: String((item as any).态度 ?? '中立'),
          内心想法: String((item as any).内心想法 ?? ''),
          基础属性: normalized_attrs,
          更新时间: Date.now(),
        };
      });
  } catch {
    return undefined;
  }
}

function parseNpcRelationHints(content: string): NpcRelationHint[] | undefined {
  const match = content.match(/<NpcRelationHints>([\s\S]*?)<\/NpcRelationHints>/im);
  if (!match?.[1]) return undefined;
  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .filter(item => _.isObjectLike(item))
      .map(item => ({
        姓名: String((item as any).姓名 ?? ''),
        标签: Array.isArray((item as any).标签) ? (item as any).标签.map((v: unknown) => String(v)) : [],
      }))
      .filter(v => v.姓名);
  } catch {
    return undefined;
  }
}

function ensureNpcData(stat_data: any): void {
  if (!_.isObjectLike(_.get(stat_data, '界面'))) _.set(stat_data, '界面', {});
  if (!Array.isArray(_.get(stat_data, '界面.在场角色'))) _.set(stat_data, '界面.在场角色', []);
  if (!_.isObjectLike(_.get(stat_data, '界面.模块折叠'))) {
    _.set(stat_data, '界面.模块折叠', { 在场角色: false, 长期NPC: false });
  } else {
    _.defaults(_.get(stat_data, '界面.模块折叠'), { 在场角色: false, 长期NPC: false });
  }
  if (!_.isObjectLike(_.get(stat_data, '世界.长期NPC列表'))) _.set(stat_data, '世界.长期NPC列表', {});
  if (!_.isObjectLike(_.get(stat_data, '世界.NPC关系追踪'))) _.set(stat_data, '世界.NPC关系追踪', {});
  if (!_.isObjectLike(_.get(stat_data, '战利品'))) _.set(stat_data, '战利品', {});
  _.defaultsDeep(_.get(stat_data, '战利品'), {
    显示战利品: false,
    当前容器: {},
    最近获取: {},
    副本: {
      已激活: false,
      副本名称: '',
      实验室等级: '基础实验室',
      地图规模: '小型',
      房间总数: 0,
      当前房间索引: 0,
      已探索房间: 0,
      最近房间: '',
      最近结算: '',
      房间列表: [],
    },
    仓库: {
      联合币: 0,
      芯片: 0,
      物品: {},
      独特收藏品: [],
    },
  });
}

function resetNpcStateBeforeCreate(stat_data: any): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  if (Boolean(_.get(stat_data, '界面.建卡.已开始', false))) return;
  _.set(stat_data, '界面.在场角色', []);
  _.set(stat_data, '世界.长期NPC列表', {});
  _.set(stat_data, '世界.NPC关系追踪', {});
}

function clampAffection(value: unknown, fallback = 0): number {
  return _.clamp(asNumber(value, fallback), -200, 1000);
}

function calcAffectionStage(score: number, is_partner = false): string {
  if (is_partner) return '伴侣';
  if (score <= -50) return '死敌';
  if (score <= -20) return '危险';
  if (score <= 0) return '警惕';
  if (score <= 100) return '熟悉';
  if (score <= 400) return '朋友';
  if (score <= 600) return '挚友';
  return '亲密';
}

function mergeOnStageCharacters(old_list: OnStageCharacter[], incoming: OnStageCharacter[]): OnStageCharacter[] {
  const merged_map = new Map<string, OnStageCharacter>();
  for (const old of old_list) {
    merged_map.set(old.姓名, {
      姓名: String(old.姓名 || '未命名'),
      好感度: clampAffection(old.好感度, 0),
      态度: String(old.态度 || '中立'),
      内心想法: String(old.内心想法 || ''),
      基础属性: _.isObjectLike(old.基础属性) ? _.cloneDeep(old.基础属性) : {},
      更新时间: asNumber(old.更新时间, 0),
    });
  }
  for (const next of incoming) {
    const name = String(next.姓名 || '未命名');
    const prev = merged_map.get(name);
    if (!prev) {
      merged_map.set(name, {
        姓名: name,
        好感度: clampAffection(next.好感度, 0),
        态度: String(next.态度 || '中立'),
        内心想法: String(next.内心想法 || ''),
        基础属性: _.isObjectLike(next.基础属性) ? _.cloneDeep(next.基础属性) : {},
        更新时间: Date.now(),
      });
      continue;
    }
    const requested = clampAffection(next.好感度, prev.好感度);
    const merged_affection = requested > prev.好感度 ? Math.min(prev.好感度 + 5, requested) : requested;
    merged_map.set(name, {
      姓名: name,
      好感度: clampAffection(merged_affection, prev.好感度),
      态度: String(next.态度 || prev.态度 || '中立'),
      内心想法: String(next.内心想法 || prev.内心想法 || ''),
      基础属性: {
        ...(prev.基础属性 ?? {}),
        ...(_.isObjectLike(next.基础属性) ? next.基础属性 : {}),
      },
      更新时间: Date.now(),
    });
  }
  return [...merged_map.values()];
}

function detectMentionedNames(content: string, names: string[]): Set<string> {
  const text = String(content ?? '');
  const mentions = new Set<string>();
  for (const name of names) {
    if (!name) continue;
    if (text.includes(name)) mentions.add(name);
  }
  return mentions;
}

function getTracker(stat_data: any, name: string): any {
  const key = `世界.NPC关系追踪.${name}`;
  if (!_.isObjectLike(_.get(stat_data, key))) {
    _.set(stat_data, key, {
      连续出现计数: 0,
      最近出现轮次: 0,
      玩家随行请求命中次数: 0,
      最近玩家请求时间: 0,
      是否已转长期: false,
    });
  }
  return _.get(stat_data, key);
}

function upsertLongTermNpc(stat_data: any, name: string, payload?: Partial<OnStageCharacter>): any {
  const key = `世界.长期NPC列表.${name}`;
  const existing = _.get(stat_data, key);
  const base = _.isObjectLike(existing) ? existing : {
    姓名: name,
    好感度: 0,
    好感阶段: '警惕',
    态度: '中立',
    内心想法: '',
    基础属性: {},
    性行为次数: 0,
    贞洁状态: '处女',
    关系标签: [],
    首次记录时间: Date.now(),
    最后更新时间: 0,
  };
  const next_affection = clampAffection(payload?.好感度, base.好感度);
  const current_affection = clampAffection(base.好感度, 0);
  const merged_affection = next_affection > current_affection ? Math.min(current_affection + 5, next_affection) : next_affection;
  const is_partner = Array.isArray(base.关系标签) && base.关系标签.includes('伴侣');
  const next = {
    ...base,
    姓名: name,
    好感度: merged_affection,
    态度: String(payload?.态度 || base.态度 || '中立'),
    内心想法: String(payload?.内心想法 || base.内心想法 || ''),
    基础属性: {
      ...(base.基础属性 ?? {}),
      ...(payload?.基础属性 ?? {}),
    },
    最后更新时间: Date.now(),
  };
  next.好感阶段 = calcAffectionStage(next.好感度, is_partner);
  _.set(stat_data, key, next);
  return next;
}

function promoteToLongTermByName(stat_data: any, name: string, reason: string): void {
  const onstage_list = (_.get(stat_data, '界面.在场角色', []) as OnStageCharacter[]);
  const onstage = onstage_list.find(v => v.姓名 === name);
  const npc = upsertLongTermNpc(stat_data, name, onstage);
  const tracker = getTracker(stat_data, name);
  tracker.是否已转长期 = true;
  _.set(stat_data, `世界.长期NPC列表.${name}.关系标签`, _.uniq([...(npc.关系标签 ?? []), reason]));
}

const npc_follow_pattern = /随行|跟随|主动跟随|任务搭档|结成朋友|更亲密关系/;
const npc_partner_ai_pattern = /表白|喜欢|爱/;
const npc_partner_user_confirm_pattern = /我也喜欢|接受|愿意|在一起|答应/;
const npc_sex_pattern = /发生关系|交合|做爱|上床|亲密行为完成/;

function applyUserNpcRequest(stat_data: any, user_content: string): boolean {
  if (!npc_follow_pattern.test(user_content)) return false;
  const onstage_list = (_.get(stat_data, '界面.在场角色', []) as OnStageCharacter[]);
  const names = onstage_list.map(v => v.姓名);
  const mentioned = [...detectMentionedNames(user_content, names)];
  const targets = mentioned.length > 0 ? mentioned : (names.length === 1 ? [names[0]] : []);
  if (targets.length === 0) return false;
  for (const name of targets) {
    const tracker = getTracker(stat_data, name);
    tracker.玩家随行请求命中次数 = asNumber(tracker.玩家随行请求命中次数, 0) + 1;
    tracker.最近玩家请求时间 = Date.now();
    promoteToLongTermByName(stat_data, name, '任务搭档');
  }
  return true;
}

function applyNpcLongTermRules(stat_data: any, ai_content: string, user_content: string, parsed_onstage?: OnStageCharacter[], hints?: NpcRelationHint[]): void {
  ensureNpcData(stat_data);
  const onstage_list = (_.get(stat_data, '界面.在场角色', []) as OnStageCharacter[]);
  const long_map = _.get(stat_data, '世界.长期NPC列表', {}) as Record<string, any>;
  const name_pool = _.uniq([
    ...onstage_list.map(v => v.姓名),
    ...Object.keys(long_map),
    ...(parsed_onstage?.map(v => v.姓名) ?? []),
  ]);
  const structured_names = new Set((parsed_onstage ?? []).map(v => v.姓名));
  const text_mentions = detectMentionedNames(ai_content, name_pool);
  const appeared = new Set<string>([...structured_names, ...text_mentions]);
  const round = asNumber(_.get(stat_data, '主角.战术.当前轮次', 1), 1);

  for (const name of name_pool) {
    const tracker = getTracker(stat_data, name);
    if (appeared.has(name)) {
      tracker.连续出现计数 = asNumber(tracker.连续出现计数, 0) + 1;
      tracker.最近出现轮次 = round;
    } else {
      tracker.连续出现计数 = Math.max(0, asNumber(tracker.连续出现计数, 0) - 1);
    }
    if (tracker.连续出现计数 >= 5 && !tracker.是否已转长期) {
      promoteToLongTermByName(stat_data, name, '连续出现');
    }
  }

  for (const onstage of onstage_list) {
    if (_.has(stat_data, `世界.长期NPC列表.${onstage.姓名}`)) {
      upsertLongTermNpc(stat_data, onstage.姓名, onstage);
    }
  }

  for (const hint of hints ?? []) {
    if (!_.has(long_map, hint.姓名)) continue;
    const curr = _.get(stat_data, `世界.长期NPC列表.${hint.姓名}.关系标签`, []);
    _.set(stat_data, `世界.长期NPC列表.${hint.姓名}.关系标签`, _.uniq([...(curr ?? []), ...hint.标签]));
  }

  const ai_has_partner_signal = npc_partner_ai_pattern.test(ai_content);
  const user_confirm = npc_partner_user_confirm_pattern.test(user_content);
  if (ai_has_partner_signal && user_confirm) {
    for (const name of detectMentionedNames(ai_content, Object.keys(_.get(stat_data, '世界.长期NPC列表', {})))) {
      const score = clampAffection(_.get(stat_data, `世界.长期NPC列表.${name}.好感度`, 0), 0);
      if (score < 601) continue;
      const current_tags = _.get(stat_data, `世界.长期NPC列表.${name}.关系标签`, []);
      const tags = _.uniq([...(Array.isArray(current_tags) ? current_tags : []), '伴侣']);
      _.set(stat_data, `世界.长期NPC列表.${name}.关系标签`, tags);
      _.set(stat_data, `世界.长期NPC列表.${name}.好感阶段`, '伴侣');
      _.set(stat_data, `世界.长期NPC列表.${name}.最后更新时间`, Date.now());
    }
  }

  if (npc_sex_pattern.test(ai_content)) {
    for (const name of detectMentionedNames(ai_content, Object.keys(_.get(stat_data, '世界.长期NPC列表', {})))) {
      const count = asNumber(_.get(stat_data, `世界.长期NPC列表.${name}.性行为次数`, 0), 0) + 1;
      _.set(stat_data, `世界.长期NPC列表.${name}.性行为次数`, count);
      _.set(stat_data, `世界.长期NPC列表.${name}.贞洁状态`, '非处女');
      _.set(stat_data, `世界.长期NPC列表.${name}.最后更新时间`, Date.now());
    }
  }
}

function applyVivianaArc(stat_data: any): void {
  const current_place = String(_.get(stat_data, '世界.当前地点', ''));
  const in_library = /大图书馆/.test(current_place);
  const onstage = _.get(stat_data, '界面.在场角色', []) as OnStageCharacter[];
  const long_map = _.get(stat_data, '世界.长期NPC列表', {}) as Record<string, any>;
  const names = _.uniq([
    ...onstage.map(v => String(v.姓名 || '')),
    ...Object.keys(long_map),
  ]).filter(v => /薇薇安娜/.test(v));
  if (names.length === 0) return;

  for (const name of names) {
    if (!in_library) {
      _.remove(onstage, v => String(v?.姓名 ?? '') === name);
      continue;
    }
    const npc = _.get(stat_data, `世界.长期NPC列表.${name}`, {});
    const score = clampAffection(_.get(npc, '好感度', 0), 0);
    const stage = String(_.get(npc, '好感阶段', calcAffectionStage(score)));
    const is_partner = stage === '伴侣' || (Array.isArray(_.get(npc, '关系标签')) && _.get(npc, '关系标签').includes('伴侣'));

    let attitude = '审视中的礼貌';
    let thought = '她在评估你是否理解“记录真实”与“承担后果”之间的重量。';
    if (score >= 1) {
      attitude = '克制友善';
      thought = '她愿意多给你一条线索，但仍保持必要的距离与边界。';
    }
    if (score >= 101) {
      attitude = '谨慎信任';
      thought = '她开始把你视作可合作的记录者，而非短暂访客。';
    }
    if (score >= 401) {
      attitude = '高位盟友';
      thought = '她愿意在关键节点给出判断，但仍避免替你做决定。';
    }
    if (score >= 601) {
      attitude = '深度信任';
      thought = '她允许你触及更深层的历史片段，但要求你承担相应代价。';
    }
    if (is_partner) {
      attitude = '伴侣（成熟克制）';
      thought = '她的亲密建立在尊重与分寸上，不依恋、不占有，只在关键时刻并肩。';
      _.set(stat_data, `世界.长期NPC列表.${name}.好感阶段`, '伴侣');
    }

    _.set(stat_data, `世界.长期NPC列表.${name}.态度`, attitude);
    _.set(stat_data, `世界.长期NPC列表.${name}.内心想法`, thought);
    _.set(stat_data, `世界.长期NPC列表.${name}.最后更新时间`, Date.now());

    const idx = onstage.findIndex(v => String(v?.姓名 ?? '') === name);
    if (idx >= 0) {
      onstage[idx].态度 = attitude;
      onstage[idx].内心想法 = `本回合：${thought}`;
      onstage[idx].更新时间 = Date.now();
    }
  }
}

const dungeon_enter_pattern = /进入副本|进入希尔顿实验室|开始副本|副本探索|下副本|进入实验室/i;
const dungeon_leave_pattern = /离开副本|副本结束|撤离副本|通关副本|退出实验室/i;
const dungeon_move_pattern = /前往|推进|移动到|去往|转移到|深入|进入房间/i;
const dungeon_search_pattern = /搜索|搜刮|开箱|打开容器|翻找|调查容器|检查容器/i;
const dungeon_blow_pattern = /爆破|炸开|大当量|强行炸门|炸门/i;

const lab_level_options = ['基础实验室', '被封锁的实验室', '被封锁的机密实验室', '被封锁的顶点实验室'] as const;
const lab_room_pool: Record<'一般' | '不错' | '危险' | '隐藏', string[]> = {
  一般: ['保安室', '食堂', '破损的生物实验室', '职员办公室', '职员宿舍', '工作间', '车间', '车库'],
  不错: ['培养皿房间', '初级武器实验室', '图书馆', '生物实验室', '研究员办公室', '破损的物理实验室', '休息区', '地库', '化学实验室'],
  危险: ['危险房间', '测试场地', '破损的通风区', '泄露的生物实验室', '工业设施', '颠倒的物理实验室', '破损的房间'],
  隐藏: ['高级武器实验室', '总裁办公室', '总裁休息间', '保险仓库', '物理实验室', '不死鸟武器储藏点'],
};

type ItemTier = '通用' | '良好' | '优秀' | '机密' | '实验' | '收藏';
const tier_value_range: Record<ItemTier, [number, number]> = {
  通用: [1, 1000],
  良好: [1001, 5000],
  优秀: [5001, 20000],
  机密: [20001, 50000],
  实验: [50001, 200000],
  收藏: [200001, 20000000],
};
const tier_affix_count: Record<ItemTier, number> = {
  通用: 0,
  良好: 1,
  优秀: 2,
  机密: 3,
  实验: 4,
  收藏: 5,
};
const affix_pool = [
  '高精度', '抗污染', '快拆', '穿甲', '高频', '稳定供能', '灵装共鸣', '自动校准', '扩容弹仓', '轻量化',
];
const trade_only_items = ['金手表', '金色钢笔', '盛宴雕塑', '古董银杯', '鎏金怀表'];
const black_market_trade_pattern = /黑市.*(出售|卖出|卖掉|抛售|卖)/i;
const black_market_buy_pattern = /黑市.*(购买|买入|买下|买)/i;

function parseLabLevel(content: string): (typeof lab_level_options)[number] {
  if (/顶点实验室/.test(content)) return '被封锁的顶点实验室';
  if (/机密实验室/.test(content)) return '被封锁的机密实验室';
  if (/被封锁的实验室/.test(content)) return '被封锁的实验室';
  return '基础实验室';
}

function parseMapScale(content: string, level: (typeof lab_level_options)[number]): '小型' | '中型' | '大型' {
  if (/大型/.test(content)) return '大型';
  if (/中型/.test(content)) return '中型';
  if (/小型/.test(content)) return '小型';
  if (level === '被封锁的顶点实验室' || level === '被封锁的机密实验室') return '大型';
  if (level === '被封锁的实验室') return '中型';
  return '小型';
}

function rollRoomTypeByLuck(luck: number): '一般' | '不错' | '危险' | '隐藏' {
  // 权重1.0基准：隐藏1，不错2~3，一般4~7，陷阱/战斗8~9，危险10
  // 幸运偏转：每20幸运 +0.1，按规则把一般/危险向不错方向偏移
  const shift = Math.max(0, Math.floor(luck / 20));
  let good_weight = 2 + shift;
  let normal_weight = Math.max(1, 4 - shift);
  let danger_weight = 1;
  let risky_weight = 2;
  if (shift >= 2) {
    risky_weight = Math.max(1, risky_weight - Math.floor(shift / 2));
  }
  const hidden_weight = 1;
  const total = hidden_weight + good_weight + normal_weight + risky_weight + danger_weight;
  const r = Math.random() * total;
  if (r < hidden_weight) return '隐藏';
  if (r < hidden_weight + good_weight) return '不错';
  if (r < hidden_weight + good_weight + normal_weight) return '一般';
  // 危险房间与陷阱/战斗房间合并为危险类型，但后续容器规则区分
  return '危险';
}

function buildRoomContainer(room_type: '一般' | '不错' | '危险' | '隐藏'): { 普通: number; 高级: number; 上锁: boolean; 已搜索: boolean } {
  if (room_type === '隐藏') return { 普通: 0, 高级: 4, 上锁: false, 已搜索: false };
  if (room_type === '不错') {
    const locked = Math.random() < 0.35;
    return locked
      ? { 普通: 0, 高级: _.random(2, 5), 上锁: true, 已搜索: false }
      : { 普通: 1, 高级: 1, 上锁: false, 已搜索: false };
  }
  if (room_type === '一般') return { 普通: 2, 高级: 0, 上锁: false, 已搜索: false };
  const trap_or_danger = Math.random() < 0.7; // 陷阱/战斗房间可有1普通，纯危险房间无容器
  return { 普通: trap_or_danger ? 1 : 0, 高级: 0, 上锁: false, 已搜索: false };
}

function generateDungeonMap(level: (typeof lab_level_options)[number], scale: '小型' | '中型' | '大型', luck: number): any[] {
  const count = scale === '小型' ? 5 : scale === '中型' ? 12 : 20;
  const rooms: any[] = [];
  for (let i = 1; i <= count; i += 1) {
    const room_type = rollRoomTypeByLuck(luck);
    // 允许重复出现：危险/一般房间按“有放回抽样”自然可重复
    const room_name = _.sample(lab_room_pool[room_type]) ?? (room_type === '一般' ? '工作间' : '未知房间');
    rooms.push({
      序号: i,
      房间名: room_name,
      房间类型: room_type,
      容器: buildRoomContainer(room_type),
    });
  }
  return rooms;
}

function pickLootQuality(level: (typeof lab_level_options)[number], is_advanced: boolean): ItemTier {
  const roll = _.random(1, 100);
  if (level === '被封锁的顶点实验室') {
    if (roll >= 96) return '收藏';
    if (roll >= 75) return '实验';
    if (roll >= 45) return '机密';
    if (roll >= 20) return '优秀';
    return is_advanced ? '良好' : '通用';
  }
  if (level === '被封锁的机密实验室') {
    if (roll >= 97) return '收藏';
    if (roll >= 82) return '实验';
    if (roll >= 55) return '机密';
    if (roll >= 25) return '优秀';
    return is_advanced ? '良好' : '通用';
  }
  if (level === '被封锁的实验室') {
    if (roll >= 95) return '实验';
    if (roll >= 75) return '机密';
    if (roll >= 45) return '优秀';
    if (roll >= 20) return '良好';
    return '通用';
  }
  if (roll >= 98) return '实验';
  if (roll >= 85) return '机密';
  if (roll >= 60) return '优秀';
  if (roll >= 30) return '良好';
  return '通用';
}

function addWarehouseItem(stat_data: any, item_name: string, quality: ItemTier, count: number, category: string, desc: string, value: number, tags: string[], tradeable = true): void {
  if (item_name === '联合币') {
    _.set(stat_data, '战利品.仓库.联合币', asNumber(_.get(stat_data, '战利品.仓库.联合币', 0), 0) + count);
    return;
  }
  if (item_name === '芯片') {
    _.set(stat_data, '战利品.仓库.芯片', asNumber(_.get(stat_data, '战利品.仓库.芯片', 0), 0) + count);
    return;
  }
  const key = `战利品.仓库.物品.${item_name}`;
  const old_count = asNumber(_.get(stat_data, `${key}.数量`, 0), 0);
  const old_tags = _.get(stat_data, `${key}.词条`, []);
  _.set(stat_data, key, {
    品质: quality,
    数量: old_count + count,
    价值: value,
    分类: category,
    描述: desc,
    词条: _.uniq([...(Array.isArray(old_tags) ? old_tags : []), ...tags]),
    可交易: tradeable,
  });
  if (/收藏|机密|实验/.test(quality)) {
    const curr = _.get(stat_data, '战利品.仓库.独特收藏品', []);
    _.set(stat_data, '战利品.仓库.独特收藏品', _.uniq([...(Array.isArray(curr) ? curr : []), item_name]));
  }
}

function generateLootFromContainer(stat_data: any, level: (typeof lab_level_options)[number], container_type: '普通' | '高级', slot_override?: number): Record<string, any> {
  const slots = slot_override ?? (container_type === '高级' ? 3 : 2);
  const loot: Record<string, any> = {};
  const pools = {
    武器: ['制式步枪', '战术手枪', '高频匕首', '实验型枪机', '灵装增幅器'],
    资源: ['联合币', '芯片', '魔力碎片', '修复套件'],
    收藏: ['古董怀表', '残损铭牌', '星辉玻片', '封蜡档案'],
    医疗: ['急救针剂', '应急医疗箱', '生物稳定剂'],
  };
  for (let i = 0; i < slots; i += 1) {
    const quality = pickLootQuality(level, container_type === '高级');
    const category = quality === '通用' || quality === '良好'
      ? _.sample(['资源', '医疗', '武器']) ?? '资源'
      : _.sample(['武器', '收藏', '资源']) ?? '武器';
    const is_trade_only = category === '收藏' && Math.random() < 0.45;
    const item_name = (() => {
      if (is_trade_only) return _.sample(trade_only_items) ?? '金手表';
      if (quality === '收藏') return Math.random() < 0.25 ? '不死鸟实验原型' : '机密馆藏';
      if (quality === '实验') return '顶点实验模块';
      if (quality === '机密') return '机密数据芯片';
      return _.sample((pools as any)[category]) ?? '联合币';
    })();
    const count = item_name === '联合币' ? _.random(40, 280) : item_name === '芯片' ? _.random(1, 4) : 1;
    const [vmin, vmax] = tier_value_range[quality];
    const value = _.random(vmin, vmax);
    const tags = is_trade_only ? [] : _.sampleSize(affix_pool, tier_affix_count[quality]);
    loot[item_name] = {
      品质: quality,
      数量: asNumber(_.get(loot, `${item_name}.数量`, 0), 0) + count,
      价值: value,
    };
    addWarehouseItem(stat_data, item_name, quality, count, category, `${container_type}容器掉落`, value, tags, true);
  }
  return loot;
}

function mergeLootRecord(target: Record<string, any>, incoming: Record<string, any>): void {
  for (const [name, item] of Object.entries(incoming)) {
    const old_count = asNumber(_.get(target, `${name}.数量`, 0), 0);
    target[name] = {
      品质: String((item as any)?.品质 ?? _.get(target, `${name}.品质`, '通用')),
      数量: old_count + asNumber((item as any)?.数量, 0),
      价值: asNumber((item as any)?.价值, asNumber(_.get(target, `${name}.价值`, 1), 1)),
    };
  }
}

function applyDungeonLootSystem(stat_data: any, content: string): void {
  ensureNpcData(stat_data);
  const level = parseLabLevel(content);
  const scale = parseMapScale(content, level);
  const luck = asNumber(_.get(stat_data, '主角.人类属性.感知', 1), 1) * 20;

  if (dungeon_enter_pattern.test(content)) {
    const map = generateDungeonMap(level, scale, luck);
    _.set(stat_data, '战利品.副本', {
      已激活: true,
      副本名称: '希尔顿实验室',
      实验室等级: level,
      地图规模: scale,
      房间总数: map.length,
      当前房间索引: 0,
      已探索房间: 1,
      最近房间: map[0]?.房间名 ?? '',
      最近结算: `副本生成完成：${level}/${scale}/${map.length}房`,
      房间列表: map,
    });
    _.set(stat_data, '战利品.显示战利品', true);
    _.set(stat_data, '世界.近期事务.副本', `已进入希尔顿实验室（${level}，${scale}）`);
    return;
  }

  if (!Boolean(_.get(stat_data, '战利品.副本.已激活', false))) return;
  const rooms = _.get(stat_data, '战利品.副本.房间列表', []) as any[];
  if (!Array.isArray(rooms) || rooms.length === 0) return;
  let idx = _.clamp(asNumber(_.get(stat_data, '战利品.副本.当前房间索引', 0), 0), 0, rooms.length - 1);

  if (dungeon_move_pattern.test(content)) {
    idx = Math.min(rooms.length - 1, idx + 1);
    _.set(stat_data, '战利品.副本.当前房间索引', idx);
    _.set(stat_data, '战利品.副本.已探索房间', Math.max(asNumber(_.get(stat_data, '战利品.副本.已探索房间', 1), 1), idx + 1));
    _.set(stat_data, '战利品.副本.最近房间', String(rooms[idx]?.房间名 ?? '未知'));
  }

  if (dungeon_search_pattern.test(content)) {
    const room = rooms[idx];
    if (room?.容器?.已搜索) {
      _.set(stat_data, '战利品.最近获取', {});
      _.set(stat_data, '战利品.副本.最近结算', `房间${idx + 1}已搜索过，本次无新增战利品`);
      _.set(stat_data, '战利品.显示战利品', true);
    } else {
      const merged_loot: Record<string, any> = {};
      const is_blow = dungeon_blow_pattern.test(content) && Boolean(room?.容器?.上锁);
      const slot_override = is_blow ? 1 : undefined;
      const normal_count = asNumber(room?.容器?.普通, 0);
      const advanced_count = asNumber(room?.容器?.高级, 0);

      for (let i = 0; i < normal_count; i += 1) {
        const loot = generateLootFromContainer(stat_data, _.get(stat_data, '战利品.副本.实验室等级', level), '普通', slot_override);
        mergeLootRecord(merged_loot, loot);
      }
      for (let i = 0; i < advanced_count; i += 1) {
        const loot = generateLootFromContainer(stat_data, _.get(stat_data, '战利品.副本.实验室等级', level), '高级', slot_override);
        mergeLootRecord(merged_loot, loot);
      }

      _.set(room, '容器.已搜索', true);
      _.set(stat_data, '战利品.最近获取', merged_loot);
      _.set(stat_data, '战利品.显示战利品', true);
      _.set(stat_data, '战利品.副本.最近结算', is_blow ? '上锁门爆破，容器内容缩水为1槽/容器' : `房间${idx + 1}完成搜索`);
      _.set(stat_data, `战场日志.战利品-${Date.now()}`, `副本房间${idx + 1}:${room?.房间名 ?? '未知'} 已结算战利品`);
      trimBattleLogs(stat_data, 3);
    }
  }

  if (dungeon_leave_pattern.test(content)) {
    _.set(stat_data, '战利品.副本.已激活', false);
    _.set(stat_data, '世界.近期事务.副本', '已撤离希尔顿实验室');
  }
}

function applyBlackMarketTrade(stat_data: any, content: string): void {
  if (!/黑市|学院南侧/.test(content)) return;
  const market_place = '威曼普学院南侧黑市';
  if (/进入黑市|前往黑市|到黑市|学院南侧黑市/.test(content)) {
    _.set(stat_data, '世界.当前地点', market_place);
    _.set(stat_data, '世界.近期事务.黑市', '已进入学院南侧黑市（仅联合币储蓄卡交易）');
  }

  const items = _.get(stat_data, '战利品.仓库.物品', {}) as Record<string, any>;
  const names = Object.keys(items);
  if (black_market_trade_pattern.test(content)) {
    const targets = [...detectMentionedNames(content, names)];
    for (const name of targets) {
      const qty_match = content.match(new RegExp(`${_.escapeRegExp(name)}\\D*(\\d+)`, 'i'));
      const sell_qty = Math.max(1, asNumber(qty_match?.[1], 1));
      const own_qty = asNumber(_.get(stat_data, `战利品.仓库.物品.${name}.数量`, 0), 0);
      if (own_qty <= 0) continue;
      const use_qty = Math.min(own_qty, sell_qty);
      const value = asNumber(_.get(stat_data, `战利品.仓库.物品.${name}.价值`, 1), 1);
      const tradeable = Boolean(_.get(stat_data, `战利品.仓库.物品.${name}.可交易`, true));
      if (!tradeable) continue;
      const income = Math.floor(value * use_qty * 0.1); // 黑市折价90%
      _.set(stat_data, '战利品.仓库.联合币', asNumber(_.get(stat_data, '战利品.仓库.联合币', 0), 0) + income);
      const left = own_qty - use_qty;
      if (left <= 0) _.unset(stat_data, `战利品.仓库.物品.${name}`);
      else _.set(stat_data, `战利品.仓库.物品.${name}.数量`, left);
      _.set(stat_data, '战利品.副本.最近结算', `黑市售出 ${name} x${use_qty}，入账${income}联合币（折价90%）`);
    }
  }

  if (black_market_buy_pattern.test(content)) {
    const want_tier = (['收藏', '实验', '机密', '优秀', '良好', '通用'] as ItemTier[]).find(t => content.includes(t)) ?? '良好';
    const [vmin, vmax] = tier_value_range[want_tier];
    const price = _.random(vmin, vmax);
    const money = asNumber(_.get(stat_data, '战利品.仓库.联合币', 0), 0);
    if (money >= price) {
      _.set(stat_data, '战利品.仓库.联合币', money - price);
      const item_name = `${want_tier}黑市货-${Date.now().toString().slice(-4)}`;
      const tags = _.sampleSize(affix_pool, tier_affix_count[want_tier]);
      addWarehouseItem(stat_data, item_name, want_tier, 1, '黑市', '黑市购入', price, tags, true);
      _.set(stat_data, '战利品.副本.最近结算', `黑市购入 ${item_name}（${want_tier}） 花费${price}联合币`);
    } else {
      _.set(stat_data, '战利品.副本.最近结算', `黑市购入失败：联合币不足（需${price}，现有${money}）`);
    }
  }
}

function hasExplicitUpdateTag(content: string): boolean {
  return /<update(?:variable)?>[\s\S]*?<\/update(?:variable)?>|<update(?:variable)?>[\s\S]*$/im.test(content);
}

function patchGameplayState(stat_data: any, content: string): void {
  if (!stat_data || typeof stat_data !== 'object') return;

  const profession = _.get(stat_data, '界面.建卡.职业', '');
  const is_warmaid = profession === '战姬' || String(_.get(stat_data, '主角.档案.身份路径', '')).includes('战姬');
  if (!is_warmaid) {
    _.set(stat_data, '主角.灵装化.启用', false);
    _.set(stat_data, '战利品.显示战利品', false);
    return;
  }

  const current_round = asNumber(_.get(stat_data, '主角.战术.当前轮次', 0), 0);
  const line = String(_.get(stat_data, '主角.战术.当前阵线', ''));
  const threat = String(_.get(stat_data, '世界.战区威胁等级', ''));
  const manual_toggle = Boolean(_.get(stat_data, '主角.灵装化.手动切换', false));

  const battle_by_state = current_round > 1 || line === '前线' || line === '交锋区' || threat === '高' || threat === '极危';
  const battle_by_text = /战斗|交战|接敌|开火|敌袭|突击|火力压制|回合|战场|异种来袭|进入战区/i.test(content);
  const in_battle = battle_by_state || battle_by_text;

  const was_enabled = Boolean(_.get(stat_data, '主角.灵装化.启用', false));
  const should_enable = manual_toggle || in_battle;
  _.set(stat_data, '主角.灵装化.启用', should_enable);

  let last_round = asNumber(_.get(stat_data, '主角.灵装化.上次结算轮次', 0), 0);
  if (!was_enabled && should_enable) {
    last_round = current_round;
    _.set(stat_data, '主角.灵装化.上次结算轮次', current_round);
  }

  if (should_enable) {
    const round_delta = Math.max(0, current_round - last_round);
    if (round_delta > 0) {
      const magic_cost = asNumber(_.get(stat_data, '主角.灵装化.每回合耗魔', 0), 0) * round_delta;
      const slot_cost = asNumber(_.get(stat_data, '主角.灵装化.每回合耗槽', 0), 0) * round_delta;

      const current_magic = asNumber(_.get(stat_data, '主角.资源.当前魔力', 0), 0);
      const current_slot = asNumber(_.get(stat_data, '主角.资源.灵装槽当前', 0), 0);
      const next_magic = Math.max(0, current_magic - magic_cost);
      const next_slot = Math.max(0, current_slot - slot_cost);

      _.set(stat_data, '主角.资源.当前魔力', next_magic);
      _.set(stat_data, '主角.资源.灵装槽当前', next_slot);
      _.set(stat_data, '主角.灵装化.上次结算轮次', current_round);

      if (next_magic <= 0 || next_slot <= 0) {
        _.set(stat_data, '主角.灵装化.启用', false);
        _.set(stat_data, '主角.灵装化.手动切换', false);
      }
    }
  } else if (last_round > current_round) {
    _.set(stat_data, '主角.灵装化.上次结算轮次', current_round);
  }

  // 战利品显示改由完整副本/容器系统控制，避免关键词误触发。
}

function getWarmaidType(stat_data: any): string {
  return String(
    _.get(stat_data, '界面.建卡.战姬类型', '').trim()
      || _.get(stat_data, '主角.档案.身份路径', '').replace('战姬-', '').trim(),
  );
}

function applyBattleSystemConstraints(stat_data: any, content: string): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  ensureAirCombatData(stat_data);

  const mode_by_text =
    /地面战|巷战|室内战|近身战|步战|地表交战/i.test(content) ? '地面战'
      : /空战|制空|空域|空中交战|空袭/i.test(content) ? '空战'
        : '非战斗';
  const current_round = asNumber(_.get(stat_data, '主角.战术.当前轮次', 1), 1);
  const threat = String(_.get(stat_data, '世界.战区威胁等级', ''));
  const line = String(_.get(stat_data, '主角.战术.当前阵线', '中线'));
  const in_battle_by_state = current_round > 1 || line === '前线' || line === '交锋区' || threat === '高' || threat === '极危';
  const in_battle_by_text = /战斗|交战|接敌|开火|敌袭|突击|火力压制|回合|战场|异种来袭|进入战区/i.test(content);
  const in_battle = in_battle_by_state || in_battle_by_text;

  const mode = in_battle ? (mode_by_text === '非战斗' ? '空战' : mode_by_text) : '非战斗';
  _.set(stat_data, '主角.战术.战斗模式', mode);
  _.set(stat_data, '主角.战术.是否战斗中', in_battle);

  if (!in_battle) {
    _.set(stat_data, '主角.资源.行动点', 1);
    _.set(stat_data, '主角.资源.移动点', 1);
    _.set(stat_data, '主角.战术.火力惩罚', '无');
    return;
  }

  const profession = _.get(stat_data, '界面.建卡.职业', '');
  const warmaid_type = getWarmaidType(stat_data);
  const is_commander = profession === '指挥官';
  const is_authority = profession === '权柄使役者';

  let ap = 1;
  let mp = 1;
  let penalty = '无';

  if (mode === '地面战') {
    const agi = asNumber(_.get(stat_data, '主角.人类属性.敏捷', 1), 1);
    ap = Math.max(1, Math.floor(agi / 3));
    mp = warmaid_type === '要塞型' ? 0 : 1;
  } else if (is_commander) {
    ap = 1;
    mp = 1;
    if (line !== '后卫') {
      _.set(stat_data, '主角.战术.当前阵线', '后卫');
    }
  } else if (is_authority) {
    ap = 1;
    mp = 1;
  } else {
    if (warmaid_type === '侦察型') {
      ap = 1; mp = 2;
    } else if (warmaid_type === '轻型') {
      ap = 2; mp = 1;
    } else if (warmaid_type === '中型') {
      ap = 1; mp = 1;
    } else if (warmaid_type === '重型') {
      ap = 1;
      const move_counter = asNumber(_.get(stat_data, '主角.战术.重型移动计数', 0), 0) + 1;
      _.set(stat_data, '主角.战术.重型移动计数', move_counter % 2);
      mp = move_counter % 2 === 0 ? 1 : 0;
      if (line === '前线') penalty = '重型前线火力惩罚：伤害骰-1/3';
      if (line === '交锋区') penalty = '重型交锋区火力惩罚：伤害骰-1/2';
    } else if (warmaid_type === '要塞型') {
      ap = 1;
      mp = 0;
      if (line === '中线') penalty = '要塞中线火力惩罚：伤害骰-1/2';
      if (line === '前线' || line === '交锋区') penalty = '要塞前线/交锋区仅可使用自卫灵装';
    } else if (warmaid_type === '地面支援姬') {
      ap = 1; mp = 1;
    }
  }

  _.set(stat_data, '主角.资源.行动点', ap);
  _.set(stat_data, '主角.资源.移动点', mp);
  if (mode === '空战') {
    const weather_hit = asNumber(_.get(stat_data, '主角.战术.空战.天气命中修正', 0), 0);
    const superiority = asNumber(_.get(stat_data, '主角.战术.空战.制空修正', 0), 0);
    const heavy_condition = String(_.get(stat_data, '主角.战术.空战.重武器命中条件', '无'));
    const transform_on = Boolean(_.get(stat_data, '主角.灵装化.启用', false));
    const airflow_penalty = `空战命中修正: 天气${weather_hit >= 0 ? '+' : ''}${weather_hit} / 制空${superiority >= 0 ? '+' : ''}${superiority} | 重武器条件:${heavy_condition}`;
    penalty = penalty === '无' ? airflow_penalty : `${penalty}；${airflow_penalty}`;
    if (!transform_on && !is_commander && !is_authority) {
      penalty = `${penalty}；警告: 非灵装化空战，伤亡风险极高`;
    }
  }

  _.set(stat_data, '主角.战术.火力惩罚', penalty);
}

function applyHumanTraining(stat_data: any, content: string): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  const attrs: Array<'力量' | '敏捷' | '体质' | '感知' | '意志' | '魅力' | '学识'> = [
    '力量',
    '敏捷',
    '体质',
    '感知',
    '意志',
    '魅力',
    '学识',
  ];

  const keyword_map: Record<(typeof attrs)[number], RegExp> = {
    力量: /力量|负重|搬运|举起|挥击|拳击|体能|肌力/i,
    敏捷: /敏捷|闪避|躲避|疾跑|冲刺|翻滚|机动/i,
    体质: /体质|耐力|抗打|恢复|硬抗|承伤|受伤后坚持/i,
    感知: /感知|观察|侦察|洞察|听觉|视野|发现|感应/i,
    意志: /意志|精神|专注|抗压|毅力|抗干扰|冷静/i,
    魅力: /魅力|交涉|说服|领导|社交|鼓舞|谈判/i,
    学识: /学识|知识|研究|分析|学习|推理|理论|解读/i,
  };

  attrs.forEach(attr => {
    const matched = keyword_map[attr].test(content);
    if (!matched) return;

    const current_attr = asNumber(_.get(stat_data, `主角.人类属性.${attr}`, 1), 1);
    if (current_attr >= 5) {
      _.set(stat_data, `主角.锻炼.${attr}`, 100);
      return;
    }

    const current_train = asNumber(_.get(stat_data, `主角.锻炼.${attr}`, 0), 0);
    const next_train = Math.min(100, current_train + 1);

    if (next_train >= 100) {
      _.set(stat_data, `主角.人类属性.${attr}`, Math.min(5, current_attr + 1));
      _.set(stat_data, `主角.锻炼.${attr}`, 0);
    } else {
      _.set(stat_data, `主角.锻炼.${attr}`, next_train);
    }
  });
}

type SkillAttr = '力量' | '敏捷' | '体质' | '感知' | '意志' | '魅力' | '学识' | '无';

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function inferSkillAttr(content: string): SkillAttr {
  const map: Array<{ attr: SkillAttr; pattern: RegExp }> = [
    { attr: '力量', pattern: /力量|搬运|举起|破门|推开|推动|推车|推行|拖拽|扛起|扛着|挥击|拳击|擒抱|攀爬|投掷|撬开|砸|砸开|砸墙|破墙|撞墙|破拆/i },
    { attr: '敏捷', pattern: /敏捷|闪避|躲避|冲刺|翻滚|疾跑|潜入|潜行|跳跃|翻越|驾驶|快速反应/i },
    { attr: '体质', pattern: /体质|耐力|硬抗|抗伤|扛住|恢复|憋气|抗毒|忍痛|耐寒|耐热|极端环境/i },
    { attr: '感知', pattern: /感知|侦察|观察|洞察|听声|追踪|搜索|聆听|察觉|察言观色|危险感知|找线索/i },
    { attr: '意志', pattern: /意志|精神|专注|抗压|抗恐惧|抵抗干扰|san|理智|催眠抵抗|精神对抗|心智/i },
    { attr: '魅力', pattern: /魅力|交涉|说服|谈判|鼓舞|社交|话术|魅惑|恐吓|礼仪|周旋/i },
    { attr: '学识', pattern: /学识|分析|研究|解读|知识|推理|图书馆|神秘学|历史|医学|数学|语文|英语|科学|计算|解题/i },
  ];
  const hit = map.find(item => item.pattern.test(content));
  return hit?.attr ?? '无';
}

function inferActionTag(content: string): string {
  const rules: Array<{ tag: string; pattern: RegExp }> = [
    { tag: '破拆', pattern: /砸|砸开|砸墙|破墙|破拆|撞墙|拆墙|破门/i },
    { tag: '推车', pattern: /推车|推动|推行|拖拽/i },
    { tag: '搬运', pattern: /搬运|举起|扛起|抬起|负重/i },
    { tag: '冲刺', pattern: /冲刺|疾跑|快速推进/i },
    { tag: '闪避', pattern: /闪避|躲避|翻滚/i },
    { tag: '侦察', pattern: /侦察|搜索|观察|洞察|追踪/i },
    { tag: '交涉', pattern: /交涉|说服|谈判|协商/i },
    { tag: '分析', pattern: /分析|研究|解读|推理/i },
    { tag: '抵抗', pattern: /抵抗|抗压|抗恐惧|硬抗/i },
  ];
  return rules.find(r => r.pattern.test(content))?.tag ?? '通用动作';
}

function inferDifficulty(content: string, attr: SkillAttr): { penalty: number; label: string } {
  let penalty = 0;
  const hard = /高等|高阶|复杂|精密|微积分|偏微分|拓扑|密码破译|三语同传|古文献|极限|高压|极端|战场极端环境/i.test(content);
  const extreme = /专家级|大师级|传奇级|远超常人|超人|不可能|不现实|几乎无法完成/i.test(content);

  if (hard) penalty += 2;
  if (extreme) penalty += 2;

  if (attr === '学识' && /数学|语文|英语|解题|推导|证明|翻译/i.test(content) && hard) {
    penalty += 1;
  }

  if (penalty <= 0) return { penalty: 0, label: '常规难度' };
  if (penalty <= 2) return { penalty, label: '困难难度' };
  if (penalty <= 4) return { penalty, label: '极难难度' };
  return { penalty: Math.min(6, penalty), label: '超常难度' };
}

type SkillOutcome = {
  attr: SkillAttr;
  action_tag: string;
  current_round: number;
  raw: number;
  bonus: number;
  difficulty_penalty: number;
  difficulty_label: string;
  total: number;
  result: '大成功' | '成功' | '失败' | '大失败';
  desc: string;
  lock_to_round: number;
  hp_loss: number;
  mp_loss: number;
};

type PendingSkillState = {
  user_message_id: number;
  source_content: string;
  outcome: SkillOutcome;
  feedback_prompt: string;
  injected: boolean;
  game_over: boolean;
};

function resolveSkillOutcome(stat_data: any, content: string, raw_override?: number): SkillOutcome | undefined {
  const has_explicit_check = /检定|判定|骰点/i.test(content);
  const has_action_verb = /尝试|试图|开始|进行|执行|用力|发力|冲刺|推进|推开|推动|推车|搬运|举起|观察|侦察|搜索|说服|交涉|谈判|分析|研究|解读|抵抗|闪避|躲避|潜行|攀爬|投掷|聆听|san|图书馆|神秘学|历史|医学|数学|语文|英语|解题/i.test(content);
  const inferred_attr = inferSkillAttr(content);
  const should_check = has_explicit_check || (has_action_verb && inferred_attr !== '无');
  if (!should_check) return undefined;

  const attr = inferred_attr;
  const action_tag = inferActionTag(content);
  const current_round = asNumber(_.get(stat_data, '主角.战术.当前轮次', 1), 1);
  const lock_action = String(_.get(stat_data, '主角.技能检定.封锁行为', ''));
  const lock_until = asNumber(_.get(stat_data, '主角.技能检定.封锁至轮次', 0), 0);

  if (lock_action && lock_action === action_tag && current_round <= lock_until) {
    return {
      attr,
      action_tag,
      current_round,
      raw: 1,
      bonus: 0,
      difficulty_penalty: 0,
      difficulty_label: '封锁中',
      total: 0,
      result: '失败',
      desc: `你在前次失败中受挫，${action_tag} 被封锁至第 ${lock_until} 轮，当前无法重复。`,
      lock_to_round: lock_until,
      hp_loss: 0,
      mp_loss: 0,
    };
  }

  const bonus = attr === '无' ? 0 : asNumber(_.get(stat_data, `主角.人类属性.${attr}`, 0), 0);
  const difficulty = inferDifficulty(content, attr);
  const raw = _.clamp(raw_override ?? rollD10(), 1, 10);
  const total = Math.max(0, raw + bonus - difficulty.penalty);

  let result: '大成功' | '成功' | '失败' | '大失败' = '失败';
  let desc = '';
  if (raw === 10) {
    result = '大成功';
    desc = '原始骰点=10，触发大成功。';
  } else if (raw === 1) {
    result = '大失败';
    desc = '原始骰点=1，触发大失败。';
  } else if (total > 5) {
    result = '成功';
    desc = `通过检定（高于目标值 ${total - 5}），成功幅度越大效果越好。`;
  } else {
    result = '失败';
    desc = `未通过检定（低于目标值 ${5 - total}），差距越大负面结果越重。`;
  }

  let lock_to_round = 0;
  let hp_loss = 0;
  let mp_loss = 0;
  if (result === '失败' || result === '大失败') {
    const lock_rounds = result === '大失败' ? 4 : 2;
    lock_to_round = current_round + lock_rounds;
    hp_loss = result === '大失败' ? 12 : 4;
    mp_loss = result === '大失败' ? 15 : 5;
    desc += ` 你受到惩罚：生命-${hp_loss}，魔力-${mp_loss}，并在第 ${lock_to_round} 轮前无法重复该动作。`;
  }

  return {
    attr,
    action_tag,
    current_round,
    raw,
    bonus,
    difficulty_penalty: difficulty.penalty,
    difficulty_label: difficulty.label,
    total,
    result,
    desc,
    lock_to_round,
    hp_loss,
    mp_loss,
  };
}

function applyResolvedSkillOutcome(stat_data: any, content: string, outcome: SkillOutcome): void {
  if (outcome.result === '失败' || outcome.result === '大失败') {
    const lock_rounds = outcome.result === '大失败' ? 4 : 2;
    _.set(stat_data, '主角.技能检定.封锁行为', outcome.action_tag);
    _.set(stat_data, '主角.技能检定.封锁至轮次', outcome.lock_to_round);
    _.set(
      stat_data,
      `主角.异常状态.${outcome.action_tag}受挫`,
      {
        等级: outcome.result === '大失败' ? '致命' : '严重',
        效果: outcome.result === '大失败' ? '重创与心理压迫，短期内无法重复该动作。' : '动作受挫，短期内无法重复该动作。',
        剩余轮次: lock_rounds,
      },
    );
    _.set(stat_data, '主角.资源.当前生命', Math.max(0, asNumber(_.get(stat_data, '主角.资源.当前生命', 0), 0) - outcome.hp_loss));
    _.set(stat_data, '主角.资源.当前魔力', Math.max(0, asNumber(_.get(stat_data, '主角.资源.当前魔力', 0), 0) - outcome.mp_loss));
  } else {
    _.set(stat_data, '主角.技能检定.封锁行为', '');
    _.set(stat_data, '主角.技能检定.封锁至轮次', 0);
  }

  _.set(stat_data, '主角.技能检定', {
    最近动作: content.slice(0, 80),
    关联属性: outcome.attr,
    原始骰点: outcome.raw,
    属性加值: outcome.bonus,
    难度减值: outcome.difficulty_penalty,
    难度说明: outcome.difficulty_label,
    总值: outcome.total,
    结果: outcome.result,
    结果描述: outcome.desc,
    封锁行为: outcome.result === '失败' || outcome.result === '大失败' ? outcome.action_tag : '',
    封锁至轮次: outcome.lock_to_round,
    更新时间: Date.now(),
  });

  _.set(
    stat_data,
    `战场日志.技能检定-${Date.now()}`,
    `${outcome.action_tag} | ${outcome.attr} | 骰点${outcome.raw}+${outcome.bonus}-${outcome.difficulty_penalty}=${outcome.total} | ${outcome.difficulty_label} | ${outcome.result} | ${outcome.desc}`,
  );
  trimBattleLogs(stat_data, 3);
  _.set(
    stat_data,
    '世界.近期事务.最近技能检定',
    `${outcome.action_tag}(${outcome.attr})=${outcome.result}，总值${outcome.total}，原始骰点${outcome.raw}，难度减值${outcome.difficulty_penalty}`,
  );
}

function applySkillCheckSystem(stat_data: any, content: string): SkillOutcome | undefined {
  const outcome = resolveSkillOutcome(stat_data, content);
  if (!outcome) return undefined;
  applyResolvedSkillOutcome(stat_data, content, outcome);
  return outcome;
}

function enforceGameOver(stat_data: any, reason: string): boolean {
  const hp = asNumber(_.get(stat_data, '主角.资源.当前生命', 0), 0);
  if (hp > 0) return false;

  _.set(stat_data, '主角.资源.当前生命', 0);
  _.set(stat_data, '主角.灵装化.启用', false);
  _.set(stat_data, '主角.灵装化.手动切换', false);
  _.set(stat_data, '主角.战术.是否战斗中', false);
  _.set(stat_data, '主角.战术.战斗模式', '非战斗');
  _.set(stat_data, '界面.游戏结束.已结束', true);
  _.set(stat_data, '界面.游戏结束.原因', reason);
  _.set(stat_data, '界面.游戏结束.时间戳', Date.now());
  _.set(stat_data, `战场日志.终局-${Date.now()}`, reason);
  trimBattleLogs(stat_data, 3);
  _.set(stat_data, '世界.近期事务.本局状态', '终止：生命值归零');
  return true;
}

const battle_time_pattern = /空战|地面战|交战|战斗|接敌|敌袭|开火|突击|异种进攻|超视距空战|偷袭/i;
const dialogue_time_pattern = /说|问|回答|交流|对话|聊天|询问|讨论|讲述|回复/i;
const jump_time_pattern = /(?:跳过时间到|时间跳到|快进到|直接到)\s*([^\n，。,；;]+)/i;

function formatUnionDateTime(date: Date): string {
  const union_year = Math.max(1, date.getFullYear() - 2000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `联合纪年${union_year}年${month}月${day}日 ${hour}:${minute}`;
}

function parseWorldDateTime(value: unknown): Date {
  const text = String(value ?? '').trim();
  if (!text) return new Date(2177, 7, 28, 8, 0, 0, 0);

  const union_match = text.match(/联合纪年\s*(\d+)\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\s*(\d{1,2})[:：](\d{1,2}))?/);
  if (union_match) {
    const year = 2000 + asNumber(union_match[1], 177);
    const month = asNumber(union_match[2], 8);
    const day = asNumber(union_match[3], 28);
    const hour = asNumber(union_match[4], 8);
    const minute = asNumber(union_match[5], 0);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  const iso_like = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2})[:：](\d{1,2}))?/);
  if (iso_like) {
    const year = asNumber(iso_like[1], 2026);
    const month = asNumber(iso_like[2], 1);
    const day = asNumber(iso_like[3], 1);
    const hour = asNumber(iso_like[4], 8);
    const minute = asNumber(iso_like[5], 0);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  return new Date(2177, 7, 28, 8, 0, 0, 0);
}

function parseTimeJumpTarget(text: string, current: Date): Date | undefined {
  const source = String(text ?? '').trim();
  if (!source) return undefined;

  const full_match = source.match(/(?:(?:联合纪年)?\s*(\d+)\s*年)?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\s*(\d{1,2})[:：点时](\d{1,2})?)?/);
  if (full_match) {
    const year = full_match[1] ? 2000 + asNumber(full_match[1], current.getFullYear() - 2000) : current.getFullYear();
    const month = asNumber(full_match[2], current.getMonth() + 1);
    const day = asNumber(full_match[3], current.getDate());
    const hour = full_match[4] ? asNumber(full_match[4], 8) : current.getHours();
    const minute = full_match[5] ? asNumber(full_match[5], 0) : current.getMinutes();
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  const day_only_match = source.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (day_only_match) {
    const month = asNumber(day_only_match[1], current.getMonth() + 1);
    const day = asNumber(day_only_match[2], current.getDate());
    const hm = source.match(/(\d{1,2})[:：](\d{1,2})/);
    const hour = hm ? asNumber(hm[1], 8) : current.getHours();
    const minute = hm ? asNumber(hm[2], 0) : current.getMinutes();
    return new Date(current.getFullYear(), month - 1, day, hour, minute, 0, 0);
  }

  const hm_only = source.match(/(\d{1,2})[:：](\d{1,2})/);
  if (hm_only) {
    const hour = asNumber(hm_only[1], current.getHours());
    const minute = asNumber(hm_only[2], current.getMinutes());
    return new Date(current.getFullYear(), current.getMonth(), current.getDate(), hour, minute, 0, 0);
  }

  return undefined;
}

function advanceWorldTimeByAction(stat_data: any, content: string): void {
  if (!stat_data || typeof stat_data !== 'object') return;
  const prev_text = String(_.get(stat_data, '世界.当前时间', '')).trim();
  const prev_date = parseWorldDateTime(prev_text);

  const jump_match = content.match(jump_time_pattern);
  if (jump_match?.[1]) {
    const jump_target = parseTimeJumpTarget(jump_match[1], prev_date);
    if (jump_target) {
      const next_text = formatUnionDateTime(jump_target);
      _.set(stat_data, '世界.当前时间', next_text);
      _.set(stat_data, '世界.近期事务.时间推进', `${prev_text || formatUnionDateTime(prev_date)} -> ${next_text}（玩家声明跳时）`);
      return;
    }
  }

  const delta_minutes = battle_time_pattern.test(content)
    ? _.random(240, 360)
    : dialogue_time_pattern.test(content)
      ? 5
      : 20;

  const next_date = new Date(prev_date.getTime() + delta_minutes * 60 * 1000);
  const next_text = formatUnionDateTime(next_date);
  const reason = battle_time_pattern.test(content)
    ? `战斗推进${delta_minutes}分钟`
    : dialogue_time_pattern.test(content)
      ? '对话推进5分钟'
      : '一般行为推进20分钟';
  _.set(stat_data, '世界.当前时间', next_text);
  _.set(stat_data, '世界.近期事务.时间推进', `${prev_text || formatUnionDateTime(prev_date)} -> ${next_text}（${reason}）`);
}

const player_background_trigger_pattern = /(我的背景|角色背景|人物背景|身世|来历|经历|过去|设定如下|背景如下)/;
const player_background_strip_pattern = /武器|装备|能力|技能|灵装|道具|神器|无敌|神格|权柄之主/;

function summarizePlayerBackground(raw: string): string {
  const text = String(raw ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (!text) return '';

  const lines = text
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean)
    .filter(v => !player_background_strip_pattern.test(v));

  const merged = lines.join(' ');
  if (!merged) return '';
  return merged.length > 180 ? `${merged.slice(0, 180)}...` : merged;
}

function applyPlayerBackgroundInput(stat_data: any, content: string): boolean {
  const source = String(content ?? '').trim();
  if (!source) return false;
  if (!player_background_trigger_pattern.test(source)) return false;
  if (source.length < 24) return false;

  const cleaned = source
    .replace(/^.*?(我的背景|角色背景|人物背景|身世|来历|经历|过去|设定如下|背景如下)[:：]?\s*/i, '')
    .trim();
  const raw = cleaned || source;
  const summary = summarizePlayerBackground(raw);
  if (!summary) return false;

  _.set(stat_data, '主角.背景.原文', raw);
  _.set(stat_data, '主角.背景.摘要', summary);
  _.set(stat_data, '世界.近期事务.背景更新', `玩家补充背景：${summary}`);
  return true;
}

function buildOutcomePrompt(outcome: SkillOutcome, game_over: boolean): string {
  const lines = [
    '[系统检定反馈-必须执行]',
    `动作: ${outcome.action_tag}`,
    `属性: ${outcome.attr}`,
    `公式: D10(${outcome.raw}) + 属性(${outcome.bonus}) - 难度(${outcome.difficulty_penalty}) = ${outcome.total}`,
    `难度: ${outcome.difficulty_label}`,
    `结果: ${outcome.result}`,
    `后果: ${outcome.desc}`,
    '写作要求: 必须把该检定结果与后果直接写进本轮叙事，不可忽略，不可弱化。',
  ];
  if (game_over) {
    lines.push('终局要求: 主角生命值归零，本局立即结束。你只能输出终局/善后叙事，不得继续推进可行动剧情。');
  }
  return lines.join('\n');
}

function toShortText(value: unknown, fallback = '-'): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function toInt(value: unknown, fallback = 0): number {
  return Math.trunc(asNumber(value, fallback));
}

function pickTailEntries(source: unknown, keep = 2): Array<[string, string]> {
  if (!_.isObjectLike(source)) return [];
  return Object.entries(source as Record<string, unknown>)
    .slice(-keep)
    .map(([k, v]) => [k, toShortText(v)]);
}

function buildMvuSummaryPrompt(chat_data: any): string {
  const stat = _.isObjectLike(chat_data?.stat_data) ? chat_data.stat_data : {};

  const world_time = toShortText(_.get(stat, '世界.当前时间', _.get(stat, '世界.日期')));
  const world_place = toShortText(_.get(stat, '世界.当前地点', _.get(stat, '世界.地点')));
  const world_weather = toShortText(_.get(stat, '世界.天气'));
  const world_threat = toShortText(_.get(stat, '世界.战区威胁等级', '中'));

  const name = toShortText(_.get(stat, '主角.档案.姓名', _.get(stat, '界面.建卡.角色姓名')));
  const profession = toShortText(_.get(stat, '界面.建卡.职业'));
  const path = toShortText(_.get(stat, '主角.档案.身份路径'));

  const hp = toInt(_.get(stat, '主角.资源.当前生命', 0), 0);
  const hp_max = toInt(_.get(stat, '主角.资源.生命上限', hp), hp);
  const mp = toInt(_.get(stat, '主角.资源.当前魔力', 0), 0);
  const mp_max = toInt(_.get(stat, '主角.资源.魔力上限', mp), mp);
  const action_point = toInt(_.get(stat, '主角.资源.行动点', 1), 1);
  const move_point = toInt(_.get(stat, '主角.资源.移动点', 1), 1);
  const slot_now = toInt(_.get(stat, '主角.资源.灵装槽当前', 0), 0);
  const slot_max = toInt(_.get(stat, '主角.资源.灵装槽上限', slot_now), slot_now);
  const corruption = toInt(_.get(stat, '主角.资源.污染值', 0), 0);

  const in_battle = Boolean(_.get(stat, '主角.战术.是否战斗中', false));
  const mode = toShortText(_.get(stat, '主角.战术.战斗模式', '非战斗'));
  const line = toShortText(_.get(stat, '主角.战术.当前阵线', '中线'));
  const round = toInt(_.get(stat, '主角.战术.当前轮次', 1), 1);
  const air_sup = toShortText(_.get(stat, '主角.战术.制空权', '争夺中'));
  const fire_penalty = toShortText(_.get(stat, '主角.战术.火力惩罚', '无'));

  const warmaid_lv = toInt(_.get(stat, '主角.成长.战姬老练等级', 0), 0);
  const authority_lv = toInt(_.get(stat, '主角.成长.权柄使役者等级', 0), 0);
  const magic_shard = toInt(_.get(stat, '主角.成长.魔力碎片', 0), 0);
  const next_magic_shard = toInt(_.get(stat, '主角.成长.下一级所需魔力碎片', 0), 0);
  const authority_shard = toInt(_.get(stat, '主角.成长.权柄碎片', 0), 0);
  const has_origin = Boolean(_.get(stat, '主角.成长.权柄本源', false));

  const skill_result = toShortText(_.get(stat, '主角.技能检定.结果', '无'));
  const skill_attr = toShortText(_.get(stat, '主角.技能检定.关联属性', '无'));
  const skill_total = toInt(_.get(stat, '主角.技能检定.总值', 0), 0);
  const bg_summary = toShortText(_.get(stat, '主角.背景.摘要', ''), '');

  const recent_affairs = pickTailEntries(_.get(stat, '世界.近期事务', {}), 2);
  const recent_logs = pickTailEntries(_.get(stat, '战场日志', {}), 2);

  const lines = [
    '[MVU状态摘要-每轮必读]',
    `世界: 日期=${world_time} | 地点=${world_place} | 天气=${world_weather} | 威胁=${world_threat}`,
    `主角: 姓名=${name} | 职业=${profession} | 身份=${path}`,
    `资源: HP=${hp}/${hp_max} | MP=${mp}/${mp_max} | AP=${action_point} | Move=${move_point} | 灵装槽=${slot_now}/${slot_max} | 污染=${corruption}`,
    `战术: 战斗中=${in_battle ? '是' : '否'} | 模式=${mode} | 阵线=${line} | 轮次=${round} | 制空=${air_sup} | 火力惩罚=${fire_penalty}`,
    `成长: 战姬老练=${warmaid_lv} | 权柄等级=${authority_lv} | 魔力碎片=${magic_shard}(下级需${next_magic_shard}) | 权柄碎片=${authority_shard} | 权柄本源=${has_origin ? '有' : '无'}`,
    `检定: 最近=${skill_result} | 属性=${skill_attr} | 总值=${skill_total}`,
  ];
  if (bg_summary) {
    lines.push(`主角背景摘要: ${bg_summary}`);
  }

  if (recent_affairs.length > 0) {
    lines.push(`近期事务: ${recent_affairs.map(([k, v]) => `${k}:${v}`).join('；')}`);
  }
  if (recent_logs.length > 0) {
    lines.push(`战场日志: ${recent_logs.map(([k, v]) => `${k}:${v}`).join('；')}`);
  }

  lines.push('要求: 以上状态为本轮叙事硬约束。必须据此输出，不得与状态冲突。');
  lines.push('角色触发规范: 优先按自然叙事输出即可（系统会从中文正文自动识别在场角色）；若你愿意，也可在末尾附加 <OnStageCharacters>JSON数组提高稳定性。');
  lines.push('内心想法规范: 本轮若出现在场角色，必须给出其“本回合内心想法/心理动机”，并随回合刷新，不得长期复用旧句。');
  lines.push('地点硬限制: 角色“薇薇安娜·威曼普”仅允许在“威曼普城西侧·大图书馆”及其内部场景出现；若地点不在大图书馆，禁止让其出场或发言。');
  lines.push('人物弧光规范: 薇薇安娜的态度需随好感阶段自然变化；若阶段=伴侣，必须表现为“成熟克制的并肩关系”，禁止依恋化、幼态化或占有欲表达。');
  lines.push('JSON字段: 姓名(string), 好感度(-200~1000), 态度(string), 内心想法(string), 基础属性(object<number>)。');
  lines.push('可选附加: <NpcRelationHints>JSON数组</NpcRelationHints>，字段: 姓名(string), 标签(string[])。');
  return lines.join('\n');
}

$(() => {
  errorCatched(async () => {
    const global_key = '__apocalypse_dawn_variable_bridge_installed__';
    if ((window as any)[global_key]) return;
    (window as any)[global_key] = true;

    installHideOriginalReplyStyle();
    registerMvuSchema(Schema);
    await waitGlobalInitialized('Mvu');

    const syncing_message_ids = new Set<number>();
    const synced_message_content = new Map<number, string>();
      const pending_skill_by_user_message = new Map<number, PendingSkillState>();
    const processed_user_messages = new Set<number>();

    async function processUserAction(message_id: number): Promise<void> {
      if (processed_user_messages.has(message_id)) return;
      const user_message = getChatMessages(message_id, { include_swipes: false })[0];
      if (!user_message || user_message.role !== 'user' || user_message.is_hidden) return;

      const source_content = String(user_message.message ?? '').trim();
      if (!source_content) return;

      const assistant_before = getChatMessages(`0-${Math.max(0, message_id - 1)}`, {
        role: 'assistant',
        include_swipes: false,
      });
      const anchor_assistant = assistant_before.length > 0 ? assistant_before[assistant_before.length - 1] : undefined;
      const source_data = anchor_assistant
        ? Mvu.getMvuData({ type: 'message', message_id: anchor_assistant.message_id })
        : Mvu.getMvuData({ type: 'chat' });
      const next_data = _.cloneDeep(source_data ?? {});
      next_data.stat_data = _.isObjectLike(next_data?.stat_data) ? _.cloneDeep(next_data.stat_data) : {};
      ensureAirCombatData(next_data.stat_data);
      ensureNpcData(next_data.stat_data);
      resetNpcStateBeforeCreate(next_data.stat_data);
      applyPlayerBackgroundInput(next_data.stat_data, source_content);
      advanceWorldTimeByAction(next_data.stat_data, source_content);
      const user_npc_request_hit = applyUserNpcRequest(next_data.stat_data, source_content);

      applyBattleSystemConstraints(next_data.stat_data, source_content);
      patchGameplayState(next_data.stat_data, source_content);
      applyDungeonLootSystem(next_data.stat_data, source_content);
      applyBlackMarketTrade(next_data.stat_data, source_content);
      applyVivianaArc(next_data.stat_data);
      applyHumanTraining(next_data.stat_data, source_content);
      reconcileGrowthLevel(next_data.stat_data);
      const battle_started = startAirBattleIfTriggered(next_data.stat_data, source_content);
      const battle_resolved = resolveAirCombatRound(next_data.stat_data, source_content);
      const in_air_battle = Boolean(_.get(next_data.stat_data, '主角.战术.是否战斗中', false))
        && _.get(next_data.stat_data, '主角.战术.战斗模式', '非战斗') === '空战';

      if (battle_started || battle_resolved || in_air_battle) {
        processed_user_messages.add(message_id);
        trimBattleLogs(next_data.stat_data, 3);
        await Mvu.replaceMvuData(next_data, { type: 'chat' });
        if (anchor_assistant) {
          await Mvu.replaceMvuData(next_data, { type: 'message', message_id: anchor_assistant.message_id });
        }
        console.info(`[天启黎明][空战] 已结算玩家动作楼层 ${message_id}`);
        return;
      }

      const outcome = applySkillCheckSystem(next_data.stat_data, source_content);
      if (!outcome) {
        if (user_npc_request_hit) {
          trimBattleLogs(next_data.stat_data, 3);
          await Mvu.replaceMvuData(next_data, { type: 'chat' });
          if (anchor_assistant) {
            await Mvu.replaceMvuData(next_data, { type: 'message', message_id: anchor_assistant.message_id });
          }
        }
        return;
      }
      processed_user_messages.add(message_id);

      const game_over = enforceGameOver(
        next_data.stat_data,
        `检定失败导致生命归零：${outcome.action_tag} / ${outcome.result}`,
      );
      const feedback_prompt = buildOutcomePrompt(outcome, game_over);
      injectPrompts(
        [{
          id: `apocalypse-dawn-skill-feedback-pre-${message_id}-${Date.now()}`,
          position: 'in_chat',
          depth: 0,
          role: 'system',
          content: feedback_prompt,
          should_scan: true,
        }],
        { once: true },
      );
      pending_skill_by_user_message.set(message_id, {
        user_message_id: message_id,
        source_content,
        outcome,
        feedback_prompt,
        injected: true,
        game_over,
      });
      trimBattleLogs(next_data.stat_data, 3);

      await Mvu.replaceMvuData(next_data, { type: 'chat' });
      if (anchor_assistant) {
        await Mvu.replaceMvuData(next_data, { type: 'message', message_id: anchor_assistant.message_id });
      }
      console.info(`[天启黎明][检定前置] 已处理玩家动作楼层 ${message_id}`);
    }

    async function syncMessageToMvu(message_id: number): Promise<void> {
      if (syncing_message_ids.has(message_id)) return;

      const message = getChatMessages(message_id, { include_swipes: false })[0];
      if (!message || message.role !== 'assistant' || message.is_hidden) return;

      const content = message.message?.trim() ?? '';
      if (!content) return;
      if (synced_message_content.get(message_id) === content) return;

      syncing_message_ids.add(message_id);
      try {
        const old_data = Mvu.getMvuData({ type: 'message', message_id });
        const new_data = await Mvu.parseMessage(content, old_data);

        // 禁止口胡：没有显式变量更新块时，不允许改动核心 MVU 数据
        if (!hasExplicitUpdateTag(content)) {
          new_data.stat_data = _.isObjectLike(old_data?.stat_data) ? _.cloneDeep(old_data.stat_data) : {};
        }

        if (!new_data.stat_data || typeof new_data.stat_data !== 'object') {
          new_data.stat_data = {};
        }
        ensureAirCombatData(new_data.stat_data);
        ensureNpcData(new_data.stat_data);
        resetNpcStateBeforeCreate(new_data.stat_data);
        if (!new_data.stat_data.界面 || typeof new_data.stat_data.界面 !== 'object') {
          new_data.stat_data.界面 = {};
        }
        const parsed_onstage = parseOnStageCharacters(content);
        const old_onstage = Array.isArray(_.get(new_data.stat_data, '界面.在场角色')) ? _.get(new_data.stat_data, '界面.在场角色') : [];
        const inferred_onstage = inferOnStageCharactersFromText(content, {
          exclude_names: [
            String(_.get(new_data.stat_data, '主角.档案.代号', '')),
            String(_.get(new_data.stat_data, '界面.建卡.角色姓名', '')),
          ].filter(Boolean),
          old_onstage,
        });
        const relation_hints = parseNpcRelationHints(content);
        const incoming_onstage = [...(parsed_onstage ?? []), ...inferred_onstage];
        const name_excluded = new Set<string>([
          String(_.get(new_data.stat_data, '主角.档案.代号', '')),
          String(_.get(new_data.stat_data, '界面.建卡.角色姓名', '')),
        ].filter(Boolean));

        if (incoming_onstage.length > 0) {
          const merged = mergeOnStageCharacters(old_onstage, incoming_onstage);
          new_data.stat_data.界面.在场角色 = sanitizeOnStageCharacters(merged, name_excluded);
          _.set(
            new_data.stat_data,
            '世界.近期事务.在场角色更新',
            `AI更新在场角色：${_.uniq(incoming_onstage.map(v => v.姓名)).join('、')}`,
          );
        } else {
          const current = Array.isArray(_.get(new_data.stat_data, '界面.在场角色')) ? _.get(new_data.stat_data, '界面.在场角色') : [];
          new_data.stat_data.界面.在场角色 = sanitizeOnStageCharacters(current, name_excluded);
        }
        refreshOnStageThoughtsByAiText(new_data.stat_data, content);

        const previous_message = getChatMessages(message_id - 1, { include_swipes: false })[0];
        const user_context = previous_message && previous_message.role === 'user' ? String(previous_message.message ?? '') : '';
        const trigger_context = `${user_context}\n${content}`;
        const skill_context = user_context.trim() || content;
        const pending_skill = previous_message && previous_message.role === 'user'
          ? pending_skill_by_user_message.get(previous_message.message_id)
          : undefined;

        applyBattleSystemConstraints(new_data.stat_data, trigger_context);
        patchGameplayState(new_data.stat_data, trigger_context);
        applyDungeonLootSystem(new_data.stat_data, content);
        applyBlackMarketTrade(new_data.stat_data, user_context);
        applyHumanTraining(new_data.stat_data, trigger_context);
        reconcileGrowthLevel(new_data.stat_data);
        startAirBattleIfTriggered(new_data.stat_data, trigger_context);
        if (pending_skill) {
          applyResolvedSkillOutcome(new_data.stat_data, pending_skill.source_content, pending_skill.outcome);
          if (pending_skill.game_over) {
            enforceGameOver(
              new_data.stat_data,
              `检定失败导致生命归零：${pending_skill.outcome.action_tag} / ${pending_skill.outcome.result}`,
            );
          }
          pending_skill_by_user_message.delete(previous_message.message_id);
        } else {
          const in_air_battle = Boolean(_.get(new_data.stat_data, '主角.战术.是否战斗中', false))
            && _.get(new_data.stat_data, '主角.战术.战斗模式', '非战斗') === '空战';
          if (!in_air_battle) applySkillCheckSystem(new_data.stat_data, skill_context);
        }
        enforceGameOver(new_data.stat_data, '生命值归零，本局立即结束。');
        applyNpcLongTermRules(new_data.stat_data, content, user_context, incoming_onstage, relation_hints);
        applyVivianaArc(new_data.stat_data);

        new_data.stat_data.界面.楼层文本 = {
          正文: extractDisplayText(content),
          原文: content,
          更新时间: Date.now(),
        };
        trimBattleLogs(new_data.stat_data, 3);

        await Mvu.replaceMvuData(new_data, { type: 'message', message_id });
        synced_message_content.set(message_id, content);
        console.info(`[天启黎明][MVU桥接] 已同步楼层 ${message_id}`);
      } catch (error) {
        console.warn(`[天启黎明][MVU桥接] 同步楼层 ${message_id} 失败`, error);
      } finally {
        syncing_message_ids.delete(message_id);
      }
    }

    eventOn(tavern_events.MESSAGE_RECEIVED, message_id => {
      void syncMessageToMvu(message_id);
    });

    eventOn(tavern_events.MESSAGE_UPDATED, message_id => {
      void syncMessageToMvu(message_id);
    });

    eventOn(tavern_events.MESSAGE_SENT, message_id => {
      void processUserAction(message_id);
    });

    eventOn(tavern_events.GENERATION_AFTER_COMMANDS, () => {
      const latest_user = getChatMessages(-1, { role: 'user', include_swipes: false })[0];
      if (!latest_user || latest_user.role !== 'user') return;

      const chat_data = Mvu.getMvuData({ type: 'chat' });
      const mvu_summary_prompt = buildMvuSummaryPrompt(chat_data);
      injectPrompts(
        [{
          id: `apocalypse-dawn-mvu-summary-${latest_user.message_id}-${Date.now()}`,
          position: 'in_chat',
          depth: 0,
          role: 'system',
          content: mvu_summary_prompt,
          should_scan: true,
        }],
        { once: true },
      );

      const pending = pending_skill_by_user_message.get(latest_user.message_id);
      if (pending && !pending.injected) {
        injectPrompts(
          [{
            id: `apocalypse-dawn-skill-feedback-${latest_user.message_id}-${Date.now()}`,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            content: pending.feedback_prompt,
            should_scan: true,
          }],
          { once: true },
        );
        pending.injected = true;
        return;
      }

      const air_pending = Boolean(_.get(chat_data, 'stat_data.界面.空战反馈.待反馈', false));
      const air_summary = String(_.get(chat_data, 'stat_data.界面.空战反馈.摘要', '')).trim();
      if (air_pending && air_summary) {
        injectPrompts(
          [{
            id: `apocalypse-dawn-airbattle-${Date.now()}`,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            content: `[空战结算-强制叙事钩子]\n${air_summary}\n要求：你必须严格按该结算继续叙事，并同步后果；不得与结算冲突。`,
            should_scan: true,
          }],
          { once: true },
        );
        const next_chat_data = _.cloneDeep(chat_data ?? {});
        if (!_.isObjectLike(next_chat_data.stat_data)) next_chat_data.stat_data = {};
        if (!_.isObjectLike(next_chat_data.stat_data.界面)) next_chat_data.stat_data.界面 = {};
        next_chat_data.stat_data.界面.空战反馈 = {
          待反馈: false,
          摘要: air_summary,
          时间戳: Date.now(),
        };
        void Mvu.replaceMvuData(next_chat_data, { type: 'chat' });
      }
      const ended = Boolean(_.get(chat_data, 'stat_data.界面.游戏结束.已结束', false));
      if (ended) {
        injectPrompts(
          [{
            id: `apocalypse-dawn-gameover-${Date.now()}`,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            content: '系统裁定：主角生命值归零，本局已结束。你只能输出终局/善后叙事，不得继续正常推进剧情。',
            should_scan: true,
          }],
          { once: true },
        );
      }
    });

    eventOn(tavern_events.CHAT_CHANGED, () => {
      syncing_message_ids.clear();
      synced_message_content.clear();
      pending_skill_by_user_message.clear();

      const latest = getChatMessages(-1, { include_swipes: false })[0];
      if (latest && latest.role === 'assistant') {
        void syncMessageToMvu(latest.message_id);
      }
    });

    const latest = getChatMessages(-1, { include_swipes: false })[0];
    if (latest && latest.role === 'assistant') {
      void syncMessageToMvu(latest.message_id);
    }
  })();
});
