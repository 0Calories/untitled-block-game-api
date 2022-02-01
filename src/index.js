import '@babel/polyfill';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import server from './server';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log('The server is up!');
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "My First Test Transaction",
});

setTimeout(() => {
  try {
    foo();
  } catch (e) {
    Sentry.captureException(e);
  } finally {
    transaction.finish();
  }
}, 99);
