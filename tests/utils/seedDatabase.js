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
  jwt: undefined
};

const seedDatabase = async () => {
  // Delete all test data
  await prisma.character.deleteMany();
  await prisma.user.deleteMany();
  // await prisma.post.deleteMany();
  // await prisma.comment.deleteMany();

  // Create users
  userOne.user = await prisma.user.create({
    data: userOne.input
  });
  userOne.jwt = jwt.sign({ userId: userOne.user.id }, process.env.JWT_SECRET);

  // Create a character for the user
  const character = await prisma.character.create({
    data: {
      user: {
        connect: { id: userOne.user.id }
      }
    }
  });
};

export { seedDatabase as default, userOne };
