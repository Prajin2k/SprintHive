/**
 * Wraps async route handlers to automatically pass errors to next()
 * Eliminates repetitive try-catch blocks in controllers.
 *
 * Usage:
 *   router.get('/example', asyncHandler(async (req, res) => {
 *     const data = await SomeModel.find();
 *     res.json({ success: true, data });
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
