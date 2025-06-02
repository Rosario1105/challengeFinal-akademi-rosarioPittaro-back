const mongoose = require('mongoose');

const qualitationSchema = new mongoose.Schema({
    studentId: {type: mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    courseId: {type: mongoose.Schema.Types.ObjectId, ref:'Curse', required: true},
    score: {type: Numer, required: true, min:0, max:100},
    feedback: {type: String}
}, {timestamps: true});

qualitationSchema.index({ studentId: 1, courseId:1}, {unique: true});

module.exports = mongoose.model('Qualitation', qualitationSchema);