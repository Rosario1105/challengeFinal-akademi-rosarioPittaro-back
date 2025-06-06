const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const allowedLevels = ["basico", "intermedio", "avanzado", "todos"];

const getAllCourses = async (req, res) => {
  try {
    let {
      page = "1",
      limit = "10",
      sort = "title",
      level = "todos",
      search = "",
    } = req.query;

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

    if (
      typeof level !== "string" ||
      !allowedLevels.includes(level.toLowerCase())
    ) {
      return res
        .status(400)
        .json({
          msg: `Parámetro "level" inválido. Debe ser uno de: ${allowedLevels.join(
            ", "
          )}.`,
        });
    }
    level = level.toLowerCase();

    if (typeof search !== "string") {
      return res
        .status(400)
        .json({ msg: 'Parámetro "search" inválido. Debe ser texto.' });
    }
    search = search.trim();

    const allowedSortFields = ["title", "price", "level", "createdAt"];
    let sortField = sort;
    let sortDirection = 1;
    if (sort.startsWith("-")) {
      sortField = sort.slice(1);
      sortDirection = -1;
    }
    if (!allowedSortFields.includes(sortField)) {
      return res
        .status(400)
        .json({
          msg: `Parámetro "sort" inválido. Debe ser uno de: ${allowedSortFields.join(
            ", "
          )} o con "-" delante.`,
        });
    }

    const filters = {};
    if (level !== "todos") {
      filters.level = level;
    }
    if (search) {
      filters.title = new RegExp(search, "i");
    }

    const total = await Course.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    const courses = await Course.find(filters)
      .populate("profesor", "name email")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limit);

    return res.json({
      data: courses,
      pagination: { total, totalPages, page, limit },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al obtener cursos.", error: err.message });
  }
};

const getCourseById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de curso inválido." });
  }

  try {
    const curso = await Course.findById(id).select(
      "title description category level price capacity"
    );
    if (!curso) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }

    const inscritosCount = await Enrollment.countDocuments({
      courseId: curso._id,
    });

    const cursoObj = curso.toObject();
    cursoObj.inscriptos = inscritosCount;

    return res.json(cursoObj);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error interno del servidor.", error: err.message });
  }
};

const createCourse = async (req, res) => {
  const { title, description, category, level, price, capacity } = req.body;
  const profesorId = req.user._id;

  if (
    !title ||
    !description ||
    !category ||
    !level ||
    price === undefined ||
    capacity === undefined
  ) {
    return res
      .status(400)
      .json({
        msg: "Campos obligatorios: title, description, category, level, price, capacity.",
      });
  }

  if (
    typeof title !== "string" ||
    title.trim().length < 8 ||
    title.trim().length > 100
  ) {
    return res
      .status(400)
      .json({ msg: "Título inválido. Debe tener entre 8 y 100 caracteres." });
  }

  if (
    typeof description !== "string" ||
    description.trim().length < 8 ||
    description.trim().length > 200
  ) {
    return res
      .status(400)
      .json({
        msg: "Descripción inválida. Debe tener entre 8 y 200 caracteres.",
      });
  }

  if (typeof category !== "string" || category.trim().length === 0) {
    return res.status(400).json({ msg: "Categoría inválida." });
  }

  if (
    !allowedLevels.includes(level.toLowerCase()) ||
    level.toLowerCase() === "todos"
  ) {
    return res
      .status(400)
      .json({
        msg: `Nivel inválido. Debe ser uno de: basico, intermedio, avanzado.`,
      });
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    return res
      .status(400)
      .json({ msg: "Precio inválido. Debe ser un número ≥ 0." });
  }

  const numericCapacity = Number(capacity);
  if (isNaN(numericCapacity) || numericCapacity < 1) {
    return res
      .status(400)
      .json({ msg: "Capacidad inválida. Debe ser un entero ≥ 1." });
  }

  try {
    if (req.body.level) {
      req.body.level =
        req.body.level.charAt(0).toUpperCase() +
        req.body.level.slice(1).toLowerCase();
    }
    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      level: level.toLowerCase(),
      price: numericPrice,
      capacity: numericCapacity,
      profesor: profesorId,
    });
    await course.save();

    return res.status(201).json({ msg: "Curso creado exitosamente.", course });
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
      .json({ msg: "Error al crear curso.", error: err.message });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de curso inválido." });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }
    if (course.profesor.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Solo el profesor creador puede editar este curso." });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "level",
      "price",
      "capacity",
    ];
    const payload = {};

    for (const key in updates) {
      if (!allowedFields.includes(key)) {
        return res
          .status(400)
          .json({ msg: `No se puede actualizar el campo "${key}".` });
      }
      const value = updates[key];

      switch (key) {
        case "title":
          if (
            typeof value !== "string" ||
            value.trim().length < 8 ||
            value.trim().length > 100
          ) {
            return res
              .status(400)
              .json({
                msg: "Título inválido. Debe tener entre 8 y 100 caracteres.",
              });
          }
          payload.title = value.trim();
          break;

        case "description":
          if (
            typeof value !== "string" ||
            value.trim().length < 8 ||
            value.trim().length > 200
          ) {
            return res
              .status(400)
              .json({
                msg: "Descripción inválida. Debe tener entre 8 y 200 caracteres.",
              });
          }
          payload.description = value.trim();
          break;

        case "category":
          if (typeof value !== "string" || value.trim().length === 0) {
            return res.status(400).json({ msg: "Categoría inválida." });
          }
          payload.category = value.trim();
          break;

        case "level":
          if (
            !allowedLevels.includes(value.toLowerCase()) ||
            value.toLowerCase() === "todos"
          ) {
            return res
              .status(400)
              .json({
                msg: "Nivel inválido. Debe ser basico, intermedio o avanzado.",
              });
          }
          payload.level = value.toLowerCase();
          break;

        case "price":
          const numPrice = Number(value);
          if (isNaN(numPrice) || numPrice < 0) {
            return res
              .status(400)
              .json({ msg: "Precio inválido. Debe ser un número ≥ 0." });
          }
          payload.price = numPrice;
          break;

        case "capacity":
          const numCap = Number(value);
          if (isNaN(numCap) || numCap < 1) {
            return res
              .status(400)
              .json({ msg: "Capacidad inválida. Debe ser un entero ≥ 1." });
          }
          payload.capacity = numCap;
          break;
      }
    }

    // 4) Actualizar y devolver nuevo curso
    const updated = await Course.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    return res.json({ msg: "Curso actualizado.", updated });
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
      .json({ msg: "Error al actualizar curso.", error: err.message });
  }
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de curso inválido." });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }
    if (course.profesor.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Solo el profesor creador puede eliminar este curso." });
    }

    await course.deleteOne();
    return res.json({ msg: "Curso eliminado correctamente." });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al eliminar curso.", error: err.message });
  }
};

const getCourseByProfesor = async (req, res) => {
  const profesorId = req.user._id;

  try {
    const cursos = await Course.find({ profesor: profesorId });
    return res.json(cursos);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        msg: "Error al obtener cursos del profesor.",
        error: err.message,
      });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseByProfesor,
};
