const Post = require("../models/post");
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');
const pool = require("../database");

function getPosts(req, res) {
    pool.query('SELECT post.id, title, user_id, created_at, body, name FROM post LEFT JOIN users ON post.user_id = users.id')
    .then(posts => {
        res.status(200).json(posts);
    })
    .catch(err => console.log(err));
};


//FALTA
function createdPost(req, res){
    let form = new formidable.IncomingForm();
    
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err) {
            return res.status(400).json({error: "La imagen no fue subida"});
        }
        const post = _.extend(fields);

        req.user.hashed_password = undefined;
        req.user.salt = undefined;
        post.user_id = req.user.id
        if(files.photo) {
            post.photo = fs.readFileSync(files.photo.path);
        }

        console.log(post);

        pool.query('INSERT INTO post set ?', [post], (err, result) => {
            if(err){
                return res.status(400).json({error: err});
            }
            console.log("hola2");
            console.log(result);
            res.json(result)
        });
    });
};

function getPostsByUser(req, res){
    let user = req.user;

    pool.query('SELECT id, title, body, created FROM post WHERE user_id = ? ORDER BY created ASC', [user.id], (err, posts) => {
        if(err){
            return res.status(400).json({error: err});
        }

        return res.json(posts);
    });
}

async function postById(req, res, next, id){
    const post = await pool.query('SELECT post.id, post.photo, name, title, user_id, created_at, body FROM post LEFT JOIN users ON post.user_id = users.id WHERE post.id = ? LIMIT 1', [id]);
    if(!post[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const likes = await pool.query('SELECT * FROM likes WHERE post_id = ?',[id]);
    const comments = await pool.query('SELECT comment.id, text, commentBy, fromPost, name, created FROM comment LEFT JOIN users ON comment.commentBy = users.id WHERE comment.fromPost = ?', [id]);

    post[0].likes = likes;
    post[0].comments = comments;
    
    req.post = post[0];
    next();
}

function updatePost (req, res, next) {
    console.log("hola0");
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err){
            return res.status(400).json({
                error: "La imagen no ha sido actualizada"
            });
        }

        let id = req.post.id;
        let title = req.post.title;
        let photo = req.post.photo;
        let user_id = req.post.user_id;
        let created_at = req.post.created_at;
        let body = req.post.body;
        let post = {id, title, photo, user_id, created_at, body};
        post = _.extend(post, fields);

        if (files.photo) {
            post.photo = fs.readFileSync(files.photo.path);
        }

        pool.query('UPDATE post set ? WHERE id = ?', [post, req.params.postId], (err, updated) => {
            if (err) {
                return res.status(400).json({error: err});
            }
            console.log("hola2");

            pool.query('SELECT * FROM post WHERE id = ? LIMIT 1', [req.params.postId], (err, post) => {
                if (err) {
                    return res.status(400).json({error: err});
                }
                res.json(post);
            });
        });
    });
};

function isPoster(req, res, next){
    let isPoster = req.post && req.auth && req.post.user_id == req.auth.id;

    if(!isPoster){
        return res.status(403).json({
            error: "El usuario no esta autorizado para esta accion"
        });
    }
    next();
}

function deletePost(req, res){
    let post = req.post;
    console.log(post.id);

    pool.query('DELETE FROM post WHERE id = ?', [post.id], (err, post) => {
        if(err){
            return res.status(400).json({
                error: err
            });
        }
        res.json({
            message: "El post ha sido eliminado exitosamente"
        });
    });
}

function postPhoto(req, res){
    return res.send(req.post.photo)
}

function singlePost(req, res){
    return res.json(req.post);
}

async function like(req, res){
    const likedBy = await req.body.userId;
    const post_id = await req.body.postId;
    const likes = await {
        likedBy,
        post_id
    }
    console.log(likes);

    const addlikes = await pool.query('INSERT INTO likes set ?', [likes]);
    console.log("hola1");
    const post = await pool.query('SELECT post.id, name, title, user_id, created_at, body FROM post LEFT JOIN users ON post.user_id = users.id WHERE post.id = ? LIMIT 1', [post_id]);
        if(!post[0]) {return res.status(400).json({error: "Usuario no encontrado"})}
        console.log("hola2");
    const like = await pool.query('SELECT * FROM likes WHERE post_id = ?',[post_id]);
    console.log("hola3");
    post[0].likes = like;

    res.json(post[0]);
      
}

async function unlike(req, res){
    const userId = await req.body.userId;
    const postId = await req.body.postId;

    const unlike = await pool.query('DELETE FROM likes WHERE likedBy = ? AND post_id = ?', [userId, postId]);
    const post = await pool.query('SELECT post.id, name, title, user_id, created_at, body FROM post LEFT JOIN users ON post.user_id = users.id WHERE post.id = ? LIMIT 1', [postId]);
        if(!post[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const like = await pool.query('SELECT * FROM likes WHERE post_id = ?',[postId]);
    post[0].likes = like;

    res.json(post[0]);
      
}

async function comment(req, res) {
    let text = await req.body.comment.text;
    let commentBy = await req.body.userId;
    let fromPost = await req.body.postId;
    const comment = await {
        text,
        commentBy,
        fromPost
    } 

    const insertComment = await pool.query('INSERT INTO comment set ?', [comment]);  
    const post = await pool.query('SELECT post.id, name, title, user_id, created_at, body FROM post LEFT JOIN users ON post.user_id = users.id WHERE post.id = ? LIMIT 1', [fromPost]);
        if(!post[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const comments = await pool.query('SELECT comment.id, text, commentBy, fromPost, name, created FROM comment LEFT JOIN users ON comment.commentBy = users.id WHERE comment.fromPost = ?', [fromPost]);
    post[0].comments = comments;

    res.json(post[0]);     
}

async function uncomment (req, res) {
    try{
        let comment = req.body;

        const deleteComment = await pool.query('DELETE FROM comment WHERE id = ?', [comment.comment.id]);
        const post = await pool.query('SELECT post.id, name, title, user_id, created_at, body FROM post LEFT JOIN users ON post.user_id = users.id WHERE post.id = ? LIMIT 1', [comment.postId]);
        if(!post[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

        const comments = await pool.query('SELECT comment.id, text, commentBy, fromPost, name, created FROM comment LEFT JOIN users ON comment.commentBy = users.id WHERE comment.fromPost = ?', [comment.postId]);
        post[0].comments = comments;

        res.json(post[0]);      
    }catch(err){
        return res.status(500).send(err);
    } 
}





module.exports = {
    getPosts,
    createdPost,
    getPostsByUser,
    postById,
    updatePost,
    isPoster,
    deletePost,
    postPhoto,
    singlePost,
    like,
    unlike,
    comment,
    uncomment
}





