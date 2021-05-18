const express = require('express');
const { getPosts, createdPost, getPostsByUser, postById, isPoster, deletePost,
        updatePost, postPhoto, singlePost, like, unlike, comment, uncomment } = require('../controllers/post');
const { requireSignin } = require("../authentication/auth");
const { userById } = require("../controllers/user");
const router = express.Router();
const validator = require('../validator/validator');


router.get('/getPosts', getPosts);
router.post('/createdpost/:userId', requireSignin, createdPost, validator.createPostValidator);
router.get('/posts/by/:userId', requireSignin, getPostsByUser);
router.get('/post/:postId', singlePost);
router.put('/updatepost/:postId', requireSignin, isPoster, updatePost);
router.delete('/deletepost/:postId', requireSignin, isPoster, deletePost);
router.get("/post/photo/:postId",  postPhoto);
router.put("/post/like", requireSignin, like);
router.put("/post/unlike", requireSignin, unlike);

router.put("/post/comment", requireSignin, comment);
router.put("/post/uncomment", requireSignin, uncomment);

router.param("userId", userById);
router.param("postId", postById);

module.exports = router;