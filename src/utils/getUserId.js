import jwt from 'jsonwebtoken';

const getUserId = (request, requireAuth = true, isRestCall = false) => {
  let header;

  if (isRestCall) {
    header = request.headers.authorization;
  } else {
    header = request.request ? request.request.headers.authorization : request.connection.context.Authorization;
  }

  if (header) {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded.userId;
  }

  if (requireAuth) {
    throw new Error('Authentication required');
  }

  return null;
};

export default getUserId;
