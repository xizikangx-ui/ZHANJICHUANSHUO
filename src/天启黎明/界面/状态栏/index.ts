import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
    const w = window as any;
    const parent_w = (window.parent ?? {}) as any;
    const element_ctor = w.Element || parent_w.Element || w.HTMLElement || parent_w.HTMLElement;
    if (typeof w.SVGElement !== 'function' && typeof element_ctor === 'function') w.SVGElement = element_ctor;
    if (typeof w.MathMLElement !== 'function' && typeof element_ctor === 'function') w.MathMLElement = element_ctor;
    if (typeof w.HTMLElement !== 'function' && typeof element_ctor === 'function') w.HTMLElement = element_ctor;
    if (typeof w.Node !== 'function' && typeof parent_w.Node === 'function') w.Node = parent_w.Node;
    if (typeof w.ShadowRoot !== 'function' && typeof parent_w.ShadowRoot === 'function') w.ShadowRoot = parent_w.ShadowRoot;
    const root = document.getElementById('app');
    if (!root) return;
    createApp(App).use(createPinia()).mount(root);
  })();
});
