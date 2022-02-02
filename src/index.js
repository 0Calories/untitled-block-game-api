import '@babel/polyfill';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import server from './server';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log('The server is up!');
});