'use client';

import { useEffect } from 'react';
import { initWebSocket, closeWebSocket } from '../services/websocket';

export default function WebSocketInitializer() {
  useEffect(() => {
    initWebSocket();
    return () => {
      closeWebSocket();
    };
  }, []);

  return null;
}
