import getUserId from '../utils/getUserId';

const Query = {
  users(parent, args, { prisma }, info) {
    return prisma.user.findMany({
      where: {
        username: {
          contains: args.query
        }
      }
    });
  },

  me(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.user.findUnique({
      where: {
        id: userId
      }
    }, info);
  },

  async myCharacter(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);

    return prisma.character.findUnique({
      where: {
        id: userId
      }
    }, info);
  }
};

export { Query as default };