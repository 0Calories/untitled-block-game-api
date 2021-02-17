
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne, worldOne } from './utils/seedDatabase';
import { createWorld } from './utils/operations';

const prisma = new PrismaClient();


beforeAll(() => {
  return server.start({ port: 4000 }).then((httpServer) => {
    global.httpServer = httpServer;
  });
});

afterAll(() => {
  return global.httpServer.close();
});

beforeEach(seedDatabase);

test('Should create a new world', async () => {
  const variables = {
    data: {
      name: "Sword Fight Tournament",
      description: "Compete to be the best swordsman!",
    }
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  const response = await graphQLClient.request(createWorld, variables);

  const world = await prisma.world.findUnique({
    where: {
      id: parseInt(response.createWorld.id)
    }
  });

  expect(world).toBeTruthy();
  expect(world.name).toBe(variables.data.name);
  expect(world.description).toBe(variables.data.description);
});
