
import { PrismaClient } from '@prisma/client';
import { request, GraphQLClient } from 'graphql-request';
import "regenerator-runtime/runtime";
// import "core-js/stable";

import server from '../src/server';
import { URL } from './utils/constants';
import seedDatabase, { userOne } from './utils/seedDatabase';
import { createUser, login, updateCharacter, myCharacter } from './utils/operations';

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
    data: {
      email: userOne.input.email,
      password: 'asdfasdfasd'
    }
  };

  await expect(request(URL, login, variables)).rejects.toThrow('Invalid credentials');
});

test('Should login with correct credentials using email', async () => {
  const variables = {
    data: {
      email: userOne.input.email,
      password: 'Daniel123'
    }
  };

  const response = await request(URL, login, variables);
  expect(response.login.token).toBeTruthy();
});

test('Should login with correct credentials using username', async () => {
  const variables = {
    data: {
      username: userOne.input.username,
      password: 'Daniel123'
    }
  };

  const response = await request(URL, login, variables);
  expect(response.login.token).toBeTruthy();
});

test('Should not create user with a short username', async () => {
  const variables = {
    data: {
      username: 'AH',
      email: 'eric@example.com',
      password: 'aVerysecurepassword123'
    }
  };

  await expect(request(URL, createUser, variables)).rejects.toThrow('Username must be at least 4 characters long');
});

test('Should not create user with a short password', async () => {
  const variables = {
    data: {
      username: 'EricCao',
      email: 'eric@example.com',
      password: 'pass'
    }
  };

  await expect(request(URL, createUser, variables)).rejects.toThrow('Password must be 8 characters or longer');
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

test('Should create a new home world for a user upon registration', async () => {
  const variables = {
    data: {
      username: 'EricCao',
      email: 'eric@example.com',
      password: 'password1234'
    }
  };

  // Create the user
  const payload = await request(URL, createUser, variables);

  // Login as the user
  const graphQLClient = new GraphQLClient(URL, {
    headers: {
      Authorization: `Bearer ${payload.createUser.token}`
    }
  });

  // Ensure that the user's character has a new world
  const character = await graphQLClient.request(myCharacter);

  expect(character.myCharacter.worlds[0]).toBeTruthy();
  expect(character.myCharacter.homeWorldId).toEqual(character.myCharacter.worlds[0].id);
});

