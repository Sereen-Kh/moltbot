import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load .env file if it exists
if (existsSync('.env')) {
  dotenv.config();
}

export const config = {
  // Twilio WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  },
  
  // Bot (optional)
  bot: {
    token: process.env.BOT_TOKEN || '',
    username: process.env.BOT_USERNAME || '',
  },
  
  // API Keys
  apiKeys: {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
  
  // Video Processing
  video: {
    maxSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB || '100', 10),
    downloadDir: process.env.DOWNLOAD_DIR || './downloads',
    whisperModel: process.env.WHISPER_MODEL || 'base',
    enabled: process.env.ENABLE_VIDEO_TRANSCRIPTION === 'true',
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'production',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  
  // Security
  security: {
    allowedUsers: process.env.ALLOWED_USERS?.split(',').map(u => u.trim()) || [],
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10),
  },
};

// Validate required Twilio variables
const requiredVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
    'Please copy .env.example to .env and fill in your Twilio credentials.'
  );
}

// Validate Twilio credentials format
if (config.twilio.accountSid && !config.twilio.accountSid.startsWith('AC')) {
  console.warn('⚠️  TWILIO_ACCOUNT_SID should start with "AC"');
}

if (config.twilio.whatsappFrom && !config.twilio.whatsappFrom.startsWith('whatsapp:')) {
  console.warn('⚠️  TWILIO_WHATSAPP_FROM should start with "whatsapp:"');
}

console.log('✅ Configuration loaded successfully');