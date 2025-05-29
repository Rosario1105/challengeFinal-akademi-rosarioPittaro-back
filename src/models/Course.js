const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true, unique: true },
  teacher: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);