const { Errors } = require('../utils/errors');

// SRS §5 authorization checklist:
// Roles: SUPERVISOR, OPERATOR (strictly 2 roles)
// - SUPERVISOR has management capability across their unit (users, config, reports, adjustments, yields)
// - OPERATOR performs operational transactions within their assigned unit (intake, transfers, yield submissions)

// Restrict to a set of roles.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(Errors.unauthenticated());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
}

// Enforce unit-level isolation:
// Every user can only access resources matching their assigned unit.
function requireUnitAccess(resolveUnitId) {
  return async (req, res, next) => {
    try {
      if (!req.user) return next(Errors.unauthenticated());
      
      const targetUnitId = await resolveUnitId(req);
      if (!targetUnitId) return next(Errors.validation('unitId is required.'));

      if (req.user.unit && String(req.user.unit) !== String(targetUnitId)) {
        return next(Errors.unauthorizedUnit());
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole, requireUnitAccess };
