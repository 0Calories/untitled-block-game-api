import { GraphQLServer, PubSub } from 'graphql-yoga';
import { PrismaClient } from '@prisma/client';
import fileUpload from 'express-fileupload';

import { resolvers, fragmentReplacements } from './resolvers/index';
import uploadFile from './utils/uploadFile';
import getUserId from './utils/getUserId';

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

server.use(fileUpload());

// Custom endpoint for handling world file uploads
server.post('/worlds/:worldId', (req, res) => {
  const worldId = req.params.worldId;

  // Check if the authenticated user has rights to this world
  const userId = getUserId(req, true, true);

  uploadFile(req.files.file, worldId, res);
});

export default server;
