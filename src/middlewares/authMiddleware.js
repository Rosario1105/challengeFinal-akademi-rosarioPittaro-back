const jwt = require ('jsonwebtoken');
const User = require('../models/User');


const authMiddleware = async (req, res, next) => {
    const authHeader = req.headears.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer'))
        return res.status(401).json({msg:'Token faltante o invalido'});

    const token = authHeader.split('')[1];

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (err){
        return res.status(401).json({msg:'Token invalidado'});
    }
};

const isSuperAdmin = (req, res, next) =>{
    if(req.user.role !== 'superadmin'){
        return res.status(403).json({msg:'Acceso denegado(solo superadmin)'});
    }
    next();
};

module.exports = {authMiddleware, isSuperAdmin};