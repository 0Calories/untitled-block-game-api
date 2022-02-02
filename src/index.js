import '@babel/polyfill';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import server from './server';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "untitled-block-game-api@1.0.0",
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

const options = { 
  port: process.env.PORT || 4000,
  cors: {
    credentials: true,
    origin: ['https://untitledblockgame.netlify.app/']
  }
};

server.start(options, () => {
  console.log('The server is up!');
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "Testing transaction",
});

setTimeout(() => {
  try {
    throw new Error('A new error');
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);
