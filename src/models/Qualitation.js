const mongoose = require("mongoose");

const qualitationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El estudiante es obligatorio."],
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "ID de estudiante inválido.",
      },
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "El curso es obligatorio."],
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "ID de curso inválido.",
      },
    },
    score: {
      type: Number,
      required: [true, "La calificación es obligatoria."],
      min: [0, "La calificación mínima es 0."],
      max: [100, "La calificación máxima es 100."],
    },
    feedback: {
      type: String,
      maxlength: [500, "El feedback no puede superar los 500 caracteres."],
    },
  },
  { timestamps: true }
);

qualitationSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Qualitation", qualitationSchema);
