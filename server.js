
//MySQL + Node.js 접속 코드
var mysql = require("mysql");
var conn = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "1111",
    database : "yourboard"
})

conn.connect();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));


let session = require('express-session');
app.use(session({
    secret : 'dkanrjskclrl',
    resave : false,
    saveUninitialized : true
}))

app.set('view engine','ejs');

app.listen(8080,function(){
    console.log("포트 8080으로 서버 대기중 ... ");
});


//html
app.get('/', function(req,res){
    console.log("home");
    res.render('home.ejs');
});
app.get('/zone',function(req,res){
    console.log("zone");
    res.render('zone.ejs');
})

app.get('/companies', function(req, res){
    console.log("companies");
    res.render('companies.ejs');
});
app.get('/contact', function(req, res){
    console.log("contact");
    res.render('contact.ejs');
});
app.get('/introduction', function(req, res){
    console.log("introduction");
    res.render('introduction.ejs');
});


app.get("/login",function(req,res){
    res.render('login.ejs');
});
app.post("/login",function(req,res){
    console.log("아이디 : "+req.body.userid);
    console.log("비밀번호 : "+req.body.userpw);
    
    var sql_query = "select * from user where userid = \'"+req.body.userid+"\';"
    conn.query(sql_query, function(err,rows,fields){

        if(err) throw err;
        
        console.log(rows[0].userid);
        if (rows[0].userid == req.body.userid && rows[0].userpw == req.body.userpw){
            req.session.user = req.body;
            //res.send(`session : ${req.session}`);
            res.render('user.ejs' ,{user:req.session.user});
            console.log(req.session.user);
        }else{
            res.send('로그인에 실패하셨습니다.');
        }
    })
    
});
app.get("/signup",function(req,res){
    res.render('signup.ejs');
});
app.post("/signup",function(req,res){
    console.log("아이디 : "+req.body.signup_userid);
    console.log("비밀번호 : "+req.body.signup_userpw);
    res.send('가입 되었습니다.');

    var sql_query = "insert into user values (\'"+req.body.signup_userid+"\',\'"+req.body.signup_userpw+"\');"
    console.log(sql_query);
    conn.query(sql_query);

    var sql_query = "select * from user where userid = \'"+req.body.signup_userid+"\';"
    console.log(sql_query);
    conn.query(sql_query, function(err,rows,fields){
        if(err) throw err;
        console.log(rows);
    })
});

app.get("/list", (req, res) => {
    var sql_query = "select * from user;";
    conn.query(sql_query, function(err,rows,fields){
        if(err) throw err;
        //res.send(result);
        req.session.user=req.body;
        res.render('list.ejs',{data:rows});
        console.log(rows);
    });
});

//css
app.get('/sty.css', function(req, res){
    res.sendFile(__dirname + '/css/sty.css');
});
app.get('/zone.css', function(req, res){
    res.sendFile(__dirname + '/css/zone.css');
});
app.get('/companies.css', function(req, res){
    res.sendFile(__dirname + '/css/companies.css');
});
app.get('/contact.css', function(req, res){
    res.sendFile(__dirname + '/css/contact.css');
});
app.get('/introduction.css', function(req, res){
    res.sendFile(__dirname + '/css/introduction.css');
});
