/**
 * Main Server Entry Point
 * Dependency Inversion: Servisleri dependency injection ile kullanır
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const config = require('./src/config/server.config');
const ProfileService = require('./src/services/ProfileService');
const VotingService = require('./src/services/VotingService');
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

// Servisleri oluştur (Dependency Injection)
const profileService = new ProfileService();
const votingService = new VotingService();
const socketHandlers = new SocketHandlers(io, profileService, votingService);

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
  socketHandlers.handleConnection(socket);
});

// Sunucuyu başlat
server.listen(config.port, config.host, () => {
  console.log(`\n🚀 Backend sunucusu başlatıldı!`);
  console.log(`📍 Yerel: http://localhost:${config.port}`);
  console.log(`🌐 Ağ: http://[LAN_IP_ADRESİNİZ]:${config.port}`);
  console.log(`\n✅ Sunucu hazır ve dinliyor...\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı, sunucu kapatılıyor...');
  server.close(() => {
    console.log('Sunucu kapatıldı.');
    process.exit(0);
  });
});

module.exports = { app, server, io };
