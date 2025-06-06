const Enrollment = require ('../models/Enrollment');
const Course = require ('../models/Course');
const Qualitation = require('../models/Qualitation');

const getStudentsByProfesor = async (req, res) => {
  try {
    const cursos = await Course.find({ profesor: req.user._id }).select('_id title');

    const cursosIds = cursos.map(curso => curso._id);

    const enrollments = await Enrollment.find({ courseId: { $in: cursosIds } })
      .populate('studentId', 'name email dni')
      .populate('courseId', 'title');

    const alumnos = await Promise.all(enrollments.map(async e => {
      const qual = await Qualitation.findOne({ studentId: e.studentId._id, courseId: e.courseId._id });
      return {
        enrollmentId: e._id,
        studentId: e.studentId._id,
        name: e.studentId.name,
        email: e.studentId.email,
        dni: e.studentId.dni,
        curso: e.courseId.title,
        grade: qual ? qual.score : null,
        feedback: qual ? qual.feedback : null,
        qualId: qual ? qual._id : null,
      };
    }));

    res.json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error al obtener alumnos del profesor' });
  }
};

const getEnrollmentsByStudent = async (req,res) => {
    const {id} = req.params;
    try{
        const enrollments = await Enrollment.find({studentId: id}).populate('courseId');
        res.json(enrollments);
    } catch (err){
        res.status(500).json({msg: 'Error al obtener inscripciones'});
    }
};

const getEnrollmentsByCourse = async (req,res) => {
    const {id} = req.params;
    try{
        const course = await Course.findById(id);
        if(!course || course.profesor.toString() !== req.user._id.toString()) {
            return res.status(403).json({msg: 'Solo el profesor creador puede ver los inscriptos a este curso'});
        }

        const enrollments = await Enrollment.find({courseId: id}).populate('studentId', 'name email');
        res.json(enrollments);
    }catch (err){
        res.status(500).json({msg: 'Error al obtener alumnos inscriptos'});
    }
    
};


 const enrollInCourse = async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user._id;
  
  try {
    
    const already = await Enrollment.findOne({ courseId, studentId });
    if (already) return res.status(400).json({ message: 'Ya estás inscripto en este curso' });

    
    const inscriptos = await Enrollment.countDocuments({ courseId });
    const course = await Course.findById(courseId);
    if (inscriptos >= course.capacity) {
      return res.status(400).json({ message: 'No hay cupos disponibles' });
    }

    const enrollment = new Enrollment({ courseId, studentId });
    await enrollment.save();
    res.status(201).json({ message: 'Inscripción exitosa' });
  } catch (err) {
    res.status(500).json({ message: 'Error al inscribirse' });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Inscripción no encontrada' });

    if (enrollment.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No puedes cancelar esta inscripción' });
    }

    await enrollment.deleteOne();
    res.json({ message: 'Inscripción cancelada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cancelar inscripción' });
  }
};

module.exports = {
getEnrollmentsByCourse, getEnrollmentsByStudent, enrollInCourse, cancelEnrollment, getStudentsByProfesor
};