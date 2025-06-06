const mongoose = require("mongoose");
const Qualitation = require("../models/Qualitation");
const Course = require("../models/Course");

// Utilitario para validar ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ======================
// POST /api/qualitations
// ======================
const createQualitation = async (req, res) => {
  const { studentId, courseId, score, feedback } = req.body;

  // 1) Validar que studentId y courseId sean ObjectId válidos
  if (!studentId || !isValidObjectId(studentId)) {
    return res
      .status(400)
      .json({
        msg: "El campo studentId es obligatorio y debe ser un ObjectId válido.",
      });
  }
  if (!courseId || !isValidObjectId(courseId)) {
    return res
      .status(400)
      .json({
        msg: "El campo courseId es obligatorio y debe ser un ObjectId válido.",
      });
  }

  // 2) Validar score
  if (score === undefined || score === null || isNaN(score)) {
    return res
      .status(400)
      .json({ msg: "El campo score es obligatorio y debe ser numérico." });
  }
  const numericScore = Number(score);
  if (numericScore < 0 || numericScore > 100) {
    return res
      .status(400)
      .json({ msg: "El campo score debe estar entre 0 y 100." });
  }

  // 3) (Opcional) Validar longitud de feedback
  if (feedback && typeof feedback === "string" && feedback.length > 500) {
    return res
      .status(400)
      .json({ msg: "El feedback no puede superar los 500 caracteres." });
  }

  try {
    // 4) Comprobar que el curso exista
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }

    // 5) Verificar que el usuario autenticado sea el profesor de ese curso
    if (course.profesor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ msg: "No autorizado para calificar este curso." });
    }

    const already = await Qualitation.findOne({ studentId, courseId });
    if (already) {
      return res
        .status(400)
        .json({
          msg: "Ya existe una calificación para este alumno en este curso.",
        });
    }

    const newQual = new Qualitation({
      studentId,
      courseId,
      score: numericScore,
      feedback: feedback ? feedback.trim() : undefined,
    });
    await newQual.save();
    return res
      .status(201)
      .json({ msg: "Calificación creada exitosamente.", qualitation: newQual });
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
      .json({ msg: "Error al crear la calificación.", error: err.message });
  }
};

const updateQualitation = async (req, res) => {
  const { id } = req.params;
  const { score, feedback } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de calificación inválido." });
  }

  const updates = {};
  if (score !== undefined) {
    if (isNaN(score)) {
      return res.status(400).json({ msg: "El campo score debe ser numérico." });
    }
    const numericScore = Number(score);
    if (numericScore < 0 || numericScore > 100) {
      return res
        .status(400)
        .json({ msg: "El campo score debe estar entre 0 y 100." });
    }
    updates.score = numericScore;
  }
  if (feedback !== undefined) {
    if (typeof feedback !== "string") {
      return res.status(400).json({ msg: "El campo feedback debe ser texto." });
    }
    if (feedback.length > 500) {
      return res
        .status(400)
        .json({ msg: "El feedback no puede superar los 500 caracteres." });
    }
    updates.feedback = feedback.trim();
  }

  try {
    const qual = await Qualitation.findById(id);
    if (!qual) {
      return res.status(404).json({ msg: "Calificación no encontrada." });
    }

    const course = await Course.findById(qual.courseId);
    if (!course) {
      return res
        .status(404)
        .json({ msg: "Curso asociado a la calificación no encontrado." });
    }
    if (course.profesor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ msg: "No autorizado para editar esta calificación." });
    }

    const updated = await Qualitation.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    return res.json({ msg: "Calificación actualizada.", updated });
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
      .json({
        msg: "Error al actualizar la calificación.",
        error: err.message,
      });
  }
};

const getQualitationsByStudent = async (req, res) => {
  const studentId = req.params.id;
  let { page = "1", limit = "10", level, search, sort = "score" } = req.query;

  if (!isValidObjectId(studentId)) {
    return res.status(400).json({ msg: "ID de estudiante inválido." });
  }

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

  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  if (sortField !== "score") {
    return res
      .status(400)
      .json({ msg: 'Parámetro "sort" inválido. Solo "score" o "-score".' });
  }
  const sortOption = sort.startsWith("-") ? { score: -1 } : { score: 1 };

  try {
    const courseFilter = {};
    if (level && level.toLowerCase() !== "todos") {
      courseFilter.level = level.toLowerCase();
    }
    if (search) {
      courseFilter.title = new RegExp(search, "i");
    }
    const cursos = await Course.find(courseFilter).select("_id");
    const cursosIds = cursos.map((c) => c._id);

    const qualFilter = {
      studentId,
      courseId: cursosIds.length > 0 ? { $in: cursosIds } : { $in: [] },
    };

    const total = await Qualitation.countDocuments(qualFilter);
    const qualitations = await Qualitation.find(qualFilter)
      .populate("courseId", "title level")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return res.json({
      data: qualitations,
      pagination: { total, totalPages, page, limit },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        msg: "Error al obtener calificaciones del alumno.",
        error: err.message,
      });
  }
};

const deleteQualitation = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de calificación inválido." });
  }

  try {
    const qual = await Qualitation.findById(id);
    if (!qual) {
      return res.status(404).json({ msg: "Calificación no encontrada." });
    }

    const course = await Course.findById(qual.courseId);
    if (!course) {
      return res
        .status(404)
        .json({ msg: "Curso asociado a la calificación no encontrado." });
    }
    if (course.profesor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ msg: "No autorizado para eliminar esta calificación." });
    }

    await Qualitation.findByIdAndDelete(id);
    return res.json({ msg: "Calificación eliminada correctamente." });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al eliminar la calificación.", error: err.message });
  }
};

module.exports = {
  createQualitation,
  updateQualitation,
  getQualitationsByStudent,
  deleteQualitation,
};
