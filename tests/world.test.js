
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne, userTwo, worldOne } from './utils/seedDatabase';
import { createWorld, visitWorld } from './utils/operations';
import { WORLD_VISIT_REWARD, HOURS_BETWEEN_VISITS } from '../src/utils/constants';

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

test('Should award currency to owner of visited place', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userTwo.jwt}`
    }
  });

  const creatorBeforeVisit = await prisma.character.findUnique({
    where: {
      id: worldOne.creator.id
    }
  });

  await graphQLClient.request(visitWorld, variables);

  const creatorAfterVisit = await prisma.character.findUnique({
    where: {
      id: worldOne.creator.id
    }
  });

  expect(creatorAfterVisit.bobux).toEqual(creatorBeforeVisit.bobux + WORLD_VISIT_REWARD);

  const worldAfterVisit = await prisma.world.findUnique({
    where: {
      id: variables.worldId
    }
  });

  expect(worldAfterVisit.visits).toEqual(1);
});

test('Should not reward world creator if player visits world twice consecutively', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userTwo.jwt}`
    }
  });

  const creatorBeforeVisit = await prisma.character.findUnique({
    where: {
      id: worldOne.creator.id
    }
  });

  // Visit the world twice
  await graphQLClient.request(visitWorld, variables);
  await graphQLClient.request(visitWorld, variables);

  const creatorAfterVisit = await prisma.character.findUnique({
    where: {
      id: worldOne.creator.id
    }
  });

  expect(creatorAfterVisit.bobux).toEqual(creatorBeforeVisit.bobux + WORLD_VISIT_REWARD);

  const worldAfterVisit = await prisma.world.findUnique({
    where: {
      id: variables.worldId
    }
  });

  expect(worldAfterVisit.visits).toEqual(1);
});

test('Should not reward world creator if they visit their own world', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  await graphQLClient.request(visitWorld, variables);

  const creator = await prisma.character.findUnique({
    where: {
      id: worldOne.creator.id
    }
  });

  expect(creator.bobux).toEqual(0);

  const worldAfterVisit = await prisma.world.findUnique({
    where: {
      id: variables.worldId
    }
  });

  expect(worldAfterVisit.visits).toEqual(0);
});
