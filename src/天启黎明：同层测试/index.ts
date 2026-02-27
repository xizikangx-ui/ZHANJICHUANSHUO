import App from './App.vue';

function ensureStandaloneRoot() {
  let root = document.querySelector('#app');
  if (!root) {
    root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
  }
  return root;
}

function isLikelyTavernEnv() {
  return typeof window !== 'undefined' && typeof (window as any).SillyTavern !== 'undefined' && !!$('#chat').length;
}

async function mountInTavern() {
  try {
    const { mountStreamingMessages } = await import('@util/streaming');
    const { unmount } = mountStreamingMessages(() => createApp(App, { mode: 'embedded' }));
    $(window).on('pagehide', () => unmount());
    return true;
  } catch (error) {
    console.warn('[同层测试] 酒馆同层挂载失败，自动回退为独立模式', error);
    return false;
  }
}

async function boot() {
  if (isLikelyTavernEnv() && (await mountInTavern())) {
    return;
  }
  ensureStandaloneRoot();
  createApp(App, { mode: 'standalone' }).mount('#app');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void boot();
  });
} else {
  void boot();
}
