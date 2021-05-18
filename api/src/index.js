const port = 3800;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const expressValidator = require('express-validator');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// importando rutas
const postRoutes = require("./routes/post");
const userRoutes = require("./routes/user");


// cargar middlewares
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());


 //rutas
 app.use("/api", postRoutes);
 app.use("/api", userRoutes);

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json('El token es invalido..');
    }
  });


//crear del servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});



//exportar
module.exports = app;