require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require ('./routes/enrollmentRoutes');
const qualitationRoutes = require('./routes/qualitationRoutes');
const statsRoutes = require("./routes/statsRoutes");
connectDB();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/qualitations', qualitationRoutes);
app.use("/api/stats", statsRoutes);


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando http://localhost:${PORT}`);
});

