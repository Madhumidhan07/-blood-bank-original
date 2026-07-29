// UPDATE 12: Global error handling middleware
// (Unchanged by the Firebase migration)
module.exports = function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path} =>`, err.message);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
