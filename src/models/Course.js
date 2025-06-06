const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio."],
      unique: true,
      match: [/^[a-zA-Z\s]+$/, "Título inválido. Solo letras y espacios."],
      minlength: [8, "El título debe tener al menos 8 caracteres."],
      maxlength: [100, "El título no puede superar los 100 caracteres."],
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria."],
      match: [
        /^[a-zA-Z0-9\s.,;:()\-_'"\?!¡¿]+$/,
        "Descripción inválida. Solo caracteres alfanuméricos y signos básicos.",
      ],
      minlength: [8, "La descripción debe tener al menos 8 caracteres."],
      maxlength: [200, "La descripción debe tener hasta 200 caracteres."],
    },
    category: {
      type: String,
      default: "General",
    },
    level: {
      type: String,
      enum: {
        values: ["basico", "intermedio", "avanzado"],
        message: "Nivel inválido. Debe ser Basico, Intermedio o Avanzado.",
      },
      default: "Basico",
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "El precio no puede ser negativo."],
    },
    capacity: {
      type: Number,
      default: 10,
      min: [1, "La capacidad mínima es 1."],
    },
    currentCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "La capacidad actual no puede ser negativa."],
      validate: {
        validator: function (value) {
          return value <= this.capacity;
        },
        message: "La capacidad actual no puede superar la capacidad máxima.",
      },
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El profesor es obligatorio."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
