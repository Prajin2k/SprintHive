/**
 * Atomic sequence counters for project-scoped numbers (taskNumber, bugNumber).
 * Uses findOneAndUpdate + $inc to avoid the race in "find max then +1".
 */

const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * @param {string} name - e.g. `task:${projectId}` or `bug:${projectId}`
 * @returns {Promise<number>} next sequence value
 */
const getNextSequence = async (name) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = { Counter, getNextSequence };
