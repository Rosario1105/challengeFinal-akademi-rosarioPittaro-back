require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.send("API de CURSOS VORTEX");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando http://localhost:${PORT}`);
});