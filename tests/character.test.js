
import { PrismaClient } from '@prisma/client';
import { request } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne, userTwo } from './utils/seedDatabase';
import { getCharacters } from './utils/operations';

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

test('Should fetch a list of all characters', async () => {
  const response = await request(URL, getCharacters);

  // Note: There are 2 characters being made manually in seedDatabase.js
  // You'll have to update this test if that number ever changes
  expect(response.getCharacters.length).toEqual(2);
  expect(response.getCharacters[0].name).toBe(userOne.character.name);
  expect(response.getCharacters[1].name).toBe(userTwo.character.name);
});

test('Should query characters appropriately', async () => {
  const variables = {
    query: 'Daniel'
  };

  const response = await request(URL, getCharacters, variables);

  expect(response.getCharacters.length).toEqual(1);
  expect(response.getCharacters[0].name).toBe(variables.query);
});
