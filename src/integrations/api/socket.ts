// Native WebSocket client with a Socket.IO-compatible interface
// so existing code (socket.emit / socket.on / socket.off) works unchanged.

const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api")
  .replace(/^http/, "ws")
  .replace(/\/api$/, "/ws/chat/");

type Handler = (...args: unknown[]) => void;

class ToneSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Handler>> = new Map();
  private queue: object[] = [];

  connect() {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.queue.forEach((msg) => this.ws!.send(JSON.stringify(msg)));
      this.queue = [];
    };

    this.ws.onmessage = (e) => {
      try {
        const { type, ...rest } = JSON.parse(e.data);
        const handlers = this.listeners.get(type);
        if (handlers) {
          // For events like online_users the payload is { users: [...] }
          const payload = rest.users ?? rest;
          handlers.forEach((h) => h(payload));
        }
      } catch {}
    };

    this.ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(() => this.connect(), 3000);
    };
  }

  emit(type: string, data: object = {}) {
    const msg = { type, ...data };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler?: Handler) {
    if (!handler) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(handler);
    }
  }
}

export const socket = new ToneSocket();
