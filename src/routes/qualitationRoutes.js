const express = require('express');
const router = express.Router();
const{
    createQualitation,
    updateQualitation,
    getQualitationsByStudent,
    deleteQualitation
} = require ('../controllers/qualitationController');

const {authMiddleware} = require('../middlewares/authMiddleware');

router.post('/qualitations', authMiddleware, createQualitation);
router.put('/qualitations/:id', authMiddleware, updateQualitation);
router.get('/qualitations/student/:id', authMiddleware, getQualitationsByStudent);
router.delete('/:id', authMiddleware, deleteQualitation);

module.exports = router;