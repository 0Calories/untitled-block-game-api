
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne, userTwo, worldOne } from './utils/seedDatabase';
import { createWorld, visitWorld, updateWorld, deleteWorld, setHomeWorld, myCharacter } from './utils/operations';
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

test('Should update a world when authorized', async () => {
  const variables = {
    data: {
      worldId: worldOne.world.id,
      name: 'My Renamed World',
      description: 'Thanks for the bobux, kind stranger!'
    }
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  const response = await graphQLClient.request(updateWorld, variables);

  expect(response.updateWorld.name).toBe(variables.data.name);
  expect(response.updateWorld.description).toBe(variables.data.description);
});

test('Should delete a world when authorized', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  // Check that the world exists prior to deletion
  const worldBeforeDeletion = await prisma.world.findUnique({
    where: {
      id: variables.worldId
    }
  });
  expect(worldBeforeDeletion).toBeTruthy();

  await graphQLClient.request(deleteWorld, variables);

  // World should no longer exist
  const worldAfterDeletion = await prisma.world.findUnique({
    where: {
      id: variables.worldId
    }
  });

  expect(worldAfterDeletion).toBeFalsy();
});

test('Should delete all related Visitor entries after deleting a world', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  let graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userTwo.jwt}`
    }
  });

  // Visit the world
  await graphQLClient.request(visitWorld, variables);

  // Ensure the Visitor table has a new entry
  const visitorBeforeDeletion = await prisma.visitor.findFirst({
    where: {
      worldId: worldOne.world.id
    }
  });

  expect(visitorBeforeDeletion).toBeTruthy();

  // Login as the creator of the world, and delete it
  graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  await graphQLClient.request(deleteWorld, variables);

  // Confirm that the entry in the Visitor table no longer exists
  const visitorAfterDeletion = await prisma.visitor.findFirst({
    where: {
      worldId: worldOne.world.id
    }
  });

  expect(visitorAfterDeletion).toBeFalsy();
});


test('Should properly set a home world', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  await graphQLClient.request(setHomeWorld, variables)

  const character = await graphQLClient.request(myCharacter);

  expect(character.myCharacter.homeWorldId).toEqual(variables.worldId);
});

test('Should not allow a user to set someone else\'s world as their home world', async () => {
  const variables = {
    worldId: worldOne.world.id
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userTwo.jwt}`
    }
  });

  await expect(graphQLClient.request(setHomeWorld, variables)).rejects.toThrow('User does not own this world');
});
