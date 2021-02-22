import { GraphQLServer, PubSub } from 'graphql-yoga';
import { PrismaClient } from '@prisma/client';
import fileUpload from 'express-fileupload';
import request from 'request';

import { resolvers, fragmentReplacements } from './resolvers/index';
import uploadFile from './utils/uploadFile';
import { getUserIdRest } from './utils/getUserId';

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
server.post('/worlds/:worldId', async (req, res) => {
  try {
    const userId = getUserIdRest(req, res);
    const worldId = parseInt(req.params.worldId);

    // Check if the authenticated user has rights to this world
    const world = await prisma.world.findUnique({
      where: {
        id: worldId
      },
      select: { creator: true }
    });

    if (!world) {
      res.status(404);
      throw new Error(`World with id ${worldId} does not exist`);
    }

    if (userId !== world.creator.id) {
      res.status(401).send('Not authorized to upload to this world');
    }

    await uploadFile(req.files.file, worldId, res);
  } catch (err) {
    // Set the status code to 400 if it was not already set to an error code
    if (res.statusCode === 200) {
      res.status(400);
    }

    res.send(err.message);
  }
});

// Custom endpoint for downloading world files
server.get('/worlds/:worldId', async (req, res) => {
  const worldId = parseInt(req.params.worldId);

  // TODO: Need to implement security in S3 bucket
  request(`${process.env.S3_BUCKET_URL}/${worldId}/world.block`)
    .pipe(res.set('Content-Type', 'application/octet-stream').set('Content-Disposition', 'inline; filename="world.block"'));
});

export default server;
