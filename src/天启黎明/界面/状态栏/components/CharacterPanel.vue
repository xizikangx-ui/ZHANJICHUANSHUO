<template>
  <div class="char-layout">
    <div class="section-head">角色扩展面板（停用）</div>
    <div class="title-box">
      <span class="title-name">已停用</span>
      <div class="title-effect">该组件不再绑定固定角色数据。</div>
      <div class="title-quote">"Use dynamic OnStage/长期NPC data instead."</div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.char-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-head {
  font-size: 0.95rem;
  border-bottom: 3px solid var(--c-celadon);
  display: inline-block;
  margin-bottom: 8px;
  font-weight: bold;
}
.title-box {
  border: 1.5px solid var(--c-granite);
  padding: 7px;
  background: #fff;
}
.title-name {
  background: var(--c-granite);
  color: var(--c-celadon);
  display: inline-block;
  padding: 2px 4px;
  font-size: 0.72rem;
  font-weight: bold;
  margin-bottom: 3px;
}
.title-effect {
  font-size: 0.78rem;
  margin-bottom: 3px;
}
.title-quote {
  font-size: 0.7rem;
  color: var(--c-grey-olive);
  font-style: italic;
}
</style>
