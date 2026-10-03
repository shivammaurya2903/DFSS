function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.code === 'INSUFFICIENT_ELIGIBLE_NODES' ? 503 : 500);
  const message = err.message || "Internal Server Error";

  const response = {
    error: err.code || "SERVER_ERROR",
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