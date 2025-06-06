const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
