import pino from 'pino';

const getLogLevel = () => {
  const level = process.env.LOG_LEVEL;
  if (!level || level === 'LOG_LEVEL') return 'info';
  return level;
};

export const logger = pino({
  level: getLogLevel(),
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  } : undefined,
});
