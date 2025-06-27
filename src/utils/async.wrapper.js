/**
 * A higher-order function that wraps async route handlers to catch errors
 * and pass them to the global error-handling middleware.
 * @param {function} fn - The asynchronous controller function to wrap.
 * @returns {function} An Express route handler that handles promise rejections.
 */
const asyncWrapper = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  export { asyncWrapper };
  