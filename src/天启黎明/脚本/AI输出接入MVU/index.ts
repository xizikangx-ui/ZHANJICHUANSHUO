$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('Mvu');

    const syncing_message_ids = new Set<number>();
    const synced_message_content = new Map<number, string>();

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

    eventOn(tavern_events.CHAT_CHANGED, () => {
      syncing_message_ids.clear();
      synced_message_content.clear();
    });

    const latest = getChatMessages(-1, { include_swipes: false })[0];
    if (latest && latest.role === 'assistant') {
      void syncMessageToMvu(latest.message_id);
    }
  })();
});

