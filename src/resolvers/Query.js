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

    return prisma.user.findOne({
      where: {
        id: userId
      }
    }, info);
  },
};

export { Query as default };