import bcrypt from 'bcryptjs';

import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';
import hashPassword from '../utils/hashPassword';

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
    const { email, username, password } = args;

    if (!email && !username) {
      throw new Error('Must provide an email address or username');
    }

    const user = await prisma.user.findOne({
      where: {
        email,
        username
      }
    });

    if (!user) {
      throw new Error('Invalid credentials: user not found');
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

  async createPost(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return await prisma.post.create({
      data: {
        ...args.data,
        author: {
          connect: { id: userId }
        }
      },
      include: { author: true }
    }, info);
  },
  
  async deletePost(parent, args, { prisma, request }, info) {
    const { id } = args;
    const userId = getUserId(request);

    // TODO: This is kind of sloppy but the only way to do this at the moment.
    // When Prisma 2 reintroduces the "exists" operation, use that here instead.
    const posts = await prisma.post.findMany({
      where: {
        id,
        AND: [{ authorId: userId }]
      }
    });

    if (!posts[0]) {
      throw new Error('Post not found or unauthorized operation');
    }

    return await prisma.post.delete({
      where: {
        id
      }
    }, info);
  }
};

export default Mutation;