const httpStatus = require('http-status-codes');

module.exports = {
    pageNotFound: (req, res, next) => {
        if(req.session.username){
            res.locals.path = '/home';
        }else{
            res.locals.path = '/login';
        }
        res.status(404).render('notFound');
    },
    internalError: (error, req, res, next) => {
        let errorCode = httpStatus.INTERNAL_SERVER_ERROR;
        console.log(errorCode);
        res.status(errorCode);
        res.send('内部エラー発生中。ご迷惑をお掛けします…');
    }
}