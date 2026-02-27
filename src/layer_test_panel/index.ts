import App from '../layer_test/App.vue';

const ROOT_ID = 'th-layer-test-standalone-root';

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    Object.assign(root.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      width: 'min(560px, calc(100vw - 24px))',
      maxHeight: '78vh',
      zIndex: '99999',
      overflow: 'auto',
      borderRadius: '12px',
      boxShadow: '0 20px 50px rgba(0,0,0,.45)',
    } as CSSStyleDeclaration);
    document.body.append(root);
  }
  return root;
}

let app: ReturnType<typeof createApp> | null = null;

$(() => {
  if (app) return;
  app = createApp(App, { mode: 'standalone' });
  app.mount(ensureRoot());
  toastr.success('[同层测试] 独立悬浮界面已挂载');
  $(window).on('pagehide', () => {
    app?.unmount();
    app = null;
    document.getElementById(ROOT_ID)?.remove();
  });
});
