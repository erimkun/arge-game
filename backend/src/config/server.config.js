/**
 * Server Configuration
 * Single Responsibility: Sunucu yapılandırma ayarlarını yönetir
 */

const config = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
};

module.exports = config;

