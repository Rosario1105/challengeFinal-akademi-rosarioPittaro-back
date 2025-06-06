const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment')

const getAllCourses = async (req, res) => {
    const courses = await Course.find().populate('profesor', 'name email');
    console.log("Cursos disponibles:", courses.map(c => c._id.toString()));
    res.json(courses);
};


const getCourseById = async (req, res) => {
  try {
    const curso = await Course.findById(req.params.id).select('title description category level price capacity');
    if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });

    const inscritosCount = await Enrollment.countDocuments({ courseId: curso._id });

    const cursoObj = curso.toObject();
    cursoObj.inscriptos = inscritosCount;

    res.json(cursoObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};


const createCourse = async (req, res) => {
    const {title, description, category, level, price, capacity } = req.body;

    const course = new Course ({
        title,
        description,
        category,
        level,
        price,
        capacity,
        profesor: req.user._id
    });

    await course.save();
    res.status(201).json({msg: 'Curso creado exitosamente', course});
};

const updateCourse = async (req, res) => {
    const course = await Course.findById(req.params.id);
    if(!course) return res.status(404).json({msg: 'Curso no encontrado'});

    if(course.profesor.toString() !==req.user._id.toString()) {
        return res.status(403).json({msg: 'Solo el profesor creador puede editar este curso'});
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(updated);
};

const deleteCourse = async (req, res) => {
    const course = await Course.findById(req.params.id);
    if(!course) return res.status(404).json({msg:'Curso no encontrado'});

    if(course.profesor.toString() !== req.user._id.toString()){
        return res.status(403).json({msg:'Solo el profesor creador puede eliminar este curso'});
    }
    
    await course.deleteOne();
    res.json({msg: 'Curso eliminado'});
};

const getCourseByProfesor = async (req,res) => {
    const cursos = await Course.find({profesor: req.user.id});
    res.json(cursos);
};

module.exports = {getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseByProfesor}