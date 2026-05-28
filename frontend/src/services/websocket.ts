import { useAssignmentStore } from '../store/useAssignmentStore';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const initWebSocket = () => {
  if (typeof window === 'undefined') return;

  const WS_URL = 'ws://localhost:5000/ws';
  console.log(`Connecting to WebSocket at ${WS_URL}...`);

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket server.');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log('WebSocket message received:', parsed);

        if (parsed.type === 'progress') {
          const { assignmentId, status, progress, data } = parsed;
          // Trigger Zustand store update
          useAssignmentStore.getState().updateLocalProgress(assignmentId, status, progress, data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.warn('WebSocket connection closed. Attempting reconnect in 3s...');
      reconnectTimer = setTimeout(() => {
        initWebSocket();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws?.close();
    };
  } catch (err) {
    console.error('Failed to establish WebSocket:', err);
  }
};

export const subscribeToAssignment = (assignmentId: string) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
  } else {
    // If not open yet, wait and retry
    setTimeout(() => {
      subscribeToAssignment(assignmentId);
    }, 500);
  }
};

export const closeWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  if (ws) {
    ws.close();
    ws = null;
  }
};
