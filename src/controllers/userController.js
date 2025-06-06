const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Course = require("../models/Course");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAllUsers = async (req, res) => {
  try {
    let { page = "1", limit = "10", role, search, sort = "name" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) {
      return res
        .status(400)
        .json({ msg: 'Parámetro "page" inválido. Debe ser entero ≥ 1.' });
    }
    if (isNaN(limit) || limit < 1) {
      return res
        .status(400)
        .json({ msg: 'Parámetro "limit" inválido. Debe ser entero ≥ 1.' });
    }
    const skip = (page - 1) * limit;

    const allowedRoles = ["superadmin", "profesor", "alumno", "todos"];
    if (role && !allowedRoles.includes(role.toLowerCase())) {
      return res
        .status(400)
        .json({
          msg: `Rol inválido. Debe ser uno de: ${allowedRoles.join(", ")}`,
        });
    }

    // 3) Validar sort (solo por campos existentes: name o email, con opcional “-”)
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const allowedSort = ["name", "email"];
    if (!allowedSort.includes(sortField)) {
      return res
        .status(400)
        .json({
          msg: `Parámetro "sort" inválido. Debe ser uno de: ${allowedSort.join(
            ", "
          )}, o con "-" delante.`,
        });
    }

    const filters = {};
    if (role && role.toLowerCase() !== "todos") {
      filters.role = role.toLowerCase();
    }
    if (search) {
      filters.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const total = await User.countDocuments(filters);

    const users = await User.find(filters)
      .select("-password")
      .sort(sort.startsWith("-") ? { [sortField]: -1 } : { [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      data: users,
      pagination: {
        total,
        totalPages,
        page,
        limit,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al obtener usuarios.", error: err.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de usuario inválido." });
  }

  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    if (req.user.role !== "superadmin" && req.user.id !== user.id) {
      return res.status(403).json({ msg: "Acceso denegado." });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al obtener el usuario.", error: err.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, dni } = req.body;

  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ msg: "Campos obligatorios: name, email, password, role." });
  }

  if (typeof name !== "string" || name.trim().length < 3) {
    return res
      .status(400)
      .json({ msg: "Nombre inválido. Mínimo 3 caracteres." });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Formato de email inválido." });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ msg: "La contraseña debe tener al menos 6 caracteres." });
  }

  const allowedRoles = ["profesor", "superadmin"];
  if (!allowedRoles.includes(role.toLowerCase())) {
    return res
      .status(400)
      .json({
        msg: `Rol inválido. Solo se permite: ${allowedRoles.join(", ")}.`,
      });
  }

  if (dni) {
    if (typeof dni !== "string" || !/^\d{7,10}$/.test(dni)) {
      return res
        .status(400)
        .json({
          msg: "DNI inválido. Debe tener entre 7 y 10 dígitos numéricos.",
        });
    }
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "El email ya está registrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toLowerCase(),
      dni,
    });
    await user.save();

    return res.status(201).json({ msg: "Usuario creado exitosamente." });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const errors = {};
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }
    return res
      .status(500)
      .json({ msg: "Error al crear usuario.", error: err.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de usuario inválido." });
  }

  if (req.user.role !== "superadmin" && req.user.id !== id) {
    return res.status(403).json({ msg: "No autorizado." });
  }

  const allowedFields = ["name", "email", "password", "role", "dni"];
  const updateData = {};

  for (const key in updates) {
    if (!allowedFields.includes(key)) {
      return res
        .status(400)
        .json({ msg: `No se puede actualizar el campo "${key}".` });
    }
    const value = updates[key];

    switch (key) {
      case "name":
        if (typeof value !== "string" || value.trim().length < 3) {
          return res
            .status(400)
            .json({ msg: "Nombre inválido. Mínimo 3 caracteres." });
        }
        updateData.name = value.trim();
        break;

      case "email":
        if (!emailRegex.test(value)) {
          return res.status(400).json({ msg: "Formato de email inválido." });
        }
        updateData.email = value.toLowerCase();
        break;

      case "password":
        if (typeof value !== "string" || value.length < 6) {
          return res
            .status(400)
            .json({ msg: "La contraseña debe tener al menos 6 caracteres." });
        }
        updateData.password = await bcrypt.hash(value, 10);
        break;

      case "role":
        if (
          !["profesor", "superadmin", "alumno"].includes(value.toLowerCase())
        ) {
          return res.status(400).json({ msg: "Rol inválido." });
        }
        updateData.role = value.toLowerCase();
        break;

      case "dni":
        if (typeof value !== "string" || !/^\d{7,10}$/.test(value)) {
          return res
            .status(400)
            .json({ msg: "DNI inválido. Debe tener entre 7 y 10 dígitos." });
        }
        updateData.dni = value;
        break;
    }
  }

  try {
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }
    return res.json(user);
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const errors = {};
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }
    return res
      .status(500)
      .json({ msg: "Error al actualizar usuario.", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de usuario inválido." });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado." });
    }

    if (user.role === "profesor") {
      const cursos = await Course.find({ profesor: user._id });
      if (cursos.length > 0) {
        return res
          .status(400)
          .json({
            msg: "No se puede eliminar un profesor que tenga cursos activos.",
          });
      }
    }

    await User.findByIdAndDelete(id);
    return res.json({ msg: "Usuario eliminado correctamente." });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al eliminar usuario.", error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
