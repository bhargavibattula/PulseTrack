const jwt = require('jsonwebtoken');
const { Errors } = require('../utils/errors');

// Verifies the access token and attaches { id, role, unit } to req.user.
// This is the first of the SRS §5 five-point authorization checklist: authenticated user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(Errors.unauthenticated());

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'dummy_access_secret_change_me');
    req.user = { id: payload.sub, _id: payload.sub, role: payload.role, unit: payload.unit || null };
    next();
  } catch (err) {
    next(Errors.unauthenticated('Invalid or expired token.'));
  }
}

module.exports = { requireAuth };
