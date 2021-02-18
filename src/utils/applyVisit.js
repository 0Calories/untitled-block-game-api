import { WORLD_VISIT_REWARD } from './constants';

const applyPlayerVisit = async (world, prisma) => {
  // Pay the world's creator
  await prisma.character.update({
    where: {
      id: world.creator.id
    },
    data: {
      bobux: {
        increment: WORLD_VISIT_REWARD
      }
    }
  });

  // Increment the world's visits 
  await prisma.world.update({
    where: {
      id: world.id
    },
    data: {
      visits: {
        increment: 1
      }
    }
  });
}

export default applyPlayerVisit;
