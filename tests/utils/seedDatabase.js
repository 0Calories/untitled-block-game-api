import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const userOne = {
  input: {
    username: 'Daniel',
    email: 'daniel@example.com',
    password: bcrypt.hashSync('Daniel123')
  },
  user: undefined,
  character: undefined,
  jwt: undefined
};

const userTwo = {
  input: {
    username: 'hedyskiibo',
    email: 'hskiibo@example.com',
    password: bcrypt.hashSync('averygoodpassword123')
  },
  user: undefined,
  character: undefined,
  jwt: undefined
};

const worldOne = {
  input: {
    name: 'Hide n Seek',
    description: 'Hide from the seekers and hope you don\'t get caught'
  },
  creator: userOne.user,
  world: undefined
}

const seedDatabase = async () => {
  // Delete all test data
  await prisma.visitor.deleteMany();
  await prisma.world.deleteMany();
  await prisma.character.deleteMany();
  await prisma.user.deleteMany();

  // ======= Create users =======
  userOne.user = await prisma.user.create({
    data: userOne.input
  });
  userOne.jwt = jwt.sign({ userId: userOne.user.id }, process.env.JWT_SECRET);

  userOne.character = await prisma.character.create({
    data: {
      user: {
        connect: { id: userOne.user.id }
      },
      name: userOne.user.username
    }
  });

  userTwo.user = await prisma.user.create({
    data: userTwo.input
  });
  userTwo.jwt = jwt.sign({ userId: userTwo.user.id }, process.env.JWT_SECRET);

  userTwo.character = await prisma.character.create({
    data: {
      user: {
        connect: { id: userTwo.user.id }
      },
      name: userTwo.user.username
    }
  });

  // ======= Create worlds =======
  worldOne.world = await prisma.world.create({
    data: {
      ...worldOne.input,
      creator: {
        connect: { id: userOne.user.id }
      }
    }
  });
  worldOne.creator = userOne.character;
};

export { seedDatabase as default, userOne, userTwo, worldOne };
