import { mountStreamingMessages } from '@util/streaming';
import App from '../layer_test/App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(() => createApp(App, { mode: 'embedded' }));
  $(window).on('pagehide', () => unmount());
});
