
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne, userTwo } from './utils/seedDatabase';
import { getCharacters, updateCharacter } from './utils/operations';
import { BIO_MAX_CHAR_COUNT } from '../src/utils/constants';

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

test('Should update a user\'s colour and bio', async () => {
  const variables = {
    data: {
      bio: "I know a lot about web dev...",
      colour: "#F1F2F3"
    }
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  const response = await graphQLClient.request(updateCharacter, variables);
  expect(response.updateCharacter.bio).toBe(variables.data.bio);
  expect(response.updateCharacter.colour).toBe(variables.data.colour);
});

test('Should reject invalid hex strings when updating character', async () => {
  const variables = {
    data: {
      bio: "I know a lot about web dev...",
      colour: "wow"
    }
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  await expect(graphQLClient.request(updateCharacter, variables)).rejects.toThrow('Invalid colour value provided');
});

test('Should not update bio if character count exceeds max amount', async () => {
  const variables = {
    data: {
      bio: 'Zooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooom'
    }
  };

  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${userOne.jwt}`
    }
  });

  await expect(graphQLClient.request(updateCharacter, variables)).rejects.toThrow(`Bio cannot exceed ${BIO_MAX_CHAR_COUNT} characters`)
});
