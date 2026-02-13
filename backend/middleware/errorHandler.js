exports.errorHandler = (err, req, res, next) => {
  const error = { ...err };
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error.statusCode = 400;
    error.message = message;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `${Object.keys(err.keyValue)[0]} already exists`;
    error.statusCode = 400;
    error.message = message;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};