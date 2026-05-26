const { redis } = require('../redis');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    const userId = await redis.get(`session:${token}`);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }

    req.userId = userId;
    req.token = token;

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = authMiddleware;
