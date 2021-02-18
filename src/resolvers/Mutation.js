import bcrypt from 'bcryptjs';

import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';
import applyVisit from '../utils/applyVisit';
import { HOURS_BETWEEN_VISITS } from '../utils/constants';


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

  async updateWorld(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const { world, name, description } = args.data;

    if (!name && !description) {
      throw new Error('Please provide a new name or description');
    }

    const worldToUpdate = await prisma.world.findUnique({
      where: {
        id: world
      },
      include: { creator: true }
    });

    if (worldToUpdate.creator.id !== userId) {
      throw new Error('Not authorized to update this world');
    }

    return await prisma.world.update({
      where: {
        id: world
      },
      data: {
        name,
        description
      }
    }, info);
  },

  // Warning: This mutation is quite a mess, but I'm unsure if it can be optimized
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

    if (!world) {
      throw new Error(`Could not find world with id ${worldId}`);
    }

    // Nothing else needs to be done if the visitor is the owner of the world
    if (world.creator.id === userId) {
      return world;
    }

    const lastVisit = await prisma.visitors.findUnique({
      where: {
        visitorId_worldId: {
          visitorId: userId,
          worldId
        }
      }
    });

    if (lastVisit) {
      // Ensure that the creator is not paid unless 3 hours have passed since the last visit
      const currentDate = new Date();
      const hoursSinceLastVisit = Math.abs(currentDate - lastVisit.visitDate) / 36e5;

      console.log(`Hours since last visit: ${hoursSinceLastVisit}`);
      if (hoursSinceLastVisit >= HOURS_BETWEEN_VISITS) {
        await applyVisit(world, prisma);

        // Update the visited date 
        await prisma.visitors.update({
          where: {
            visitorId_worldId: {
              visitorId: userId,
              worldId
            }
          },
          data: {
            visitDate: new Date()
          }
        })
      }

    } else {
      await prisma.visitors.create({
        data: {
          visitor: {
            connect: { id: userId }
          },
          world: {
            connect: { id: worldId }
          }
        }
      });

      await applyVisit(world, prisma);
    }

    return world;
  }
};

export default Mutation;
