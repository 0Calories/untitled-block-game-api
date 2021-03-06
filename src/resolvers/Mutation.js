import bcrypt from 'bcryptjs';
import validator from 'email-validator';

import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';
import applyVisit from '../utils/applyVisit';
import { HOURS_BETWEEN_VISITS, BIO_MAX_CHAR_COUNT } from '../utils/constants';


const Mutation = {
  async createUser(parent, args, { prisma }, info) {
    // Validate the username and email inputs
    const isValidUsername = /^[a-z0-9]+$/i.test(args.data.username);
    if (!isValidUsername) {
      throw new Error('Username cannot contain symbols or spaces');
    }

    const isValidEmail = validator.validate(args.data.email);
    if (!isValidEmail) {
      throw new Error('Please enter a valid email address');
    }

    const password = await hashPassword(args.data.password);

    if (args.data.username.length < 4) {
      throw new Error('Username must be at least 4 characters long');
    }

    // Ensure the username or email doesn't already exist
    let user = await prisma.user.findUnique({
      where: {
        username: args.data.username
      }
    }, info);

    if (user) {
      throw new Error('Username is taken');
    }

    user = await prisma.user.findUnique({
      where: {
        email: args.data.email
      }
    }, info);

    if (user) {
      throw new Error('Email is already in use');
    }

    user = await prisma.user.create({
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
        },
        name: user.username
      }
    });

    // Create a home world for the user
    const homeWorld = await prisma.world.create({
      data: {
        name: `${args.data.username}'s Home World`,
        creator: {
          connect: { id: user.id }
        }
      }
    });

    // Update the home world for the character
    await prisma.character.update({
      where: {
        id: user.id
      },
      data: {
        homeWorldId: homeWorld.id
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
      throw new Error('Please provide an email address or username');
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
    const { colour, bio } = args.data;

    // If the bio field was provided, ensure its character count does not exceed the maximum
    if (bio && bio.length > BIO_MAX_CHAR_COUNT) {
      throw new Error(`Bio cannot exceed ${BIO_MAX_CHAR_COUNT} characters`);
    }

    if (colour) {
      // Ensure that the colour argument is a proper hex colour code
      const hexRegex = /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/;
      if (!hexRegex.test(colour)) {
        throw new Error('Invalid colour value provided');
      }
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
    const { worldId, name, description } = args.data;

    if (!name && !description) {
      throw new Error('Please provide a new name or description');
    }

    const worldToUpdate = await prisma.world.findUnique({
      where: {
        id: worldId
      },
      include: { creator: true }
    });

    if (worldToUpdate.creator.id !== userId) {
      throw new Error('Not authorized to update this world');
    }

    return await prisma.world.update({
      where: {
        id: worldId
      },
      data: {
        name,
        description,
        updatedAt: new Date()
      }
    }, info);
  },

  async deleteWorld(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    const worldToDelete = await prisma.world.findUnique({
      where: {
        id: args.worldId
      },
      include: { creator: true }
    });

    if (worldToDelete.creator.id !== userId) {
      throw new Error('Not authorized to delete this world');
    }

    // Delete all entries in the Visitor table containing this world
    await prisma.visitor.deleteMany({
      where: {
        worldId: args.worldId
      }
    });

    return await prisma.world.delete({
      where: {
        id: args.worldId
      }
    });
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

    const lastVisit = await prisma.visitor.findUnique({
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
        await prisma.visitor.update({
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
      await prisma.visitor.create({
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
  },

  async setHomeWorld(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
    const { worldId } = args;

    // Check if the world exists, and if authenticated user owns that world
    const world = await prisma.world.findUnique({
      where: {
        id: worldId
      },
      select: { creator: true }
    });

    if (!world) {
      throw new Error(`Could not find world with id ${worldId}`);
    }

    if (world.creator.id !== userId) {
      throw new Error('User does not own this world');
    }

    await prisma.character.update({
      where: {
        id: userId
      },
      data: {
        homeWorldId: worldId
      }
    });

    return await prisma.world.findUnique({
      where: {
        id: worldId
      }
    });
  }
};

export default Mutation;
