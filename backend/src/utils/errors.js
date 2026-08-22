class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Error codes referenced throughout the app (mirrors SRS §43 + design doc Section J)
const Errors = {
  validation: (message) => new ApiError(400, 'VALIDATION_ERROR', message),
  unauthorizedUnit: (message = 'You are not authorized to access this unit.') =>
    new ApiError(403, 'UNAUTHORIZED_UNIT', message),
  unauthenticated: (message = 'Authentication required.') =>
    new ApiError(401, 'UNAUTHENTICATED', message),
  forbidden: (message = 'You do not have permission to perform this action.') =>
    new ApiError(403, 'FORBIDDEN', message),
  notFound: (message = 'Resource not found.') => new ApiError(404, 'NOT_FOUND', message),
  invalidStateTransition: (message) => new ApiError(400, 'INVALID_STATE_TRANSITION', message),
  insufficientInventory: (available, requested) =>
    new ApiError(
      409,
      'INSUFFICIENT_INVENTORY',
      `Unable to complete operation. Available quantity: ${available} kg. Requested quantity: ${requested} kg.`
    ),
  duplicateSubmission: (message = 'This action was already submitted.') =>
    new ApiError(409, 'DUPLICATE_SUBMISSION', message),
  conflict: (message) => new ApiError(409, 'CONFLICT', message),
};

module.exports = { ApiError, Errors };
