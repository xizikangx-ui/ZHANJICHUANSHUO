import App from '../App.vue';

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

const mount = () => {
  if (app) return;
  const root = ensureRoot();
  app = createApp(App, { mode: 'standalone' });
  app.mount(root);
  console.info('[同层测试] 独立界面已挂载');
  toastr.success('[同层测试] 独立界面已挂载');
};

const unmount = () => {
  if (!app) return;
  app.unmount();
  app = null;
  document.getElementById(ROOT_ID)?.remove();
};

$(() => {
  mount();
  $(window).on('pagehide', () => unmount());
});
