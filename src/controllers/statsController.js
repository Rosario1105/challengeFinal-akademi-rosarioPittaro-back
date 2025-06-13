const Course = require("../models/Course");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");

const getStatsOverview = async (req, res) => {
  try {
    const totalCursos = await Course.countDocuments();
    const totalProfesores = await User.countDocuments({ role: "profesor" });

    const alumnosUnicos = await Enrollment.distinct("studentId");
    const totalAlumnosInscriptos = alumnosUnicos.length;

    res.status(200).json({
      totalCursos,
      totalProfesores,
      totalAlumnosInscriptos,
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ message: "Error obteniendo estadísticas" });
  }
};

module.exports = { getStatsOverview };
