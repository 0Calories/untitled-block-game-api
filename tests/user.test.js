
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne } from './utils/seedDatabase';
import { createUser, login, updateCharacter } from './utils/operations';

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

test('Should create a new user', async () => {
  const variables = {
    data: {
      username: "Ash123",
      email: "ash@example.com",
      password: "MyPass123"
    }
  };

  const response = await request(URL, createUser, variables);
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(response.createUser.user.id)
    }
  });

  // Each user should also have a character generated for them
  const character = await prisma.character.findUnique({
    where: {
      id: parseInt(response.createUser.user.id)
    }
  });

  expect(user).toBeTruthy();
  expect(character).toBeTruthy();
  expect(user.username).toBe(variables.data.username);
});

test('Should not login with bad credentials', async () => {
  const variables = {
    email: userOne.input.email,
    password: 'asdfasdfasd'
  };

  await expect(request(URL, login, variables)).rejects.toThrow();
});

test('Should login with correct credentials using email', async () => {
  const variables = {
    email: userOne.input.email,
    password: 'Daniel123'
  };

  const response = await request(URL, login, variables);
  expect(response.login.token).toBeTruthy();
});

test('Should login with correct credentials using username', async () => {
  const variables = {
    username: userOne.input.username,
    password: 'Daniel123'
  };

  const response = await request(URL, login, variables);
  expect(response.login.token).toBeTruthy();
});

test('Should not create user with a short password', async () => {
  const variables = {
    data: {
      name: 'Eric Cao',
      email: 'eric@example.com',
      password: 'pass'
    }
  };

  await expect(request(URL, createUser, variables)).rejects.toThrow();
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

// test('Should fetch user profile', async () => {
//   // const client = getClient(userOne.jwt);

//   // const { data } = await client.query({ query: getProfile });

//   // expect(data.me.id).toBe(userOne.user.id);
//   // expect(data.me.name).toBe(userOne.user.name);
//   // expect(data.me.email).toBe(userOne.user.email);
// });

