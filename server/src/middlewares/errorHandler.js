function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message);
  console.error(err.stack);

  if (err.name === 'RequestError' || err.name === 'ConnectionError') {
    return res.status(503).json({ error: 'Database connection error. Please try again later.' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}

module.exports = { errorHandler };
