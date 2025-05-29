require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

connectDB();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));


app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.get("/", (req, res) => {
  res.send("API de CURSOS VORTEX");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando http://localhost:${PORT}`);
});