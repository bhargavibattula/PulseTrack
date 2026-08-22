const { Errors } = require('../utils/errors');

// SRS §5's five-point checklist, points 2-4: role, user's assigned unit, requested
// resource's unit. Point 5 (specific capability) is expressed by which `roles` are
// passed in at the route level. This middleware NEVER trusts the client — it re-derives
// the caller's unit from the verified JWT (req.user), never from a request body/query
// the client could tamper with.

// Restrict to a set of roles.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(Errors.unauthenticated());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
}

// Given a resolver that extracts the target unit id from the request
// (params/body/query, or a loaded document), enforce that:
//   - MANAGER may access any unit
//   - SUPERVISOR/OPERATOR may only access their own assigned unit
function requireUnitAccess(resolveUnitId) {
  return async (req, res, next) => {
    try {
      if (!req.user) return next(Errors.unauthenticated());
      if (req.user.role === 'MANAGER') return next(); // org-wide, SRS §4.1

      const targetUnitId = await resolveUnitId(req);
      if (!targetUnitId) return next(Errors.validation('unit_id is required.'));

      if (String(req.user.unit) !== String(targetUnitId)) {
        return next(Errors.unauthorizedUnit());
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, requireUnitAccess };
