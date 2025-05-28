const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'profesor', 'alumno'], default: 'alumno' },

  dni: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
