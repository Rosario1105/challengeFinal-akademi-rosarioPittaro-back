const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token faltante o inválido" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;
    req.user = await User.findById(userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ msg: "Usuario no encontrado" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido" });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ msg: "Acceso denegado (solo superadmin)" });
  }
  next();
};

const isProfesor = (req, res, next) => {
  if (req.user.role !== "profesor") {
    return res.status(403).json({ msg: "Acceso denegado (solo profesor)" });
  }
  next();
};

const isAlumno = (req, res, next) => {
  if (req.user.role !== "alumno") {
    return res.status(403).json({ msg: "Acceso denegado (solo alumno)" });
  }
  next();
};

module.exports = {
  authMiddleware,
  isSuperAdmin,
  isProfesor,
  isAlumno,
};
