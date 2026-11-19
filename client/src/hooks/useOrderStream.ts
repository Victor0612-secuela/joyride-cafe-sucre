import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useOrderStream(options: { orderId?: string; enabled?: boolean; onUpdate?: (data: any) => void }) {
  const queryClient = useQueryClient();
  const { orderId, enabled = true, onUpdate } = options;

  useEffect(() => {
    if (!enabled) return;

    const url = orderId ? `/api/events/stream?orderId=${encodeURIComponent(orderId)}` : '/api/events/stream';
    const es = new EventSource(url);

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['cashier'] });
        queryClient.invalidateQueries({ queryKey: ['packer'] });
        queryClient.invalidateQueries({ queryKey: ['delivery'] });
        queryClient.invalidateQueries({ queryKey: ['admin'] });
        if (orderId) {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }
        onUpdate?.(data);
      } catch {
        // ignore parse errors
      }
    };

    es.addEventListener('order_update', handleEvent);
    es.addEventListener('staff_refresh', handleEvent);

    return () => {
      es.close();
    };
  }, [orderId, enabled, onUpdate, queryClient]);
}
