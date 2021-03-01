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
  },

  async getCharacters(parent, args, { prisma, request }, info) {
    return await prisma.character.findMany({
      where: {
        name: {
          contains: args.query
        }
      }
    });
  }
};

export { Query as default };
