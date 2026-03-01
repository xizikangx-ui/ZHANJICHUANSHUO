<template>
  <main ref="rootRef" class="shell" @click.stop>
    <section v-if="!started" class="start-screen">
      <div class="start-screen__veil" />
      <div class="start-card">
        <p class="start-card__kicker">LIBRARY NODE / LAYER SESSION</p>
        <h2>天启黎明</h2>
        <p class="start-card__author">作者：未来</p>
        <p class="start-card__desc">同层流式界面已加载。进入后可在一个界面里完成输入、AI回复与翻页推进。</p>
        <p class="start-card__quote">[入此地者，祝你好运]</p>
        <p class="start-card__mode">当前路线：{{ xenoRouteMode ? `异种开局（${xenoRouteRole}）` : '常规开局' }}</p>
        <p class="start-card__mode">当前建卡：{{ cheatMode ? '作弊模式已开启' : '标准模式' }}</p>
        <p class="start-card__mode">当前叙事：{{ plotMode ? '剧情模式' : '自由模式' }}</p>
        <div class="start-card__actions">
          <button type="button" @click="startNormalRoute">开始游戏</button>
          <button type="button" class="xeno" @click="startXenoRoute">
            {{ xenoRouteMode ? '异种开局：已选' : '异种开局' }}
          </button>
          <button type="button" class="ghost" @click="plotMode = !plotMode">
            {{ plotMode ? '剧情模式：开启' : '剧情模式：关闭' }}
          </button>
          <button type="button" class="ghost" @click="cheatMode = !cheatMode">
            {{ cheatMode ? '作弊模式：开启' : '作弊模式：关闭' }}
          </button>
          <button type="button" class="ghost" @click="pullFromTavern">读取酒馆配置</button>
        </div>
      </div>
    </section>

    <section v-else-if="!createDone && createPage === 1" class="panel create-card">
      <h2>建卡 - 第1页</h2>
      <label>
        <span>姓名</span>
        <input v-model.trim="createForm.name" placeholder="请输入角色姓名" />
      </label>
      <label>
        <span>职业类别</span>
        <select v-model="createForm.profession" :disabled="xenoRouteMode">
          <option v-for="item in professionOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <section v-if="xenoRouteMode" class="xeno-box">
        <p>异种开局身份（本地化重写）</p>
        <label>
          <span>身份类别</span>
          <select v-model="xenoRouteRole">
            <option value="再诞战姬">再诞战姬（高位格战斗个体）</option>
            <option value="异种指挥官">异种指挥官（高位格指挥个体）</option>
          </select>
        </label>
        <p class="hint">该路线会增强“异种认知滤镜”叙事权重，但不会取消风险与代价。</p>
      </section>
      <label class="desc-field">
        <span>职业说明（世界书原文）</span>
        <textarea :value="professionDescription" rows="9" readonly></textarea>
      </label>
      <label>
        <span>年龄（{{ currentAgeRange.min }}-{{ currentAgeRange.max }}）</span>
        <input
          v-model.number="createForm.age"
          type="number"
          :min="currentAgeRange.min"
          :max="currentAgeRange.max"
          placeholder="请输入年龄"
        />
      </label>
      <label>
        <span>性别</span>
        <select v-model="createForm.gender" :disabled="createForm.profession === '战姬'">
          <option v-for="item in genderOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label v-if="createForm.profession === '战姬'">
        <span>战姬类型</span>
        <select v-model="createForm.warmaidType">
          <option v-for="item in warmaidTypeOptions" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
      <label v-if="createForm.profession === '战姬'" class="desc-field">
        <span>战姬类型说明（世界书原文）</span>
        <textarea :value="warmaidTypeDescription" rows="10" readonly></textarea>
      </label>
      <div class="row center-row">
        <button type="button" class="ghost" @click="started = false">返回开始界面</button>
        <button type="button" @click="goCreatePageTwo">下一步</button>
      </div>
    </section>

    <section v-else-if="!createDone && createPage === 2" class="panel create-card">
      <h2>建卡 - 第2页（属性分配）</h2>
      <p class="hint">初始属性均为 1，自由分配 5 点。人类属性上限为 5。</p>
      <p class="hint">剩余可分配点数：{{ humanPointsLeft }}</p>

      <section class="attr-list">
        <article v-for="item in humanAttrItems" :key="item.key" class="attr-item">
          <header>
            <strong>{{ item.key }}</strong>
            <span>{{ item.desc }}</span>
          </header>
          <div class="attr-ctrl">
            <button type="button" class="ghost" :disabled="createHumanAttr[item.key] <= 1" @click="decHumanAttr(item.key)">-</button>
            <b>{{ createHumanAttr[item.key] }}</b>
            <button type="button" :disabled="humanPointsLeft <= 0 || createHumanAttr[item.key] >= 5" @click="incHumanAttr(item.key)">+</button>
          </div>
        </article>
      </section>

      <div class="row center-row">
        <button type="button" class="ghost" @click="createPage = 1">上一步</button>
        <button type="button" @click="goCreatePageThree">下一步</button>
      </div>
    </section>

    <section v-else-if="!createDone && createPage === 3" class="panel create-card">
      <h2>建卡 - 第3页（背景设定）</h2>
      <p class="hint">可填写最多1000字背景。背景会进入变量提示并影响训练判定与叙事约束。</p>
      <label>
        <span>默认背景模板</span>
        <select v-model="backgroundPresetKey">
          <option v-for="item in backgroundPresetOptions" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
      </label>
      <div class="row">
        <button type="button" class="ghost" @click="applyBackgroundPreset">载入模板到背景文本</button>
        <span class="hint">当前模板：{{ currentBackgroundPresetLabel }}</span>
      </div>
      <label class="desc-field">
        <span>角色背景（0-1000字）</span>
        <textarea v-model="createForm.background" rows="12" maxlength="1000" placeholder="写下你的身世、经历、受训情况、入学动机等。"></textarea>
      </label>
      <p class="hint">已输入 {{ createForm.background.length }}/1000</p>
      <div class="row center-row">
        <button type="button" class="ghost" @click="createPage = 2">上一步</button>
        <button type="button" @click="finishCreate">进入主界面</button>
      </div>
    </section>

    <template v-else>
      <header class="topbar">
        <div class="title">
          <h1>天启黎明同层卡</h1>
          <p>Ruina Style / Auto Paging / Tavern API Bridge</p>
        </div>
        <div class="controls">
          <button type="button" class="ghost db-btn" @click="showSummaryCenter = !showSummaryCenter">
            {{ showSummaryCenter ? '独立数据库：已开' : '独立数据库' }}
          </button>
          <button type="button" class="ghost" @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
          <button type="button" class="ghost" @click="showSettings = !showSettings">
            {{ showSettings ? '隐藏设置' : '打开设置' }}
          </button>
        </div>
      </header>

      <section class="main-layout">
        <aside class="panel player-sidebar">
          <h3>玩家档案</h3>
          <dl>
            <div>
              <dt>名字</dt>
              <dd>{{ createForm.name || '未命名' }}</dd>
            </div>
            <div>
              <dt>性别</dt>
              <dd>{{ createForm.gender }}</dd>
            </div>
            <div>
              <dt>职业</dt>
              <dd>{{ createForm.profession }}</dd>
            </div>
            <div>
              <dt>路线</dt>
              <dd>{{ xenoRouteMode ? `异种开局/${xenoRouteRole}` : '常规开局' }}</dd>
            </div>
            <div>
              <dt>模式</dt>
              <dd>{{ cheatMode ? '作弊模式' : '标准模式' }}</dd>
            </div>
            <div>
              <dt>叙事</dt>
              <dd>{{ plotMode ? '剧情模式' : '自由模式' }}</dd>
            </div>
            <div class="attr-card">
              <dt>人类属性</dt>
              <dd>
                <span v-for="item in humanAttrItems" :key="item.key" class="attr-chip">{{ item.key }} {{ createHumanAttr[item.key] }}</span>
              </dd>
            </div>
            <div class="resource-card">
              <dt>状态资源</dt>
              <dd>
                <span class="attr-chip">生命 {{ playerResource.hp }}/{{ playerResource.hpMax }}</span>
                <span class="attr-chip">魔力 {{ playerResource.mp }}/{{ playerResource.mpMax }}</span>
                <span class="attr-chip">行动点 {{ playerResource.ap }}</span>
              </dd>
            </div>
            <div>
              <dt>背景摘要</dt>
              <dd>{{ backgroundSummary }}</dd>
            </div>
          </dl>

          <section class="inventory-panel">
            <div class="row">
              <h4>仓库</h4>
              <button type="button" class="ghost small" @click="showInventoryPanel = !showInventoryPanel">
                {{ showInventoryPanel ? '收起仓库' : '展开仓库' }}
              </button>
            </div>
            <template v-if="showInventoryPanel">
              <div v-if="cheatMode" class="inventory-form">
                <input v-model.trim="inventoryEditor.name" placeholder="物品名称" />
                <input v-model.number="inventoryEditor.count" type="number" min="1" placeholder="数量" />
                <input v-model.trim="inventoryEditor.note" placeholder="备注（可选）" />
                <button type="button" class="ghost small" @click="addInventoryItem">写入仓库</button>
              </div>
              <p v-else class="hint">当前为标准模式，仓库只读。开启作弊模式后可编辑仓库。</p>
              <article v-for="item in inventoryItems" :key="item.id" class="inventory-item">
                <header>
                  <strong>{{ item.name }} ×{{ item.count }}</strong>
                  <button v-if="cheatMode" type="button" class="ghost small" @click="removeInventoryItem(item.id)">删除</button>
                </header>
                <p>备注：{{ item.note }}</p>
              </article>
              <p v-if="!inventoryItems.length" class="hint">暂无物品</p>
            </template>
          </section>
        </aside>

        <div class="main-column">
          <section class="panel pager">
            <div class="row">
              <button type="button" class="ghost" :disabled="currentPage <= 0" @click="currentPage--">上一页</button>
              <span class="hint">第 {{ currentPage + 1 }} / {{ pageRanges.length }} 页</span>
              <button type="button" class="ghost" :disabled="currentPage >= pageRanges.length - 1" @click="currentPage++">
                下一页
              </button>
            </div>
            <label class="toggle">
              <input v-model="settings.autoFlipPage" type="checkbox" />
              <span>每次新对话自动翻到最新页</span>
            </label>
          </section>

          <section v-if="showSettings" class="panel settings">
            <div class="row">
              <button type="button" @click="pullFromTavern">读取酒馆预设/API</button>
              <span class="hint">{{ tavernSummary }}</span>
            </div>
            <label class="toggle">
              <input v-model="settings.useTavernPreset" type="checkbox" />
              <span>优先使用酒馆预设生成</span>
            </label>
            <label>
              <span>Base URL</span>
              <input v-model.trim="settings.baseUrl" placeholder="https://api.openai.com/v1" />
            </label>
            <label>
              <span>API Key</span>
              <input v-model.trim="settings.apiKey" type="password" placeholder="sk-..." />
            </label>
            <label>
              <span>Model</span>
              <input v-model.trim="settings.model" list="th-model-options" placeholder="gpt-4.1-mini" />
              <datalist id="th-model-options">
                <option v-for="item in modelOptions" :key="item" :value="item">{{ item }}</option>
              </datalist>
            </label>
            <div class="row">
              <button type="button" class="ghost small" :disabled="modelFetchRunning" @click="fetchModelOptions">
                {{ modelFetchRunning ? '读取中...' : '读取模型列表' }}
              </button>
              <span class="hint">
                {{ modelOptions.length ? `已加载 ${modelOptions.length} 个模型` : '填写URL和秘钥后可读取模型信息' }}
              </span>
            </div>
            <label>
              <span>System Prompt</span>
              <textarea v-model="settings.systemPrompt" rows="3"></textarea>
            </label>
            <label class="toggle">
              <input v-model="settings.autoSummaryEnabled" type="checkbox" />
              <span>开启自动大总结（每 5 层触发）</span>
            </label>
            <label>
              <span>每几层触发一次大总结</span>
              <input v-model.number="settings.summaryFloorsPerRun" type="number" min="1" />
            </label>
            <label class="toggle">
              <input v-model="settings.summaryUseCurrentApi" type="checkbox" />
              <span>大总结优先使用当前酒馆API</span>
            </label>
            <label class="full">
              <span>大总结提示词</span>
              <textarea v-model="settings.autoSummaryPrompt" rows="4"></textarea>
            </label>
            <label class="toggle">
              <input v-model="settings.summaryUseVarApi" type="checkbox" />
              <span>大总结使用额外变量API</span>
            </label>
            <label>
              <span>变量API URL</span>
              <input v-model.trim="settings.summaryVarApiUrl" placeholder="https://your-api/vars" />
            </label>
            <label>
              <span>变量API Key</span>
              <input v-model.trim="settings.summaryVarApiKey" type="password" placeholder="Bearer Token" />
            </label>
            <label class="full">
              <span>变量API请求体（JSON，可空）</span>
              <textarea v-model="settings.summaryVarApiPayload" rows="3"></textarea>
            </label>
            <label class="toggle">
              <input v-model="settings.megaSummaryEnabled" type="checkbox" />
              <span>开启超大总结</span>
            </label>
            <label>
              <span>每几次大总结触发一次超大总结</span>
              <input v-model.number="settings.megaSummaryEvery" type="number" min="1" />
            </label>
            <label class="toggle">
              <input v-model="settings.megaSummaryUseCurrentApi" type="checkbox" />
              <span>超大总结优先使用当前酒馆API</span>
            </label>
            <label class="full">
              <span>超大总结提示词</span>
              <textarea v-model="settings.megaSummaryPrompt" rows="4"></textarea>
            </label>
            <label class="toggle">
              <input v-model="settings.megaSummaryUseVarApi" type="checkbox" />
              <span>超大总结使用独立变量API</span>
            </label>
            <label>
              <span>超大总结变量API URL</span>
              <input v-model.trim="settings.megaSummaryVarApiUrl" placeholder="https://your-api/mega-vars" />
            </label>
            <label>
              <span>超大总结变量API Key</span>
              <input v-model.trim="settings.megaSummaryVarApiKey" type="password" placeholder="Bearer Token" />
            </label>
            <label class="full">
              <span>超大总结变量API请求体（JSON，可空）</span>
              <textarea v-model="settings.megaSummaryVarApiPayload" rows="3"></textarea>
            </label>
            <hr />
            <label class="toggle">
              <input v-model="settings.specialMemoryEnabled" type="checkbox" />
              <span>启用特殊记忆NPC独立计算</span>
            </label>
            <label>
              <span>特殊记忆NPC</span>
              <select v-model.number="settings.specialMemoryNpcId">
                <option :value="0">未选择</option>
                <option v-for="npc in allNpcs" :key="npc.id" :value="npc.id">{{ npc.name }}（{{ npc.role }}）</option>
              </select>
            </label>
            <label class="toggle">
              <input v-model="settings.specialMemoryUseCurrentApi" type="checkbox" />
              <span>特殊记忆NPC优先使用当前酒馆API</span>
            </label>
            <label>
              <span>特殊记忆NPC Base URL</span>
              <input v-model.trim="settings.specialMemoryBaseUrl" placeholder="https://api.openai.com/v1" />
            </label>
            <label>
              <span>特殊记忆NPC API Key</span>
              <input v-model.trim="settings.specialMemoryApiKey" type="password" placeholder="sk-..." />
            </label>
            <label>
              <span>特殊记忆NPC Model</span>
              <input v-model.trim="settings.specialMemoryModel" list="th-special-model-options" placeholder="gpt-4.1-mini" />
              <datalist id="th-special-model-options">
                <option v-for="item in specialModelOptions" :key="item" :value="item">{{ item }}</option>
              </datalist>
            </label>
            <div class="row">
              <button type="button" class="ghost small" :disabled="specialModelFetchRunning" @click="fetchSpecialModelOptions">
                {{ specialModelFetchRunning ? '读取中...' : '读取特殊NPC模型列表' }}
              </button>
              <span class="hint">
                {{ specialModelOptions.length ? `已加载 ${specialModelOptions.length} 个模型` : '可独立读取特殊NPC模型' }}
              </span>
            </div>
            <label class="full">
              <span>特殊记忆NPC提示词</span>
              <textarea v-model="settings.specialMemoryPrompt" rows="4"></textarea>
            </label>
            <label class="toggle">
              <input v-model="settings.specialMemoryUseVarApi" type="checkbox" />
              <span>特殊记忆NPC使用独立变量API</span>
            </label>
            <label>
              <span>特殊记忆NPC变量API URL</span>
              <input v-model.trim="settings.specialMemoryVarApiUrl" placeholder="https://your-api/npc-vars" />
            </label>
            <label>
              <span>特殊记忆NPC变量API Key</span>
              <input v-model.trim="settings.specialMemoryVarApiKey" type="password" placeholder="Bearer Token" />
            </label>
            <label class="full">
              <span>特殊记忆NPC变量API请求体（JSON，可空）</span>
              <textarea v-model="settings.specialMemoryVarApiPayload" rows="3"></textarea>
            </label>
            <div class="row">
              <button type="button" @click="saveSettings">保存设置</button>
              <button type="button" class="ghost" @click="resetSession">清空会话</button>
              <button type="button" class="ghost" @click="showSummaryCenter = !showSummaryCenter">
                {{ showSummaryCenter ? '隐藏大总结中心' : '打开大总结中心' }}
              </button>
            </div>
          </section>

          <section v-if="showSummaryCenter" class="panel memory-vault">
            <div class="row">
              <strong>记忆库</strong>
              <span class="hint">已收录 {{ memoryVault.length }} 条，已隐藏至楼层 {{ hiddenFloorUntil }}</span>
            </div>
            <div class="row">
              <button type="button" class="ghost" :disabled="summaryRunning || pending" @click="runManualSummary">
                {{ summaryRunning ? '总结中...' : '立即大总结' }}
              </button>
              <button type="button" class="ghost" :disabled="summaryRunning || pending" @click="runManualMegaSummary">
                {{ summaryRunning ? '总结中...' : '立即超大总结' }}
              </button>
              <button type="button" class="ghost" @click="clearMemoryVault">清空记忆库</button>
            </div>
            <article v-for="entry in memoryVaultReversed" :key="entry.id" class="memory-item">
              <header>
                <strong>楼层 {{ entry.floorStart }} - {{ entry.floorEnd }}</strong>
                <span class="hint">{{ formatTs(entry.createdAt) }} / {{ entry.extraVarNote }}</span>
              </header>
              <pre>{{ entry.summary }}</pre>
            </article>
            <p v-if="!memoryVault.length" class="hint">暂无记忆。到第 {{ settings.summaryFloorsPerRun }} 层周期会自动生成并压缩历史上下文。</p>
            <div class="row">
              <strong>超大总结库</strong>
              <span class="hint">已生成 {{ megaMemoryVault.length }} 条</span>
            </div>
            <article v-for="entry in megaMemoryVaultReversed" :key="entry.id" class="memory-item mega">
              <header>
                <strong>超大总结（覆盖楼层 {{ entry.floorStart }} - {{ entry.floorEnd }}）</strong>
                <span class="hint">{{ formatTs(entry.createdAt) }} / {{ entry.extraVarNote }}</span>
              </header>
              <pre>{{ entry.summary }}</pre>
            </article>
          </section>

          <section class="panel quick">
            <button type="button" :disabled="interactionLocked" @click="sendQuick('我选择探索当前区域，给我三个可选行动。')">探索</button>
            <button type="button" :disabled="interactionLocked" @click="sendQuick('我选择休整，恢复状态并给出后续风险。')">休整</button>
            <button type="button" :disabled="interactionLocked" @click="sendQuick('我选择推进主线，给出当前遭遇与判定。')">推进</button>
          </section>

          <section class="panel chat">
            <div class="messages">
              <article v-for="item in visibleMessages" :key="item.id" class="msg" :class="`msg--${item.role}`">
                <header>{{ roleLabel(item.role) }}</header>
                <pre>{{ displayContent(item) }}</pre>
              </article>
            </div>
            <form class="composer" @submit.prevent="sendUserInput">
              <textarea
                v-model="draft"
                rows="3"
                :disabled="interactionLocked"
                placeholder="输入行动。每次发送可自动翻到最新页。"
              ></textarea>
              <div class="row">
                <span class="hint">{{ interactionLocked ? lockHint : modeHint }}</span>
                <button type="submit" :disabled="interactionLocked || !draft.trim()">发送</button>
              </div>
            </form>
          </section>

          <section class="panel npc-panel">
            <div class="row">
              <strong>NPC状态栏</strong>
              <span class="hint">在场角色 {{ onstageNpcs.length }} / 长期NPC {{ longtermNpcs.length }}</span>
              <button type="button" class="ghost small" @click="showNpcPanel = !showNpcPanel">
                {{ showNpcPanel ? '收起NPC栏' : '展开NPC栏' }}
              </button>
            </div>
            <template v-if="showNpcPanel">
              <div class="npc-form">
                <input v-model.trim="npcEditor.name" placeholder="NPC姓名" />
                <input v-model.trim="npcEditor.role" placeholder="定位（例：战姬/教官）" />
                <input v-model.trim="npcEditor.relation" placeholder="关系（例：信任/敌对）" />
                <input v-model.trim="npcEditor.status" placeholder="状态（例：待命/受伤）" />
                <input v-model.trim="npcEditor.tags" placeholder="关系标签（/分隔）" />
                <label class="toggle">
                  <input v-model="npcEditor.toLongterm" type="checkbox" />
                  <span>写入长期NPC</span>
                </label>
                <button type="button" class="ghost" @click="addNpc">写入NPC栏</button>
              </div>

              <div class="npc-columns">
                <section>
                  <h4>当前在场角色</h4>
                  <article v-for="npc in onstageNpcs" :key="npc.id" class="npc-card">
                    <header>
                      <strong>{{ npc.name }}</strong>
                      <button type="button" class="ghost small" @click="removeNpc(npc.id, 'onstage')">删除</button>
                    </header>
                    <p>定位：{{ npc.role }}</p>
                    <p>关系：{{ npc.relation }}</p>
                    <p>状态：{{ npc.status }}</p>
                    <p>标签：{{ npc.tags }}</p>
                  </article>
                  <p v-if="!onstageNpcs.length" class="hint">暂无在场角色</p>
                </section>
                <section>
                  <h4>长期NPC列表</h4>
                  <article v-for="npc in longtermNpcs" :key="npc.id" class="npc-card">
                    <header>
                      <strong>{{ npc.name }}</strong>
                      <button type="button" class="ghost small" @click="removeNpc(npc.id, 'longterm')">删除</button>
                    </header>
                    <p>定位：{{ npc.role }}</p>
                    <p>关系：{{ npc.relation }}</p>
                    <p>状态：{{ npc.status }}</p>
                    <p>标签：{{ npc.tags }}</p>
                  </article>
                  <p v-if="!longtermNpcs.length" class="hint">暂无长期NPC</p>
                </section>
              </div>
              <div class="row">
                <strong>NPC自主行动</strong>
                <span class="hint">已记录 {{ npcAutoActions.length }} 条</span>
                <button type="button" class="ghost small" :disabled="specialNpcRunning" @click="runSpecialMemoryNpcTurn('manual')">
                  {{ specialNpcRunning ? '独立计算中...' : '手动触发自主行动' }}
                </button>
                <button type="button" class="ghost small" @click="npcAutoPanelCollapsed = !npcAutoPanelCollapsed">
                  {{ npcAutoPanelCollapsed ? '展开自主行动' : '收起自主行动' }}
                </button>
              </div>
              <div v-if="!npcAutoPanelCollapsed">
                <article v-for="item in npcAutoActionsReversed" :key="item.id" class="memory-item">
                  <header>
                    <strong>{{ item.name }} / {{ item.source }}</strong>
                    <span class="hint">{{ formatTs(item.createdAt) }} / {{ item.extraVarNote }}</span>
                  </header>
                  <pre>{{ item.action }}</pre>
                </article>
                <p v-if="!npcAutoActions.length" class="hint">暂无自主行动记录。</p>
              </div>
            </template>
          </section>
        </div>
      </section>
    </template>

    <section v-if="systemNotices.length || dbTask.active" class="system-float">
      <article v-if="dbTask.active" class="system-notice db-notice">
        <header>
          <span>数据库任务</span>
          <span>{{ dbTask.completed ? '完成' : '运行中' }}</span>
        </header>
        <div v-if="!dbTask.completed">
          {{ dbTask.label }} · 已运行 {{ dbTask.seconds }} 秒
        </div>
        <div v-else>
          {{ dbTask.label }} 已完成，可继续游玩。
        </div>
      </article>
      <article v-for="n in systemNotices" :key="n.id" class="system-notice">
        <header>
          <span>系统提示</span>
          <button type="button" class="ghost small" @click="dismissNotice(n.id)">关闭</button>
        </header>
        <div>{{ n.content }}</div>
      </article>
    </section>

  </main>
</template>

<script setup lang="ts">
type Mode = 'embedded' | 'standalone';
type Role = 'system' | 'user' | 'assistant' | 'error';
type ChatItem = { id: number; role: Role; content: string };
type Range = { start: number; end: number };
type Notice = { id: number; content: string };
type Profession = '战姬' | '指挥官' | '权柄使役者';
type Gender = '男' | '女' | '伪娘' | '双性' | '沃尔玛购物袋' | '武装直升机';
type HumanAttrKey = '力量' | '敏捷' | '体质' | '感知' | '意志' | '魅力' | '学识';
type XenoRouteRole = '再诞战姬' | '异种指挥官';
type MemoryEntry = { id: number; floorStart: number; floorEnd: number; summary: string; createdAt: number; extraVarNote: string };
type NpcEntry = { id: number; name: string; role: string; relation: string; status: string; tags: string };
type InventoryItem = { id: number; name: string; count: number; note: string };
type NpcAutoActionEntry = {
  id: number;
  npcId: number;
  name: string;
  action: string;
  createdAt: number;
  source: '自动触发' | '手动触发';
  extraVarNote: string;
};
type DbTaskState = { active: boolean; completed: boolean; label: string; seconds: number };

const props = withDefaults(defineProps<{ mode?: Mode }>(), { mode: 'standalone' });

const storageKey = 'th-layer-test-api-settings-v3';
const runtimeStorageKey = 'th-layer-test-memory-runtime-v1';
const modeHint = computed(() => (props.mode === 'embedded' ? '酒馆同层模式' : '独立模式'));
const inTavern = computed(() => typeof (window as any).SillyTavern !== 'undefined');

const rootRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const started = ref(false);
const createDone = ref(false);
const createPage = ref<1 | 2 | 3>(1);
const cheatMode = ref(false);
const plotMode = ref(true);
const xenoRouteMode = ref(false);
const xenoRouteRole = ref<XenoRouteRole>('再诞战姬');
const showSettings = ref(true);
const showSummaryCenter = ref(false);
const showInventoryPanel = ref(true);
const showNpcPanel = ref(true);
const pending = ref(false);
const dbLock = ref(false);
const draft = ref('');
const nextId = ref(1);
const currentPage = ref(0);
const tavernSummary = ref('未读取');
const systemNotices = ref<Notice[]>([]);
const dbTask = reactive<DbTaskState>({
  active: false,
  completed: false,
  label: '',
  seconds: 0,
});
const professionOptions: Profession[] = ['战姬', '指挥官', '权柄使役者'];
const warmaidTypeOptions = ['侦察型', '轻型', '中型', '重型', '要塞型', '地面支援型'];
const genderOptions: Gender[] = ['男', '女', '伪娘', '双性', '沃尔玛购物袋', '武装直升机'];
const ageLimits: Record<Profession, { min: number; max: number }> = {
  战姬: { min: 12, max: 18 },
  指挥官: { min: 21, max: 70 },
  权柄使役者: { min: 14, max: 80 },
};
const professionDescriptionMap: Record<Profession, string> = {
  战姬: `【战姬】
战姬是人类方面的终极单位，也是人类在与异种长期战争中最核心、最不可替代的高端战力。
无论是正面战场的拦截、前线支援、空域压制、要点防守，还是对异种高危个体的猎杀行动，战姬都承担着远超常规兵力的战略价值。

但战姬并不是可以规模化制造的常规兵种。
在当前世界范围内，人类侧战姬总数永远不会超过1000。
这个数量限制并非单纯来自训练资源，而是来自“觉醒本身”的稀缺性与不可控性。

目前已知的觉醒规律是：
战姬只会在人类12-18岁的少女中随机觉醒。`,
  指挥官: `指挥官：
特殊词条：指挥/调律者
指挥官的基础六维属性骰点为
魔力评级:X
力量加成:X
体质加成:1D6
抗污染值:1D6
飞行速度:X
防御评级:X
指挥官并非标准武装，而是每个队伍中必须有的协调人员，只有在拥有指挥官的情况下，才能完成各单位之间的协调，同时指挥官可以使用基础地面自卫武器用于保护自己。
指挥官的魔力频率独特，可以用以打开每个战姬独立的魔力频率锁进行调律
每个分队必须有一名指挥官，而且指挥官性别不限制，	可以为男性或女性。
指挥官每回合可以行动1次，可以移动1次，但是不具有飞行能力，最好让指挥官处于支援阵线，指挥官可以携带一种支援设备协助战斗。
指挥官通常驾驶无人补给舰或其他舰只跟随行动，如果指挥官所有补给消耗完毕，那么所有单位在使用完当前魔力后则立即解除灵装。`,
  权柄使役者: `权柄使役者
权柄使役者是从异种尚未来到的时代就已经存在的超自然力量使用者，他们通过一系列复杂的仪式，特殊的圣器，与高位存在的契约等表象方式仪式性的使用权柄的碎片，实际上是依靠散落在其家族血脉中的权柄碎片来运行被称之为【仪式】的力量来进行一系列超自然的行动。
在【公主】被弑神之剑处决后，新时代的权柄使役者相较于曾经的屈指可数变的泛滥了许多，一些从未出现过的权柄也落到了凡人手中。
权柄各有不同，权柄使役者通常从从高到低可以分级为。
【权柄之主】
【编织者】
【书写者】
【信徒】`,
};
const warmaidTypeDescriptionMap: Record<string, string> = {
  侦察型: `空战行动点（严格按类型）:
侦察型:
  行动点: 1
  移动点: 2`,
  轻型: `轻型：
特殊词条：轻装/追踪
轻型战姬的基础六维属性骰点为
魔力评级:4D6
力量加成:3D6
体质加成:3D6
抗污染值:3D6
飞行速度:5D6
防御评级:2D6
轻型战姬的武装强度最大可以为2级，可以携带轻型自卫灵装或轻型炮型灵装，允许携带近身灵装武器（例如猎杀者轻剑），可以装备轻型灵装防具，通常适合正面支援其他战姬或对敌对战姬/异种生物进行骚扰或追击，移动速度相对来说是除了侦察型战姬以外最快的，可以轻松追杀一些敌对目标，甚至某些极端情况可以欺负武装失效的大型敌人。
轻型战姬一回合可以行动2次，可以移动1次，开火不需要任何准备行动，在任何位置都可以无损开火。`,
  中型: `中型：
特殊词条：武装/反制
中型战姬的基础六维属性骰点为
魔力评级:4D6
力量加成:4D6
体质加成:3D6
抗污染值:5D6
飞行速度:4D6
防御评级:3D8
中型战姬的武装强度最大可以为3级，可以携带中型自卫灵装或正规炮型灵装，可以装备中型灵装防具，通常适合对抗高强度的敌人，是最平均的战姬，从某种意义上来说什么都可以做，但是因为太全能反而没有什么比较突出的点，不过某种意义上，当你不知道选什么样的战姬灵装好的时候，中型就可以成为你的选择。
中型战姬一回合可以行动1次，可以移动1次，开火不需要任何准备行动，在任何位置都可以无损开火。`,
  重型: `重型：
特殊词条：武装/重甲
重型战姬的基础六维属性骰点为
魔力评级:4D6
力量加成:6D6
体质加成:5D6
抗污染值:6D6
飞行速度:3D5
防御评级:4D8
重型战姬的武装强度最大可以为4级，可以携带重型自卫灵装或正规炮型灵装，允许装备重型联装炮型灵装，可以装备大型灵装防具，通常适合对抗极高强度的敌人，强大的武装可以轻易撕碎一些小型敌人，但是基本很难躲开敌人的攻击，不过一般情况下有其他同分队队友的帮忙的情况下，依靠厚重的装甲一般很难被解除灵装化。
重型战姬一回合可以行动1次，每两回合可以移动1次，开火如果携带重型武器，需要架设灵装一回合，在中线和后卫可以无损开火，在前线损失三分之一的伤害骰（向上取整），在交锋区则损失二分之一伤害骰（向上取整）`,
  要塞型: `要塞型：
特殊词条：武装/要塞/屏障
要塞型战姬的基础六维属性骰点为
魔力评级:4D6
力量加成:10D6
体质加成:7D6
抗污染值:10D6
飞行速度:1D2
防御评级:7D10
要塞型战姬的武装强度最大可以为6级，可以携带要塞型自卫灵装或正规炮型灵装，允许装备超重型多联装炮型灵装，允许携带要塞级灵装，可以装备要塞级灵装防具，通常适合对抗任何强度的敌人，强大的武装可以轻易撕碎所有敌人，但是没有闪避攻击的可能性，通常一旦展开灵装就极度需要其他队友的掩护，否则被大量敌人追击的时候跑都跑不掉。
要塞型战姬一回合可以行动1次，战斗中无法移动，开火时如果携带要塞级火力，必须要有侦察型或轻型提供稳定射击辅助的情况下才能无损开火，否则会损失五分之四的伤害骰（向上取整），在后卫可以无损开火，如果位于中线则损失二分之一的伤害骰（向上取整），在前线，交锋区则只能使用自卫灵装。`,
  地面支援姬: `地面支援姬：
特殊词条：武装/地面支援
指挥官的基础六维属性骰点为
魔力评级:4d6
力量加成:5d6
体质加成:4D6
抗污染值:10D6
飞行速度:1d1
防御评级:4d12
地面支援姬的武装最大等级为2，但是可以装配独特的投弹舱，主要针对地面目标，巢穴等其他单位进行打击，但由于异常耐打所以也可以在有些时候被丢到前线去，地面支援姬无论任何区域都可以使用任何灵装。
地面支援姬一回合可以行动1次，可以移动1次，开火不需要任何准备行动，在任何位置都可以无损开火。`,
};
const createForm = reactive({
  name: '',
  profession: '战姬' as Profession,
  warmaidType: '侦察型',
  age: 12,
  gender: '女' as Gender,
  background: '',
});
const normalOpeningStory = `【联合纪年177年8月28日】
你们是新一批威曼普学院的新生。
根据【第二协议】中的对等条款，曾经在各地上中学的你们，在即将升到高中时，作为各地与威曼普学院的某种交换成为了对抗异种的中坚力量预备军。
而好巧不巧的是，在你们接到入学通知的时候，异种在领主【咒妄】的率领下，突破了联合北部防线，斯托尔，夏顿两座边塞城市的沦陷，直接导致重要军事要塞光明大圣堂被完全包围。
如果光明大圣堂沦陷，整个北部防线有被以点带面凿穿的风险，威曼普城同样根据【第二协议】的条款，派出了【海洋】【魔法支点】【学士】三个结社前往支援。
而除了这些明面上的力量，新生也不可避免的被卷入了这场漩涡，正面战场也许很难帮得上忙，但是，繁杂的侦查，辅助，探索，清理少量异种的任务，还是不可避免的向你们袭来。
而幸运与不幸的是，你们这支新成立的学员小队，恰巧成为了最前端的侦察小队，即将承接可能带来最丰厚报偿，也可能是送命的侦查任务……
而今天，你来到了学校......`;
const xenoOpeningStory = `【异种开局 / 联合纪年177年8月28日】\n地点：异种巢穴外围的血肉层通道。\n你在一段破碎记忆后醒来，意识像被冰水浸透。高位异种个体将你自石棺牵出，你以异常视角开始接触异种线叙事。\n当你注视异种时，部分下级单位会出现“认知滤镜”显现偏移。\n这不代表无敌。你仍会受伤、会失误、会承担错误判断的后果。`;
const backgroundTemplateMap: Record<string, string> = {
  战姬: `我在近期完成觉醒，被地方机构登记后依照【第二协议】送往威曼普学院。
觉醒后的身体感知、魔力流动与情绪波动都与过去不同，这份力量让我兴奋，也让我不安。
入学后我必须尽快完成灵装适配、基础战术训练和小队磨合，学会在危险世界里正确使用力量，而不是被力量和恐惧拖垮。`,
  指挥官: `我来自联合或大公国体系下的普通教育与基础军训环境，在进入威曼普学院前已接受过基础纪律、地图判读、队列协同或后勤常识训练，但并非前线老兵。
依照【第二协议】，我被送入威曼普战姬学院接受战术化训练，目标是完成指挥链路适配并学会与战姬小队稳定协同。
我清楚自己不是最强的战斗单位，因此更重视判断、秩序、补给与沟通，希望在真实任务中证明自己能在压力下做出正确决定。`,
  权柄使役者: `我作为新入门的权柄使役者（或家族传承中的低阶使役者）被纳入学院体系，拥有初步仪式经验或象征性施术认知，但缺乏系统战术训练。
在进入威曼普学院后，我需要学习如何在团队规则下使用权柄，控制代价、稳定施术，并在侦查与支援任务中证明自己的价值。
我明白权柄并不意味着无敌，错误使用只会让自己和队友承担后果，因此我必须先学会约束与判断。`,
  再诞战姬: `我在异种巢穴深层的石棺中苏醒，被高位异种个体牵引至巢穴外层。
我的战姬能力并不稳定，认知滤镜在观察下级异种时会改变我看到的显现方式，但危险性并未降低。
我必须在巢穴与占领区环境中完成自我定位，弄清自身位格与代价来源，再决定是否接触人类学院体系。`,
  异种指挥官: `我在异种巢穴外围恢复意识，保留了异常指挥感知，却失去了完整记忆链。
高位异种并未将我视为普通猎物，而是以观察者姿态放任我进入异种战场链路。
我需要在巢穴环境中建立自己的调度规则，确认“认知滤镜”与现实风险的边界，再决定如何与人类阵线发生接触。`,
};
const backgroundPresetOptions = [
  { key: '战姬', label: '战姬默认背景' },
  { key: '指挥官', label: '指挥官默认背景' },
  { key: '权柄使役者', label: '权柄使役者默认背景' },
  { key: '再诞战姬', label: '再诞战姬默认背景（异种）' },
  { key: '异种指挥官', label: '异种指挥官默认背景（异种）' },
];
const backgroundPresetKey = ref<string>('战姬');
const humanAttrItems: Array<{ key: HumanAttrKey; desc: string }> = [
  { key: '力量', desc: '发力、搬运、近身压制能力。' },
  { key: '敏捷', desc: '反应、闪避、平衡与位移。' },
  { key: '体质', desc: '生命、耐受与恢复。' },
  { key: '感知', desc: '观察、聆听、环境识别。' },
  { key: '意志', desc: '抗压、抗恐惧、精神稳定。' },
  { key: '魅力', desc: '社交表达、说服与安抚。' },
  { key: '学识', desc: '知识、推理与信息整理。' },
];
const createHumanAttr = reactive<Record<HumanAttrKey, number>>({
  力量: 1,
  敏捷: 1,
  体质: 1,
  感知: 1,
  意志: 1,
  魅力: 1,
  学识: 1,
});
const humanPointsTotal = 5;
const humanPointsLeft = computed(() =>
  humanPointsTotal - Object.values(createHumanAttr).reduce((sum, v) => sum + Number(v || 0), 0) + 7,
);
const currentAgeRange = computed(() => ageLimits[createForm.profession]);
const professionDescription = computed(() => professionDescriptionMap[createForm.profession]);
const warmaidTypeDescription = computed(() => {
  if (createForm.warmaidType === '侦查型') createForm.warmaidType = '侦察型';
  const key = createForm.warmaidType === '侦查型'
    ? '侦察型'
    : createForm.warmaidType === '地面支援型'
      ? '地面支援姬'
      : createForm.warmaidType;
  return warmaidTypeDescriptionMap[key] ?? '世界书暂无该类型的独立条目。';
});
const autoBackgroundPresetKey = computed(() => (xenoRouteMode.value ? xenoRouteRole.value : createForm.profession));
const currentBackgroundPresetLabel = computed(
  () => backgroundPresetOptions.find(item => item.key === backgroundPresetKey.value)?.label || '未选择',
);
const backgroundSummary = computed(() => {
  const raw = (createForm.background || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '未填写';
  return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
});
const getInitialResourceByBuild = () => {
  if (xenoRouteMode.value) {
    if (xenoRouteRole.value === '再诞战姬') {
      return { hpMax: 130, mpMax: 140, ap: 1 };
    }
    return { hpMax: 110, mpMax: 130, ap: 1 };
  }
  if (createForm.profession === '战姬') {
    const apByType: Record<string, number> = {
      侦察型: 1,
      轻型: 2,
      中型: 1,
      重型: 1,
      要塞型: 1,
      地面支援型: 1,
    };
    return { hpMax: 120, mpMax: 120, ap: apByType[createForm.warmaidType] ?? 1 };
  }
  if (createForm.profession === '指挥官') return { hpMax: 100, mpMax: 100, ap: 1 };
  return { hpMax: 100, mpMax: 110, ap: 1 };
};
const resetPlayerResource = () => {
  const base = getInitialResourceByBuild();
  playerResource.hpMax = base.hpMax;
  playerResource.hp = base.hpMax;
  playerResource.mpMax = base.mpMax;
  playerResource.mp = base.mpMax;
  playerResource.ap = base.ap;
};

const defaultSettings = {
  autoFlipPage: true,
  useTavernPreset: true,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  systemPrompt: '你是一个同层游玩叙事助手。请简洁推进剧情并给出下一步选项。',
  autoSummaryEnabled: true,
  summaryFloorsPerRun: 5,
  summaryUseCurrentApi: true,
  autoSummaryPrompt:
    '你是同层游玩的记忆总结器。请将输入楼层对话压缩为结构化记忆，包含：关键事件、角色关系变化、已确定规则/设定、未完成目标、危险与伏笔。避免废话，避免改写事实。',
  summaryUseVarApi: false,
  summaryVarApiUrl: '',
  summaryVarApiKey: '',
  summaryVarApiPayload: '{"scope":"layer_memory","need":["world_state","route_state","flags"]}',
  megaSummaryEnabled: true,
  megaSummaryEvery: 5,
  megaSummaryUseCurrentApi: true,
  megaSummaryPrompt:
    '你是超大总结器。请把输入的大总结内容再次融合，输出稳定世界状态、核心矛盾、长期目标、角色关系总图与下一阶段策略。',
  megaSummaryUseVarApi: false,
  megaSummaryVarApiUrl: '',
  megaSummaryVarApiKey: '',
  megaSummaryVarApiPayload: '{"scope":"mega_memory","need":["global_flags","chapter_progress"]}',
  specialMemoryEnabled: false,
  specialMemoryNpcId: 0,
  specialMemoryUseCurrentApi: true,
  specialMemoryBaseUrl: '',
  specialMemoryApiKey: '',
  specialMemoryModel: '',
  specialMemoryPrompt:
    '你是特殊记忆NPC的独立行动内核。请基于最近对话与设定，输出该NPC此刻最可能执行的一条自主行动，格式：行动目标/行动内容/潜在风险。',
  specialMemoryUseVarApi: false,
  specialMemoryVarApiUrl: '',
  specialMemoryVarApiKey: '',
  specialMemoryVarApiPayload: '{"scope":"special_npc","need":["npc_state","world_state","recent_flags"]}',
};
const settings = reactive({ ...defaultSettings });
const modelOptions = ref<string[]>([]);
const modelFetchRunning = ref(false);
const specialModelOptions = ref<string[]>([]);
const specialModelFetchRunning = ref(false);
const memoryVault = ref<MemoryEntry[]>([]);
const megaMemoryVault = ref<MemoryEntry[]>([]);
const onstageNpcs = ref<NpcEntry[]>([]);
const longtermNpcs = ref<NpcEntry[]>([]);
const inventoryItems = ref<InventoryItem[]>([]);
const npcAutoActions = ref<NpcAutoActionEntry[]>([]);
const specialNpcRunning = ref(false);
const npcAutoPanelCollapsed = ref(true);
const npcEditor = reactive({
  name: '',
  role: '',
  relation: '',
  status: '',
  tags: '',
  toLongterm: false,
});
const inventoryEditor = reactive({
  name: '',
  count: 1,
  note: '',
});
const summaryRunning = ref(false);
const summaryLastFloor = ref(0);
const hiddenFloorUntil = ref(0);
const megaSummaryLastCount = ref(0);
const lockHint = computed(() => {
  if (dbLock.value || summaryRunning.value) return '数据库后台处理中，请稍候...';
  if (pending.value) return 'AI 回复中...';
  return modeHint.value;
});
const interactionLocked = computed(() => pending.value || summaryRunning.value || dbLock.value);

const injectedContext = inject<any>('streaming_message_context', null);
const contextHint = computed(() => {
  if (!injectedContext) return '';
  return `\n\n[上下文] 当前楼层ID: ${injectedContext.message_id}\n[楼层文本]\n${injectedContext.message ?? ''}`;
});
const playerBuildHint = computed(() => {
  const attrs = humanAttrItems.map(item => `${item.key}:${createHumanAttr[item.key]}`).join(' / ');
  const route = xenoRouteMode.value ? `异种开局(${xenoRouteRole.value})` : '常规开局';
  const mode = cheatMode.value ? '作弊模式' : '标准模式';
  return [
    `[建卡状态] 姓名=${createForm.name || '未命名'} | 性别=${createForm.gender} | 职业=${createForm.profession} | 年龄=${createForm.age}`,
    `[建卡状态] 路线=${route} | 模式=${mode}`,
    `[建卡状态] 剧情模式=${plotMode.value ? '开启' : '关闭'} | 锚点=${plotMode.value ? '__PLOT_ON__' : '__PLOT_OFF__'}`,
    `[建卡状态] 人类属性=${attrs}`,
    `[建卡状态] 资源=生命${playerResource.hp}/${playerResource.hpMax} 魔力${playerResource.mp}/${playerResource.mpMax} 行动点${playerResource.ap}`,
    `[建卡状态] 背景原文=${createForm.background || '未填写'}`,
    `[建卡状态] 背景摘要=${backgroundSummary.value}`,
    plotMode.value
      ? '[剧情模式约束] 必须按入学引导与章节推进链叙事。'
      : '[自由模式约束] 禁止触发开局事件引导链与主线章节事件书。',
    xenoRouteMode.value
      ? '[异种线约束] 可出现认知滤镜叙事，但不得免除作战代价、污染风险与失败后果。'
      : '[常规线约束] 按学院新生与前线支援逻辑推进。',
  ].join('\n');
});
const memoryVaultHint = computed(() => {
  if (!memoryVault.value.length) return '';
  const lines = memoryVault.value.map(item => `- 楼层${item.floorStart}-${item.floorEnd}: ${item.summary}`);
  return `[记忆库]\n${lines.join('\n')}`;
});
const memoryVaultReversed = computed(() => [...memoryVault.value].reverse());
const megaMemoryVaultReversed = computed(() => [...megaMemoryVault.value].reverse());
const npcAutoActionsReversed = computed(() => [...npcAutoActions.value].reverse());
const allNpcs = computed(() => [...onstageNpcs.value, ...longtermNpcs.value]);
const selectedSpecialMemoryNpc = computed(() => {
  const id = Number(settings.specialMemoryNpcId) || 0;
  if (!id) return null;
  return allNpcs.value.find(n => n.id === id) ?? null;
});

const messages = ref<ChatItem[]>([{ id: nextId.value++, role: 'assistant', content: '已就绪。你可以直接输入行动。' }]);
const playerResource = reactive({
  hp: 100,
  hpMax: 100,
  mp: 100,
  mpMax: 100,
  ap: 1,
});

const roleLabel = (role: Role) => (role === 'user' ? '玩家' : role === 'assistant' ? 'AI' : role === 'error' ? '错误' : '系统');
const pushMessage = (role: Role, content: string) => messages.value.push({ id: nextId.value++, role, content });

const sanitizeAssistantContent = (content: string) => {
  const raw = String(content ?? '');
  const rawTrimmed = raw.trim();
  const normalizedRaw = raw
    .replace(/&lt;\/?think\b[^&]*&gt;/gim, m => m.replace('&lt;', '<').replace('&gt;', '>'))
    .replace(/&lt;\/?thinking\b[^&]*&gt;/gim, m => m.replace('&lt;', '<').replace('&gt;', '>'))
    .replace(/&lt;\/?reasoning\b[^&]*&gt;/gim, m => m.replace('&lt;', '<').replace('&gt;', '>'))
    .replace(/&lt;\/?content&gt;/gim, m => m.replace('&lt;', '<').replace('&gt;', '>'));

  // If a stray </think> leaks into output, keep only the tail text.
  const tailAfterThink = normalizedRaw.includes('</think>')
    ? normalizedRaw.split('</think>').pop() ?? normalizedRaw
    : normalizedRaw;
  const contentMatch = tailAfterThink.match(/<content>([\s\S]*?)<\/content>/im);
  const source = contentMatch?.[1] ?? tailAfterThink;

  const cleaned = source
    .replace(/<think[\s\S]*?<\/think>/gim, '')
    .replace(/<Thought[\s\S]*?<\/Thought>/gim, '')
    .replace(/<thinking[\s\S]*?<\/thinking>/gim, '')
    .replace(/<reasoning[\s\S]*?<\/reasoning>/gim, '')
    .replace(/```(?:think|thinking|reasoning|cot)[\s\S]*?```/gim, '')
    .replace(/<(think|Thought|thinking|reasoning)\b[^>]*>[\s\S]*$/gim, '')
    .replace(/<\/?content>/gim, '')
    .trim();
  const cleanedFallback = tailAfterThink
    .replace(/<\/?content>/gim, '')
    .replace(/<(think|Thought|thinking|reasoning)\b[^>]*>/gim, '')
    .trim();
  if (cleaned) return cleaned;
  if (cleanedFallback) return cleanedFallback;
  if (/<(think|Thought|thinking|reasoning)\b|```(?:think|thinking|reasoning|cot)/i.test(raw)) return '';
  return rawTrimmed;
};

const displayContent = (item: ChatItem) => (item.role === 'assistant' ? sanitizeAssistantContent(item.content) : item.content);

const dismissNotice = (id: number) => {
  systemNotices.value = systemNotices.value.filter(n => n.id !== id);
};

const pushSystemNotice = (content: string) => {
  const id = Date.now() + Math.floor(Math.random() * 10000);
  systemNotices.value.unshift({ id, content });
  systemNotices.value = systemNotices.value.slice(0, 4);
  toastr.info(content, '同层卡');
  setTimeout(() => dismissNotice(id), 12000);
};
let dbTickTimer: ReturnType<typeof setInterval> | null = null;

const startDbTask = (label: string) => {
  dbTask.active = true;
  dbTask.completed = false;
  dbTask.label = label;
  dbTask.seconds = 0;
  dbLock.value = true;
  if (dbTickTimer) clearInterval(dbTickTimer);
  dbTickTimer = setInterval(() => {
    dbTask.seconds += 1;
  }, 1000);
};

const finishDbTask = () => {
  if (dbTickTimer) {
    clearInterval(dbTickTimer);
    dbTickTimer = null;
  }
  dbTask.completed = true;
  dbLock.value = false;
  setTimeout(() => {
    dbTask.active = false;
    dbTask.completed = false;
    dbTask.label = '';
    dbTask.seconds = 0;
  }, 1500);
};

const pageRanges = computed<Range[]>(() => {
  const starts = [0];
  for (let i = 1; i < messages.value.length; i++) {
    if (messages.value[i]?.role === 'user') starts.push(i);
  }
  return starts.map((start, idx) => ({ start, end: starts[idx + 1] ?? messages.value.length }));
});

const visibleMessages = computed(() => {
  const page = pageRanges.value[currentPage.value];
  const source = page ? messages.value.slice(page.start, page.end) : messages.value;
  return source.filter(item => item.role !== 'system');
});

watch(
  () => messages.value.length,
  () => {
    if (pageRanges.value.length && settings.autoFlipPage) currentPage.value = pageRanges.value.length - 1;
  },
);

watch(
  () => createForm.profession,
  profession => {
    const range = ageLimits[profession];
    if (!cheatMode.value) {
      if (createForm.age < range.min) createForm.age = range.min;
      if (createForm.age > range.max) createForm.age = range.max;
    }
    if (profession === '战姬') createForm.gender = '女';
  },
  { immediate: true },
);
watch(
  () => xenoRouteRole.value,
  () => {
    if (!xenoRouteMode.value) return;
    if (xenoRouteRole.value === '再诞战姬') {
      createForm.profession = '战姬';
      createForm.gender = '女';
      if (!cheatMode.value) {
        if (createForm.age < 12) createForm.age = 12;
        if (createForm.age > 18) createForm.age = 18;
      }
      return;
    }
    createForm.profession = '指挥官';
    if (!cheatMode.value) {
      if (createForm.age < 21) createForm.age = 21;
      if (createForm.age > 70) createForm.age = 70;
    }
  },
);
watch(
  () => autoBackgroundPresetKey.value,
  key => {
    backgroundPresetKey.value = key;
  },
  { immediate: true },
);
watch(
  () => createForm.background,
  value => {
    if ((value || '').length > 1000) createForm.background = value.slice(0, 1000);
  },
);

watch(
  settings,
  () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...settings }));
  },
  { deep: true },
);

watch(
  allNpcs,
  npcs => {
    const id = Number(settings.specialMemoryNpcId) || 0;
    if (!id) return;
    if (!npcs.some(n => n.id === id)) settings.specialMemoryNpcId = 0;
  },
  { deep: true },
);

watch(
  [
    memoryVault,
    megaMemoryVault,
    onstageNpcs,
    longtermNpcs,
    inventoryItems,
    npcAutoActions,
    npcAutoPanelCollapsed,
    () => ({ ...playerResource }),
    summaryLastFloor,
    hiddenFloorUntil,
    megaSummaryLastCount,
  ],
  () => {
    saveRuntimeState();
  },
  { deep: true },
);

const saveSettings = () => {
  localStorage.setItem(storageKey, JSON.stringify({ ...settings }));
  pushSystemNotice('设置已保存。');
};
const saveRuntimeState = () => {
  localStorage.setItem(
    runtimeStorageKey,
    JSON.stringify({
      memoryVault: memoryVault.value,
      megaMemoryVault: megaMemoryVault.value,
      onstageNpcs: onstageNpcs.value,
      longtermNpcs: longtermNpcs.value,
      inventoryItems: inventoryItems.value,
      npcAutoActions: npcAutoActions.value,
      npcAutoPanelCollapsed: npcAutoPanelCollapsed.value,
      playerResource: { ...playerResource },
      summaryLastFloor: summaryLastFloor.value,
      hiddenFloorUntil: hiddenFloorUntil.value,
      megaSummaryLastCount: megaSummaryLastCount.value,
    }),
  );
};

const loadSettings = () => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    Object.assign(settings, defaultSettings, JSON.parse(raw) ?? {});
  } catch {
    Object.assign(settings, defaultSettings);
  }
};
const loadRuntimeState = () => {
  const raw = localStorage.getItem(runtimeStorageKey);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) ?? {};
    memoryVault.value = Array.isArray(parsed.memoryVault) ? parsed.memoryVault : [];
    megaMemoryVault.value = Array.isArray(parsed.megaMemoryVault) ? parsed.megaMemoryVault : [];
    onstageNpcs.value = Array.isArray(parsed.onstageNpcs) ? parsed.onstageNpcs : [];
    longtermNpcs.value = Array.isArray(parsed.longtermNpcs) ? parsed.longtermNpcs : [];
    inventoryItems.value = Array.isArray(parsed.inventoryItems) ? parsed.inventoryItems : [];
    npcAutoActions.value = Array.isArray(parsed.npcAutoActions) ? parsed.npcAutoActions : [];
    npcAutoPanelCollapsed.value = parsed.npcAutoPanelCollapsed !== false;
    Object.assign(playerResource, parsed.playerResource ?? {});
    playerResource.hpMax = Math.max(1, Number(playerResource.hpMax) || 100);
    playerResource.mpMax = Math.max(1, Number(playerResource.mpMax) || 100);
    playerResource.hp = Math.max(0, Math.min(playerResource.hpMax, Number(playerResource.hp) || playerResource.hpMax));
    playerResource.mp = Math.max(0, Math.min(playerResource.mpMax, Number(playerResource.mp) || playerResource.mpMax));
    playerResource.ap = Math.max(0, Math.min(9, Number(playerResource.ap) || 1));
    summaryLastFloor.value = Number(parsed.summaryLastFloor) || 0;
    hiddenFloorUntil.value = Number(parsed.hiddenFloorUntil) || 0;
    megaSummaryLastCount.value = Number(parsed.megaSummaryLastCount) || 0;
  } catch {
    memoryVault.value = [];
    megaMemoryVault.value = [];
    onstageNpcs.value = [];
    longtermNpcs.value = [];
    inventoryItems.value = [];
    npcAutoActions.value = [];
    npcAutoPanelCollapsed.value = true;
    resetPlayerResource();
    summaryLastFloor.value = 0;
    hiddenFloorUntil.value = 0;
    megaSummaryLastCount.value = 0;
  }
};

const resetSession = () => {
  messages.value = [{ id: 1, role: 'assistant', content: '会话已清空。' }];
  nextId.value = 2;
  currentPage.value = 0;
  memoryVault.value = [];
  megaMemoryVault.value = [];
  onstageNpcs.value = [];
  longtermNpcs.value = [];
  inventoryItems.value = [];
  npcAutoActions.value = [];
  resetPlayerResource();
  summaryLastFloor.value = 0;
  hiddenFloorUntil.value = 0;
  megaSummaryLastCount.value = 0;
  saveRuntimeState();
};

const pickString = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const pullFromTavern = () => {
  if (!inTavern.value) {
    tavernSummary.value = '当前非酒馆环境';
    pushMessage('error', '当前不在酒馆页面，无法读取酒馆配置。');
    return;
  }

  try {
    const st = (window as any).SillyTavern;
    const presetName = typeof getLoadedPresetName === 'function' ? getLoadedPresetName() : '';
    const preset = typeof getPreset === 'function' ? getPreset('in_use') : null;
    const chatConfig = st?.chatCompletionSettings ?? {};

    settings.model = (typeof st?.getChatCompletionModel === 'function' ? st.getChatCompletionModel() : '') || settings.model;
    settings.baseUrl = pickString(chatConfig, ['api_url', 'apiUrl', 'reverse_proxy', 'proxy_url', 'custom_url']) || settings.baseUrl;
    settings.apiKey = pickString(chatConfig, ['api_key', 'apiKey', 'reverse_proxy_password']) || settings.apiKey;
    settings.useTavernPreset = true;

    if (preset?.settings?.should_stream === false) {
      pushSystemNotice('读取到当前预设关闭流式，界面仍可显示完整回复。');
    }

    tavernSummary.value = presetName ? `当前预设: ${presetName}` : '已读取酒馆配置';
    pushSystemNotice(`已读取酒馆配置。${presetName ? `预设: ${presetName}` : ''}`);
    saveSettings();
  } catch (error: any) {
    tavernSummary.value = '读取失败';
    pushMessage('error', `读取酒馆配置失败: ${error?.message ?? String(error)}`);
  }
};

const buildApiUrl = (baseUrl: string) => {
  const cleaned = baseUrl.trim().replace(/\/+$/, '');
  return cleaned.endsWith('/chat/completions') ? cleaned : `${cleaned}/chat/completions`;
};

const buildModelsUrl = (baseUrl: string) => {
  const cleaned = baseUrl.trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (/\/chat\/completions$/i.test(cleaned)) return cleaned.replace(/\/chat\/completions$/i, '/models');
  if (/\/models$/i.test(cleaned)) return cleaned;
  return `${cleaned}/models`;
};

const extractModelIds = (payload: any) => {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.models)
        ? payload.models
        : [];
  const ids = rawList
    .map((item: any) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item.id === 'string') return item.id.trim();
      if (item && typeof item.name === 'string') return item.name.trim();
      return '';
    })
    .filter(Boolean);
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
};

const fetchModelOptions = async () => {
  const url = buildModelsUrl(settings.baseUrl);
  if (!url) {
    pushSystemNotice('请先填写 Base URL。');
    return;
  }
  modelFetchRunning.value = true;
  try {
    const headers: Record<string, string> = {};
    if (settings.apiKey?.trim()) headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const ids = extractModelIds(data);
    if (!ids.length) throw new Error('未解析到模型列表，请确认接口返回格式。');
    modelOptions.value = ids;
    if (!settings.model || !ids.includes(settings.model)) settings.model = ids[0];
    pushSystemNotice(`模型信息读取成功，共 ${ids.length} 个。`);
    saveSettings();
  } catch (error: any) {
    pushMessage('error', `读取模型信息失败: ${error?.message ?? String(error)}`);
  } finally {
    modelFetchRunning.value = false;
  }
};

const fetchSpecialModelOptions = async () => {
  const url = buildModelsUrl(settings.specialMemoryBaseUrl);
  if (!url) {
    pushSystemNotice('请先填写特殊记忆NPC Base URL。');
    return;
  }
  specialModelFetchRunning.value = true;
  try {
    const headers: Record<string, string> = {};
    if (settings.specialMemoryApiKey?.trim()) headers.Authorization = `Bearer ${settings.specialMemoryApiKey.trim()}`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const ids = extractModelIds(data);
    if (!ids.length) throw new Error('未解析到模型列表，请确认接口返回格式。');
    specialModelOptions.value = ids;
    if (!settings.specialMemoryModel || !ids.includes(settings.specialMemoryModel)) settings.specialMemoryModel = ids[0];
    pushSystemNotice(`特殊NPC模型读取成功，共 ${ids.length} 个。`);
    saveSettings();
  } catch (error: any) {
    pushMessage('error', `读取特殊NPC模型信息失败: ${error?.message ?? String(error)}`);
  } finally {
    specialModelFetchRunning.value = false;
  }
};

const buildPayloadMessages = () => {
  const payload: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  const systemBlocks = [settings.systemPrompt, playerBuildHint.value];
  if (memoryVaultHint.value) systemBlocks.push(memoryVaultHint.value);
  if (contextHint.value) systemBlocks.push(contextHint.value);
  if (hiddenFloorUntil.value > 0) {
    systemBlocks.push(`[上下文裁剪] 已隐藏楼层 1-${hiddenFloorUntil.value}，仅保留记忆库摘要与近期楼层。`);
  }
  payload.push({ role: 'system', content: systemBlocks.filter(Boolean).join('\n\n') });

  for (const [idx, range] of pageRanges.value.entries()) {
    if (idx > 0 && idx <= hiddenFloorUntil.value) continue;
    const slice = messages.value.slice(range.start, range.end);
    for (const item of slice) {
      if (item.role === 'user' || item.role === 'assistant') payload.push({ role: item.role, content: item.content });
    }
  }
  return payload;
};

const extractAssistantText = (raw: string) => {
  const text = sanitizeAssistantContent(raw).trim();
  return text || '[无可用文本]';
};

const buildFloorTranscript = (floorStart: number, floorEnd: number) => {
  const lines: string[] = [];
  for (let floor = floorStart; floor <= floorEnd; floor++) {
    const range = pageRanges.value[floor];
    if (!range) continue;
    const slice = messages.value.slice(range.start, range.end);
    lines.push(`### 楼层 ${floor}`);
    for (const item of slice) {
      if (item.role === 'user') lines.push(`玩家: ${item.content}`);
      if (item.role === 'assistant') lines.push(`AI: ${extractAssistantText(item.content)}`);
    }
  }
  return lines.join('\n');
};

const fetchExtraVariablesByConfig = async (options: {
  useVarApi: boolean;
  url: string;
  key: string;
  payload: string;
}) => {
  if (!options.useVarApi || !options.url.trim()) return '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.key.trim()) headers.Authorization = `Bearer ${options.key.trim()}`;
  const bodyText = options.payload.trim();
  const method = bodyText ? 'POST' : 'GET';
  const response = await fetch(options.url.trim(), {
    method,
    headers,
    body: method === 'POST' ? bodyText : undefined,
  });
  if (!response.ok) throw new Error(`变量API异常: HTTP ${response.status}`);
  const text = await response.text();
  return text.length > 5000 ? `${text.slice(0, 5000)}\n...(已截断)` : text;
};

const requestTextByManualApi = async (userPrompt: string) => {
  if (!settings.baseUrl || !settings.model) throw new Error('大总结缺少 Base URL 或 Model。');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  const response = await fetch(buildApiUrl(settings.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      stream: false,
      messages: [
        { role: 'system', content: '你是高压缩记忆总结器，必须忠实、简明、结构化。' },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`大总结请求失败: HTTP ${response.status}`);
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? '').trim();
};

const requestTextByApiConfig = async (options: { baseUrl: string; apiKey: string; model: string; systemPrompt: string }, userPrompt: string) => {
  if (!options.baseUrl || !options.model) throw new Error('缺少 Base URL 或 Model。');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;
  const response = await fetch(buildApiUrl(options.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model,
      stream: false,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`请求失败: HTTP ${response.status}`);
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? '').trim();
};

const requestSummaryText = async (userPrompt: string, useCurrentApi: boolean) => {
  if (useCurrentApi && inTavern.value && settings.useTavernPreset) {
    const text = await generate({ user_input: userPrompt, should_stream: false, should_silence: true });
    if (String(text ?? '').trim()) return String(text).trim();
  }
  return requestTextByManualApi(userPrompt);
};

const buildRecentTranscript = (floors = 2) => {
  const playableFloors = Math.max(0, pageRanges.value.length - 1);
  if (!playableFloors) return '';
  const end = playableFloors;
  const start = Math.max(1, end - floors + 1);
  return buildFloorTranscript(start, end);
};

const runSpecialMemoryNpcTurn = async (trigger: 'auto' | 'manual') => {
  if (!settings.specialMemoryEnabled) return;
  const npc = selectedSpecialMemoryNpc.value;
  if (!npc) {
    if (trigger === 'manual') pushSystemNotice('请先在设置中选择特殊记忆NPC。');
    return;
  }
  if (specialNpcRunning.value) return;
  specialNpcRunning.value = true;
  let extraVars = '';
  try {
    extraVars = await fetchExtraVariablesByConfig({
      useVarApi: settings.specialMemoryUseVarApi,
      url: settings.specialMemoryVarApiUrl,
      key: settings.specialMemoryVarApiKey,
      payload: settings.specialMemoryVarApiPayload,
    });
  } catch (error: any) {
    pushSystemNotice(`特殊记忆NPC变量API读取失败，已忽略：${error?.message ?? String(error)}`);
  }

  try {
    const prompt = [
      settings.specialMemoryPrompt,
      `[NPC档案] 名字=${npc.name} | 定位=${npc.role} | 关系=${npc.relation} | 状态=${npc.status} | 标签=${npc.tags}`,
      '[玩家建卡快照]',
      playerBuildHint.value,
      memoryVaultHint.value ? `[记忆库摘要]\n${memoryVaultHint.value}` : '',
      '[最近楼层对话]',
      buildRecentTranscript(2),
      extraVars ? `[额外变量API返回]\n${extraVars}` : '',
      '[输出要求] 严格输出一段“NPC自主行动”，需可执行、具体，不要解释系统规则。',
    ]
      .filter(Boolean)
      .join('\n\n');

    let actionText = '';
    if (settings.specialMemoryUseCurrentApi && inTavern.value && settings.useTavernPreset) {
      const text = await generate({ user_input: prompt, should_stream: false, should_silence: true });
      actionText = String(text ?? '').trim();
    } else {
      actionText = await requestTextByApiConfig(
        {
          baseUrl: settings.specialMemoryBaseUrl,
          apiKey: settings.specialMemoryApiKey,
          model: settings.specialMemoryModel,
          systemPrompt: '你是NPC自主行动决策器。必须短、准、可执行。',
        },
        prompt,
      );
    }

    const action = actionText || '（未返回可用行动）';
    npcAutoActions.value.push({
      id: Date.now() + Math.floor(Math.random() * 10000),
      npcId: npc.id,
      name: npc.name,
      action,
      createdAt: Date.now(),
      source: trigger === 'manual' ? '手动触发' : '自动触发',
      extraVarNote: extraVars ? '已使用独立变量API' : '未使用独立变量API',
    });
    if (npcAutoActions.value.length > 60) npcAutoActions.value = npcAutoActions.value.slice(-60);
    pushSystemNotice(`已生成 ${npc.name} 的自主行动。`);
  } catch (error: any) {
    if (trigger === 'manual') pushMessage('error', `特殊记忆NPC行动生成失败: ${error?.message ?? String(error)}`);
  } finally {
    specialNpcRunning.value = false;
  }
};

const maybeRunMegaSummary = async (force = false) => {
  if (!settings.megaSummaryEnabled) return;
  const threshold = Math.max(1, Math.trunc(Number(settings.megaSummaryEvery) || 5));
  const pending = memoryVault.value.length - megaSummaryLastCount.value;
  if (!force && pending < threshold) return;
  if (pending <= 0 || !memoryVault.value.length) return;
  let extraVars = '';
  try {
    extraVars = await fetchExtraVariablesByConfig({
      useVarApi: settings.megaSummaryUseVarApi,
      url: settings.megaSummaryVarApiUrl,
      key: settings.megaSummaryVarApiKey,
      payload: settings.megaSummaryVarApiPayload,
    });
  } catch (error: any) {
    pushSystemNotice(`超大总结变量API读取失败，已忽略：${error?.message ?? String(error)}`);
  }

  const allSummaryText = memoryVault.value
    .map(item => `楼层${item.floorStart}-${item.floorEnd}\n${item.summary}`)
    .join('\n\n');
  const megaPrompt = [
    settings.megaSummaryPrompt,
    `[触发规则] 每 ${threshold} 次大总结触发一次超大总结。当前累计大总结: ${memoryVault.value.length}。`,
    '[已累计大总结内容]',
    allSummaryText,
    extraVars ? `[额外变量API返回]\n${extraVars}` : '',
    '[输出要求] 使用中文项目符号，输出“世界稳定态/长期矛盾/关键关系网/下一阶段主目标”。',
  ]
    .filter(Boolean)
    .join('\n\n');
  const text = await requestSummaryText(megaPrompt, Boolean(settings.megaSummaryUseCurrentApi));
  const first = memoryVault.value[0];
  const last = memoryVault.value[memoryVault.value.length - 1];
  megaMemoryVault.value.push({
    id: Date.now() + Math.floor(Math.random() * 10000),
    floorStart: first?.floorStart ?? 1,
    floorEnd: last?.floorEnd ?? hiddenFloorUntil.value,
    summary: text || '（超大总结返回空文本）',
    createdAt: Date.now(),
    extraVarNote: extraVars ? '已使用额外变量API' : '未使用额外变量API',
  });
  megaSummaryLastCount.value = memoryVault.value.length;
  pushSystemNotice('已生成超大总结。');
};

const runAutoSummaryForBlock = async (floorStart: number, floorEnd: number) => {
  const transcript = buildFloorTranscript(floorStart, floorEnd).trim();
  if (!transcript) return;
  let extraVars = '';
  try {
    extraVars = await fetchExtraVariablesByConfig({
      useVarApi: settings.summaryUseVarApi,
      url: settings.summaryVarApiUrl,
      key: settings.summaryVarApiKey,
      payload: settings.summaryVarApiPayload,
    });
  } catch (error: any) {
    pushSystemNotice(`变量API读取失败，已忽略：${error?.message ?? String(error)}`);
  }
  const summaryPrompt = [
    settings.autoSummaryPrompt,
    `[总结范围] 楼层 ${floorStart}-${floorEnd}`,
    '[角色建卡快照]',
    playerBuildHint.value,
    extraVars ? `[额外变量API返回]\n${extraVars}` : '',
    '[对话原文]',
    transcript,
    '[输出要求] 用中文输出，采用项目符号，必须包含“当前阶段建议动作”。',
  ]
    .filter(Boolean)
    .join('\n\n');
  const summaryText = await requestSummaryText(summaryPrompt, Boolean(settings.summaryUseCurrentApi));
  const summary = summaryText || '（自动大总结返回空文本）';
  memoryVault.value.push({
    id: Date.now() + Math.floor(Math.random() * 10000),
    floorStart,
    floorEnd,
    summary,
    createdAt: Date.now(),
    extraVarNote: extraVars ? '已使用额外变量API' : '未使用额外变量API',
  });
  hiddenFloorUntil.value = floorEnd;
  summaryLastFloor.value = floorEnd;
  pushSystemNotice(`已完成楼层 ${floorStart}-${floorEnd} 大总结，并隐藏对应原始楼层。`);
  await maybeRunMegaSummary(false);
};

const maybeRunAutoSummary = async () => {
  if (!settings.autoSummaryEnabled || summaryRunning.value) return;
  const floorsPerRun = Math.max(1, Math.trunc(Number(settings.summaryFloorsPerRun) || 5));
  const playableFloors = Math.max(0, pageRanges.value.length - 1);
  if (playableFloors < floorsPerRun) return;
  const nextTarget = Math.floor(playableFloors / floorsPerRun) * floorsPerRun;
  if (nextTarget <= summaryLastFloor.value) return;
  summaryRunning.value = true;
  startDbTask(`自动大总结（至楼层 ${nextTarget}）`);
  try {
    for (let start = summaryLastFloor.value + 1; start <= nextTarget; start += floorsPerRun) {
      const end = Math.min(start + floorsPerRun - 1, nextTarget);
      await runAutoSummaryForBlock(start, end);
    }
  } catch (error: any) {
    pushMessage('error', `自动大总结失败: ${error?.message ?? String(error)}`);
  } finally {
    summaryRunning.value = false;
    finishDbTask();
  }
};

const parseSseAndWrite = async (response: Response, onDelta: (text: string) => void) => {
  const reader = response.body?.getReader();
  if (!reader) return false;
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return true;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) onDelta(delta);
      } catch {
        // ignore malformed stream lines
      }
    }
  }

  return true;
};

const requestWithTavernPreset = async () => {
  const answer = { id: nextId.value++, role: 'assistant' as const, content: '' };
  messages.value.push(answer);
  const lastUser = [...messages.value].reverse().find(item => item.role === 'user');
  const text = await generate({ user_input: lastUser?.content ?? '', should_stream: true, should_silence: true });
  answer.content = sanitizeAssistantContent(text || '[无响应文本]');
};

const requestWithManualApi = async () => {
  if (!settings.baseUrl || !settings.model) {
    pushMessage('error', '请先填写 Base URL 和 Model。');
    return;
  }

  const answer = { id: nextId.value++, role: 'assistant' as const, content: '' };
  messages.value.push(answer);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;

  const response = await fetch(buildApiUrl(settings.baseUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: settings.model, messages: buildPayloadMessages(), stream: true }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 400)}`);

  const streamed = await parseSseAndWrite(response, text => (answer.content += text));
  if (!streamed) {
    const data = await response.json();
    answer.content = data?.choices?.[0]?.message?.content ?? '[无响应文本]';
  }

  answer.content = sanitizeAssistantContent(answer.content);
  if (!answer.content.trim()) answer.content = '[模型未返回可显示文本]';
};

const requestAi = async () => {
  pending.value = true;
  try {
    if (inTavern.value && settings.useTavernPreset) await requestWithTavernPreset();
    else await requestWithManualApi();
    await maybeRunAutoSummary();
    void runSpecialMemoryNpcTurn('auto');
  } catch (error: any) {
    pushMessage('error', `请求失败: ${error?.message ?? String(error)}`);
  } finally {
    pending.value = false;
  }
};

const sendUserInput = async () => {
  const text = draft.value.trim();
  if (!text || interactionLocked.value) return;
  pushMessage('user', text);
  draft.value = '';
  await requestAi();
};

const sendQuick = async (text: string) => {
  if (interactionLocked.value) return;
  pushMessage('user', text);
  await requestAi();
};

const formatTs = (ts: number) => new Date(ts).toLocaleString();

const clearMemoryVault = () => {
  memoryVault.value = [];
  megaMemoryVault.value = [];
  summaryLastFloor.value = 0;
  hiddenFloorUntil.value = 0;
  megaSummaryLastCount.value = 0;
  pushSystemNotice('记忆库已清空。');
};

const runManualSummary = async () => {
  if (summaryRunning.value) return;
  const playableFloors = Math.max(0, pageRanges.value.length - 1);
  if (playableFloors <= summaryLastFloor.value) {
    pushSystemNotice('当前没有可总结的新楼层。');
    return;
  }
  const start = summaryLastFloor.value + 1;
  const end = playableFloors;
  summaryRunning.value = true;
  startDbTask(`大总结（楼层 ${start}-${end}）`);
  try {
    await runAutoSummaryForBlock(start, end);
  } catch (error: any) {
    pushMessage('error', `手动大总结失败: ${error?.message ?? String(error)}`);
  } finally {
    summaryRunning.value = false;
    finishDbTask();
  }
};

const runManualMegaSummary = async () => {
  if (summaryRunning.value) return;
  if (!settings.megaSummaryEnabled) {
    pushSystemNotice('超大总结当前已关闭，请先在设置中开启。');
    return;
  }
  summaryRunning.value = true;
  startDbTask('超大总结');
  try {
    await maybeRunMegaSummary(true);
  } catch (error: any) {
    pushMessage('error', `手动超大总结失败: ${error?.message ?? String(error)}`);
  } finally {
    summaryRunning.value = false;
    finishDbTask();
  }
};

const addNpc = () => {
  const name = npcEditor.name.trim();
  if (!name) {
    pushSystemNotice('请先填写NPC姓名。');
    return;
  }
  const target = npcEditor.toLongterm ? longtermNpcs.value : onstageNpcs.value;
  const exist = target.find(n => n.name === name);
  const next: NpcEntry = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name,
    role: npcEditor.role.trim() || '未知',
    relation: npcEditor.relation.trim() || '未建立',
    status: npcEditor.status.trim() || '稳定',
    tags: npcEditor.tags.trim() || '无',
  };
  if (exist) Object.assign(exist, next, { id: exist.id });
  else target.push(next);
  npcEditor.name = '';
  npcEditor.role = '';
  npcEditor.relation = '';
  npcEditor.status = '';
  npcEditor.tags = '';
  pushSystemNotice(`${npcEditor.toLongterm ? '长期NPC' : '在场角色'}已更新。`);
};

const removeNpc = (id: number, type: 'onstage' | 'longterm') => {
  if (type === 'onstage') onstageNpcs.value = onstageNpcs.value.filter(n => n.id !== id);
  else longtermNpcs.value = longtermNpcs.value.filter(n => n.id !== id);
  if (Number(settings.specialMemoryNpcId) === id) settings.specialMemoryNpcId = 0;
};

const addInventoryItem = () => {
  if (!cheatMode.value) {
    pushSystemNotice('标准模式下仓库为只读，开启作弊模式后才能写入。');
    return;
  }
  const name = inventoryEditor.name.trim();
  if (!name) {
    pushSystemNotice('请先填写物品名称。');
    return;
  }
  const count = Math.max(1, Math.trunc(Number(inventoryEditor.count) || 1));
  const note = inventoryEditor.note.trim();
  const exist = inventoryItems.value.find(item => item.name === name);
  if (exist) {
    exist.count = count;
    exist.note = note || exist.note || '无';
  } else {
    inventoryItems.value.push({
      id: Date.now() + Math.floor(Math.random() * 10000),
      name,
      count,
      note: note || '无',
    });
  }
  inventoryEditor.name = '';
  inventoryEditor.count = 1;
  inventoryEditor.note = '';
  pushSystemNotice('仓库物品已更新。');
};

const removeInventoryItem = (id: number) => {
  if (!cheatMode.value) {
    pushSystemNotice('标准模式下仓库为只读，开启作弊模式后才能删除。');
    return;
  }
  inventoryItems.value = inventoryItems.value.filter(item => item.id !== id);
};

const startSession = () => {
  started.value = true;
  createDone.value = false;
  createPage.value = 1;
  createForm.background = '';
  backgroundPresetKey.value = autoBackgroundPresetKey.value;
  pushSystemNotice('进入建卡界面。');
};
const startNormalRoute = () => {
  xenoRouteMode.value = false;
  startSession();
};
const startXenoRoute = () => {
  xenoRouteMode.value = true;
  if (xenoRouteRole.value === '再诞战姬') {
    createForm.profession = '战姬';
    createForm.gender = '女';
  } else {
    createForm.profession = '指挥官';
  }
  startSession();
};

const goCreatePageTwo = () => {
  if (!createForm.name.trim()) {
    pushSystemNotice('请先填写姓名。');
    return;
  }
  const range = ageLimits[createForm.profession];
  if (!Number.isFinite(createForm.age)) {
    pushSystemNotice('请先填写年龄。');
    return;
  }
  if (!cheatMode.value && (createForm.age < range.min || createForm.age > range.max)) {
    pushSystemNotice(`${createForm.profession}年龄需在${range.min}-${range.max}。`);
    return;
  }
  if (createForm.profession === '战姬') createForm.gender = '女';
  createPage.value = 2;
};

const goCreatePageThree = () => {
  if (!cheatMode.value && humanPointsLeft.value !== 0) {
    pushSystemNotice(`属性点尚未分配完毕（剩余 ${humanPointsLeft.value} 点）。`);
    return;
  }
  createPage.value = 3;
};

const applyBackgroundPreset = () => {
  const text = backgroundTemplateMap[backgroundPresetKey.value] ?? '';
  if (!text) {
    pushSystemNotice('当前模板为空。');
    return;
  }
  createForm.background = text.slice(0, 1000);
  pushSystemNotice('已载入默认背景模板。');
};

const incHumanAttr = (key: HumanAttrKey) => {
  if (humanPointsLeft.value <= 0) return;
  if (createHumanAttr[key] >= 5) return;
  createHumanAttr[key] += 1;
};

const decHumanAttr = (key: HumanAttrKey) => {
  if (createHumanAttr[key] <= 1) return;
  createHumanAttr[key] -= 1;
};

const finishCreate = () => {
  if (createPage.value !== 3) {
    pushSystemNotice('请先完成第3页背景设定。');
    return;
  }
  if (!cheatMode.value && humanPointsLeft.value !== 0) {
    pushSystemNotice(`属性点尚未分配完毕（剩余 ${humanPointsLeft.value} 点）。`);
    return;
  }
  if ((createForm.background || '').length > 1000) {
    pushSystemNotice('背景超过1000字，请先精简。');
    return;
  }
  createDone.value = true;
  messages.value = [
    {
      id: 1,
      role: 'assistant',
      content: xenoRouteMode.value ? xenoOpeningStory : normalOpeningStory,
    },
  ];
  nextId.value = 2;
  currentPage.value = 0;
  memoryVault.value = [];
  megaMemoryVault.value = [];
  onstageNpcs.value = [];
  longtermNpcs.value = [];
  inventoryItems.value = [];
  resetPlayerResource();
  summaryLastFloor.value = 0;
  hiddenFloorUntil.value = 0;
  megaSummaryLastCount.value = 0;
  pushSystemNotice(
    `建卡完成：${createForm.name} / ${createForm.profession} / ${createForm.age}岁 / ${createForm.gender} / ${xenoRouteMode.value ? '异种开局' : '常规开局'} / ${plotMode.value ? '剧情模式' : '自由模式'} / 背景${createForm.background.length}字`,
  );
};

const fullscreenTarget = () => (rootRef.value ?? document.documentElement) as any;
const getFullscreenElement = () =>
  (document as any).fullscreenElement ||
  (document as any).webkitFullscreenElement ||
  (document as any).mozFullScreenElement ||
  (document as any).msFullscreenElement;

const enterFullscreen = async () => {
  const target = fullscreenTarget();
  const fn =
    target.requestFullscreen ||
    target.webkitRequestFullscreen ||
    target.mozRequestFullScreen ||
    target.msRequestFullscreen;
  if (typeof fn === 'function') await fn.call(target);
};

const exitFullscreen = async () => {
  const doc = document as any;
  const fn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
  if (typeof fn === 'function') await fn.call(doc);
};

const syncFullscreenState = () => {
  isFullscreen.value = Boolean(getFullscreenElement());
};

const toggleFullscreen = async () => {
  try {
    if (getFullscreenElement()) await exitFullscreen();
    else await enterFullscreen();
    syncFullscreenState();
  } catch (error: any) {
    pushSystemNotice(`全屏切换失败: ${error?.message ?? String(error)}`);
  }
};

onMounted(() => {
  loadSettings();
  loadRuntimeState();
  if (inTavern.value) pullFromTavern();
  if (props.mode === 'embedded') showSettings.value = false;
  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(eventName => {
    document.addEventListener(eventName, syncFullscreenState as EventListener);
  });
});

onUnmounted(() => {
  if (dbTickTimer) {
    clearInterval(dbTickTimer);
    dbTickTimer = null;
  }
});
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+SC:wght@400;500;700&display=swap');

.shell {
  --ink: #e8ddc6;
  --ink-muted: #b7a586;
  --line: #6f5632;
  --line-soft: #4f3b23;
  --panel: rgba(16, 12, 9, 0.9);
  --panel-2: rgba(34, 24, 16, 0.9);
  --gold: #b49a63;
  width: min(96vw, 1920px);
  max-width: none;
  min-height: 96vh;
  margin: 0 auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--ink);
  background:
    radial-gradient(circle at 14% -10%, rgba(188, 146, 71, 0.2), transparent 34%),
    radial-gradient(circle at 90% 0, rgba(130, 40, 40, 0.18), transparent 28%),
    linear-gradient(150deg, #080705, #120d09 48%, #090705);
  border: 1px solid var(--line);
  border-radius: 14px;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 223, 160, 0.06);
  text-align: center;
}

.shell::before,
.shell::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shell::before {
  background:
    linear-gradient(transparent 97%, rgba(232, 193, 110, 0.05)),
    linear-gradient(90deg, transparent 97%, rgba(166, 45, 45, 0.03));
  background-size: 100% 4px, 4px 100%;
  mix-blend-mode: soft-light;
}

.shell::after {
  border: 1px solid rgba(188, 156, 98, 0.24);
  border-radius: 11px;
  margin: 6px;
}

.start-screen {
  min-height: calc(100vh - 110px);
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 25%, rgba(118, 34, 34, 0.3), transparent 42%),
    radial-gradient(circle at 75% 15%, rgba(168, 134, 69, 0.25), transparent 34%),
    linear-gradient(140deg, rgba(12, 9, 7, 0.94), rgba(19, 13, 9, 0.95));
}

.start-screen__veil {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 5px,
      rgba(232, 193, 110, 0.05) 5px,
      rgba(232, 193, 110, 0.05) 6px
    );
  animation: pageDrift 16s linear infinite;
}

.start-card {
  position: relative;
  width: min(1600px, calc(100% - 28px));
  border: 1px solid #8f7044;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(20, 14, 10, 0.95), rgba(13, 10, 8, 0.96));
  padding: 28px 26px;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.44),
    inset 0 0 0 1px rgba(217, 181, 113, 0.1);
  animation: cardLift 520ms ease-out;
}

.start-card__kicker {
  margin: 0;
  font: 600 11px/1.2 'Cinzel', 'Noto Serif SC', serif;
  letter-spacing: 0.18em;
  color: #c9b086;
}

.start-card h2 {
  margin: 10px 0 8px;
  font: 700 clamp(72px, 12vw, 168px)/1.04 'Cinzel', 'Noto Serif SC', serif;
  letter-spacing: 0.12em;
  color: transparent;
  background: linear-gradient(180deg, #fff6dc 0%, #f8de9f 24%, #d3aa57 52%, #f1d188 74%, #8d6428 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 6px rgba(181, 141, 64, 0.26),
    0 0 14px rgba(116, 82, 30, 0.22),
    0 0 26px rgba(64, 44, 16, 0.16);
}

.start-card__desc {
  margin: 0;
  color: var(--ink-muted);
  line-height: 1.65;
}

.start-card__author {
  margin: 0 0 10px;
  color: #ceb893;
  letter-spacing: 0.05em;
}

.start-card__quote {
  margin: 14px 0 0;
  padding-left: 0;
  border-left: 0;
  color: #d7c7a7;
  opacity: 0.92;
}

.start-card__mode {
  margin: 8px 0 0;
  color: #ceb893;
  font-size: 13px;
}

.start-card__actions {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  width: min(420px, 92%);
  margin-inline: auto;
  justify-items: center;
  align-items: center;
}

.start-card__actions button {
  width: min(320px, 100%);
  display: block;
  text-align: center;
  margin-inline: auto;
}

.start-card__actions .xeno {
  border-color: #8b4a4a;
  background: linear-gradient(180deg, #5e2a2a, #3e1b1b);
}

.create-card {
  display: grid;
  gap: 14px;
}

.create-card h2 {
  margin: 0;
  font: 700 30px/1.2 'Cinzel', 'Noto Serif SC', serif;
  text-align: center;
  color: #f3e4c4;
  text-shadow: 0 0 10px rgba(160, 120, 58, 0.22);
}

.create-card label {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(190, 152, 85, 0.5);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(227, 183, 107, 0.05), rgba(227, 183, 107, 0)),
    rgba(25, 18, 12, 0.86);
  box-shadow: inset 0 0 0 1px rgba(255, 223, 163, 0.06);
}

.create-card label > span {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #f0ddb7;
}

.create-card input,
.create-card select,
.create-card textarea {
  font-size: 18px;
  color: #f5e8cc;
  background: rgba(31, 22, 14, 0.95);
  border-color: #b4915e;
}

.desc-field textarea {
  min-height: 180px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.xeno-box {
  border: 1px solid rgba(156, 79, 79, 0.55);
  border-radius: 10px;
  padding: 10px;
  background: linear-gradient(180deg, rgba(120, 42, 42, 0.16), rgba(40, 16, 16, 0.2));
  display: grid;
  gap: 8px;
}

.xeno-box > p {
  margin: 0;
}

.attr-list {
  display: grid;
  gap: 8px;
}

.attr-item {
  border: 1px solid rgba(190, 152, 85, 0.38);
  border-radius: 8px;
  background: rgba(26, 18, 12, 0.72);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.attr-item header {
  display: grid;
  gap: 3px;
}

.attr-item header strong {
  font-size: 18px;
  color: #f0ddb7;
}

.attr-item header span {
  font-size: 13px;
  color: var(--ink-muted);
}

.attr-ctrl {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.attr-ctrl b {
  min-width: 28px;
  font-size: 20px;
  color: #f4e7cd;
}

.topbar,
.row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.center-row {
  justify-content: center;
}

.title h1 {
  margin: 0;
  font: 700 24px/1.2 'Cinzel', 'Noto Serif SC', serif;
  letter-spacing: 0.05em;
}

.title p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--ink-muted);
}

.controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.db-btn {
  border-color: #8f7044;
  background: linear-gradient(180deg, rgba(103, 78, 41, 0.45), rgba(49, 36, 19, 0.45));
}

.panel {
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 230, 180, 0.03), transparent),
    var(--panel);
  padding: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 223, 160, 0.05);
}

.main-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.main-column {
  display: grid;
  gap: 10px;
}

.player-sidebar {
  position: sticky;
  top: 10px;
  text-align: left;
}

.player-sidebar h3 {
  margin: 0 0 10px;
  font: 700 18px/1.2 'Cinzel', 'Noto Serif SC', serif;
  letter-spacing: 0.04em;
  color: #f2dfbb;
}

.player-sidebar dl {
  margin: 0;
  display: grid;
  gap: 8px;
}

.player-sidebar dl > div {
  display: grid;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(190, 152, 85, 0.38);
  border-radius: 8px;
  background: rgba(26, 18, 12, 0.72);
}

.player-sidebar dt {
  font-size: 12px;
  color: var(--ink-muted);
}

.player-sidebar dd {
  margin: 0;
  font-size: 16px;
  color: #f4e7cd;
}

.inventory-panel {
  margin-top: 10px;
  border: 1px solid rgba(190, 152, 85, 0.35);
  border-radius: 8px;
  padding: 8px;
  background: rgba(22, 16, 11, 0.72);
  display: grid;
  gap: 8px;
}

.inventory-panel h4 {
  margin: 0;
  color: #efdcb8;
}

.inventory-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.inventory-item {
  border: 1px solid rgba(190, 152, 85, 0.28);
  border-radius: 8px;
  padding: 7px;
  background: rgba(29, 21, 14, 0.72);
  text-align: left;
}

.inventory-item header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.inventory-item p {
  margin: 4px 0 0;
}

.attr-card dd {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.attr-chip {
  border: 1px solid rgba(190, 152, 85, 0.35);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 12px;
  color: #e8d8b7;
  background: rgba(20, 14, 10, 0.7);
}

.settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.settings label:last-of-type {
  grid-column: 1 / -1;
}

.settings label.full {
  grid-column: 1 / -1;
}

.toggle {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ink-muted);
  justify-content: center;
}

.toggle input[type='checkbox'] {
  appearance: none;
  -webkit-appearance: none;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #8e6c3d;
  background: linear-gradient(180deg, #2c2014, #1c150e);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  flex: 0 0 auto;
}

.memory-vault {
  display: grid;
  gap: 8px;
}

.memory-item {
  border: 1px solid rgba(190, 152, 85, 0.34);
  border-radius: 8px;
  background: rgba(23, 16, 11, 0.82);
  padding: 8px;
  text-align: left;
}

.memory-item header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 6px;
}

.memory-item pre {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.45;
  color: #e6d7b8;
}

.memory-item.mega {
  border-color: rgba(118, 88, 42, 0.6);
  background: rgba(30, 22, 13, 0.86);
}

.npc-panel {
  display: grid;
  gap: 8px;
}

.npc-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.npc-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.npc-columns section {
  border: 1px solid rgba(190, 152, 85, 0.3);
  border-radius: 8px;
  padding: 8px;
  background: rgba(23, 16, 11, 0.7);
  text-align: left;
}

.npc-columns h4 {
  margin: 0 0 6px;
  color: #ead9b8;
}

.npc-card {
  border: 1px solid rgba(190, 152, 85, 0.28);
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 6px;
  background: rgba(31, 22, 14, 0.72);
}

.npc-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.npc-card p {
  margin: 4px 0 0;
}

.toggle input[type='checkbox']::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(180deg, #d2bf96, #9a7f4f);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  transition: left 0.2s ease;
}

.toggle input[type='checkbox']:checked {
  background: linear-gradient(180deg, #6e2a2a, #4c1c1c);
  border-color: #b8835f;
}

.toggle input[type='checkbox']:checked::after {
  left: 22px;
}

input,
select,
textarea,
button {
  border: 1px solid #7b6040;
  border-radius: 7px;
  background: rgba(34, 24, 16, 0.9);
  color: var(--ink);
  padding: 8px;
}

input,
select,
textarea {
  width: 100%;
}

button {
  cursor: pointer;
  background: linear-gradient(180deg, #7c6038, #523a24);
  border-color: #ad8d59;
  transition: filter 160ms ease, transform 160ms ease;
}

button:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

button.ghost {
  background: linear-gradient(180deg, #3a2b1d, #281d13);
  border-color: #6d5637;
}

.quick button:nth-child(2) {
  border-color: #8b5f43;
}

.quick button:nth-child(3) {
  border-color: #844444;
  background: linear-gradient(180deg, #6e3535, #4a2222);
}

button.small {
  font-size: 11px;
  padding: 4px 8px;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.quick {
  display: flex;
  gap: 8px;
}

.chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.messages {
  max-height: 52vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
  align-items: center;
}

.messages::-webkit-scrollbar {
  width: 8px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(155, 122, 72, 0.7);
  border-radius: 10px;
}

.msg {
  border: 1px solid #685133;
  border-radius: 9px;
  padding: 10px;
  background: rgba(24, 18, 12, 0.8);
  width: min(940px, 100%);
}

.msg--user {
  border-color: #8f5d3e;
  background: linear-gradient(180deg, rgba(33, 22, 15, 0.95), rgba(25, 18, 13, 0.9));
}

.msg--assistant {
  border-color: #7b6a49;
  background: linear-gradient(180deg, rgba(20, 16, 11, 0.95), rgba(14, 12, 9, 0.92));
}

.msg--error {
  border-color: #8f3d3d;
  background: rgba(128, 38, 38, 0.26);
}

.msg header {
  font: 600 11px/1.3 'Cinzel', 'Noto Serif SC', serif;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  margin-bottom: 5px;
}

.msg pre {
  white-space: pre-wrap;
  margin: 0;
  font: inherit;
  line-height: 1.7;
  text-align: center;
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  font-size: 12px;
  color: var(--ink-muted);
}

.system-float {
  position: fixed;
  right: 14px;
  top: 14px;
  z-index: 200000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, calc(100vw - 24px));
}

.system-notice {
  border: 1px solid #9d7a46;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(24, 18, 12, 0.97), rgba(18, 14, 10, 0.97));
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  padding: 10px;
}

.system-notice header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: var(--gold);
}

.db-notice {
  border-color: #b68a48;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

@keyframes cardLift {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pageDrift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(6px);
  }
}

@media (max-width: 700px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .player-sidebar {
    position: static;
    text-align: center;
  }

  .settings,
  .quick {
    grid-template-columns: 1fr;
    display: grid;
  }

  .npc-form,
  .npc-columns {
    grid-template-columns: 1fr;
  }

  .title h1 {
    font-size: 19px;
  }

  .start-card {
    padding: 20px 16px;
  }

  .start-card__actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
