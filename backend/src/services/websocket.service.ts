import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientSubscription {
  ws: WebSocket;
  assignmentId?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientSubscription> = new Set();

  init(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

      if (pathname === '/ws') {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected.');
      const client: ClientSubscription = { ws };
      this.clients.add(client);

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === 'subscribe' && parsed.assignmentId) {
            client.assignmentId = parsed.assignmentId;
            console.log(`Client subscribed to assignment: ${parsed.assignmentId}`);
            // Send acknowledgement
            ws.send(JSON.stringify({ type: 'subscribed', assignmentId: parsed.assignmentId }));
          }
        } catch (err) {
          // Ignore invalid JSON messages
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected.');
        this.clients.delete(client);
      });

      // Send initial ping to verify connection
      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established.' }));
    });
  }

  /**
   * Send progress update for an assignment
   */
  sendProgress(assignmentId: string, status: string, progress: number, data?: any) {
    const payload = JSON.stringify({
      type: 'progress',
      assignmentId,
      status,
      progress,
      data
    });

    this.clients.forEach((client) => {
      // Send to clients that subscribed to this specific assignment or generally
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!client.assignmentId || client.assignmentId === assignmentId) {
          client.ws.send(payload);
        }
      }
    });
  }
}

export const wsService = new WebSocketService();
