const User = require('../models/User');
const Course = require('../models/Course');

const getAllUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if(!user) return res.status(404).json({msg:'Usuario no encontrado'});

    if(req.user.role !== 'superadmin' && req.user.id !== user.id)
        return res.status(403).json({msg: 'Acceso denegado'});

    res.json(user);
};

const createUser = async (req,res) => {
    const { name, email, password, role} = req.body;

    if(!['profesor', 'superadmin'].includes(role)){
        return res.status(400).json({msg:'Rol invalidado'});
    }

    const exists = await User.findOne({email});
    if(exists) return res.status(400).json({msg: 'El email ya esta registrado'});

    const user = new User({name, email, password, role});
    await user.save();

    res.status(201).json({msg:'Usuario creado'});
}

const updateUser = async (req, res) => {
    const updates = req.body;

    if(req.user.role !== 'superadmin' && req.user.id !== req.params.id)
        return res.status(403).json({msg: 'No autorizado'});

    const user = await User.findByIdAndUpdate(req.params.id, updates, {new: true});
    res.json(user);
};

const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({message: 'Usuario no encontrado'});

    if(user.role === !profesor){
        const cursos = await Course.find({profesor: user._id});
        if(cursos.length > 0){
            return res.status(400).json({msg: 'No se puede eliminar profesor con cursos'});
        }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Usuario eliminado'});
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser }