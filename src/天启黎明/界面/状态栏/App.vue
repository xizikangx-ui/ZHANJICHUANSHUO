<template>
  <div class="card" :class="{ fullscreen: is_fullscreen, 'mobile-mode': mobile_mode }">
    <section v-if="show_create" class="create-flow">
      <section v-if="create_stage === 'cover'" class="cover-panel">
        <h1 class="logo">天启黎明</h1>
        <p class="author">作者：未来</p>
        <div class="cover-actions">
          <button type="button" class="start-btn large" @click="create_stage = 'profile'">开始游戏</button>
          <button type="button" class="plot-btn large" :class="{ active: plot_mode }" @click="toggle_plot_mode">
            {{ plot_mode ? '剧情模式：开启' : '剧情模式：关闭' }}
          </button>
          <button type="button" class="mobile-btn large" :class="{ active: mobile_mode }" @click="toggle_mobile_mode">
            {{ mobile_mode ? '手机适配：开启' : '手机适配：关闭' }}
          </button>
        </div>
        <button type="button" class="cheat-btn" :class="{ active: cheat_mode }" @click="cheat_mode = !cheat_mode">
          {{ cheat_mode ? '作弊模式：开启' : '作弊模式：关闭' }}
        </button>
      </section>

      <section v-else-if="create_stage === 'profile'" class="create-panel">
        <h2>建卡 - 基础信息</h2>

        <label class="field">
          <span>角色姓名：</span>
          <input v-model.trim="create_form.角色姓名" type="text" placeholder="输入角色姓名" />
        </label>

        <label class="field">
          <span>职业：</span>
          <select v-model="create_form.职业">
            <option value="指挥官">指挥官</option>
            <option value="战姬">战姬</option>
            <option value="权柄使役者">权柄使役者</option>
          </select>
        </label>

        <label v-if="create_form.职业 === '战姬'" class="field">
          <span>战姬类型：</span>
          <select v-model="create_form.战姬类型">
            <option v-for="kind in warmaid_types" :key="kind" :value="kind">{{ kind }}</option>
          </select>
        </label>

        <label class="field">
          <span>年龄：</span>
          <input v-model.number="create_form.年龄" type="number" :min="age_limit.min" :max="age_limit.max" />
        </label>

        <label class="field">
          <span>性别：</span>
          <select v-model="create_form.性别" :disabled="create_form.职业 === '战姬'">
            <option value="男性">男性</option>
            <option value="女性">女性</option>
          </select>
        </label>
        <p v-if="create_form.职业 === '战姬'" class="tip">战姬角色性别固定为女性。</p>

        <p class="age-tip">年龄限制：{{ age_limit.min }} - {{ age_limit.max }}</p>
        <p v-if="create_error" class="error">{{ create_error }}</p>

        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'cover'">返回</button>
          <button type="button" class="start-btn" @click="go_human_step">下一步</button>
        </div>
      </section>

      <section v-else-if="create_stage === 'human'" class="create-panel">
        <h2>建卡 - 人类属性</h2>
        <p class="tip">初始属性均为 1，自由分配 5 点。人类属性上限统一为 5。</p>
        <p class="tip strong">剩余可分配点数：{{ human_points_left }}</p>

        <ul class="allocate-list">
          <li v-for="key in human_keys" :key="key">
            <div class="human-attr-meta">
              <span>{{ key }}（上限 {{ human_caps[key] }}）</span>
              <small class="human-attr-desc">{{ human_attr_desc[key].用途 }}</small>
            </div>
            <div class="counter">
              <button type="button" @click="change_human(key, -1)">-</button>
              <strong>{{ human_attr[key] }}</strong>
              <button type="button" @click="change_human(key, 1)">+</button>
            </div>
          </li>
        </ul>
        <details class="human-attr-help">
          <summary>查看七项人类属性说明（建卡参考）</summary>
          <ul class="human-attr-help-list">
            <li v-for="key in human_keys" :key="`help-${key}`">
              <strong>{{ key }}</strong>
              <span>{{ human_attr_desc[key].说明 }}</span>
            </li>
          </ul>
        </details>

        <p v-if="create_error" class="error">{{ create_error }}</p>
        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'profile'">上一步</button>
          <button type="button" class="start-btn" @click="go_next_after_human">下一步</button>
        </div>
      </section>

      <section v-else-if="create_stage === 'abilities'" class="create-panel">
        <h2>建卡 - 基础能力选择</h2>
        <p class="tip">{{ current_ability_hint }}</p>
        <p class="tip profession-mark">{{ current_ability_title }}</p>
        <p class="tip strong">已选择：{{ selected_abilities.length }}/{{ ability_pick_limit }}</p>

        <ul class="ability-list">
          <li v-for="ability in current_base_abilities" :key="ability.name">
            <button
              type="button"
              class="ability-btn"
              :class="{ active: selected_abilities.includes(ability.name) }"
              @click="toggle_ability(ability.name)"
            >
              <span>{{ ability.name }}</span>
              <small>{{ ability.desc }}</small>
              <small class="ability-source">{{ ability.source }}</small>
            </button>
          </li>
        </ul>

        <p v-if="create_error" class="error">{{ create_error }}</p>
        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'human'">上一步</button>
          <button type="button" class="start-btn" @click="go_next_after_abilities">下一步</button>
        </div>
      </section>

      <section v-else-if="create_stage === 'profession'" class="create-panel">
        <h2>建卡 - 职业专属</h2>
        <p class="tip profession-mark">{{ create_form.职业 }}</p>

        <template v-if="create_form.职业 === '战姬'">
          <p class="tip">技能点：{{ skill_points_left }}/{{ skill_points_total }}（初始4点，后续每次晋级+2）</p>
          <ul class="skill-list">
            <li v-for="node in current_warmaid_skills" :key="node.id">
              <button
                type="button"
                class="ability-btn"
                :class="{ active: selected_warmaid_skills.includes(node.id) }"
                @click="toggle_warmaid_skill(node.id)"
              >
                <span>{{ node.id }} {{ node.name }}（{{ node.cost }}点）</span>
                <small>{{ node.desc }}</small>
                <small class="ability-source" v-if="node.prerequisites.length > 0">
                  前置：{{ node.prerequisites.join('、') }}
                </small>
              </button>
            </li>
          </ul>
          <label v-if="cheat_mode" class="field">
            <span>作弊模式：自定义技能记录（可任意填写）</span>
            <textarea v-model="warmaid_custom_skills" rows="4" placeholder="例：终焉炮击, 无限位移"></textarea>
          </label>
        </template>

        <template v-else-if="create_form.职业 === '权柄使役者'">
          <label class="field">
            <span>权柄途径：</span>
            <select v-model="authority_build.途径">
              <option v-for="path in authority_paths" :key="path" :value="path">{{ path }}</option>
            </select>
          </label>
          <label class="field">
            <span>权柄名称：</span>
            <input v-model.trim="authority_build.名称" type="text" placeholder="例：史前爬行动物" />
          </label>
          <label class="field">
            <span>赋予技能：</span>
            <textarea
              v-model.trim="authority_build.技能描述"
              rows="8"
              placeholder="梦幻变化(强化0级)：\n将自身以梦想之权柄转变为你希望化形的动物……"
            />
          </label>
          <pre class="example-box">权柄名称：史前爬行动物
权柄途径：梦想
碎片数：1
赋予技能：
梦幻变化(强化0级)：
将自身以梦想之权柄转变为你希望化形的动物。
生命将额外获得200点，失去后次日或消耗等量魔力可以恢复。
攻击调整为2d15纯物理攻击并附带权柄魔力，防御调整为20点物理护甲。
最多不得变换为体型超过3（长宽高4米），魔力消耗：每5分钟100点。</pre>
          <p class="tip">等级固定从【信徒】开始。禁止无敌、神化、直接成为权柄之主等超限设定。</p>
        </template>

        <template v-else>
          <p class="tip">指挥官无额外职业树，后续可在游戏中通过学习解锁阵型与战术模块。</p>
        </template>

        <p v-if="create_error" class="error">{{ create_error }}</p>
        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'abilities'">上一步</button>
          <button type="button" class="start-btn" @click="go_next_after_profession">下一步</button>
        </div>
      </section>

      <section v-else-if="create_stage === 'background'" class="create-panel">
        <h2>建卡 - 人物背景</h2>
        <p class="tip">可填写约1000字背景。武器/能力/装备将被过滤，不计入有效背景。</p>
        <div class="background-template-box">
          <p class="tip strong">职业通用背景开局（参照世界书模板）</p>
          <div class="background-template-actions">
            <button type="button" class="secondary-btn" @click="apply_background_starter(false)">填入模板（覆盖）</button>
            <button type="button" class="secondary-btn" @click="apply_background_starter(true)">填入模板（追加）</button>
          </div>
          <pre class="example-box background-template-preview">{{ profession_background_starter }}</pre>
        </div>
        <label class="field">
          <span>背景原文：</span>
          <textarea v-model.trim="background_input" rows="12" maxlength="1200" placeholder="输入角色背景（约1000字）" />
        </label>
        <p class="tip">当前字数：{{ background_input.length }}/1200</p>
        <label v-if="cheat_mode" class="field">
          <span>作弊模式：背景摘要可手动覆盖</span>
          <textarea v-model.trim="background_summary_override" rows="5" placeholder="留空则自动摘要" />
        </label>
        <p v-if="create_error" class="error">{{ create_error }}</p>
        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'profession'">上一步</button>
          <button type="button" class="start-btn" @click="go_next_after_background">下一步</button>
        </div>
      </section>

      <section v-else class="create-panel">
        <h2>建卡 - 战姬六维骰点</h2>
        <p class="tip">按《天启黎明V0.5》战姬类型规则进行骰点：{{ create_form.战姬类型 }}</p>

        <ul class="dice-rule-list">
          <li v-for="item in current_dice_rules" :key="item.key">
            <span>{{ item.key }}</span>
            <strong>{{ item.rule }}</strong>
          </li>
        </ul>

        <button type="button" class="start-btn" @click="roll_warmaid_stats">掷骰</button>

        <ul v-if="warmaid_rolled" class="dice-result-list">
          <li v-for="item in warmaid_result_list" :key="item.key">
            <span>{{ item.key }}</span>
            <strong>{{ item.value }}</strong>
          </li>
        </ul>

        <p v-if="create_error" class="error">{{ create_error }}</p>
        <div class="actions">
          <button type="button" class="secondary-btn" @click="create_stage = 'background'">上一步</button>
          <button type="button" class="start-btn" @click="finish_create">完成建卡并开始</button>
        </div>
      </section>
    </section>

    <template v-else>
      <section class="mvu-textbox" :class="{ 'mvu-focus-mode': is_initial_mvu_focus_mode }">
        <div class="mvu-toolbar">
          <h2>MVU正文与可选行动</h2>
          <div class="mvu-toolbar-actions">
            <button type="button" class="status-toggle-btn" :class="{ active: !status_bar_collapsed }" @click="toggle_status_bar">
              {{ status_bar_collapsed ? '状态栏：展开' : '状态栏：收起' }}
            </button>
            <button type="button" class="plot-btn" :class="{ active: plot_mode }" @click="toggle_plot_mode">
              {{ plot_mode ? '剧情模式：开启' : '剧情模式：关闭' }}
            </button>
            <button type="button" class="mobile-btn" :class="{ active: mobile_mode }" @click="toggle_mobile_mode">
              {{ mobile_mode ? '手机适配：开启' : '手机适配：关闭' }}
            </button>
          </div>
        </div>
        <div class="mvu-font-tools">
          <span class="mvu-font-label">字体：</span>
          <button
            v-for="size in mvu_font_size_options"
            :key="size.key"
            type="button"
            class="font-size-btn"
            :class="{ active: mvu_font_size === size.key }"
            @click="mvu_font_size = size.key"
          >
            {{ size.label }}
          </button>
        </div>
        <pre v-if="display_floor_text" class="mvu-body" :class="`mvu-font-${mvu_font_size}`">{{ display_floor_text }}</pre>
        <p v-else class="empty-tip">当前暂无可展示正文</p>
        <div class="next-actions" :class="{ compact: is_initial_mvu_focus_mode }">
          <div class="next-actions-head">
            <h3>{{ next_action_panel_mode === 'options' ? '接下来可进行（自动生成，可点击）' : '手动输入行动（发送到酒馆）' }}</h3>
            <button type="button" class="next-actions-toggle-btn" @click="toggle_next_action_panel_mode">
              {{ next_action_panel_mode === 'options' ? '关闭选项栏' : '打开选项栏' }}
            </button>
          </div>
          <div v-if="next_action_panel_mode === 'options'" class="next-actions-grid">
            <button
              v-for="action in next_action_options"
              :key="action"
              type="button"
              class="next-action-btn"
              @click="send_next_action(action)"
            >
              {{ action }}
            </button>
          </div>
          <div v-else class="next-actions-inputbox">
            <textarea
              v-model.trim="manual_action_input"
              class="next-actions-textarea"
              rows="3"
              placeholder="输入你要发送给酒馆AI的行动（按回车发送，Shift+回车换行）"
              @keydown.enter.exact.prevent="send_manual_action"
            />
            <div class="next-actions-input-actions">
              <button type="button" class="secondary-btn" @click="clear_manual_action">清空</button>
              <button type="button" class="start-btn" :disabled="!manual_action_input.trim()" @click="send_manual_action">发送</button>
            </div>
          </div>
        </div>
      </section>
      <section v-if="data.界面.游戏结束.已结束 && data.主角.资源.当前生命 <= 0" class="gameover-banner">
        <h2>本局已结束</h2>
        <p>{{ data.界面.游戏结束.原因 || '生命值归零' }}</p>
      </section>

      <section v-if="status_bar_collapsed" class="status-collapsed-banner">
        <p>状态栏已收起（MVU正文保留显示）</p>
      </section>

      <template v-if="!status_bar_collapsed">
      <header class="hero">
        <div>
          <h1>天启黎明</h1>
          <p>{{ data.主角.档案.代号 }} | {{ profession }} | {{ data.主角.档案.身份路径 }}</p>
          <p>性别: {{ display_gender }}</p>
        </div>
        <div class="hero-controls">
          <span class="threat">威胁: {{ data.世界.战区威胁等级 }}</span>
          <button type="button" class="fullscreen-btn" @click="is_fullscreen = !is_fullscreen">
            {{ is_fullscreen ? '退出全屏' : '全屏' }}
          </button>
        </div>
      </header>

      <section class="world">
        <p>时间: {{ data.世界.当前时间 }}</p>
        <p>地点: {{ data.世界.当前地点 }}</p>
        <p>天气: {{ data.世界.天气 }}</p>
      </section>

      <nav class="tabs">
        <button type="button" :class="{ active: active_tab === 'main' }" @click="active_tab = 'main'">主状态栏</button>
        <button type="button" :class="{ active: active_tab === 'battle' }" @click="active_tab = 'battle'">战场</button>
        <button type="button" :class="{ active: active_tab === 'recent' }" @click="active_tab = 'recent'">近期事务</button>
        <button type="button" :class="{ active: active_tab === 'warehouse' }" @click="active_tab = 'warehouse'">仓库</button>
      </nav>
      <section v-if="active_tab === 'main'" class="panel">
        <div class="bars">
          <div class="bar">
            <label>生命</label>
            <progress :value="data.主角.资源.当前生命" :max="data.主角.资源.最大生命" />
            <strong class="bar-value">{{ data.主角.资源.当前生命 }}/{{ data.主角.资源.最大生命 }}</strong>
          </div>
          <div class="bar">
            <label>魔力</label>
            <progress :value="data.主角.资源.当前魔力" :max="data.主角.资源.最大魔力" />
            <strong class="bar-value">{{ data.主角.资源.当前魔力 }}/{{ data.主角.资源.最大魔力 }}</strong>
          </div>
          <div class="bar">
            <label>污染</label>
            <progress :value="data.主角.资源.污染值" max="100" />
            <strong class="bar-value">{{ data.主角.资源.污染值 }}/100</strong>
          </div>
        </div>

        <div class="grid two">
          <article>
            <h3>人类属性（七项）</h3>
            <ul class="kv">
              <li v-for="item in human_attributes" :key="item.key">
                <span>{{ item.key }}</span>
                <strong>{{ item.value }}（锻炼 {{ item.training }}/100）</strong>
              </li>
            </ul>
          </article>

          <article v-if="is_warmaid">
            <h3>战姬属性（六项）</h3>
            <ul class="kv">
              <li v-for="item in warmaid_attributes" :key="item.key">
                <span>{{ item.key }}</span>
                <strong>{{ item.value }}</strong>
              </li>
            </ul>
          </article>
        </div>

        <div class="grid two">
          <article>
            <h3>{{ level_label }}</h3>
            <p class="big">{{ level_value }}</p>
            <p v-for="line in level_meta_lines" :key="line">{{ line }}</p>
          </article>

          <article v-if="is_warmaid">
            <h3>灵装状态</h3>
            <p>当前状态: {{ data.主角.灵装化.启用 ? '已灵装化' : '未启用' }}（{{ data.主角.灵装化.灵装模式 }}）</p>
            <p>灵装槽: {{ data.主角.资源.灵装槽当前 }}/{{ data.主角.资源.灵装槽上限 }}</p>
            <button type="button" class="toggle-btn" @click="toggle_transform">
              {{ data.主角.灵装化.启用 ? '手动解除灵装' : '手动开启灵装' }}
            </button>
          </article>
        </div>

        <article>
          <h3>最近技能检定</h3>
          <p v-if="!has_real_skill_check">尚未进行检定</p>
          <template v-else>
            <p>属性: {{ data.主角.技能检定.关联属性 }}</p>
            <p>难度: {{ data.主角.技能检定.难度说明 }}（减值 {{ data.主角.技能检定.难度减值 }}）</p>
            <p>骰点: {{ data.主角.技能检定.原始骰点 }} + {{ data.主角.技能检定.属性加值 }} - {{ data.主角.技能检定.难度减值 }} = {{ data.主角.技能检定.总值 }}</p>
            <p>结果: {{ data.主角.技能检定.结果 }}</p>
            <p>{{ data.主角.技能检定.结果描述 }}</p>
          </template>
        </article>
      </section>

      <section v-else-if="active_tab === 'battle'" class="panel">
        <div class="grid two">
          <article>
            <h3>战术态势</h3>
            <p>模式: {{ data.主角.战术.战斗模式 }} / {{ data.主角.战术.是否战斗中 ? '战斗中' : '非战斗' }}</p>
            <p>阵线: {{ data.主角.战术.当前阵线 }}</p>
            <p>制空权: {{ data.主角.战术.制空权 }}</p>
            <p>轮次: {{ data.主角.战术.当前轮次 }}</p>
            <p>行动/移动: {{ data.主角.资源.行动点 }}/{{ data.主角.资源.移动点 }}</p>
            <p>火力惩罚: {{ data.主角.战术.火力惩罚 }}</p>
            <p v-if="is_warmaid">灵装每回合消耗: 魔力{{ data.主角.灵装化.每回合耗魔 }} / 槽{{ data.主角.灵装化.每回合耗槽 }}</p>
          </article>

          <article>
            <h3>异常状态</h3>
            <p v-if="_.isEmpty(data.主角.异常状态)">无</p>
            <ul v-else class="kv">
              <li v-for="(v, k) in data.主角.异常状态" :key="k">
                <span>{{ k }}({{ v.等级 }})</span>
                <strong>x{{ v.剩余轮次 }}</strong>
              </li>
            </ul>
          </article>
        </div>

        <article v-if="data.主角.战术.战斗模式 === '空战'" class="air-menu">
          <h3>空战系统入口</h3>
          <button type="button" class="toggle-btn" disabled>空战系统 [未完成系统别开]</button>
        </article>

        <article>
          <h3>最近技能检定</h3>
          <p v-if="!has_real_skill_check">尚未进行检定</p>
          <template v-else>
            <p>属性: {{ data.主角.技能检定.关联属性 }}</p>
            <p>难度: {{ data.主角.技能检定.难度说明 }}（减值 {{ data.主角.技能检定.难度减值 }}）</p>
            <p>骰点: {{ data.主角.技能检定.原始骰点 }} + {{ data.主角.技能检定.属性加值 }} - {{ data.主角.技能检定.难度减值 }} = {{ data.主角.技能检定.总值 }}</p>
            <p>结果: {{ data.主角.技能检定.结果 }}</p>
            <p>{{ data.主角.技能检定.结果描述 }}</p>
          </template>
        </article>

        <article v-if="data.战利品.显示战利品" class="loot">
          <h3>战利品</h3>
          <p v-if="_.isEmpty(data.战利品.最近获取)">暂无</p>
          <ul v-else class="kv">
            <li v-for="(v, k) in data.战利品.最近获取" :key="k">
              <span>{{ k }}({{ v.品质 }})</span>
              <strong>x{{ v.数量 }}</strong>
            </li>
          </ul>
        </article>
      </section>

      <section v-else-if="active_tab === 'recent'" class="panel">
        <article>
          <h3>近期事务</h3>
          <p v-if="_.isEmpty(data.世界.近期事务)">无</p>
          <ul v-else class="kv">
            <li v-for="(v, k) in data.世界.近期事务" :key="k">
              <span>{{ k }}</span>
              <strong>{{ v }}</strong>
            </li>
          </ul>
        </article>

        <article>
          <h3>战场日志</h3>
          <p v-if="_.isEmpty(data.战场日志)">无</p>
          <ul v-else class="kv">
            <li v-for="(v, k) in data.战场日志" :key="k">
              <span>{{ k }}</span>
              <strong>{{ v }}</strong>
            </li>
          </ul>
        </article>
      </section>
      <section v-else class="panel">
        <div class="grid two">
          <article>
            <h3>仓库总览</h3>
            <p>联合币：{{ data.战利品.仓库.联合币 }}</p>
            <p>芯片：{{ data.战利品.仓库.芯片 }}</p>
            <p>独特收藏品：{{ data.战利品.仓库.独特收藏品.length }}</p>
          </article>
          <article>
            <h3>副本状态</h3>
            <p v-if="!data.战利品.副本.已激活">当前未在副本内</p>
            <template v-else>
              <p>{{ data.战利品.副本.副本名称 }} / {{ data.战利品.副本.实验室等级 }}</p>
              <p>规模：{{ data.战利品.副本.地图规模 }}（{{ data.战利品.副本.房间总数 }}房）</p>
              <p>探索：{{ data.战利品.副本.已探索房间 }}/{{ data.战利品.副本.房间总数 }}</p>
              <p>当前房间：{{ data.战利品.副本.最近房间 || '未知' }}</p>
            </template>
          </article>
        </div>
        <article>
          <h3>物品列表</h3>
          <p v-if="warehouse_items.length === 0">暂无物品</p>
          <ul v-else class="kv">
            <li v-for="item in warehouse_items" :key="item.name">
              <span>{{ item.name }}（{{ item.quality }}）</span>
              <strong>x{{ item.count }} / {{ item.category }} / {{ item.value }}联合币</strong>
              <button
                v-if="item.usable"
                type="button"
                class="toggle-btn"
                @click="use_warehouse_item(item.name)"
              >
                使用
              </button>
            </li>
          </ul>
        </article>
      </section>
      <section class="onstage-box in-panel">
        <button type="button" class="module-toggle" @click="toggle_module('在场角色')">
          当前在场角色（{{ onstage_characters.length }}）{{ is_onstage_folded ? '展开' : '折叠' }}
        </button>
        <ul v-if="!is_onstage_folded" class="onstage-list">
          <li v-if="onstage_characters.length === 0" class="empty-tip">暂无在场角色数据</li>
          <li v-for="char in onstage_characters" :key="char.姓名">
            <div class="onstage-head">
              <strong>{{ char.姓名 }}</strong>
              <span>等级 {{ char.等级 || '新手' }}</span>
              <span>好感度 {{ char.好感度 }}</span>
              <span>态度 {{ char.态度 }}</span>
            </div>
            <p class="onstage-attrs">{{ format_attr_text(char.基础属性) }}</p>
            <details>
              <summary>内心想法（隐藏，点击查看）</summary>
              <p class="onstage-thought">{{ char.内心想法 || '暂无' }}</p>
            </details>
          </li>
        </ul>
      </section>
      <section class="onstage-box in-panel">
        <button type="button" class="module-toggle" @click="toggle_module('长期NPC')">
          长期NPC列表（{{ longterm_npc_list.length }}）{{ is_longterm_folded ? '展开' : '折叠' }}
        </button>
        <ul v-if="!is_longterm_folded" class="onstage-list">
          <li v-if="longterm_npc_list.length === 0" class="empty-tip">暂无长期NPC数据</li>
          <li v-for="npc in longterm_npc_list" :key="npc.姓名">
            <div class="onstage-head">
              <strong>{{ npc.姓名 }}</strong>
              <span>等级 {{ npc.等级 || '新手' }}</span>
              <span>好感度 {{ npc.好感度 }}</span>
              <span>阶段 {{ npc.好感阶段 }}</span>
              <span>态度 {{ npc.态度 }}</span>
            </div>
            <p class="onstage-attrs">{{ format_attr_text(npc.基础属性) }}</p>
            <p class="onstage-attrs">关系标签：{{ (npc.关系标签 || []).join(' / ') || '无' }}</p>
            <p class="onstage-attrs">性行为次数：{{ npc.性行为次数 }} | 贞洁状态：{{ npc.贞洁状态 }}</p>
            <details>
              <summary>内心想法（隐藏，点击查看）</summary>
              <p class="onstage-thought">{{ npc.内心想法 || '暂无' }}</p>
            </details>
          </li>
        </ul>
      </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from './store';

type Profession = '指挥官' | '战姬' | '权柄使役者';
type WarmaidType = '侦察型' | '轻型' | '中型' | '重型' | '要塞型' | '地面支援姬';
type CreateStage = 'cover' | 'profile' | 'human' | 'abilities' | 'profession' | 'background' | 'warmaid';
type Gender = '男性' | '女性';
type HumanKey = '力量' | '敏捷' | '体质' | '感知' | '意志' | '魅力' | '学识';
type WarmaidAttrKey = '魔力评级' | '力量加成' | '体质加成' | '抗污染值' | '飞行速度' | '防御评级';
type AbilityItem = { name: string; desc: string; source: string };
type SkillNode = { id: string; name: string; cost: number; desc: string; prerequisites: string[] };
type AuthorityPath = '生命' | '历史' | '群星' | '黎明' | '黑夜' | '力量' | '希望' | '勇气' | '梦想';

type WarmaidStats = Record<WarmaidAttrKey, number>;

const store = useDataStore();
const data = computed(() => store.data);
const is_fullscreen = useLocalStorage('apocalypse_dawn:status_fullscreen', false);
const mobile_mode = useLocalStorage('apocalypse_dawn:mobile_mode', false);
const status_bar_collapsed = useLocalStorage('apocalypse_dawn:status_collapsed', true);
const mvu_font_size = useLocalStorage<'sm' | 'md' | 'lg' | 'xl'>('apocalypse_dawn:mvu_font_size', 'md');
const active_tab = useLocalStorage<'main' | 'battle' | 'recent' | 'warehouse'>('apocalypse_dawn:active_tab', 'main');
const display_floor_text = computed(() => {
  const direct = String(data.value.界面.楼层文本.正文 ?? '').trim();
  if (direct) return direct;
  return extractFloorTextFromRaw(String(data.value.界面.楼层文本.原文 ?? ''));
});
const default_next_action_options = [
  '前往报到处完成登记',
  '查看学院地图并确认任务点',
  '向教官申请首次训练',
  '与在场角色进行交流',
];
const next_action_options = ref<string[]>([...default_next_action_options]);
const next_action_panel_mode = useLocalStorage<'options' | 'input'>('apocalypse_dawn:next_action_panel_mode', 'options');
const manual_action_input = ref('');
const is_initial_mvu_focus_mode = computed(() => status_bar_collapsed.value);
const onstage_characters = computed(() => {
  const list = data.value.界面.在场角色;
  return Array.isArray(list) ? list : [];
});
const module_fold_state = useLocalStorage('apocalypse_dawn:module_fold_state', {
  在场角色: false,
  长期NPC: false,
});
const is_onstage_folded = computed(() => Boolean(data.value.界面.模块折叠?.在场角色 ?? module_fold_state.value.在场角色));
const is_longterm_folded = computed(() => Boolean(data.value.界面.模块折叠?.长期NPC ?? module_fold_state.value.长期NPC));
const longterm_npc_list = computed(() => {
  const source = data.value.世界?.长期NPC列表;
  if (!source || typeof source !== 'object') return [];
  return Object.values(source as Record<string, any>);
});
const warehouse_items = computed(() => {
  const source = data.value.战利品?.仓库?.物品;
  if (!source || typeof source !== 'object') return [];
  return Object.entries(source as Record<string, any>)
    .map(([name, raw]) => ({
      name,
      quality: String(raw?.品质 ?? '通用'),
      count: Number(raw?.数量 ?? 0),
      category: String(raw?.分类 ?? '杂项'),
      value: Number(raw?.价值 ?? 0),
      usable: is_library_invitation_item(name) && Number(raw?.数量 ?? 0) > 0,
    }))
    .filter(v => v.count > 0)
    .sort((a, b) => b.count - a.count);
});

function is_library_invitation_item(name: string): boolean {
  const n = String(name ?? '').trim();
  return ['大图书馆邀请函', '威曼普大图书馆邀请函'].includes(n);
}
function is_default_name(name: string): boolean {
  const n = String(name ?? '').trim();
  return !n || ['待命战姬', '玩家', '主角', '写卡助手'].includes(n);
}

const create_profile_valid = computed(() => {
  const build = data.value.界面?.建卡 ?? ({} as any);
  const started = Boolean(build.已开始);
  if (!started) return false;
  const profession_ok = build.职业 === '指挥官' || build.职业 === '战姬' || build.职业 === '权柄使役者';
  const name_ok = !is_default_name(String(build.角色姓名 ?? ''));
  const gender = String(build.性别 ?? '').trim();
  const gender_ok = build.职业 === '战姬' ? gender === '女性' : (gender === '男性' || gender === '女性');
  return profession_ok && name_ok && gender_ok;
});

const show_create = computed(() => !create_profile_valid.value);
const has_real_skill_check = computed(() => {
  const updated = Number((data.value as any).主角?.技能检定?.更新时间 ?? 0) > 0;
  if (!updated) return false;
  const desc = String((data.value as any).主角?.技能检定?.结果描述 ?? '');
  if (/暂无检定|尚未检定|未进行检定/.test(desc)) return false;
  return true;
});

const create_stage = ref<CreateStage>('cover');
const create_error = ref('');
const cheat_mode = ref(false);
const plot_mode = ref(false);
const draft_initialized = ref(false);

const warmaid_types: WarmaidType[] = ['侦察型', '轻型', '中型', '重型', '要塞型', '地面支援姬'];
const human_keys: HumanKey[] = ['力量', '敏捷', '体质', '感知', '意志', '魅力', '学识'];
const human_attr_desc: Record<HumanKey, { 用途: string; 说明: string }> = {
  力量: { 用途: '发力、搬运、破坏、近身施力动作。', 说明: '决定角色在推、拉、搬、攀、撞击、近身压制等需要纯粹发力场景中的稳定性与上限。' },
  敏捷: { 用途: '闪避、平衡、精细动作、快速位移。', 说明: '影响角色反应、身法、手眼协调与危险环境中的身体控制能力。' },
  体质: { 用途: '生命、耐受、恢复、抗疲劳。', 说明: '决定生命上限、体力承受能力与长时间行动后的状态稳定性，是生存核心属性之一。' },
  感知: { 用途: '观察、警觉、追踪线索、环境判断。', 说明: '用于发现异常、察觉伏击、读取场景细节、捕捉声音与气味等侦知行为。' },
  意志: { 用途: '抗压、抗恐惧、坚持、精神稳定。', 说明: '决定角色在高压、污染、恐惧、诱导与痛苦环境中的精神稳定与执行能力。' },
  魅力: { 用途: '交流、说服、安抚、建立关系。', 说明: '影响社交表达、亲和力、谈判氛围与他人对你的初始接受度。' },
  学识: { 用途: '课程学习、推理、记忆、理论判断。', 说明: '决定对异种学、数学、物理、化学、权柄理论等知识内容的理解、检索与应用。' },
};
const mvu_font_size_options = [
  { key: 'sm', label: '小' },
  { key: 'md', label: '中' },
  { key: 'lg', label: '大' },
  { key: 'xl', label: '特大' },
] as const;
const air_phase_options = ['遭遇', '行动点计算', '站位划分', '制空判定', '行动序列', '回合执行', '空战结算'] as const;
const air_layer_options = ['湍流层', '云层', '高空', '标准空域', '低空', '地面'] as const;
const scout_unit_options = ['侦察型', '轻型', '中型', '重型及以上'] as const;
const scout_target_options = ['侦察型', '轻型', '中型', '重型', '要塞'] as const;
const ability_pick_limit = 2;
const base_ability_map: Record<Profession, AbilityItem[]> = {
  指挥官: [
    { name: '指挥通畅', desc: '维持编队链路稳定，减少战术执行混乱。', source: '对应DOCX“指挥官专用/综合指挥链路”' },
    { name: '调律校准', desc: '更快完成战姬频率调律，缩短战前准备。', source: '对应DOCX“指挥官可进行调律”' },
    { name: '无人补给', desc: '补给舰调度更高效，提升队伍续航。', source: '对应DOCX“指挥官补给舰与补给链”' },
    { name: '阵型推演', desc: '更早解锁并熟练使用编队阵型。', source: '对应DOCX“阵型由指挥官决定”' },
    { name: '后卫协同', desc: '在后卫/支援阵线进行更稳定的协同支援。', source: '对应DOCX“指挥官适合支援阵线”' },
    { name: '战术复盘', desc: '战后快速总结，提升后续行动判定质量。', source: '对应DOCX“读书/学习解锁编队能力”' },
  ],
  战姬: [
    { name: '灵装预热', desc: '灵装化启动更平滑，降低开场波动。', source: '对应DOCX“战姬灵装化规则”' },
    { name: '高机动切入', desc: '进入交锋区时更容易建立优势。', source: '对应DOCX“空战分层与机动”' },
    { name: '火力压制', desc: '持续火力更稳定，压制敌方行动。', source: '对应DOCX“连射/多武器火力流程”' },
    { name: '污染耐受', desc: '对异种污染与持续损伤的承受更强。', source: '对应DOCX“抗污染值与灵装维持”' },
    { name: '近战反制', desc: '在近距交锋中更易抓住反击窗口。', source: '对应DOCX“地面战动作与反射动作”' },
    { name: '空域感知', desc: '对空域变化与目标动向更敏锐。', source: '对应DOCX“空战侦查/制空信息”' },
  ],
  权柄使役者: [
    { name: '仪式构筑', desc: '更快完成基础仪式框架部署。', source: '对应DOCX“权柄使役者通过仪式施术”' },
    { name: '圣器引导', desc: '借由象征物与圣器稳定权柄输出。', source: '对应DOCX“圣器与契约表象”' },
    { name: '权柄共鸣', desc: '更容易触发权柄碎片的有效回应。', source: '对应DOCX“家族血脉中的权柄碎片”' },
    { name: '精神锚定', desc: '降低高压施术时的精神失稳风险。', source: '对应DOCX“超自然力量承载风险”' },
    { name: '象征施术', desc: '以简化行为完成可控施术。', source: '对应DOCX“书写者可用简化仪式”' },
    { name: '契约缄默', desc: '在风险边界内控制权柄代价外溢。', source: '对应DOCX“高位契约与代价”' },
  ],
};

const human_caps: Record<HumanKey, number> = {
  力量: 5,
  敏捷: 5,
  体质: 5,
  感知: 5,
  意志: 5,
  魅力: 5,
  学识: 5,
};

const warmaid_dice_rules: Record<WarmaidType, Record<WarmaidAttrKey, string>> = {
  侦察型: { 魔力评级: '4D6', 力量加成: '2D6', 体质加成: '2D6', 抗污染值: '2D6', 飞行速度: '6D6', 防御评级: '1D4' },
  轻型: { 魔力评级: '4D6', 力量加成: '3D6', 体质加成: '3D6', 抗污染值: '3D6', 飞行速度: '5D6', 防御评级: '2D6' },
  中型: { 魔力评级: '4D6', 力量加成: '4D6', 体质加成: '3D6', 抗污染值: '5D6', 飞行速度: '4D6', 防御评级: '3D8' },
  重型: { 魔力评级: '4D6', 力量加成: '6D6', 体质加成: '5D6', 抗污染值: '6D6', 飞行速度: '3D5', 防御评级: '4D8' },
  要塞型: { 魔力评级: '4D6', 力量加成: '10D6', 体质加成: '7D6', 抗污染值: '10D6', 飞行速度: '1D2', 防御评级: '7D10' },
  地面支援姬: { 魔力评级: '4D6', 力量加成: '5D6', 体质加成: '4D6', 抗污染值: '10D6', 飞行速度: '1D1', 防御评级: '4D12' },
};

const age_limit_map: Record<Profession, { min: number; max: number }> = {
  指挥官: { min: 21, max: 70 },
  战姬: { min: 12, max: 21 },
  权柄使役者: { min: 12, max: 80 },
};
const skill_points_total = 4;
const authority_paths: AuthorityPath[] = ['生命', '历史', '群星', '黎明', '黑夜', '力量', '希望', '勇气', '梦想'];
const authority_forbidden_pattern = /无敌|神|成神|全能|直接成为权柄之主|权柄之主|永生|秒杀|无限|必胜|无上限/i;
const background_filter_pattern = /武器|装备|能力|技能|灵装|道具|神器|无敌|神格|权柄之主/i;
const training_keyword_pattern = /军人|军队|部队|训练|受训|战术|服役|教官|军校|实战/;
const warmaid_skill_tree: Record<WarmaidType, SkillNode[]> = {
  侦察型: [
    { id: '1', name: '侦察升级', cost: 1, desc: '侦察骰点提升1D6，侦察大成功范围增加。', prerequisites: [] },
    { id: '1.1', name: '精锐侦察', cost: 2, desc: '侦察完毕后压制敌方侦察并夺取制空。', prerequisites: ['1'] },
    { id: '2', name: '灵能提升', cost: 1, desc: '防御评级提升2D5。', prerequisites: [] },
    { id: '2.1', name: '灵装升级', cost: 2, desc: '额外2级武器槽位并增加1D5魔力评级。', prerequisites: ['2'] },
    { id: '3', name: '滑翔', cost: 2, desc: '无声行动，降低被侦察概率。', prerequisites: [] },
    { id: '4', name: '空战适应性', cost: 1, desc: '生存能力提高并增加一个武器槽。', prerequisites: [] },
    { id: '4.1', name: '空战高手', cost: 3, desc: '飞行速度提升，可短暂魔力加压再提速。', prerequisites: ['4'] },
    { id: '5', name: '炮火通讯协议', cost: 2, desc: '辅助瞄准叠加重武器命中直至必中。', prerequisites: [] },
  ],
  轻型: [
    { id: '1', name: '追猎者', cost: 1, desc: '低生命目标伤害提升并提高追击速度。', prerequisites: [] },
    { id: '1.1', name: '寻血猎犬', cost: 2, desc: '追击时减目标移动并放宽近战触发。', prerequisites: ['1'] },
    { id: '1.2', name: '猎血狂犬', cost: 3, desc: '低血量目标额外伤害并施加强压制。', prerequisites: ['1', '1.1'] },
    { id: '2', name: '自由飞翔', cost: 1, desc: '飞行速度增加1D6。', prerequisites: [] },
    { id: '2.1', name: '空中雄鹰', cost: 2, desc: '速度优势时所有武器命中+20。', prerequisites: ['2'] },
    { id: '2.2', name: '王牌猎鹰', cost: 3, desc: '速度优势时所有武器伤害+10。', prerequisites: ['2', '2.1'] },
    { id: '3', name: '武装巡逻', cost: 1, desc: '保留行动可阻断敌方侦察/辅助并必中反制。', prerequisites: [] },
  ],
  中型: [
    { id: '1', name: '空中战法', cost: 1, desc: '全属性增加2点。', prerequisites: [] },
    { id: '1.1', name: '竞争战法', cost: 2, desc: '自选两项属性增加1D6。', prerequisites: ['1'] },
    { id: '1.2', name: '精锐战法', cost: 3, desc: '额外武器槽与自由分配点数。', prerequisites: ['1', '1.1'] },
    { id: '2', name: '扩散压制', cost: 1, desc: '可同时压制两个区域。', prerequisites: [] },
    { id: '2.1', name: '空中骑士', cost: 2, desc: '对同级及以下目标伤害/穿甲/命中提升。', prerequisites: ['2'] },
    { id: '2.2', name: '空中领主', cost: 3, desc: '同空域小体型敌方全面削弱。', prerequisites: ['2', '2.1'] },
    { id: '2.3', name: '空中霸权', cost: 4, desc: '同空域敌方持续削弱，抗污染底线锁定。', prerequisites: ['2', '2.1', '2.2'] },
    { id: '3', name: '卫戍协议', cost: 3, desc: '可伴飞重型并令敌方视为后卫状态。', prerequisites: [] },
  ],
  重型: [
    { id: '1', name: '高度防御', cost: 1, desc: '防御评级增加1D10。', prerequisites: [] },
    { id: '2', name: '密集编队', cost: 1, desc: '同阵线有友方时命中和速度提升。', prerequisites: [] },
    { id: '2.1', name: '支援', cost: 2, desc: '前线可无损使用重武器，交锋区命中提升。', prerequisites: ['2'] },
    { id: '3', name: '先进瞄准', cost: 1, desc: '瞄准命中增加。', prerequisites: [] },
    { id: '3.1', name: '魔力侦测', cost: 2, desc: '同目标失误后下次命中加值累计。', prerequisites: ['3'] },
    { id: '4', name: '密集打击', cost: 3, desc: '额外装载两武器槽并降低多武器惩罚。', prerequisites: [] },
  ],
  要塞型: [
    { id: '1', name: '不落要塞', cost: 1, desc: '防御增加2D10。', prerequisites: [] },
    { id: '1.1', name: '托布鲁克的铭记', cost: 2, desc: '单次伤害上限压制至40%。', prerequisites: ['1'] },
    { id: '1.2', name: '马奇诺的警示', cost: 3, desc: '半血强化防御，低抗污染时减伤。', prerequisites: ['1', '1.1'] },
    { id: '2', name: '密集炮火', cost: 2, desc: '额外携带1门武器并提升负重。', prerequisites: [] },
    { id: '2.1', name: '超密集火炮', cost: 2, desc: '再增武器槽并降低多武器惩罚。', prerequisites: ['2'] },
    { id: '2.2', name: '饱和式打击', cost: 3, desc: '一次战斗一次的全武器齐射。', prerequisites: ['2', '2.1'] },
    { id: '3', name: '自我校准', cost: 1, desc: '首次命中后同空域目标后续惩罚减免。', prerequisites: [] },
    { id: '4', name: '联合反击', cost: 6, desc: '进入自动反击状态，遭重型攻击即反制炮击。', prerequisites: [] },
  ],
  地面支援姬: [
    { id: '1', name: '高度防御', cost: 1, desc: '防御评级增加1D10。', prerequisites: [] },
    { id: '2', name: '密集编队', cost: 1, desc: '同阵线协同时命中与速度提升。', prerequisites: [] },
    { id: '2.1', name: '支援', cost: 2, desc: '前线支援火力无损并强化命中。', prerequisites: ['2'] },
    { id: '3', name: '先进瞄准', cost: 1, desc: '瞄准命中增加。', prerequisites: [] },
  ],
};

const opening_story = `【联合纪年177年8月28日】
你们是新一批威曼普学院的新生。
根据【第二协议】中的对等条款，曾经在各地上中学的你们，在即将升到高中时，作为各地与威曼普学院的某种交换成为了对抗异种的中坚力量预备军。
而好巧不巧的是，在你们接到入学通知的时候，异种在领主【咒妄】的率领下，突破了联合北部防线，斯托尔，夏顿两座边塞城市的沦陷，直接导致重要军事要塞光明大圣堂被完全包围。
如果光明大圣堂沦陷，整个北部防线有被以点带面凿穿的风险，威曼普城同样根据【第二协议】的条款，派出了【海洋】【魔法支点】【学士】三个结社前往支援。
而除了这些明面上的力量，新生也不可避免的被卷入了这场漩涡，正面战场也许很难帮得上忙，但是，繁杂的侦查，辅助，探索，清理少量异种的任务，还是不可避免的向你们袭来。
而幸运与不幸的是，你们这支新成立的学员小队，恰巧成为了最前端的侦察小队，即将承接可能带来最丰厚报偿，也可能是送命的侦查任务……`;
const profession_background_starters: Record<Profession, string> = {
  指挥官: `【指挥官通用背景开局】\n我来自联合或大公国体系下的普通教育与基础军训环境，在进入威曼普学院前已接受过基础纪律、地图判读、队列协同或后勤常识训练，但并非前线老兵。被送入战姬学院后，我的核心目标是尽快完成指挥链路适配，学会与战姬小队稳定协同，并在真实任务中证明自己不是拖后腿的人。`,
  战姬: `【战姬通用背景开局】\n我在近期完成觉醒，被地方机构登记后依照【第二协议】送往威曼普学院。觉醒带来的力量让我既兴奋又不安：身体感知、魔力流动与情绪波动都和过去不同。入学后我需要尽快完成灵装适配、基础战术训练和小队磨合，学会在危险世界里使用这份力量而不是被它拖垮。`,
  权柄使役者: `【权柄使役者通用背景开局】\n我作为新入门的权柄使役者（或家族传承的低阶使役者）被纳入学院体系，拥有初步仪式经验或象征性施术认知，但仍缺乏系统战术训练。进入威曼普学院后，我需要在课程与任务中学会控制代价、理解协同规则，并证明自己能在战场边缘与侦查任务中稳定发挥作用。`,
};

const create_form = reactive({
  角色姓名: '',
  职业: '指挥官' as Profession,
  战姬类型: '轻型' as WarmaidType,
  性别: '男性' as Gender,
  年龄: 21,
});
const selected_warmaid_skills = ref<string[]>([]);
const warmaid_custom_skills = ref('');
const background_input = ref('');
const background_summary_override = ref('');
const authority_build = reactive({
  途径: '生命' as AuthorityPath,
  名称: '',
  技能描述: '',
});

const human_attr = reactive<Record<HumanKey, number>>({
  力量: 1,
  敏捷: 1,
  体质: 1,
  感知: 1,
  意志: 1,
  魅力: 1,
  学识: 1,
});

const warmaid_attr = reactive<WarmaidStats>({
  魔力评级: 0,
  力量加成: 0,
  体质加成: 0,
  抗污染值: 0,
  飞行速度: 0,
  防御评级: 0,
});

const warmaid_rolled = ref(false);
const selected_abilities = ref<string[]>([]);

const age_limit = computed(() => age_limit_map[create_form.职业]);
const human_points_left = computed(() => 5 - (_.sum(Object.values(human_attr)) - human_keys.length));
const current_base_abilities = computed(() => base_ability_map[create_form.职业]);
const current_ability_title = computed(() => `${create_form.职业}能力组`);
const current_ability_hint = computed(() => {
  if (create_form.职业 === '指挥官') return '指挥官能力偏重链路、补给、阵型与协同。';
  if (create_form.职业 === '战姬') return '战姬能力偏重灵装、机动、火力与抗污染。';
  return '权柄使役者能力偏重仪式、圣器、契约与权柄稳定。';
});
const current_warmaid_skills = computed(() => warmaid_skill_tree[create_form.战姬类型] ?? []);
const selected_warmaid_skill_cost = computed(() => {
  const map = new Map(current_warmaid_skills.value.map(v => [v.id, v.cost]));
  return selected_warmaid_skills.value.reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
});
const skill_points_left = computed(() => Math.max(0, skill_points_total - selected_warmaid_skill_cost.value));

const current_dice_rules = computed(() => {
  const rule = warmaid_dice_rules[create_form.战姬类型];
  return [
    { key: '魔力评级', rule: rule.魔力评级 },
    { key: '力量加成', rule: rule.力量加成 },
    { key: '体质加成', rule: rule.体质加成 },
    { key: '抗污染值', rule: rule.抗污染值 },
    { key: '飞行速度', rule: rule.飞行速度 },
    { key: '防御评级', rule: rule.防御评级 },
  ];
});

const warmaid_result_list = computed(() => [
  { key: '魔力评级', value: warmaid_attr.魔力评级 },
  { key: '力量加成', value: warmaid_attr.力量加成 },
  { key: '体质加成', value: warmaid_attr.体质加成 },
  { key: '抗污染值', value: warmaid_attr.抗污染值 },
  { key: '飞行速度', value: warmaid_attr.飞行速度 },
  { key: '防御评级', value: warmaid_attr.防御评级 },
]);

const profession = computed<Profession>(() => {
  const saved = data.value.界面.建卡?.职业;
  if (saved === '指挥官' || saved === '战姬' || saved === '权柄使役者') return saved;
  if (data.value.主角.档案.身份路径.includes('战姬')) return '战姬';
  if (data.value.主角.档案.身份路径.includes('权柄')) return '权柄使役者';
  return '指挥官';
});
const display_gender = computed(() => {
  const raw = String((data.value as any).主角?.档案?.性别 ?? '').trim();
  if (raw) return raw;
  return profession.value === '战姬' ? '女性' : '未设定';
});

const is_warmaid = computed(() => profession.value === '战姬');

const human_attributes = computed(() => {
  const base = data.value.主角.人类属性;
  const train = data.value.主角.锻炼;
  const add_str = is_warmaid.value && data.value.主角.灵装化.启用 ? data.value.主角.属性.力量加成 : 0;
  const add_con = is_warmaid.value && data.value.主角.灵装化.启用 ? data.value.主角.属性.体质加成 : 0;
  return [
    { key: '力量', value: base.力量 + add_str, training: train.力量 },
    { key: '敏捷', value: base.敏捷, training: train.敏捷 },
    { key: '体质', value: base.体质 + add_con, training: train.体质 },
    { key: '感知', value: base.感知, training: train.感知 },
    { key: '意志', value: base.意志, training: train.意志 },
    { key: '魅力', value: base.魅力, training: train.魅力 },
    { key: '学识', value: base.学识, training: train.学识 },
  ];
});

const warmaid_attributes = computed(() => [
  { key: '魔力评级', value: data.value.主角.属性.魔力评级 },
  { key: '力量加成', value: data.value.主角.属性.力量加成 },
  { key: '体质加成', value: data.value.主角.属性.体质加成 },
  { key: '抗污染值', value: data.value.主角.属性.抗污染值 },
  { key: '飞行速度', value: data.value.主角.属性.飞行速度 },
  { key: '防御评级', value: data.value.主角.属性.防御评级 },
]);

const level_label = computed(() => {
  if (profession.value === '战姬') return '战姬老练等级';
  if (profession.value === '权柄使役者') return '权柄使役者等级';
  return '军衔等级';
});

const warmaid_rank_names = ['新手', '入门', '标准', '熟练', '专业', '精锐', '传奇'] as const;
const authority_rank_names = ['信徒', '书写者', '编织者', '权柄之主'] as const;

const level_value = computed(() => {
  if (profession.value === '战姬') {
    const idx = _.clamp(data.value.主角.成长.战姬老练等级, 1, warmaid_rank_names.length) - 1;
    return warmaid_rank_names[idx];
  }
  if (profession.value === '权柄使役者') {
    const idx = _.clamp(data.value.主角.成长.权柄使役者等级, 1, authority_rank_names.length) - 1;
    return authority_rank_names[idx];
  }
  return '-';
});

const level_meta_lines = computed(() => {
  if (profession.value === '战姬') {
    const current = _.clamp(data.value.主角.成长.战姬老练等级, 1, warmaid_rank_names.length);
    const next = current < warmaid_rank_names.length ? warmaid_rank_names[current] : '已达最高';
    const need = data.value.主角.成长.下一级所需魔力碎片;
    return [
      `魔力碎片: ${data.value.主角.成长.魔力碎片}`,
      current < warmaid_rank_names.length ? `下一阶: ${next}（需 ${need}）` : '老练等级已达顶阶',
    ];
  }
  if (profession.value === '权柄使役者') {
    const shard = data.value.主角.成长.权柄碎片;
    const has_origin = data.value.主角.成长.权柄本源;
    const lv = _.clamp(data.value.主角.成长.权柄使役者等级, 1, authority_rank_names.length);
    if (lv <= 1) return [`权柄碎片: ${shard}`, '下一阶: 书写者（需 50 权柄碎片）'];
    if (lv === 2) return [`权柄碎片: ${shard}`, '下一阶: 编织者（需 100 权柄碎片）'];
    if (lv === 3) return [`权柄碎片: ${shard}`, has_origin ? '下一阶: 权柄之主（需 1000 权柄碎片）' : '下一阶: 权柄之主（需 1000 权柄碎片 + 权柄本源）'];
    return [`权柄碎片: ${shard}`, `权柄本源: ${has_origin ? '已持有' : '未持有'}`];
  }
  return ['无等级成长信息'];
});

function extractFloorTextFromRaw(raw: string): string {
  if (!raw) return '';

  const content_match = raw.match(/<content>([\s\S]*?)<\/content>/im);
  const source = content_match?.[1] ?? raw;

  return source
    .replace(/<update(?:variable)?>[\s\S]*?<\/update(?:variable)?>/gim, '')
    .replace(/<update(?:variable)?>[\s\S]*$/gim, '')
    .replace(/<StatusPlaceHolderImpl\/>/gim, '')
    .replace(/<OnStageCharacters>[\s\S]*?<\/OnStageCharacters>/gim, '')
    .replace(/<NpcRelationHints>[\s\S]*?<\/NpcRelationHints>/gim, '')
    .replace(/<(?:think|thinking|context|disclaimer|tucao|current_event|progress)[^>]*>[\s\S]*?<\/(?:think|thinking|context|disclaimer|tucao|current_event|progress)>/gim, '')
    .replace(/<(?:think|thinking|context|disclaimer|tucao|current_event|progress)[^>]*\/>/gim, '')
    .replace(/```[\s\S]*?```/gim, '')
    .replace(/<\/?[^>\n]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function format_attr_text(attrs: Record<string, number>): string {
  const entries = Object.entries(attrs ?? {});
  if (entries.length === 0) return '基础属性：暂无';
  return `基础属性：${entries.map(([k, v]) => `${k}:${v}`).join(' / ')}`;
}

function toggle_module(module_name: '在场角色' | '长期NPC'): void {
  if (!data.value.界面.模块折叠) {
    data.value.界面.模块折叠 = {
      在场角色: false,
      长期NPC: false,
    };
  }
  const current = Boolean(data.value.界面.模块折叠[module_name]);
  data.value.界面.模块折叠[module_name] = !current;
  module_fold_state.value = {
    ...module_fold_state.value,
    [module_name]: !current,
  };
}

function toggle_plot_mode(): void {
  plot_mode.value = !plot_mode.value;
  data.value.界面.建卡.剧情模式 = plot_mode.value;
  if (!data.value.世界.新手引导) return;
  data.value.世界.新手引导.剧情模式 = plot_mode.value;
  if (!plot_mode.value) {
    data.value.世界.新手引导.阶段 = '自由推进';
    data.value.世界.新手引导.最后推进说明 = '剧情模式关闭：不强制入学引导链。';
  } else if (data.value.世界.新手引导.阶段 === '自由推进') {
    data.value.世界.新手引导.阶段 = '入学手续';
    data.value.世界.新手引导.最后推进说明 =
      '剧情模式已开启：请先完成入学手续，再完成一周课程，最后前往最低难度希尔顿试验室。';
  }
}

watch(
  () => create_form.职业,
  () => {
    create_form.年龄 = _.clamp(Number(create_form.年龄) || age_limit.value.min, age_limit.value.min, age_limit.value.max);
    if (create_form.职业 === '战姬') create_form.性别 = '女性';
    const valid_ability_names = new Set(current_base_abilities.value.map(v => v.name));
    selected_abilities.value = selected_abilities.value.filter(name => valid_ability_names.has(name));
    selected_warmaid_skills.value = [];
    warmaid_custom_skills.value = '';
    authority_build.名称 = '';
    authority_build.技能描述 = '';
    authority_build.途径 = '生命';
    if (create_form.职业 !== '战姬') {
      warmaid_rolled.value = false;
      Object.assign(warmaid_attr, { 魔力评级: 0, 力量加成: 0, 体质加成: 0, 抗污染值: 0, 飞行速度: 0, 防御评级: 0 });
    }
  },
  { immediate: true },
);

watch(
  () => create_form.战姬类型,
  () => {
    warmaid_rolled.value = false;
  },
);

watch(
  () => show_create.value,
  show => {
    if (!show) {
      draft_initialized.value = false;
      return;
    }
    if (draft_initialized.value) return;

    const saved = data.value.界面.建卡;
    if (!saved) return;
    if (saved.已开始 && create_profile_valid.value) return;

    create_form.角色姓名 = saved.角色姓名 || '';
    create_form.职业 = saved.职业;
    create_form.战姬类型 = saved.战姬类型;
    create_form.性别 = (saved as any).性别 === '女性' ? '女性' : create_form.职业 === '战姬' ? '女性' : '男性';
    create_form.年龄 = saved.年龄;
    cheat_mode.value = Boolean(saved.作弊模式);
    plot_mode.value = Boolean((saved as any).剧情模式);
    draft_initialized.value = true;
  },
  { immediate: true },
);

watchEffect(() => {
  if (show_create.value) return;
  const in_air_battle = data.value.主角.战术.战斗模式 === '空战' && data.value.主角.战术.是否战斗中;
  if (in_air_battle) active_tab.value = 'battle';
});

function build_next_actions_from_reply(text: string): string[] {
  const t = text.trim();
  if (!t) return [...default_next_action_options];

  const bad_action_pattern = /^(然后|于是|并且|但是|如果|所以|那就|这个|那个|开始|继续|现在|最后|本轮|本回合|进入《)/;
  const action_noise_pattern = /(第一天|空档|流程|系统|提示|规则|变量|楼层|代码块|输出|模型|AI|助手)/;
  const normalize_action = (raw: string): string => {
    return String(raw ?? '')
      .replace(/^[：:、，\-\s]+/, '')
      .replace(/[：:、，\-\s]+$/, '')
      .replace(/[。！？!?.]+$/g, '')
      .trim();
  };
  const is_valid_action = (action: string): boolean => {
    if (!action) return false;
    if (action.length < 6 || action.length > 24) return false;
    if (bad_action_pattern.test(action)) return false;
    if (action_noise_pattern.test(action)) return false;
    if (!/^(前往|查看|确认|申请|参加|进行|进入|整理|调查|检索|汇报|推进|联系|交流|侦查|领取|整备|休整|处理|提交|听取|学习|记录|询问|护送|护卫|训练)/.test(action)) return false;
    return true;
  };

  const pool: string[] = [];
  const pushUnique = (v: string) => {
    const s = normalize_action(v);
    if (!is_valid_action(s)) return;
    if (!pool.includes(s)) pool.push(s);
  };

  const direct_candidates = Array.from(
    new Set(
      t
        .split(/\n|。|！|!|？|\?/)
        .map(v => v.trim())
        .filter(Boolean)
        .flatMap((line) => {
          const out: string[] = [];
          const m1 = line.match(/(?:你可以|可选择|建议你|下一步可|接下来可|你将|你决定)([^，。；\n]{3,24})/);
          if (m1?.[1]) out.push(m1[1]);
          const m2 = line.match(/(?:前往|调查|申请|进入|确认|整理|查看|联系|汇报|推进|训练|休整)[^，。；\n]{2,24}/);
          if (m2?.[0]) out.push(m2[0]);
          return out;
        })
        .map(normalize_action),
    ),
  );
  for (const candidate of direct_candidates) pushUnique(candidate);

  if (/报到|学院|新生|教官|训练/.test(t)) {
    pushUnique('前往报到处补全入学手续');
    pushUnique('向教官申请进行首次适配训练');
  }
  if (/战斗|空战|异种|敌人|警报|突袭/.test(t)) {
    pushUnique('进入战备状态并确认当前阵线');
    pushUnique('申请侦察并汇报敌情');
    pushUnique('检查武装与资源后准备交战');
  }
  if (/图书馆|资料|线索|情报|调查/.test(t)) {
    pushUnique('前往图书馆检索相关情报');
    pushUnique('对当前线索进行整理并提出假设');
  }
  if (/任务|委托|小队|行动/.test(t)) {
    pushUnique('确认小队分工并接受当前任务');
    pushUnique('向队友同步行动计划');
  }
  if (/受伤|治疗|恢复|污染/.test(t)) {
    pushUnique('优先处理伤势与污染状态');
  }
  if (/交易|黑市|物资|联合币/.test(t)) {
    pushUnique('整理仓库并评估黑市交易方案');
  }

  const current_stage = String((data.value as any).世界?.新手引导?.阶段 ?? '');
  if (current_stage === '入学手续') {
    pushUnique('提交身份核验并完成报到登记');
    pushUnique('参加首次链路适配测试');
  } else if (current_stage === '课程周') {
    pushUnique('参加异种学基础课程');
    pushUnique('进行模拟侦察训练');
  } else if (current_stage === '希尔顿试验室任务') {
    pushUnique('领取最低难度希尔顿试验室任务');
    pushUnique('整备后前往试验室入口');
  }

  const first_npc = String((onstage_characters.value?.[0] as any)?.姓名 ?? '').trim();
  if (first_npc) {
    pushUnique(`向${first_npc}询问当前局势`);
  }

  // fallback
  pushUnique('与在场角色进行交流');
  pushUnique('查看近期事务并决定下一步');
  pushUnique('进行一次谨慎侦察行动');
  pushUnique('根据当前局势推进主线任务');

  return ensure_four_actions(pool.slice(0, 4));
}

function ensure_four_actions(list: string[]): string[] {
  const result: string[] = [];
  for (const item of list) {
    const t = String(item ?? '').trim();
    if (!t) continue;
    if (!result.includes(t)) result.push(t);
    if (result.length >= 4) return result;
  }
  for (const item of default_next_action_options) {
    if (!result.includes(item)) result.push(item);
    if (result.length >= 4) break;
  }
  return result.slice(0, 4);
}

watch(
  () => display_floor_text.value,
  (val) => {
    const source = String(val ?? '').trim() || String(data.value.界面?.楼层文本?.原文 ?? '');
    next_action_options.value = ensure_four_actions(build_next_actions_from_reply(source));
  },
  { immediate: true },
);
watch(
  () => Number((data.value as any).界面?.楼层文本?.更新时间 ?? 0),
  () => {
    const source = String(display_floor_text.value ?? '').trim() || String(data.value.界面?.楼层文本?.原文 ?? '');
    next_action_options.value = ensure_four_actions(build_next_actions_from_reply(source));
  },
);
watch(
  () => String((data.value as any).界面?.楼层文本?.原文 ?? ''),
  (raw) => {
    if (!raw) return;
    const source = String(display_floor_text.value ?? '').trim() || raw;
    next_action_options.value = ensure_four_actions(build_next_actions_from_reply(source));
  },
);

function change_human(key: HumanKey, delta: number): void {
  if (delta > 0) {
    if (human_points_left.value <= 0) return;
    if (human_attr[key] >= human_caps[key]) return;
    human_attr[key] += 1;
    return;
  }

  if (human_attr[key] <= 1) return;
  human_attr[key] -= 1;
}

function go_human_step(): void {
  create_error.value = '';

  const name = create_form.角色姓名.trim();
  if (!name) {
    create_error.value = '请输入角色姓名';
    return;
  }

  const limit = age_limit.value;
  const age = Number(create_form.年龄);
  if (!cheat_mode.value && (!Number.isFinite(age) || age < limit.min || age > limit.max)) {
    create_error.value = `年龄不符合职业限制（${limit.min}-${limit.max}）`;
    return;
  }

  create_stage.value = 'human';
}

function go_next_after_human(): void {
  create_error.value = '';
  if (!cheat_mode.value && human_points_left.value !== 0) {
    create_error.value = '请先分配完全部 5 点人类属性';
    return;
  }

  create_stage.value = 'abilities';
}

function toggle_ability(name: string): void {
  create_error.value = '';
  const current = selected_abilities.value;
  if (current.includes(name)) {
    selected_abilities.value = current.filter(v => v !== name);
    return;
  }
  if (current.length >= ability_pick_limit) {
    create_error.value = `当前版本最多选择 ${ability_pick_limit} 项基础能力`;
    return;
  }
  selected_abilities.value = [...current, name];
}

function go_next_after_abilities(): void {
  create_error.value = '';
  if (!cheat_mode.value && selected_abilities.value.length === 0) {
    create_error.value = '请至少选择 1 项基础能力';
    return;
  }
  create_stage.value = 'profession';
}

function hasWarmaidSkillPrerequisites(skill_id: string): boolean {
  const node = current_warmaid_skills.value.find(v => v.id === skill_id);
  if (!node) return false;
  return node.prerequisites.every(pre => selected_warmaid_skills.value.includes(pre));
}

function toggle_warmaid_skill(skill_id: string): void {
  create_error.value = '';
  const node = current_warmaid_skills.value.find(v => v.id === skill_id);
  if (!node) return;

  if (selected_warmaid_skills.value.includes(skill_id)) {
    const used_as_pre = current_warmaid_skills.value.some(v =>
      selected_warmaid_skills.value.includes(v.id) && v.prerequisites.includes(skill_id));
    if (used_as_pre && !cheat_mode.value) {
      create_error.value = '有后续技能依赖该节点，无法取消';
      return;
    }
    selected_warmaid_skills.value = selected_warmaid_skills.value.filter(v => v !== skill_id);
    return;
  }

  if (!cheat_mode.value && !hasWarmaidSkillPrerequisites(skill_id)) {
    create_error.value = `技能 ${skill_id} 前置条件不足`;
    return;
  }
  if (!cheat_mode.value && selected_warmaid_skill_cost.value + node.cost > skill_points_total) {
    create_error.value = `技能点不足（初始仅 ${skill_points_total} 点）`;
    return;
  }

  selected_warmaid_skills.value = [...selected_warmaid_skills.value, skill_id];
}

function sanitizeBackground(raw: string): string {
  const compact = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !background_filter_pattern.test(line))
    .join(' ');
  return compact.slice(0, 320);
}

function validateAuthorityBuild(): string {
  if (create_form.职业 !== '权柄使役者') return '';
  if (!authority_build.名称.trim()) return '请填写权柄名称';
  if (!authority_build.技能描述.trim()) return '请填写赋予技能';
  const merged = `${authority_build.名称}\n${authority_build.技能描述}`;
  if (!cheat_mode.value && authority_forbidden_pattern.test(merged)) {
    return '权柄描述存在超限内容（无敌/成神/直接权柄之主等），请重写';
  }
  return '';
}

function go_next_after_profession(): void {
  create_error.value = '';
  if (create_form.职业 === '战姬' && !cheat_mode.value && selected_warmaid_skills.value.length === 0) {
    create_error.value = '请至少选择1个战姬技能节点';
    return;
  }

  const authority_err = validateAuthorityBuild();
  if (authority_err) {
    create_error.value = authority_err;
    return;
  }
  create_stage.value = 'background';
}

function go_next_after_background(): void {
  create_error.value = '';
  if (!background_input.value.trim() && !cheat_mode.value) {
    create_error.value = '请填写背景';
    return;
  }
  if (create_form.职业 === '战姬') {
    create_stage.value = 'warmaid';
    return;
  }
  finish_create();
}

function rollD(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function ensure_air_defaults(): void {
  if (!data.value.主角?.战术?.空战) return;
  if (!data.value.主角.战术.词条区) data.value.主角.战术.词条区 = {};
}

function roll_air_weather(): void {
  ensure_air_defaults();
  const r = rollD(100);
  const air = data.value.主角.战术.空战;
  air.天气判定值 = r;
  air.台风眼格 = [];
  if (r <= 10) {
    air.天气 = '万里无云';
    air.天气命中修正 = 10;
    air.天气探测修正 = 50;
    air.天气移速倍率 = 1;
  } else if (r <= 70) {
    air.天气 = '天气晴朗';
    air.天气命中修正 = 5;
    air.天气探测修正 = 0;
    air.天气移速倍率 = 1;
  } else if (r <= 80) {
    air.天气 = '阴雨连绵';
    air.天气命中修正 = -10;
    air.天气探测修正 = -50;
    air.天气移速倍率 = 0.5;
  } else if (r <= 90) {
    air.天气 = '雷暴雨天';
    air.天气命中修正 = -15;
    air.天气探测修正 = -50;
    air.天气移速倍率 = 0.5;
  } else {
    air.天气 = '台风天';
    air.天气命中修正 = -20;
    air.天气探测修正 = -30;
    air.天气移速倍率 = 0.6;
    air.台风眼格 = ['E3', 'H6'];
  }
  data.value.战场日志[`天气判定-${Date.now()}`] = `${air.天气}（d100=${r}，命中修正${air.天气命中修正}）`;
}

function score_air_side(side: { 侦察型: number; 轻型: number; 中型: number; 重型: number; 要塞型: number; 其他: number }): number {
  return side.侦察型 * 3 + side.轻型 * 3 + side.中型 * 2 + side.重型 + side.其他;
}

function calc_air_superiority(): void {
  ensure_air_defaults();
  const air = data.value.主角.战术.空战;
  const my_recon = air.我方单位.侦察型;
  const enemy_recon = air.敌方单位.侦察型;
  air.我方制空点 = score_air_side(air.我方单位);
  air.敌方制空点 = score_air_side(air.敌方单位);

  if (!air.触发突袭轮 && my_recon > 0 && enemy_recon === 0) {
    data.value.主角.战术.制空权 = '我方';
    air.制空修正 = 1;
    air.重武器命中条件 = '我方可视为提前完成重武器架设';
  } else if (!air.触发突袭轮 && enemy_recon > 0 && my_recon === 0) {
    data.value.主角.战术.制空权 = '敌方';
    air.制空修正 = -1;
    air.重武器命中条件 = '重武器需侦察/轻型辅助，否则命中无效';
  } else if (air.我方制空点 > air.敌方制空点) {
    data.value.主角.战术.制空权 = '我方';
    air.制空修正 = 1;
    air.重武器命中条件 = '无';
  } else if (air.我方制空点 < air.敌方制空点) {
    data.value.主角.战术.制空权 = '敌方';
    air.制空修正 = -1;
    air.重武器命中条件 = '重武器需侦察/轻型辅助，否则命中无效';
  } else {
    data.value.主角.战术.制空权 = '争夺中';
    air.制空修正 = 0;
    air.重武器命中条件 = '无';
  }

  data.value.战场日志[`制空判定-${Date.now()}`] = `我方${air.我方制空点}/敌方${air.敌方制空点}，制空权：${data.value.主角.战术.制空权}`;
}

function run_air_recon(): void {
  ensure_air_defaults();
  const air = data.value.主角.战术.空战;
  const base_roll = rollD(10);
  let bonus = 0;
  if (air.侦查单位类型 === '侦察型') bonus = rollD(10);
  else if (air.侦查单位类型 === '轻型') bonus = rollD(5);
  else if (air.侦查单位类型 === '中型') bonus = rollD(20);
  else bonus = 10;

  const hide_map: Record<string, number> = { 侦察型: 10, 轻型: 8, 中型: 5, 重型: 2, 要塞: 1 };
  const target = air.侦查目标类型;
  const origin_hide = hide_map[target];
  const roll = base_roll + bonus + air.天气探测修正;
  const tag_text = Object.entries(data.value.主角.战术.词条区)
    .map(([k, v]) => `${k}:${v.join(',')}`)
    .join(' | ');

  const has_camo = /迷彩/.test(tag_text);
  const has_huge = /巨型|领主|再诞战姬/.test(tag_text);
  let remaining = has_huge ? 0 : origin_hide;
  if (!has_huge) {
    if (!has_camo) remaining = Math.max(0, origin_hide - roll);
  }

  air.侦查结果 = roll;
  air.目标隐匿剩余 = remaining;
  data.value.战场日志[`侦查-${Date.now()}`] = `${air.侦查单位类型}侦查${target}：结果${roll}，隐匿剩余${remaining}${has_camo ? '（迷彩阻止消减）' : ''}`;
}

function record_air_tag(side: '我方' | '敌方'): void {
  ensure_air_defaults();
  const unit = window.prompt(`${side}单位名称`)?.trim();
  const tags = window.prompt('输入词条，逗号分隔（如：迷彩,拟态）')?.trim();
  if (!unit || !tags) return;
  const list = tags.split(',').map(v => v.trim()).filter(Boolean);
  data.value.主角.战术.词条区[`${side}-${unit}`] = list;
  data.value.战场日志[`词条登记-${Date.now()}`] = `${side}-${unit} => ${list.join(',')}`;
}

function finish_air_battle_and_feedback(): void {
  ensure_air_defaults();
  const air = data.value.主角.战术.空战;
  const logs = Object.entries(data.value.战场日志).slice(-3).map(([k, v]) => `${k}:${v}`).join('；');
  const tag_lines = Object.entries(data.value.主角.战术.词条区).map(([k, v]) => `${k}[${v.join(',')}]`).join('；') || '无';
  const summary = `空战结算：天气=${air.天气}(命中修正${air.天气命中修正})，空域=${air.空域层}，制空权=${data.value.主角.战术.制空权}（修正${air.制空修正 >= 0 ? '+' : ''}${air.制空修正}），突袭轮=${air.触发突袭轮 ? `是/${air.突袭来源}` : '否'}，侦查结果=${air.侦查结果}/隐匿剩余=${air.目标隐匿剩余}，词条区=${tag_lines}，最近战场日志=${logs}。请严格按该结算继续叙事。`;
  data.value.界面.空战反馈 = {
    待反馈: true,
    摘要: summary,
    时间戳: Date.now(),
  };
  data.value.主角.战术.是否战斗中 = false;
  data.value.主角.战术.战斗模式 = '非战斗';
  data.value.主角.战术.空战.流程阶段 = '空战结算';
  data.value.世界.近期事务.空战结算 = summary;
  data.value.战场日志[`空战结算-${Date.now()}`] = summary;
}

function rollExpr(expr: string): number {
  const m = expr.trim().toUpperCase().match(/^(\d+)D(\d+)$/);
  if (!m) return 0;
  const count = Number(m[1]);
  const sides = Number(m[2]);
  let total = 0;
  for (let i = 0; i < count; i += 1) total += rollD(sides);
  return total;
}

function roll_warmaid_stats(): void {
  create_error.value = '';
  const rule = warmaid_dice_rules[create_form.战姬类型];
  warmaid_attr.魔力评级 = rollExpr(rule.魔力评级);
  warmaid_attr.力量加成 = rollExpr(rule.力量加成);
  warmaid_attr.体质加成 = rollExpr(rule.体质加成);
  warmaid_attr.抗污染值 = rollExpr(rule.抗污染值);
  warmaid_attr.飞行速度 = rollExpr(rule.飞行速度);
  warmaid_attr.防御评级 = rollExpr(rule.防御评级);
  warmaid_rolled.value = true;
}

function finish_create(): void {
  create_error.value = '';
  if (create_form.职业 === '战姬' && !warmaid_rolled.value && !cheat_mode.value) {
    create_error.value = '请先完成战姬六维骰点';
    return;
  }

  const name = create_form.角色姓名.trim();
  if (!name) {
    create_error.value = '请输入角色姓名';
    return;
  }
  const authority_err = validateAuthorityBuild();
  if (authority_err) {
    create_error.value = authority_err;
    return;
  }
  const bg_raw = background_input.value.trim();
  const bg_summary = background_summary_override.value.trim() || sanitizeBackground(bg_raw);
  const training_source = `${bg_raw}\n${bg_summary}`;
  const training_state = training_keyword_pattern.test(training_source) ? '已受训' : '未受训';

  data.value.界面.建卡 = {
    已开始: true,
    角色姓名: name,
    职业: create_form.职业,
    战姬类型: create_form.战姬类型,
    性别: create_form.职业 === '战姬' ? '女性' : create_form.性别,
    年龄: Number(create_form.年龄),
    作弊模式: cheat_mode.value,
    剧情模式: plot_mode.value,
  };

  data.value.主角.档案.代号 = name;
  _.set(data.value, '主角.档案.性别', create_form.职业 === '战姬' ? '女性' : create_form.性别);
  data.value.主角.档案.身份路径 = create_form.职业 === '战姬' ? `战姬-${create_form.战姬类型}` : create_form.职业;

  data.value.主角.人类属性 = { ...human_attr };
  data.value.主角.锻炼 = {
    力量: 0,
    敏捷: 0,
    体质: 0,
    感知: 0,
    意志: 0,
    魅力: 0,
    学识: 0,
  };

  // 强制重置关键资源，避免旧会话污染导致“开局即死亡”。
  const max_hp = Math.max(100, Number(human_attr.体质 || 1) * 100);
  data.value.主角.资源.最大生命 = max_hp;
  data.value.主角.资源.当前生命 = max_hp;
  data.value.主角.资源.污染值 = 0;
  data.value.主角.资源.行动点 = 1;
  data.value.主角.资源.移动点 = 1;
  data.value.主角.资源.灵装槽上限 = 10;
  data.value.主角.资源.灵装槽当前 = 10;

  if (create_form.职业 === '战姬') {
    data.value.主角.属性 = { ...warmaid_attr };
    const max_mp = Math.max(20, warmaid_attr.魔力评级 * 10);
    data.value.主角.资源.最大魔力 = max_mp;
    data.value.主角.资源.当前魔力 = max_mp;
    data.value.主角.灵装化.每回合耗魔 = Math.max(1, Math.ceil(max_mp / 10));
  } else {
    data.value.主角.属性 = {
      魔力评级: 0,
      力量加成: 0,
      体质加成: 0,
      抗污染值: 0,
      飞行速度: 0,
      防御评级: 0,
    };
    data.value.主角.资源.最大魔力 = 100;
    data.value.主角.资源.当前魔力 = 100;
  }

  data.value.主角.灵装化.启用 = false;
  data.value.主角.灵装化.手动切换 = false;
  data.value.主角.灵装化.上次结算轮次 = data.value.主角.战术.当前轮次;
  data.value.主角.基础能力.已选 = [...selected_abilities.value];
  data.value.主角.技能树 = {
    可用技能点: skill_points_total - selected_warmaid_skill_cost.value,
    已用技能点: selected_warmaid_skill_cost.value,
    已解锁: Object.fromEntries(selected_warmaid_skills.value.map(id => [id, true])),
    自定义: warmaid_custom_skills.value.trim(),
  };
  data.value.主角.权柄 = {
    权柄名称: authority_build.名称.trim(),
    权柄途径: authority_build.途径,
    碎片数: create_form.职业 === '权柄使役者' ? 1 : 0,
    赋予技能: authority_build.技能描述.trim(),
    审核通过: create_form.职业 !== '权柄使役者' ? false : !authority_forbidden_pattern.test(`${authority_build.名称}\n${authority_build.技能描述}`),
    审核备注: create_form.职业 === '权柄使役者' ? '初始为【信徒】。禁止无敌、成神、直接权柄之主等超限设定。' : '',
  };
  data.value.主角.背景 = {
    原文: bg_raw,
    摘要: bg_summary,
  };
  data.value.主角.成长.战姬老练等级 = 1;
  data.value.主角.成长.权柄使役者等级 = 1;
  data.value.主角.成长.魔力碎片 = 0;
  data.value.主角.成长.下一级所需魔力碎片 = 10;
  data.value.主角.成长.权柄碎片 = 0;
  data.value.主角.成长.权柄本源 = false;

  data.value.世界.当前时间 = '联合纪年177年8月28日 08:00';
  data.value.世界.当前地点 = '威曼普战姬学院 主校区 报到大厅';
  data.value.世界.战区威胁等级 = '低';
  data.value.世界.新手引导 = {
    剧情模式: plot_mode.value,
    训练判定: training_state,
    阶段: plot_mode.value ? '入学手续' : '自由推进',
    入学手续进度: 0,
    课程周进度: 0,
    已完成入学手续: false,
    已完成课程周: false,
    已接希尔顿任务: false,
    最后推进说明: plot_mode.value
      ? '剧情模式已开启：请先完成入学手续，再完成一周课程，最后前往最低难度希尔顿试验室。'
      : '剧情模式未开启：可自由推进。',
  };
  data.value.世界.近期事务 = {
    新生报道: '在威曼普学院完成身份登记与宿舍分配',
    北线战况: '咒妄率异种突破北部防线，光明大圣堂遭围困',
    小队任务: '新生侦察小队即将承接前沿侦查任务',
    背景摘要: bg_summary || '暂无背景摘要',
    训练判定: training_state === '已受训' ? '背景含训练/战术经历，按受训生处理。' : '背景未出现军人/训练/战术经历，按未受训新生处理。',
    引导链: plot_mode.value
      ? '阶段1/3 入学手续：身份核验→链路适配→纪律简报。'
      : '剧情模式关闭：不强制入学引导链。',
  };

  data.value.战场日志 = {
    开场简报: '联合纪年177年8月28日，新生小队在威曼普学院报到并被编入前沿侦察序列。',
  };
  data.value.界面.楼层文本 = {
    正文: opening_story,
    原文: opening_story,
    更新时间: Date.now(),
  };
  data.value.界面.在场角色 = [];
  data.value.界面.模块折叠 = {
    在场角色: false,
    长期NPC: false,
  };
  module_fold_state.value = {
    在场角色: false,
    长期NPC: false,
  };

  data.value.战利品.显示战利品 = false;
  data.value.战利品.当前容器 = {};
  data.value.战利品.最近获取 = {};
  data.value.战利品.副本 = {
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
  };
  data.value.战利品.仓库 = {
    联合币: 0,
    芯片: 0,
    物品: {},
    独特收藏品: [],
  };
  data.value.界面.游戏结束 = {
    已结束: false,
    原因: '',
    时间戳: 0,
  };
  data.value.界面.空战反馈 = {
    待反馈: false,
    摘要: '',
    时间戳: 0,
  };
  data.value.世界.长期NPC列表 = {};
  data.value.世界.NPC关系追踪 = {};
  data.value.主角.战术.词条区 = {};
  data.value.主角.战术.空战 = {
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
  };
}

function toggle_transform(): void {
  if (!is_warmaid.value) return;

  const next = !data.value.主角.灵装化.启用;
  data.value.主角.灵装化.手动切换 = next;
  data.value.主角.灵装化.启用 = next;

  if (next) {
    data.value.主角.灵装化.上次结算轮次 = data.value.主角.战术.当前轮次;
  }
}

async function dispatch_action_to_tavern(action: string): Promise<void> {

  // 首选酒馆助手官方接口，避免跨域/DOM结构差异导致发送失败。
  try {
    if (typeof createChatMessages === 'function') {
      await createChatMessages([{ role: 'user', message: action }]);
      if (typeof triggerSlash === 'function') triggerSlash('/trigger');
      return;
    }
  } catch (error) {
    console.warn('[天启黎明] createChatMessages 发送失败，回退到兼容模式。', error);
  }

  // 远程前端在跨域 iframe 中时，不能直接操作父页面 DOM，优先通过 postMessage 交给主页面脚本代发。
  try {
    const payload = {
      type: 'apocalypse-dawn:send_action',
      source: 'apocalypse_dawn_mvu',
      action,
      ts: Date.now(),
    };
    if (window.parent) window.parent.postMessage(payload, '*');
    if (window.top && window.top !== window.parent) window.top.postMessage(payload, '*');
  } catch {}

  const docs: Document[] = [];
  docs.push(window.document);
  try {
    if (window.parent?.document && window.parent.document !== window.document) docs.push(window.parent.document);
  } catch {}
  try {
    if (window.top?.document && window.top.document !== window.document) docs.push(window.top.document);
  } catch {}

  const textarea_selectors = ['#send_textarea', 'textarea#send_textarea', 'textarea[id*=\"send\"]', 'textarea'];
  const send_btn_selectors = ['#send_but', 'button#send_but', '#send-button', 'button[type=\"submit\"]'];

  for (const doc of docs) {
    let input_el: HTMLTextAreaElement | null = null;
    for (const sel of textarea_selectors) {
      const el = doc.querySelector(sel);
      if (el instanceof HTMLTextAreaElement) {
        input_el = el;
        break;
      }
    }
    if (!input_el) continue;

    input_el.value = action;
    input_el.dispatchEvent(new Event('input', { bubbles: true }));
    input_el.dispatchEvent(new Event('change', { bubbles: true }));

    for (const sel of send_btn_selectors) {
      const btn = doc.querySelector(sel);
      if (btn instanceof HTMLElement) {
        btn.click();
        return;
      }
    }
  }
  // 这里不再弹错误：跨域模式下主页面会通过 message 监听代发，避免误报。
  console.info('[天启黎明] 当前上下文未直接找到输入框，已尝试通过 postMessage 发送。');
}

async function send_next_action(action: string): Promise<void> {
  const ok = window.confirm(`确定吗？\n将发送：${action}`);
  if (!ok) return;
  await dispatch_action_to_tavern(action);
}

function toggle_next_action_panel_mode(): void {
  next_action_panel_mode.value = next_action_panel_mode.value === 'options' ? 'input' : 'options';
}

function clear_manual_action(): void {
  manual_action_input.value = '';
}

async function send_manual_action(): Promise<void> {
  const action = manual_action_input.value.trim();
  if (!action) return;
  await dispatch_action_to_tavern(action);
  manual_action_input.value = '';
}

async function use_warehouse_item(item_name: string): Promise<void> {
  if (!is_library_invitation_item(item_name)) return;
  const stock = _.get(data.value, ['战利品', '仓库', '物品', item_name, '数量'], 0);
  if (Number(stock) <= 0) return;

  const ok = window.confirm(`确定使用【${item_name}】吗？\n将消耗1个并发送前往大图书馆的请求。`);
  if (!ok) return;

  _.set(data.value, ['战利品', '仓库', '物品', item_name, '数量'], Math.max(0, Number(stock) - 1));
  _.set(
    data.value,
    ['世界', '近期事务', '大图书馆邀请'],
    '已使用邀请函，准备前往威曼普城西侧大图书馆外馆办理入馆引导',
  );

  const action =
    '我使用大图书馆邀请函，前往威曼普城西侧大图书馆外馆，请按规则引导我入馆并说明当前可进入区域（外馆/内馆权限）。';
  await send_next_action(action);
}

function toggle_mobile_mode(): void {
  mobile_mode.value = !mobile_mode.value;
}

function toggle_status_bar(): void {
  status_bar_collapsed.value = !status_bar_collapsed.value;
}

const profession_background_starter = computed(() => profession_background_starters[create_form.职业]);

function apply_background_starter(append: boolean): void {
  const starter = profession_background_starter.value.trim();
  if (!starter) return;
  if (!append || !background_input.value.trim()) {
    background_input.value = starter;
    return;
  }
  background_input.value = `${background_input.value.trim()}\n\n${starter}`;
}
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 940px;
  margin: 0 auto;
  border: 2px solid var(--c-line);
  border-radius: 14px;
  background: var(--c-panel);
  box-shadow: 0 18px 44px rgba(16, 25, 30, 0.16);
  overflow: hidden;
}
.card.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  width: 100vw;
  max-width: none;
  margin: 0;
  border-width: 0;
  box-shadow: none;
  border-radius: 0;
  overflow-y: auto;
}
.create-flow {
  padding: 16px;
  background: radial-gradient(circle at 12% 10%, #fff6e9 0%, #fffdf8 42%, #f8ede3 100%);
}
.cover-panel {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 18px;
  border: 1px solid #9d7f61;
  border-radius: 14px;
  background: linear-gradient(150deg, #fff9ee 0%, #f3ddca 55%, #ead2bf 100%);
}
.logo {
  font-size: clamp(44px, 8vw, 92px);
  line-height: 1;
  letter-spacing: 8px;
  color: #7c2610;
  text-shadow: 0 2px 0 #ffdcb8, 0 6px 16px rgba(90, 22, 8, 0.28);
}
.author {
  font-size: 18px;
  color: #5f4332;
}
.cover-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.create-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid #9b8c80;
  border-radius: 12px;
  background: linear-gradient(165deg, #fffcf6 0%, #fff6ee 100%);
}
.create-panel h2 {
  color: var(--c-accent);
  font-size: 24px;
  letter-spacing: 0.5px;
}
.field {
  display: grid;
  gap: 6px;
}
.field span {
  font-size: 13px;
}
.field input,
.field select {
  border: 1px solid #3f525c;
  border-radius: 8px;
  padding: 9px 10px;
  background: #fff;
  font-family: var(--font-main);
}
.field textarea {
  border: 1px solid #3f525c;
  border-radius: 8px;
  padding: 9px 10px;
  background: #fff;
  font-family: var(--font-main);
  resize: vertical;
}
.tip {
  font-size: 12px;
  color: var(--c-sub);
}
.tip.strong {
  font-weight: 700;
  color: #7c2610;
}
.tip.profession-mark {
  color: #2d4653;
  font-weight: 700;
}
.age-tip {
  font-size: 12px;
  color: var(--c-sub);
}
.error {
  color: #b00020;
  font-size: 12px;
}
.actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.start-btn,
.secondary-btn {
  border-radius: 999px;
  font-weight: 700;
  padding: 9px 16px;
  cursor: pointer;
}
.start-btn {
  border: 2px solid #7a2f18;
  background: linear-gradient(180deg, #d56a46 0%, #b65232 100%);
  color: #fffaf6;
}
.start-btn.large {
  font-size: 16px;
  padding: 10px 28px;
}
.plot-btn {
  border: 1px solid #395f78;
  background: #eef7ff;
  color: #1d4258;
  border-radius: 999px;
  padding: 9px 18px;
  font-weight: 700;
  cursor: pointer;
}
.plot-btn.active {
  background: #1d4d68;
  color: #fff;
}
.plot-btn.large {
  font-size: 16px;
  padding: 10px 20px;
}
.mobile-btn {
  border: 1px solid #4a6b3a;
  background: #f2fff0;
  color: #315326;
  border-radius: 999px;
  padding: 9px 18px;
  font-weight: 700;
  cursor: pointer;
}
.mobile-btn.active {
  background: #2f6e44;
  color: #fff;
  border-color: #2f6e44;
}
.mobile-btn.large {
  font-size: 16px;
  padding: 10px 20px;
}
.cheat-btn {
  border: 1px solid #b03333;
  background: #fff1f1;
  color: #b00020;
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 700;
  cursor: pointer;
}
.cheat-btn.active {
  background: #b00020;
  color: #fff;
}
.secondary-btn {
  border: 1px solid #55646d;
  background: #fff;
  color: #2f4048;
}
.status-toggle-btn {
  border: 1px solid #6a5c2d;
  background: #fff8db;
  color: #5c4a16;
  border-radius: 999px;
  padding: 9px 14px;
  font-weight: 700;
  cursor: pointer;
}
.status-toggle-btn.active {
  background: #6a5c2d;
  color: #fff;
}
.allocate-list,
.ability-list,
.skill-list,
.dice-rule-list,
.dice-result-list {
  list-style: none;
  display: grid;
  gap: 6px;
}
.allocate-list li,
.ability-list li,
.skill-list li,
.dice-rule-list li,
.dice-result-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dashed #cdd6dc;
  padding-bottom: 4px;
}
.ability-btn {
  width: 100%;
  text-align: left;
  border: 1px solid #6d7d86;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  cursor: pointer;
  display: grid;
  gap: 4px;
}
.ability-btn.active {
  border-color: #7a2f18;
  background: #fff1e8;
}
.ability-btn span {
  font-weight: 700;
}
.ability-btn small {
  color: #5f7079;
}
.ability-source {
  color: #7a4b33;
  font-size: 11px;
}
.example-box {
  margin: 0;
  white-space: pre-wrap;
  border: 1px dashed #b58e71;
  border-radius: 8px;
  padding: 8px;
  background: #fff8f0;
  font-size: 12px;
  color: #5a473b;
}
.counter {
  display: flex;
  gap: 8px;
  align-items: center;
}
.human-attr-meta {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.human-attr-desc {
  font-size: 11px;
  color: #5f7079;
  line-height: 1.35;
}
.human-attr-help {
  border: 1px dashed #b8a589;
  border-radius: 8px;
  padding: 8px;
  background: #fffaf4;
}
.human-attr-help summary {
  cursor: pointer;
  font-weight: 700;
  color: #7c2610;
}
.human-attr-help-list {
  margin-top: 8px;
  list-style: none;
  display: grid;
  gap: 6px;
}
.human-attr-help-list li {
  display: grid;
  gap: 2px;
}
.human-attr-help-list li span {
  font-size: 12px;
  color: #4d5d67;
  line-height: 1.4;
}
.background-template-box {
  border: 1px dashed #8b9aa4;
  border-radius: 10px;
  background: #f8fcff;
  padding: 10px;
  display: grid;
  gap: 8px;
}
.background-template-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.background-template-preview {
  max-height: 150px;
  overflow: auto;
}
.counter button {
  width: 24px;
  height: 24px;
  border: 1px solid #55646d;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}
.mvu-textbox {
  padding: 12px;
  border-bottom: 1px dashed #7d8a90;
  background: #fffef8;
}
.mvu-textbox.mvu-focus-mode {
  min-height: clamp(340px, 62vh, 760px);
  display: grid;
  grid-template-rows: auto auto minmax(180px, 1fr) auto;
  align-content: start;
}
.mvu-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.mvu-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.mvu-font-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.mvu-font-label {
  font-size: 12px;
  color: var(--c-sub);
}
.font-size-btn {
  border: 1px solid #60707a;
  background: #fff;
  color: #34434b;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.font-size-btn.active {
  border-color: #2f4f62;
  background: #eaf5ff;
  color: #15384f;
  font-weight: 700;
}
.next-actions {
  padding: 12px;
  border-bottom: 1px dashed #7d8a90;
  background: #f8fcff;
}
.next-actions-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.next-actions h2 {
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--c-accent);
}
.next-actions h3 {
  margin: 0;
}
.next-actions-toggle-btn {
  border: 1px solid #53626a;
  border-radius: 999px;
  padding: 6px 10px;
  background: #fff;
  color: #2d3f49;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.next-actions-toggle-btn:hover {
  background: #edf4f9;
}
.next-actions-inputbox {
  display: grid;
  gap: 8px;
}
.next-actions-textarea {
  width: 100%;
  border: 1px solid #53626a;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
  color: #2d3f49;
  resize: vertical;
  font-family: var(--font-main);
  font-size: 13px;
  line-height: 1.45;
}
.next-actions-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.next-actions-input-actions .start-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.next-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.next-action-btn {
  border: 1px solid #53626a;
  border-radius: 8px;
  padding: 8px 10px;
  background: #ffffff;
  color: #2d3f49;
  font-size: 12px;
  text-align: left;
}
.next-action-btn:hover {
  background: #edf4f9;
}
.onstage-box {
  padding: 12px;
  border-bottom: 1px dashed #7d8a90;
  background: #f9fbff;
}
.onstage-box.in-panel {
  border: 1px solid #6f7d85;
  border-radius: 10px;
  background: #f7fbff;
}
.onstage-box h2 {
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--c-accent);
}
.module-toggle {
  width: 100%;
  text-align: left;
  border: 1px solid #53626a;
  border-radius: 8px;
  background: #ffffff;
  color: #2d3f49;
  font-weight: 700;
  padding: 8px 10px;
  cursor: pointer;
  margin-bottom: 8px;
}
.module-toggle:hover {
  background: #edf4f9;
}
.onstage-list {
  list-style: none;
  display: grid;
  gap: 8px;
}
.onstage-list li {
  border: 1px solid #5f6e77;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
.onstage-list li.empty-tip {
  border-style: dashed;
  color: #5e6f79;
  text-align: center;
  background: #fbfdff;
}
.onstage-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.onstage-attrs {
  margin: 6px 0;
  font-size: 12px;
  color: #4e5d66;
}
.onstage-thought {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
}
.mvu-textbox h2 {
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--c-accent);
}
.mvu-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.55;
  max-height: 240px;
  overflow: auto;
  padding: 10px;
  border: 1px solid #4f5d64;
  border-radius: 8px;
  background: #ffffff;
}
.mvu-textbox.mvu-focus-mode .mvu-body {
  max-height: none;
  min-height: 0;
  height: 100%;
}
.next-actions.compact {
  padding-top: 8px;
  padding-bottom: 8px;
}
.mvu-textbox.mvu-focus-mode .next-actions {
  border-bottom: 0;
  margin-top: 6px;
}
.mvu-body.mvu-font-sm {
  font-size: 12px;
  line-height: 1.45;
}
.mvu-body.mvu-font-md {
  font-size: 13px;
  line-height: 1.55;
}
.mvu-body.mvu-font-lg {
  font-size: 15px;
  line-height: 1.65;
}
.mvu-body.mvu-font-xl {
  font-size: 17px;
  line-height: 1.75;
}
.status-collapsed-banner {
  padding: 10px 12px;
  border-bottom: 1px dashed #7d8a90;
  background: #f6fbff;
}
.status-collapsed-banner p {
  margin: 0;
  font-size: 12px;
  color: #4e6070;
}
.gameover-banner {
  padding: 12px;
  border-bottom: 1px solid #8d1c1c;
  background: linear-gradient(120deg, #ffe6e6 0%, #ffd2d2 100%);
}
.gameover-banner h2 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #7a1010;
}
.gameover-banner p {
  margin: 0;
  font-size: 13px;
  color: #6a1a1a;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(130deg, #fffaf3 0%, #f2dfd5 100%);
  border-bottom: 1px solid #75838c;
}
.hero-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero h1 {
  font-size: 26px;
}
.hero p {
  font-size: 13px;
  color: var(--c-sub);
}
.threat {
  border: 1px solid var(--c-accent);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--c-accent);
  font-weight: 700;
  background: #fff6f2;
}
.fullscreen-btn,
.toggle-btn,
.tabs button {
  border: 1px solid var(--c-line);
  border-radius: 999px;
  background: #fff;
  color: var(--c-line);
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.fullscreen-btn:hover,
.toggle-btn:hover,
.tabs button:hover {
  background: var(--c-accent-soft);
}
.world {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px dashed var(--c-line);
}
.tabs {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px dashed var(--c-line);
}
.tabs button.active {
  background: var(--c-accent);
  color: #fff;
  border-color: var(--c-accent);
}
.panel {
  padding: 10px 12px 14px;
  display: grid;
  gap: 10px;
}
.bars {
  display: grid;
  gap: 8px;
}
.bar {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  gap: 8px;
}
.bar-value {
  min-width: 82px;
  text-align: right;
  font-size: 12px;
  color: var(--c-sub);
}
progress {
  width: 100%;
  height: 12px;
}
.grid {
  display: grid;
  gap: 10px;
}
.grid.two {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
article,
.loot {
  border: 1px solid #6f7d85;
  border-radius: 10px;
  padding: 10px;
  background: #fffefa;
}
article h3,
.loot h3 {
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--c-accent);
}
.big {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.kv {
  list-style: none;
  display: grid;
  gap: 4px;
}
.kv li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px dashed #ccd5d9;
  padding-bottom: 2px;
}
.kv li strong {
  text-align: right;
}
.air-menu {
  border: 1px solid #7f8d95;
  border-radius: 10px;
  padding: 10px;
  background: linear-gradient(180deg, #f8fcff 0%, #eef6fb 100%);
}
.air-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.field.mini span {
  font-size: 11px;
}
.field.mini select {
  padding: 6px 8px;
  font-size: 12px;
}
.air-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.toggle-btn.danger {
  color: #7d0f0f;
  border-color: #a23333;
  background: #ffecec;
}

.card.mobile-mode {
  position: fixed;
  inset: 0;
  z-index: 99998;
  width: 100vw;
  height: 100vh;
  max-width: none;
  margin: 0;
  border-width: 0;
  border-radius: 0;
  box-shadow: none;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.card.mobile-mode .create-flow,
.card.mobile-mode .panel,
.card.mobile-mode .mvu-textbox,
.card.mobile-mode .next-actions,
.card.mobile-mode .onstage-box {
  padding-left: 8px;
  padding-right: 8px;
}
.card.mobile-mode .cover-panel {
  min-height: 280px;
  gap: 10px;
  padding: 12px 10px;
}
.card.mobile-mode .logo {
  font-size: clamp(30px, 9vw, 56px);
  letter-spacing: 3px;
  text-align: center;
}
.card.mobile-mode .author {
  font-size: 14px;
}
.card.mobile-mode .cover-actions,
.card.mobile-mode .actions {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}
.card.mobile-mode .background-template-actions {
  display: grid;
  grid-template-columns: 1fr;
}
.card.mobile-mode .cover-actions > button,
.card.mobile-mode .actions > button,
.card.mobile-mode .background-template-actions > button,
.card.mobile-mode .plot-btn,
.card.mobile-mode .status-toggle-btn,
.card.mobile-mode .mobile-btn,
.card.mobile-mode .fullscreen-btn,
.card.mobile-mode .toggle-btn {
  width: 100%;
  text-align: center;
}
.card.mobile-mode .create-panel {
  padding: 10px;
  gap: 10px;
}
.card.mobile-mode .create-panel h2 {
  font-size: 18px;
}
.card.mobile-mode .field input,
.card.mobile-mode .field select,
.card.mobile-mode .field textarea {
  font-size: 14px;
  padding: 8px 9px;
}
.card.mobile-mode .allocate-list li,
.card.mobile-mode .dice-rule-list li,
.card.mobile-mode .dice-result-list li {
  align-items: flex-start;
  flex-direction: column;
}
.card.mobile-mode .counter {
  align-self: flex-end;
}
.card.mobile-mode .mvu-toolbar {
  align-items: stretch;
  flex-direction: column;
  gap: 6px;
}
.card.mobile-mode .mvu-toolbar h2 {
  margin-bottom: 0;
  font-size: 13px;
  line-height: 1.3;
}
.card.mobile-mode .mvu-toolbar-actions {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
}
.card.mobile-mode .mvu-font-tools {
  gap: 4px;
}
.card.mobile-mode .font-size-btn {
  flex: 1 1 calc(50% - 4px);
  text-align: center;
}
.card.mobile-mode .mvu-body {
  font-size: 12px;
  line-height: 1.45;
  max-height: 180px;
  padding: 8px;
}
.card.mobile-mode .mvu-textbox.mvu-focus-mode {
  min-height: calc(100vh - 12px - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0));
  grid-template-rows: auto auto minmax(220px, 1fr) auto;
}
.card.mobile-mode .next-actions h3 {
  font-size: 12px;
  line-height: 1.3;
}
.card.mobile-mode .next-actions-head {
  flex-direction: column;
  align-items: stretch;
}
.card.mobile-mode .next-actions-toggle-btn {
  width: 100%;
  text-align: center;
}
.card.mobile-mode .next-actions-grid {
  grid-template-columns: 1fr;
}
.card.mobile-mode .next-action-btn {
  font-size: 12px;
  padding: 9px;
}
.card.mobile-mode .next-actions-input-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.card.mobile-mode .hero {
  align-items: flex-start;
  flex-direction: column;
  padding: 10px;
}
.card.mobile-mode .hero h1 {
  font-size: 20px;
}
.card.mobile-mode .hero-controls {
  width: 100%;
  flex-wrap: wrap;
}
.card.mobile-mode .hero-controls > * {
  flex: 1 1 auto;
}
.card.mobile-mode .world {
  grid-template-columns: 1fr;
  padding: 8px;
}
.card.mobile-mode .tabs {
  gap: 6px;
  padding: 8px;
  flex-wrap: wrap;
}
.card.mobile-mode .tabs button {
  flex: 1 1 calc(50% - 6px);
  min-width: 0;
  white-space: normal;
  line-height: 1.2;
}
.card.mobile-mode .grid.two {
  grid-template-columns: 1fr;
}
.card.mobile-mode .bar {
  grid-template-columns: 42px 1fr;
}
.card.mobile-mode .bar-value {
  grid-column: 1 / -1;
  text-align: left;
  min-width: 0;
}
.card.mobile-mode article,
.card.mobile-mode .loot {
  padding: 8px;
}
.card.mobile-mode .mvu-textbox,
.card.mobile-mode .next-actions,
.card.mobile-mode .panel,
.card.mobile-mode .world,
.card.mobile-mode .tabs,
.card.mobile-mode .hero {
  width: 100%;
  max-width: 100%;
}
.card.mobile-mode .create-flow,
.card.mobile-mode .create-panel,
.card.mobile-mode .mvu-toolbar,
.card.mobile-mode .mvu-body,
.card.mobile-mode .next-actions-grid {
  min-width: 0;
}
.card.mobile-mode .plot-btn,
.card.mobile-mode .mobile-btn {
  white-space: normal;
  line-height: 1.2;
}
.card.mobile-mode .kv li {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}
.card.mobile-mode .kv li strong {
  text-align: left;
}

@media (max-width: 560px) {
  .card {
    border-width: 1px;
    border-radius: 10px;
  }
  .create-flow,
  .panel,
  .mvu-textbox,
  .next-actions,
  .onstage-box {
    padding-left: 8px;
    padding-right: 8px;
  }
  .create-panel {
    padding: 10px;
  }
  .create-panel h2 {
    font-size: 18px;
  }
  .logo {
    font-size: clamp(30px, 9vw, 58px);
    letter-spacing: 4px;
    text-align: center;
  }
  .cover-panel {
    min-height: 300px;
    gap: 12px;
    padding: 12px 10px;
  }
  .cover-actions {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }
  .cover-actions > button,
  .cheat-btn {
    width: 100%;
  }
  .mvu-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .mvu-toolbar-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }
  .mvu-font-tools {
    gap: 4px;
  }
  .font-size-btn {
    flex: 1 1 calc(50% - 4px);
    text-align: center;
  }
  .mvu-body {
    font-size: 12px;
    max-height: 190px;
    padding: 8px;
  }
  .mvu-textbox.mvu-focus-mode {
    min-height: calc(100vh - 20px);
    grid-template-rows: auto auto minmax(200px, 1fr) auto;
  }
  .next-actions {
    padding: 8px;
  }
  .next-actions-head {
    flex-direction: column;
    align-items: stretch;
  }
  .next-actions-toggle-btn {
    width: 100%;
    text-align: center;
  }
  .next-actions h3 {
    font-size: 12px;
  }
  .next-actions-input-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .allocate-list li {
    flex-direction: column;
    align-items: flex-start;
  }
  .counter {
    align-self: flex-end;
  }
  .background-template-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
  .hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .tabs {
    flex-wrap: wrap;
  }
  .tabs button {
    flex: 1 1 calc(50% - 6px);
    min-width: 0;
    white-space: normal;
  }
  .world {
    grid-template-columns: 1fr;
  }
  .grid.two {
    grid-template-columns: 1fr;
  }
  .bar {
    grid-template-columns: 42px 1fr;
  }
  .bar-value {
    grid-column: 1 / -1;
    text-align: left;
    min-width: 0;
  }
  .kv li {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .kv li strong {
    text-align: left;
  }
  .next-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
