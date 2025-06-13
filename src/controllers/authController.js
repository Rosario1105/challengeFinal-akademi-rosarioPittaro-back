const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmails = require("../utils/sendEmails");

const register = async (req, res) => {
  const { name, email, password, dni, role } = req.body;

  try {
    if (!name || !email || !password || !dni) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }
    if (password.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }
    const existingDni = await User.findOne({ dni });
    if (existingDni) {
      return res.status(400).json({ message: "Ya existe un usuario con ese DNI" });
    }

    const user = await User.create({
      name,
      email,
      password,         
      dni,
      role: role || "alumno",
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      dni: user.dni,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    console.log("Password ingresada:", password);
    console.log("Hash en DB:", user.password);

    const validPass = await bcrypt.compare(password, user.password);
    console.log("¿Contraseña válida?:", validPass);

    if (!validPass)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};


const recoverPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email es requerido" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const frontendURL = 'http://localhost:5173';
const resetLink = `${frontendURL}/reset-password/${resetToken}`;


    const html = `
      <h2>Recuperación de contraseña</h2>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este enlace es válido por 1 hora.</p>
    `;

    await sendEmails(user.email, "Recuperación de contraseña - AKADEMI", html);

    res.json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.error("Error en recoverPasswordRequest:", error);
    res.status(500).json({
      message: "Error al procesar la solicitud",
      error: error.message,
    });
  }
};


const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    user.password = password;

    console.log("Antes de guardar, password:", user.password);

    await user.save();

    console.log("Después de guardar, password:", user.password);

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Token inválido o expirado", error: error.message });
  }
};


module.exports = {
  register,
  login,
  recoverPasswordRequest,
  resetPassword,
};
