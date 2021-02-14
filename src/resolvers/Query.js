import getUserId from '../utils/getUserId';

const Query = {
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
      },
      include: {
        worlds: true
      }
    }, info);
  }
};

export { Query as default };
