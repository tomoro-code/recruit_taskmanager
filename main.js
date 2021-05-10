const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mainController = require('./controllers/mainController');
const errorController = require('./controllers/errorController');

//セッションの設定
const session = require('express-session');
app.use(session({
    secret:  process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 900000
    }
}));

//フラッシュメッセージの設定
const flash = require('connect-flash');
app.use(flash());

//静的ファイルの読み込み設定
app.use(express.static('public'));

//ビューエンジンの設定
app.set('view engine', 'ejs');

//レイアウトの使用
const layouts = require('express-ejs-layouts');
app.use(layouts);

//エンコード
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

//メソッドオーバーライド
const methodOverride = require('method-override');
app.use(methodOverride('_method', {
    methods: ['POST', 'GET']
}));

app.use((req, res, next) => {
    res.locals.flashMessage = req.flash();
    next();
});

//ルーティング

//トップ
app.get('/', mainController.getTopPage);

//ログイン
app.get('/login', mainController.getLoginPage);
app.post('/login', mainController.login);

//サインアップ
app.get('/signup', mainController.getSignupPage);
app.post('/signup', mainController.signup);

//ログイン確認ミドルウェア関数
app.use((req, res, next) => {
    if(req.session.userId){
        res.locals.username = req.session.username;
        next();
    }else{
        req.flash('error', 'ログインしてください');
        res.redirect('/login');
    }
});

//ホーム
app.get('/home', mainController.getHomePage);

//新規エントリー・タスク
app.get('/newcompany', mainController.getNewCompanyPage);
app.post('/newcompany', mainController.addNewCompany);
app.get('/newtasks/:companyId', mainController.getNewTasksPage);
app.post('/newtasks/:companyId', mainController.addNewTask);
app.delete('/deletenewtask/:companyId/:taskId', mainController.deleteNewTask);

//進捗確認・タスク管理
app.get('/progress/:companyId', mainController.getProgressPage);
app.get('/progress/editcompanyname/:companyId', mainController.getEditCompanyNamePage);
app.post('/changecompanyname/:companyId', mainController.changeCompanyName);
app.delete('/deletealldata/:companyId', mainController.deleteAllData);
app.put('/completetask/:companyId/:taskId', mainController.completeTask);
app.put('/uncompletetask/:companyId/:taskId', mainController.uncompleteTask);
app.delete('/deletetask/:companyId/:taskId', mainController.deleteTask);
app.post('/progress/addtask/:companyId', mainController.addTask);
app.get('/edittask/:companyId/:taskId', mainController.getEditTaskPage);
app.put('/edittask/:companyId/:taskId', mainController.editTask);

//全タスク管理
app.get('/alltasks', mainController.getAllTasksPage);

//設定
app.get('/config', mainController.getConfigPage);
app.put('/modifyusername', mainController.modifyUsername);
app.put('/modifypassword', mainController.modifyPassword);

//ログアウト
app.get('/logout', mainController.logout);

//エラー処理
app.use(errorController.pageNotFound);
app.use(errorController.internalError);

app.listen(port, () => {
    console.log(`the server has started running on port ${port}.`);
});