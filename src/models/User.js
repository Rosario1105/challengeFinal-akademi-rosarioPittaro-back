const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio."],
      minlength: [3, "El nombre debe tener al menos 3 caracteres."],
      maxlength: [50, "El nombre no puede superar los 50 caracteres."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Formato de correo inválido.",
      ],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria."],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres."],
    },
    role: {
      type: String,
      enum: {
        values: ["superadmin", "profesor", "alumno"],
        message: "El rol debe ser superadmin, profesor o alumno.",
      },
      default: "alumno",
    },
    dni: {
      type: String,
      required: false,
      trim: true,
      match: [
        /^\d{7,10}$/,
        "DNI inválido. Debe contener entre 7 y 10 dígitos numéricos.",
      ],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
