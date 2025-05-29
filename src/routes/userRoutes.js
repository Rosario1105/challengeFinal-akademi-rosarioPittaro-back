const express = require('express');
const router = express.Router();

const{
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const {authMiddleware, isSuperAdmin } = require ('../middlewares/authMiddleware');


router.get('/', authMiddleware, isSuperAdmin, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.post('/', authMiddleware, isSuperAdmin, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;