const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.get("/test", (req, res) => {
  console.log("Test GET recibido");
  res.send("Rutas funcionando");
});

router.post("/login", login);
router.post("/create-superadmin", async (req, res) => {
  const secretKey = req.headers["x-superadmin-key"];
  console.log("Header x-superadmin-key:", secretKey);
  console.log("Env SUPERADMIN_SECRET:", process.env.SUPERADMIN_SECRET);

  if (secretKey !== process.env.SUPERADMIN_SECRET) {
    return res.status(403).json({ msg: "No autorizado" });
  }

  const { name, email, password, dni } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      dni,
      role: "superadmin",
    });

    await user.save();
    res.status(201).json({ msg: "Superadmin creado correctamente" });
  } catch (err) {
    console.error("Error en create-superadmin:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
