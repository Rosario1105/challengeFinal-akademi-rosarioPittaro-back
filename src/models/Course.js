const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true , unique: true},
  description: { type: String, required: true },
  category: { type: String },
  level: { type: String, enum: ['Basico', 'Intermedio', 'Avanzado'], default: 'Basico'},
  price: {type: Number, default: 0},
capacity: { type: Number, default: 10 },
currentCapacity: {type:Number, required:true},
profesor: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);