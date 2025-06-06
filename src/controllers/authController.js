const express = require("express");
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
//const sendEmails = require("../utils/sendEmails");

const register = async (req, res) => {
  const { name, email, password, dni } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'El usuario ya existe' });

    const user = new User({
      name,
      email,
      password, // Ya no se hashea acá
      role: 'alumno',
      dni
    });

    await user.save();
    res.status(201).json({ msg: "Alumno registrado correctamente" });
  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
};

const login = async (req, res) => {
    const {email , password} = req.body;

    try{
        const user = await User.findOne({email});
        if(!user) return res.status(404).json({msg:'Usuario no encontrado'});

        const valid = await bcrypt.compare(password, user.password);
        if(!valid) return res.status(400).json({msg: 'Credenciales incorrectas'});

        const token = jwt.sign({ id: user._id, name: user.name, role: user.role}, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        res.json({ token, user: {id: user._id, name: user.name, role: user.role}})
    } catch(err){
        res.status(500).json({msg: 'Error del servidor'});
    }
}

module.exports = {
  register,
  login
};