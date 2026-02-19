<template>
  <div class="dependency-strip">
    <span class="dependency-label">依存条（停用）</span>
    <div class="dependency-track">
      <div class="dependency-fill" :style="{ width: '0%' }"></div>
    </div>
    <span class="dependency-value">0%</span>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.dependency-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border-bottom: 2px dashed var(--c-granite);
}
.dependency-label,
.dependency-value {
  font-weight: bold;
  font-size: 0.9rem;
}
.dependency-track {
  flex: 1;
  max-width: 360px;
  height: 10px;
  border: 1.5px solid var(--c-granite);
  background: var(--c-mint-cream);
  position: relative;
  overflow: hidden;
}
.dependency-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--c-celadon);
  border-right: 1.5px solid var(--c-granite);
}
</style>
