/**
 * Socket Service
 * Single Responsibility: Socket.IO bağlantı yönetimi
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Socket bağlantısını başlatır
   * @returns {Socket} Socket instance
   */
  connect() {
    if (!this.socket) {
      this.socket = io(this.backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
    }
    return this.socket;
  }

  /**
   * Socket bağlantısını kapatır
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Socket instance'ını döndürür
   * @returns {Socket|null} Socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Bağlantı durumunu kontrol eder
   * @returns {boolean} Bağlı mı?
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;

