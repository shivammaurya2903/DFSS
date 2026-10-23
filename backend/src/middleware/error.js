function errorHandler(err, req, res, next) {
  const isMulterLimit = err.code === 'LIMIT_FILE_SIZE';
  const statusCode = err.statusCode
    || (isMulterLimit ? 413 : null)
    || (err.code === 'INSUFFICIENT_ELIGIBLE_NODES' ? 503 : 500);
  const code = isMulterLimit ? 'FILE_TOO_LARGE' : (err.code || 'SERVER_ERROR');
  const message = isMulterLimit
    ? `File exceeds the ${Math.floor(require('../config').maxOriginalFileSize / (1024 * 1024))} MB upload limit.`
    : (err.message || "Internal Server Error");

  const response = {
    error: code,
    success: false,
    message,
    ...(err.requiredNodes && { requiredNodes: err.requiredNodes }),
    ...(err.eligibleNodes !== undefined && { eligibleNodes: err.eligibleNodes }),
    ...(err.filteredNodes && { filteredNodes: err.filteredNodes }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;