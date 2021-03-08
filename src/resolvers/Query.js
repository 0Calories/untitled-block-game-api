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

  async getCharacter(parent, { id }, { prisma, request }, info) {
    return prisma.character.findUnique({
      where: {
        id
      },
      include: {
        worlds: true
      }
    }, info);
  },

  async getCharacters(parent, args, { prisma, request }, info) {
    const query = args.query ? args.query.toLowerCase() : undefined;

    return await prisma.character.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      }
    });
  }
};

export { Query as default };
