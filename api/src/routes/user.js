const express = require("express");
const pool = require('../database');
const { signin, loginUser, signout, users, getUser, userById, updateUser, userPhoto, deleteUser, addFollowing,
    removeFollower, findPeople, forgotPassword, resetPassword } = require("../controllers/user");
const { requireSignin } = require("../authentication/auth");
const validator = require('../validator/validator');

const router = express.Router();

router.put('/user/follow', requireSignin, addFollowing);
router.delete('/user/unfollow', requireSignin, removeFollower);

router.post("/singin", validator.userSignin, signin);
router.post("/loginUser", loginUser);
router.get("/signout", signout);
router.get("/allusers", users);
router.get("/getuser/:userId", requireSignin, getUser);
router.put("/updateuser/:userId", requireSignin, updateUser);
router.get("/user/photo/:userId",  userPhoto);
router.delete("/deleteuser/:userId", requireSignin, deleteUser);

router.put("/contrasena-olvidada", forgotPassword);
router.put("/cambiar-contraseña", validator.passwordResetValidator, resetPassword);

router.get("/user/findpeople", requireSignin, findPeople)


router.param("userId", userById);

module.exports = router;

