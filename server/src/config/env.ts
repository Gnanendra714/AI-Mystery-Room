import 'dotenv/config';
export const env = {
  port: Number(process.env.PORT ?? 4000), nodeEnv: process.env.NODE_ENV ?? 'development',
  clientOrigin: process.env.CLIENT_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:5173', mongoUri: process.env.MONGODB_URI ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '', geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
  rateWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000), rateMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 20)
};
if (!Number.isFinite(env.port) || !Number.isFinite(env.rateWindowMs) || !Number.isFinite(env.rateMax)) throw new Error('Invalid numeric environment configuration');
