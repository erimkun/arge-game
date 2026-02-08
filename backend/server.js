/**
 * Main Server Entry Point
 * Oda sistemi ile çalışır - her oda izole bir oyun
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const config = require('./src/config/server.config');
const RoomService = require('./src/services/RoomService');
const SocketHandlers = require('./src/handlers/SocketHandlers');

// Express uygulaması
const app = express();
const server = http.createServer(app);

// Socket.IO sunucusu
const io = new Server(server, {
  cors: config.cors
});

// Express middleware'ler
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Room info endpoint (debugging)
app.get('/rooms', (req, res) => {
  const rooms = [];
  for (const [code, room] of roomService.rooms) {
    rooms.push({
      code,
      profileCount: room.profiles.length,
      participantCount: room.participants.size,
      isVotingEnded: room.isVotingEnded,
      createdAt: room.createdAt
    });
  }
  res.json({ rooms, count: rooms.length });
});

// Servisleri oluştur (Dependency Injection)
const roomService = new RoomService();
const socketHandlers = new SocketHandlers(io, roomService);

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
  socketHandlers.handleConnection(socket);
});

// Sunucuyu başlat (Sadece doğrudan çalıştırıldığında)
if (require.main === module) {
  server.listen(config.port, config.host, () => {
    console.log(`\n🚀 Backend sunucusu başlatıldı!`);
    console.log(`📍 Yerel: http://localhost:${config.port}`);
    console.log(`🌐 Ağ: http://[LAN_IP_ADRESİNİZ]:${config.port}`);
    console.log(`🏠 Oda sistemi aktif!`);
    console.log(`\n✅ Sunucu hazır ve dinliyor...\n`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu kapatıldı.');
    process.exit(0);
  });
});

module.exports = { app, server, io };
