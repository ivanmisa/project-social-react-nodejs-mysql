const jwt = require('jsonwebtoken');
const User = require("../models/user");
const _ = require('lodash');
const fs = require('fs');
const formidable = require('formidable');
const tokenSecret ='ASDQWE098ZXCPOIÑLK123MNRTY';
const nodeMailer = require("nodemailer");
const { v1: uuidv1 } = require('uuid');
const crypto = require('crypto');
const pool = require('../database');


exports.signin = async (req, res) => { 
    const userExist = await pool.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
    if(userExist[0]){
        return res.status(403).json({error: "Este Email ya esta en uso"});
    }

    let name = await req.body.name;
    let email = await req.body.email;
    let password = await req.body.password;
    let salt = await uuidv1();
    const hashed_password = await crypto.createHmac("sha1", salt).update(password).digest("hex");
    
    const user = await{
        name,
        email,
        salt,
        hashed_password,
    };

    await pool.query('INSERT INTO users set ?', [user]);
    res.status(200).json({ message: 'Te has registrado porfavor inicia sesion' });
}


exports.loginUser = (req, res) => {
    const {email, password} = req.body;

    console.log(email);
    console.log(password);

    pool.query('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if(err || !user[0]){
            return res.status(401).json({error: "La direccion de correo electronico no esta registrada"});
        }

        let compare_password =  crypto.createHmac("sha1", user[0].salt).update(password).digest("hex");

        if(compare_password != user[0].hashed_password){
            return res.status(401).json({error: "La contraseña es incorrecta"});
        }

        const token = jwt.sign({id: user[0].id}, tokenSecret);
        res.cookie("t", token, {expire:new Date() + 9999});
        const {id, name, email} = user[0];
        return res.json({token, user: {id, email, name} });
    });
}

exports.signout = (req, res) => {
    res.clearCookie("t");
    return res.json({message: "Sesion cerrada"});
}

exports.userById = async(req, res, next, id) => {
    const user = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if(!user[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const followers = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.followers_id = users.id WHERE following_id = ? ',[id, id]);
    
    const following = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.following_id = users.id WHERE followers_id = ? ',[id, id]);

    const post = await pool.query
    ('SELECT id, title, user_id FROM post WHERE user_id = ?',[id]);


    followers.shift();
    following.shift();


    user[0].followers = followers;
    user[0].following = following;
    user[0].posts = post;
    


        req.user = user[0];
        next();
  
}

exports.hasAutorization = (req, res, next) => {
    const authorized = req.user && req.auth && req.user._id === req.auth._id;
    if(!authorized){
        return res.status(403).json({error: "El usuario no esta autorizado para realizar esta accion"});
    }
}

exports.users = (req, res) => {
    pool.query('SELECT id, name, email FROM users', (err, users) => {
        if(!users){
            return res.status(401).json({error: "No se encontraron usuarios"});
        }
        if(err){
            return res.status(400).json({error:err});
        }

        res.json(users);
    });
}

exports.getUser = (req, res) => {
    req.user.salt = undefined;
    req.user.hashed_password = undefined;

    return res.json(req.user);
}

exports.updateUser = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err){
            return res.status(400).json({error: "La imagen no ha sido actualizada"});
        }

        let id = req.user.id;
        let name = req.user.name;
        let email = req.user.email;
        let photo = req.user.photo;
        let about = req.user.about;


        let user = {id, name, email, photo, about}

        console.log(user);

        user = _.extend(user, fields);
        console.log(user);
        

        if (files.photo) {
            user.photo = fs.readFileSync(files.photo.path);
        }

        pool.query('UPDATE users set ? WHERE id = ?', [user, req.params.userId], (err, userupdate) =>{
            if (err) {
                return res.status(400).json({error: err});
            }

            pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.params.userId], (err, user) => {

            res.json(user);

            });
        });        
    });
};


exports.userPhoto = (req, res, next) => {
    if(req.user.photo.data){
        res.set("Content-Type", req.user.photo.contentType)
        return res.send(req.user.photo.data);
    }
    next();
}

exports.deleteUser = (req, res) => {
    let user = req.user;

    if(req.params.userId != user.id){
        return res.status(400).json({message:"No tienes permisos para eliminar el usuario"});
    }

    pool.query('DELETE FROM users WHERE id = ?', [req.params.userId], (err, user) => {
        if(err){
            return res.status(400).json({error: err});
        }

        res.json({message: "Usuario eliminado"});
    });
}

exports.addFollowing = async(req, res, next) => {
    let following_id =  await req.body.followId;
    let followers_id =  await req.body.userId;
    
    const follow = await{
        following_id,
        followers_id
    };

     const addFollow = await pool.query('INSERT INTO follow set ?', [follow]);

     const user = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.body.followId]);
    if(!user[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const followers = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.followers_id = users.id WHERE following_id = ? ',[req.body.followId, req.body.followId]);
    
    const following = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.following_id = users.id WHERE followers_id = ? ',[req.body.followId, req.body.followId]);
    
    followers.shift();
    following.shift();

    user[0].followers = followers;
    user[0].following = following;
    
    res.status(200).json(user[0]);
    next();
   
}

exports.removeFollower = async(req, res) => {
    const deleteFollow = pool.query('DELETE FROM follow WHERE following_id = ? AND followers_id = ?', [req.body.unfollowId, req.body.userId])

    const user = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.body.unfollowId]);
    if(!user[0]) {return res.status(400).json({error: "Usuario no encontrado"})}

    const followers = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.followers_id = users.id WHERE following_id = ? ',[req.body.unfollowId, req.body.unfollowId]);
    
    const following = await pool.query
    ('SELECT users.id, users.photo, users.name, users.email FROM follow LEFT JOIN users ON follow.following_id = users.id WHERE users.id = ? UNION SELECT users.id, users.photo, users.name, users.email FROM follow RIGHT JOIN users ON follow.following_id = users.id WHERE followers_id = ? ',[req.body.unfollowId, req.body.unfollowId]);
    
    followers.shift();
    following.shift();

    user[0].followers = followers;
    user[0].following = following;

    res.json(user[0]);
 
}

exports.findPeople = (req, res) => {
    pool.query('SELECT id, name, email, created, about, photo FROM users', (err, users) =>{
        if(err) {
            return res.status(400).json({error: err});
        }

        console.log(users);

        res.json(users);
    });
}

exports.forgotPassword = (req, res) => {
    console.log("casa");
    if(!req.body) return res.status(400).json({message:"No hay informacion"});
    if(!req.body.email) return res.status(400).json({message:"No hay informacion del email"});

    const {email} = req.body;

    pool.query('SELECT * FROM users WHERE email = ?' [email], (err, user) =>{
        if(err || !user){
            return res.status(401).json({message:"Ocurrio un error al encontrar el usuario"})
        }

        const token = jwt.sign({_id: user._id, iss:"NODEAPI"}, tokenSecret);

        const emailData = {
            from: "socialportafolio@ivan.com",
            to: email,
            subject: "Eestrableser la contraseña",
            text: `Click en el siguiente enlace para restrablecer la contraseña: localhost:3000/restablecer-contraseña/${token}`,
            html: `<p>Click en el siguiente enlace para restrablecer la contraseña: localhost:3000/restablecer-contraseña/${token}</p>`
        };

        return pool.query('UPDATE users set ? WHERE email = ?', [resetPasswordLink= token, email], (err, succes) =>{
            if(err) { return res.json({message: err});
            } else {             
                sendEmail(emailData);
                return res.status(200).json({message: `Enlace enviado a: localhost:3000/restablecer-contraseña/${token} siga las instrucciones`});
            }
        });
    });
}


exports.resetPassword = (req, res) => {
    const {resetPasswordLink, newPassword} = req.body;

    pool.query('SELECT FROM users WHERE resetPasswordLink = ?', [resetPasswordLink], (err, user) => {
        if(err, !user) return res.status(401).json({message:"Enlace invalido"});
        const updatedFields = {
            password: newPassword, 
            resetPasswordLink: ""
        };

        user = _.extend(user, updatedFields);
        user.updated = Date.now();

        

        pool.query('UPDATE users set ? WHERE id = ?', [user, user.id], (err, result) => {
            if(err){
                return res.status(400).json({error: err});
            }
            res.json({message: "Tu contraseña ha cambiado ahora puedes iniciar sesion"});
        });
    });
}



const defaultEmailData = { from: "noreply@node-react.com" };
sendEmail = emailData => {
    const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: "ivan.api.prueba@gmail.com",
            pass: "dcpyxfhgtszykees"
        }
    });
    return (
        transporter
            .sendMail(emailData)
            .then(info => console.log(`Message sent: ${info.response}`))
            .catch(err => console.log(`Problem sending email: ${err}`))
    );
};

