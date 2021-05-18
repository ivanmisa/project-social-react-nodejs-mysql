
exports.createPostValidator = (req, res, next) => {
    // title
    req.check('title', 'Write a title').notEmpty();
    req.check('title', 'Title must be between 4 to 150 characters').isLength({
        min: 4,
        max: 150
    });
    // body
    req.check('body', 'Write a body').notEmpty();
    req.check('body', 'Body must be between 4 to 2000 characters').isLength({
        min: 4,
        max: 2000
    });
    // check for errors
    const errors = req.validationErrors();
    // if error show the first one as they happen
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    // proceed to next middleware
    next();
};

exports.userSignin = (req, res, next) => {
    req.check("name", "Nombre es requerido").notEmpty();
    req.check("email", "El Email debe contener de 3 a 32 caracteres").matches(/.+\@.+\..+/)
                .withMessage("El email es incorrecto").isLength({min: 4, max:100});

    req.check("password", "La contraseña es requirida").notEmpty();
    req.check("password").isLength({min: 6}).withMessage("La contraseña debe de contener mas de 6 caracteres")
                        .matches(/\d/).withMessage("La contraseña debe de contener un numero");

    const errors = req.validationErrors();

    if(errors){
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({error: firstError});
    }

    next();
}


exports.passwordResetValidator = (req, res, next) => {
    req.check("newPassword", "La contraseña es requerida").notEmpty();
    req.check("newPassword")
                            .isLength({min: 6})
                            .withMessage("La contraseña debe de tener mas de 6 caracteres")
                            .matches(/\d/)
                            .withMessage("Debe contener un numero")
                            .withMessage("La contraseña debe contener un numero");

    const errors = req.validationErrors();

    if(errors){
        const fistError = errors.map(error => error.msg)[0];
        return res.status(400).json({error: fistError});
    }

    next();
}


















