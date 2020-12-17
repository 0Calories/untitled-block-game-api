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
  await prisma.user.deleteMany();
  // await prisma.post.deleteMany();
  // await prisma.comment.deleteMany();

  // Create users
  userOne.user = await prisma.user.create({
    data: userOne.input
  });
};

export { seedDatabase as default, userOne };