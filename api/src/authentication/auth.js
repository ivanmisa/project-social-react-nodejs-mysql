const tokenSecret ='ASDQWE098ZXCPOIÑLK123MNRTY';
const expressJwt = require('express-jwt');

exports.requireSignin = expressJwt({
    algorithms: ['HS256'],
    secret: tokenSecret,
    userProperty: 'auth'
});