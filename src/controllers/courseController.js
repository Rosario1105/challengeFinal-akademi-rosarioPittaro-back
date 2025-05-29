const Course = require('../models/Course');


const getAllCourses = async (req, res) => {
    const courses = await Course.find().populate('profesor', 'name email');
    res.json(courses);
};

const getCourseById = async (req,res) => {
    const course = await Course.findById(req.params.id).populate('profesor', 'name email');
    if(!course) return res.status(404).json({msg: 'Curso no encontrado'});
    res.json(course);
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
    const cursos = await Course.find({profesor: req.user._id});
    res.json(cursos);
};


