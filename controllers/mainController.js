//データベースの接続
const mysql = require('mysql');
const dbConfig = {
    host: /*'us-cdbr-east-03.cleardb.com' || */'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ||  'Tomorrow79',
    database: /*'heroku_9153d210a1d5aa6' || */'recruit_taskmanager'
};

let connection;

function handleDisconnect(){
    console.log('connecting to database...');
    connection = mysql.createConnection(dbConfig); //接続or再接続

    connection.connect((error) => {
        if(error){
            console.log('error occurred when connecting to database:', error);
            setTimeout(handleDisconnect, 1000) //エラーが生じたら1秒後に再接続を試みる
        }else{
            console.log('the connection to mySQL has been succeed!');
        }
    });

    connection.on('error', (error) => {
        console.log('database error:', error);
        if(error.code === 'PROTOCOL_CONNECTION_LOST'){
            handleDisconnect();
        }else{
            throw error;
        }
    });
}

handleDisconnect();



const bcrypt = require('bcrypt');


module.exports = {
    getTopPage: (req, res) => {
        res.render('top');
    },
    getLoginPage: (req, res) => {
        res.render('login');
    },
    login:  (req, res) => {
        let username = req.body.username;
        let password = req.body.password;
        connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'エラーが生じました。');
                    res.redirect('/login');
                }else if(results.length === 0){
                    req.flash('error', `${username}は登録されていません。`);
                    res.redirect('/login');
                }else{
                    const hash = results[0].password;
                    bcrypt.compare(password, hash, (error, isEqual) => {
                        if(isEqual){
                            req.session.userId = results[0].user_id;
                            req.session.username = results[0].username;
                            req.flash('success', `ようこそ、${req.session.username}さん。`)
                            res.redirect('/home');
                        }else if(error){
                            console.log(error.stack);
                            req.flash('error', '内部エラーが生じました。');
                            res.redirect('/login');
                        }else{
                            req.flash('error', 'パスワードが違います。');
                            res.redirect('/login');
                        }
                    });
                }
            }
        );
    },
    getSignupPage:  (req, res) => {
        res.render('signup');
    },
    signup: (req, res) => {
        if(req.body.username === '' || req.body.password === ''){
            req.flash('error', '空文字は使用できません。');
            res.redirect('/signup');
        }else{
            connection.query(
                'SELECT * FROM users WHERE username = ?',
                [req.body.username],
                (error, results) => {
                    if(error){
                        console.log(error.stack);
                        req.flash('error', 'エラーが生じました');
                        res.redirect('/signup');
                    }else if(results.length >= 1){
                        req.flash('error', 'すでに同じ名前のユーザーがいます。違う名前で登録してください。');
                        res.redirect('/signup');
                    }else{
                        bcrypt.hash(req.body.password, 5, (error, hash) => {
                            if(error){
                                console.log(error.stack);
                                req.flash('error', 'パスワード暗号化にエラーが生じました。もう一度お試しください');
                                res.redirect('/signup');
                            }else{
                                connection.query(
                                    'INSERT INTO users (username, password) VALUES (?, ?)',
                                    [req.body.username, hash],
                                    (error, results) => {
                                        req.session.userId = results.insertId;
                                        req.session.username = req.body.username;
                                        req.flash('success', `ようこそ、${req.session.username}さん`);
                                        res.redirect('/home');
                                    }
                                );
                            }
                        });
                    }
                }
            );
        }
   },
    getHomePage: (req, res) => {
        connection.query(
            'SELECT * FROM companies WHERE user_id = ?',
            [req.session.userId],
            (error, results) => {
                res.locals.entries = results;
                res.render('home');
            }
        );
    },
    getNewCompanyPage: (req, res) => {
        res.render('newCompany');
    },
    addNewCompany: (req, res) => {
        if(req.body.companyName !== ''){
            connection.query(
                'INSERT INTO companies (company_name, user_id) VALUES (?, ?)',
                [req.body.companyName, req.session.userId],
                (error, results) => {
                    if(error){
                        console.log(error.stack);
                        req.flash('error', 'エントリー企業の追加に失敗しました。再度お試しください。');
                        res.redirect('/home');
                    }else{
                        let companyId = results.insertId;
                        req.flash('success', `${req.body.companyName}を追加しました。`);
                        res.redirect(`/newtasks/${companyId}`);
                    }
                }
            );
        }else{
            req.flash('error', '企業名を入力してください。');
            res.redirect('/newcompany');
        }
    },
    getNewTasksPage: (req, res) => {
        connection.query(
            'SELECT * FROM companies WHERE company_id = ? AND user_id = ?',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'エラーが生じました');
                    res.redirect('/home');
                }else if(results.length === 0){
                    req.flash('error', 'そのデータにはアクセスできません。');
                    res.redirect('/home');
                }else{
                    res.locals.companyName = results[0].company_name;
                    res.locals.companyId = results[0].company_id;
                }
            }
        );
        connection.query(
            'SELECT * FROM tasks WHERE company_id = ? AND user_id = ? ORDER BY ordernum, due_date',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'エラーが生じました');
                    res.redirect('/home');
                }else if(results.length === 0){
                    res.render('newTasks');
                }else{
                    res.locals.tasks = results;
                    res.render('newTasks');
                }
            }
        );
    },
    addNewTask: (req, res) => {
        if(req.body.taskTitle !== ''){
            if(req.body.dueDate === ''){
                res.locals.dueDate = '期日未設定';
            }else{
                res.locals.dueDate = req.body.dueDate.replace('T', '　');
            }
            connection.query(
                'INSERT INTO tasks (task_title, due_date, note, company_id, user_id, ordernum) VALUES (?, ? , ?, ?, ?, ?)',
                [req.body.taskTitle, res.locals.dueDate, req.body.note, req.params.companyId, req.session.userId, req.body.orderNum],
                (error, results) => {
                    if(error) {
                        console.log(error.stack);
                        req.flash('error', 'タスクの追加に失敗しました');
                        res.redirect('/home');
                    }else{
                        req.flash('success', `タスク：${req.body.taskTitle}を追加`);
                        res.redirect(`/newtasks/${req.params.companyId}`);
                    }
                }
            );    
        }else{
            req.flash('error', 'タスク内容を記入してください。');
            res.redirect(req.originalUrl);
        }
    },
    getProgressPage: (req, res) => {
        connection.query(
            'SELECT * FROM companies WHERE company_id = ? AND user_id = ?',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'エラーが生じました');
                    res.redirect('/home');
                }else if(results.length === 0){
                    req.flash('error', 'そのデータにはアクセスできません。');
                    res.redirect('/home');
                }else{
                    res.locals.companyName = results[0].company_name;
                    res.locals.companyId = results[0].company_id;
                }
            }
        );
        connection.query(
            'SELECT * FROM tasks WHERE company_id = ? AND user_id = ? ORDER BY ordernum, due_date',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error) {
                    console.log(error.stack);
                    req.flash('error', 'エラーが生じました');
                    res.redirect('/home');
                }else{
                    res.locals.tasks = results;
                    res.render('progress');
                }
            }
        ); 
    },
    deleteNewTask: (req, res) => {
        connection.query(
            'DELETE FROM tasks WHERE task_id = ? AND company_id = ? AND user_id = ?',
            [req.params.taskId, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'タスクの削除に失敗しました');
                }
                res.redirect(`/newtasks/${req.params.companyId}`);
            }
        );
    },
    getEditCompanyNamePage: (req, res) => {
        connection.query(
            'SELECT * FROM companies WHERE company_id = ? AND user_id = ?',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'ページの取得に失敗しました');
                    res.redirect(`/progress/${req.params.companyId}`);
                }else if(results.length === 0){
                    req.flash('error', 'そのデータにはアクセスできません。');
                    res.redirect('/home');
                }else{
                    res.locals.companyId = results[0].company_id;
                    res.locals.companyName = results[0].company_name;
                    res.locals.from = `/progress/${req.params.companyId}`;
                    res.render('editCompanyName');
                }
            }
        );
    },
    changeCompanyName: (req, res) => {
        connection.query(
            'UPDATE companies SET company_name = ? WHERE company_id = ? AND user_id = ?',
            [req.body.companyName, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error);
                }else{
                    req.flash('success', `企業名を${req.body.companyName}に変更しました`);
                }
                res.redirect(`/progress/${req.params.companyId}`);
            }
        );
    },
    completeTask: (req, res) => {
        connection.query(
            "UPDATE tasks SET completed = '完了！' WHERE task_id = ? AND company_id = ? AND user_id = ?",
            [req.params.taskId, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'エラーによりタスクを完了できませんでした');
                }else{
                    req.flash('success', 'タスクを完了しました！');
                }
                res.redirect(`/${req.query.from}`);
            }
        );
    },
    uncompleteTask: (req, res) => {
        connection.query(
            "UPDATE tasks SET completed = '未完了' WHERE task_id = ? AND company_id = ? AND user_id = ?",
            [req.params.taskId, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error);
                    req.flash('error', 'エラーによりタスクを未完了にできませんでした');
                }else{
                    req.flash('success', 'タスクを未完了に戻しました');
                }
                res.redirect(`/${req.query.from}`);
            } 
        );
    },
    deleteTask: (req, res) => {
        connection.query(
            'DELETE FROM tasks WHERE task_id = ? AND company_id = ? AND user_id = ?',
            [req.params.taskId, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'タスクの削除に失敗しました');
                }else{
                    req.flash('success', 'タスクを削除しました');
                }
                res.redirect(`/${req.query.from}`);
            }
        );
    },
    addTask: (req, res) => {
        if(req.body.taskTitle !== ''){
            if(req.body.dueDate === ''){
                res.locals.dueDate = '期日未設定';
            }else{
                res.locals.dueDate = req.body.dueDate.replace('T', '　');
            }
            connection.query(
                'INSERT INTO tasks (task_title, due_date, note, company_id, user_id, ordernum) VALUES (?, ?, ?, ?, ?, ?)',
                [req.body.taskTitle, res.locals.dueDate, req.body.note, req.params.companyId, req.session.userId, req.body.orderNum],
                (error, results) => {
                    if(error){
                        console.log(error.stack);
                        req.flash('error', 'タスクの追加に失敗しました');
                    }else{
                        req.flash('success', `タスク：${req.body.taskTitle}を追加しました`);
                    }
                    res.redirect(`/progress/${req.params.companyId}`);
                }
            );
        }else{
            req.flash('error', 'タスク内容を記入してください。');
            res.redirect(`/progress/${req.params.companyId}`);
        }
    },
    getEditTaskPage: (req, res) => {
        connection.query(
            'SELECT * FROM tasks WHERE task_id = ? AND company_id = ? AND user_id = ?',
            [req.params.taskId, req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'ページの取得に失敗しました');
                    res.redirect(`/${req.query.from}`);
                }else if(results.length === 0){
                    req.flash('error', 'そのデータにはアクセスできません。');
                    res.redirect('/home');
                }else{
                    res.locals.taskId = results[0].task_id;
                    res.locals.taskTitle = results[0].task_title;
                    res.locals.dueDate = results[0].due_date;
                    res.locals.note = results[0].note;
                    res.locals.companyId = results[0].company_id;
                    res.locals.from = req.query.from;
                    res.render('editTask');
                }
            }
        );
    },
    editTask: (req, res) => {
        if(req.body.dueDate === ''){
            res.locals.dueDate = '期日未設定';
        }else{
            res.locals.dueDate = req.body.dueDate;
        }
        connection.query(
            'UPDATE tasks SET task_title = ?, due_date = ?, note = ?, ordernum = ? WHERE task_id = ? AND user_id = ?',
            [req.body.taskTitle, res.locals.dueDate, req.body.note, req.body.orderNum, req.params.taskId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'タスクの変更に失敗しました');
                }else{
                    req.flash('success', 'タスクを変更しました');
                }
                res.redirect(`/${req.query.from}`);
            }
        );
    },
    deleteAllData: (req, res) => {
        connection.query(
            'DELETE FROM tasks WHERE company_id = ? AND user_id = ?',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', 'タスクの削除でエラーが発生しました');
                }
            }
        );
        connection.query(
            'DELETE FROM companies WHERE company_id = ? AND user_id = ?',
            [req.params.companyId, req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error);
                    req.flash('error', '企業データの削除でエラーが発生しました');
                }else{
                    req.flash('success', '企業・タスクを削除しました');
                }
                res.redirect('/home');
            }
        );
    },
    getAllTasksPage: (req, res) => {
        connection.query(
            'SELECT * FROM tasks JOIN companies ON tasks.company_id = companies.company_id WHERE companies.user_id = ? ORDER BY tasks.ordernum, tasks.due_date',
            [req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.session('error', 'タスクの取得に失敗しました');
                    res.redirect('/home');
                }else{
                    console.log(results);
                    res.locals.tasks = results;
                    res.render('allTasks');
                }
            }
        );
    },
    getConfigPage: (req, res) => {
        connection.query(
            'SELECT * FROM users WHERE user_id = ?',
            [req.session.userId],
            (error, results) => {
                if(error){
                    console.log(error.stack);
                    req.flash('error', '設定ページの取得に失敗しました');
                    res.redirect('/home');
                }else{
                    res.locals.username = results[0].username;
                    res.render('config');
                }
            }
        );
    },
    changeUsername: (req, res) => {
        if(req.body.username !== ''){
            connection.query(
                'SELECT username FROM users WHERE username = ?',
                [req.body.username],
                (error, results) => {
                    if(error){
                        console.log(error.stack);
                        req.flash('error', '何らかのエラーにより、ユーザーネームの変更は行われませんでした');
                    }else if(results.length >= 1){
                        console.log(results);
                        req.flash('error', 'すでに同じ名前のユーザーがいます。他のユーザーと同じユーザーネームは使用できません');
                    }else{
                        connection.query(
                            'UPDATE users SET username = ? WHERE user_id = ?',
                            [req.body.username, req.session.userId],
                            (error, results) => {
                                if(error){
                                    console.log(error.stack);
                                    req.flash('error', '何らかのエラーによりユーザーネームの変更は行われませんでした');
                                }else{
                                    console.log(results);
                                    req.flash('success', 'ユーザーネームを変更しました。');
                                }
                            }
                        );
                    }
                }
            );
        }else{
            req.flash('error', 'ユーザーネームを記入してください。');
        }
        res.redirect('/config');
    },
    changePassword: (req, res) => {
        if(req.body.password !== ''){
            if(req.body.password === req.body.passwordCheck){
                bcrypt.hash(req.body.password, 5, (error, hash) => {
                    if(error){
                        console.log(error.stack);
                        req.flash('error', 'パスワードのハッシュ化でエラーが生じました。');
                    }else{
                        connection.query(
                            'UPDATE users SET password = ? WHERE user_id = ?',
                            [hash, req.session.userId],
                            (error, results) => {
                                if(error){
                                    console.log(error.stack);
                                    req.flash('error', 'パスワード更新でエラーが生じました。');
                                }else{
                                    req.flash('success', 'パスワードを更新しました。');
                                }
                            }
                        );
                    }
                });
            }else{
                req.flash('error', '新パスワードと確認パスワードが一致しませんでした。もう一度お試しください。');
            }
        }else{
            req.flash('error', 'パスワードを入力してください。');
        }
        res.redirect('/config');
    },
    logout: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    },
}