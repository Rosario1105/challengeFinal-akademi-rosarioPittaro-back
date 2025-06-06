const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Qualitation = require("../models/Qualitation");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getStudentsByProfesor = async (req, res) => {
  try {
    let {
      page = "1",
      limit = "10",
      level = "todos",
      search = "",
      sort = "name",
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

    const allowedLevels = ["basico", "intermedio", "avanzado", "todos"];
    if (level && typeof level === "string") {
      if (!allowedLevels.includes(level.toLowerCase())) {
        return res
          .status(400)
          .json({
            msg: `Nivel inválido. Debe ser uno de: ${allowedLevels.join(
              ", "
            )}.`,
          });
      }
      level = level.toLowerCase();
    } else {
      level = "todos";
    }

    if (typeof search !== "string") {
      return res
        .status(400)
        .json({ msg: 'Parámetro "search" inválido. Debe ser texto.' });
    }
    search = search.trim();

    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    if (sortField !== "name") {
      return res
        .status(400)
        .json({ msg: 'Parámetro "sort" inválido. Solo "name" o "-name".' });
    }
    const sortOption = {};
    sortOption[sortField] = sort.startsWith("-") ? -1 : 1;

    const cursoFilter = { profesor: req.user._id };
    if (level !== "todos") {
      cursoFilter.level = level;
    }
    const cursos = await Course.find(cursoFilter).select("_id title level");
    const cursosIds = cursos.map((c) => c._id);
    if (cursosIds.length === 0) {
      return res.json({
        data: [],
        pagination: { total: 0, totalPages: 0, page, limit },
      });
    }

    const enrollmentFilter = { courseId: { $in: cursosIds } };
    let enrollmentsQuery = Enrollment.find(enrollmentFilter)
      .populate("studentId", "name email dni")
      .populate("courseId", "title level");

    if (search) {
      const regex = new RegExp(search, "i");
      enrollmentsQuery = enrollmentsQuery.where({
        $or: [{ "studentId.name": regex }, { "studentId.email": regex }],
      });
    }

    enrollmentsQuery = enrollmentsQuery
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    let enrollments = await enrollmentsQuery.exec();
    if (search) {
      const regex = new RegExp(search, "i");
      enrollments = enrollments.filter(
        (e) => regex.test(e.studentId.name) || regex.test(e.studentId.email)
      );
    }

    let total;
    if (search) {
      total = enrollments.length;
    } else {
      total = await Enrollment.countDocuments(enrollmentFilter);
    }
    const totalPages = Math.ceil(total / limit);

    const alumnos = await Promise.all(
      enrollments.map(async (e) => {
        const qual = await Qualitation.findOne({
          studentId: e.studentId._id,
          courseId: e.courseId._id,
        });
        return {
          enrollmentId: e._id,
          studentId: e.studentId._id,
          name: e.studentId.name,
          email: e.studentId.email,
          dni: e.studentId.dni,
          curso: e.courseId.title,
          courseId: e.courseId._id,
          courseLevel: e.courseId.level || "Sin nivel",
          score: qual ? qual.score : null,
          feedback: qual ? qual.feedback : null,
          qualId: qual ? qual._id : null,
        };
      })
    );

    return res.json({
      data: alumnos,
      pagination: { total, totalPages, page, limit },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Error al obtener alumnos del profesor",
      error: err.message,
    });
  }
};

const getEnrollmentsByStudent = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de estudiante inválido." });
  }

  try {
    const enrollments = await Enrollment.find({ studentId: id }).populate(
      "courseId",
      "title level"
    );
    return res.json(enrollments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Error al obtener inscripciones." });
  }
};
const getEnrollmentsByCourse = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de curso inválido." });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }
    if (course.profesor.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          msg: "Solo el profesor creador puede ver los inscriptos a este curso.",
        });
    }

    const enrollments = await Enrollment.find({ courseId: id }).populate(
      "studentId",
      "name email"
    );
    return res.json(enrollments);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ msg: "Error al obtener alumnos inscriptos." });
  }
};

const enrollInCourse = async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user._id;

  if (!courseId || !isValidObjectId(courseId)) {
    return res
      .status(400)
      .json({
        msg: "El campo courseId es obligatorio y debe ser un ObjectId válido.",
      });
  }

  try {
    const already = await Enrollment.findOne({ courseId, studentId });
    if (already) {
      return res.status(400).json({ msg: "Ya estás inscripto en este curso." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: "Curso no encontrado." });
    }
    const inscriptos = await Enrollment.countDocuments({ courseId });
    if (inscriptos >= course.capacity) {
      return res.status(400).json({ msg: "No hay cupos disponibles." });
    }

    const enrollment = new Enrollment({ courseId, studentId });
    await enrollment.save();
    return res.status(201).json({ msg: "Inscripción exitosa." });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const errors = {};
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ errors });
    }
    return res.status(500).json({ msg: "Error al inscribirse." });
  }
};

const cancelEnrollment = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ msg: "ID de inscripción inválido." });
  }

  try {
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ msg: "Inscripción no encontrada." });
    }

    if (enrollment.studentId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ msg: "No puedes cancelar esta inscripción." });
    }

    await enrollment.deleteOne();
    return res.json({ msg: "Inscripción cancelada." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Error al cancelar inscripción." });
  }
};

module.exports = {
  getStudentsByProfesor,
  getEnrollmentsByStudent,
  getEnrollmentsByCourse,
  enrollInCourse,
  cancelEnrollment,
};
