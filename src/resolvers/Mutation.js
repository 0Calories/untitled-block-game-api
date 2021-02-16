import bcrypt from 'bcryptjs';

import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';
import { WORLD_VISIT_REWARD } from '../utils/constants';
import { Query } from './Query'
import { PrismaClientInitializationError } from '@prisma/client';


const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    const password = await hashPassword(args.data.password);

    if (args.data.username.length < 4) {
      throw new Error('Username must be at least 4 characters long');
    }

    const user = await prisma.user.create({
      data: {
        ...args.data,
        password
      }
    });

    // Create a character for the user
    const character = await prisma.character.create({
      data: {
        user: {
          connect: { id: user.id }
        }
      }
    })

    return {
      user,
      character,
      token: generateToken(user.id)
    };
  },

  async deleteUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return await prisma.user.delete({
      where: {
        id: userId
      }
    }, info);
  },

  async updateUser(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    if (typeof args.data.password === 'string') {
      args.data.password = await hashPassword(args.data.password);
    }

    return await prisma.user.update({
      where: {
        id: userId
      },
      data: args.data
    }, info);
  },

  async login(parent, args, { prisma }, info) {
    const { email, username, password } = args.data;

    if (!email && !username) {
      throw new Error('Must provide an email address or username');
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
        username
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return {
      user,
      token: generateToken(user.id)
    };
  },

  async updateCharacter(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const { colour } = args.data;

    // Ensure that the colour argument is a proper hex colour code
    const hexRegex = /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/;
    if (!hexRegex.test(colour)) {
      throw new Error('Invalid colour value provided');
    }

    return await prisma.character.update({
      where: {
        id: userId
      },
      data: args.data
    }, info);
  },

  async createWorld(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return await prisma.world.create({
      data: {
        ...args.data,
        creator: {
          connect: { id: userId }
        }
      },
      include: { creator: true }
    }, info);
  },

  async visitWorld(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const { worldId } = args;

    // Search the database for the world 
    const world = await prisma.world.findUnique({
      where: {
        id: worldId
      },
      include: { creator: true }
    });

    // Verify that the user hasn't visited this place in the last 3 hours
    // TODO: Code for this check here

    // Award the world's creator with bobux
    const creator = await prisma.character.findUnique({
      where: {
        id: world.creator.id
      }
    });

    await prisma.character.update({
      where: {
        id: creator.id
      },
      data: {
        bobux: creator.bobux + WORLD_VISIT_REWARD
      }
    });

    return world;
  }
};

export default Mutation;
