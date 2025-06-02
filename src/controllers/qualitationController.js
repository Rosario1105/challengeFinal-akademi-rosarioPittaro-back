const Qualitation = require('../models/Qualitation');
const Course = require('../models/Course');

const createQualitation = async (req, res) => {
    const { studentId, courseId, score, feedback } = req.body;

    const course = await Course.findById(courseId);
    if(!course || course.profesor.toString() !== req.user._id.toString()){
        return res.status(403).json({msg: 'No autorizado para calificar este curso'})
    }

    const exists = await Qualitation.findOne({studentId, courseId});
    if(exists) return res.status(400).json({msg: 'Ya este una calificacion para este alumno en este curso'});

    const qualitation = new Qualitation({ studentId, courseId, score, feedback});
    await qualitation.save();
    res.status(201).json({msg: 'Nota cagarda exitosamente', qualitation});
};

const updateQualitation = async (req,res) => {
    const qualitation = await Qualitation.findById(req.params.id);
    if(!qualitation) return res.status(404).json({msg: 'Nota no encontrada'});

    const course = await Course.findById(qualitation.courseId);
    if(course.profesor.toString() !== req.user._id.toString()){
        return res.status(403).json({msg: 'No autorizado para editar esta calificacion'});
    }

    const updated = await Qualitation.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json({msg:'Nota actualizada', updated});
};

const getQualitationsByStudent = async (req,res) => {
    const qualitations = await Qualitation.find({studentId: req.params.id}).populate('courseId', 'title');
    res.json(qualitations);
};

module.exports = {createQualitation, updateQualitation, getQualitationsByStudent};