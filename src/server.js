import { GraphQLServer, PubSub } from 'graphql-yoga';
import { PrismaClient } from '@prisma/client';

import { resolvers, fragmentReplacements } from './resolvers/index';

const prisma = new PrismaClient();
const pubsub = new PubSub();

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context(request) {
    return {
      pubsub,
      prisma,
      request
    }
  },
  fragmentReplacements
});

export default server;
