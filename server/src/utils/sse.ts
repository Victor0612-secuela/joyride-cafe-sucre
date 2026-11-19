import { Response } from 'express';

interface SseClient {
  id: string;
  res: Response;
  orderId?: string;
  role?: string;
}

const clients = new Map<string, SseClient>();

export function registerSseClient(id: string, res: Response, filter: { orderId?: string; role?: string }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, time: new Date().toISOString() })}\n\n`);

  clients.set(id, { id, res, ...filter });

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      clients.delete(id);
    }
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(id);
  });
}

const STAFF_SET = new Set(['CAJERO', 'EMPAQUETADOR', 'REPARTIDOR', 'ADMIN']);

export function emitOrderUpdate(payload: {
  orderId: string;
  orderCode: string;
  status: string;
  paymentStatus?: string;
  message?: string;
  riderLat?: number;
  riderLng?: number;
  etaMinutes?: number;
}) {
  const serialized = `event: order_update\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, client] of clients.entries()) {
    const isStaff = Boolean(client.role && STAFF_SET.has(client.role));
    const matchesOrder = Boolean(client.orderId && client.orderId === payload.orderId);
    if (isStaff || matchesOrder) {
      try {
        client.res.write(serialized);
      } catch {
        clients.delete(id);
      }
    }
  }
}

export function emitStaffBroadcast(event: string, payload: unknown) {
  const serialized = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, client] of clients.entries()) {
    if (client.role && STAFF_SET.has(client.role)) {
      try {
        client.res.write(serialized);
      } catch {
        clients.delete(id);
      }
    }
  }
}

export function emitChatMessage(msg: {
  id: string;
  channelType: 'ORDER_DELIVERY' | 'STAFF_OPS';
  orderId?: string | null;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string | Date;
}) {
  const serialized = `event: chat_message\ndata: ${JSON.stringify(msg)}\n\n`;
  for (const [id, client] of clients.entries()) {
    const isStaff = Boolean(client.role && STAFF_SET.has(client.role));
    if (msg.channelType === 'STAFF_OPS') {
      if (isStaff) {
        try {
          client.res.write(serialized);
        } catch {
          clients.delete(id);
        }
      }
    } else if (isStaff || Boolean(client.orderId && client.orderId === msg.orderId)) {
      try {
        client.res.write(serialized);
      } catch {
        clients.delete(id);
      }
    }
  }
}
