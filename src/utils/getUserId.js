import jwt from 'jsonwebtoken';

const getUserId = (request, requireAuth = true) => {
  const header = request.request ? request.request.headers.authorization : request.connection.context.Authorization;

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

// Separate implementation for REST endpoints
const getUserIdRest = (request, res) => {
  const header = request.headers.authorization;

  if (header) {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  }

  // If there is no header, the user is not authorized
  throw new Error('Authentication required');
};

export { getUserId as default, getUserIdRest };
