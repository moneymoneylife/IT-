
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const { ObjectId } = require('mongodb');
const path = require('path');

let session = require('express-session');
app.use(session({
    secret : 'dkanrjskclrl',
    resave : false,
    saveUninitialized : true
}))

// 정적 파일 제공을 위해 express.static 사용
app.use('/downloads', express.static(path.join(__dirname, 'public/file')));
app.use('/public/file', express.static(path.join(__dirname, 'public/file')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(bodyParser.json());

let multer = require('multer');
let storage = multer.diskStorage({
    destination : function(req,file, done){
        done(null,'./public/file')
    },
    filename : function(req,file,done){
        done(null,file.originalname);
        //const ext = path.extname(file.originalname);
        //done(null, Date.now() + ext);
    }
})
let upload = multer({storage : storage});
let imagepath = '';
app.set('view engine','ejs');

//몽고 DB 연동
const mongoclient = require('mongodb').MongoClient;
const url = 'mongodb+srv://admin:1234@cluster0.ryjzma5.mongodb.net/';
mongoclient.connect(url)
    .then(client => {
        console.log('몽고 DB 연결')
        mydb = client.db('IT');
        
        app.listen(8080,function(){
            console.log("포트 8080으로 서버 대기중 ... ");
        });
    }).catch(err=>{
        console.log(err);
    });


//ejs
app.get('/', function(req,res){
    console.log("home");
    res.render('home.ejs',{user:req.session.user});
    
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

    mydb
        .collection("user")
        .findOne({userid : req.body.userid, userpw : req.body.userpw})
        .then((result)=>{
            if(result== null){
                res.send('로그인에 실패하셨습니다.');
            }else{
                req.session.user = result;
                console.log('로그인');
                console.log(req.session.user);
                res.redirect('/');
            }
        });
    
}); 
app.get("/signup",function(req,res){
    res.render('signup.ejs',{data:'ㅇㅇㅇ'});
});
app.post("/signup",function(req,res){
    console.log("signup");
    mydb
        .collection("user")
        .findOne({userid : req.body.signup_userid})
        .then((result)=>{
            if(result == null){
                console.log("아이디 : "+req.body.signup_userid);
                console.log("비밀번호 : "+req.body.signup_userpw);
                console.log("이름 : "+req.body.signup_username);
                console.log("이메일 : "+req.body.signup_email);
                console.log("전화번호 : "+req.body.signup_phone);
                res.send('가입 되었습니다.');
            
                //몽고 DB 추가
                mydb.collection('user').insertOne(
                    {userid : req.body.signup_userid, 
                    userpw : req.body.signup_userpw,
                    username : req.body.signup_username,
                    email : req.body.signup_email,
                    phone : req.body.signup_phone
                }
                    ).then(result => {
                        console.log(result);
                        console.log('데이터 추가 성공');
                    })
            }else{
                console.log('가입 실패');
                res.render('signup.ejs', {data:result});
            }
        });
});

app.post("/confirm_userid",function(req,res){
    console.log("confirm_userid");
    const confirm_userid = req.body.confirm_userid;
    console.log(confirm_userid);
    console.log(req.body.confirm_userid);

    mydb
        .collection("user")
        .findOne({userid : confirm_userid})
        .then((result)=>{
            if(result == null){
                console.log('중복 없음');
                res.status(200).send();
            }else{
                console.log('가입 실패');
                res.status(500).send();
            }
        });

});
app.post("/signup",function(req,res){
    console.log("signup");
    const signup_userid = req.body.signup_userid;
    const signup_userpw = req.body.signup_userpw;
    const confirm_password = req.body.confirm_password;
    const signup_username = req.body.signup_username;
    const signup_email = req.body.signup_email;
    const signup_phone = req.body.signup_phone;
    console.log(signup_userpw,confirm_password);

    if(signup_userpw == confirm_password){
        console.log("아이디 : "+signup_userid);
        console.log("비밀번호 : "+signup_userpw);
        console.log("이름 : "+signup_username);
        console.log("이메일 : "+signup_email);
        console.log("전화번호 : "+signup_phone);
    
        //몽고 DB 추가
        mydb.collection('user').insertOne(
            {
            userid : signup_userid, 
            userpw : signup_userpw,
            username : signup_username,
            email : signup_email,
            phone : signup_phone
            })
            .then(result => {
                console.log(result);
                console.log('데이터 추가 성공');
            })
            res.status(200).send();
    }else{
        console.log('가입 실패');
        res.status(500).send();
    }

});

app.get("/enter",function(req,res){
    console.log("enter");
    if(req.session.user){
    res.render('enter.ejs');
    }else{
        res.send("로그인을 해주세요.");
    }

});

app.post('/photo', upload.single('picture'),function(req,res){
    console.log("photo")
    console.log(req.file.path);
    imagepath ='\\'+req.file.path;
   
})

app.post('/save',function(req,res){
    // 현재 날짜 생성
    var currentDate = new Date();
    console.log(req.body.someDate);
    //몽고 DB 추가
    mydb.collection('list').insertOne(
        {
            title : req.body.title, 
            content : req.body.content,
            userid : req.session.user.userid,
            path : imagepath,
            currentDate : currentDate
        }
        ).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
            
        })
        res.redirect('/list');
        
})


app.get('/mypage',function(req,res){
    console.log("mypage");
    res.render('mypage.ejs');
})
app.post('/file', upload.single('file'),function(req,res){
    console.log(req.file.path);
    res.send("파일 저장 성공!");
})



// 클라이언트에게 다운로드 링크 제공
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public/file', filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send("파일을 찾을 수 없습니다.");
    }
  });
});
app.get('/download',function(req,res){
    console.log("download");
    res.render('download.ejs');
})

app.get("/list", function(req, res){
    console.log("list");
    mydb
        .collection("list")
        .find()
        .toArray()
        .then((result)=>{
                res.render('list.ejs', {data : result});
            })
});

app.get("/content/:id", (req, res) => {
    console.log(req.params.id);
    req.params.id = new ObjectId(req.params.id);
    mydb
    .collection("list")
    .findOne({_id : req.params.id})
    .then((result)=>{
        console.log(result);
        res.render('content.ejs', {data : result});
        })
});
app.get('/test', function(req, res){
    mydb
    .collection("like")
    .findOne({userid:req.session.user.userid})
    .then((like_result)=>{
        console.log(like_result);
        like_result.listid = new ObjectId(like_result.listid);
        mydb
       .collection("list")
        .findOne({_id:like_result.listid})
        .then((list_result)=>{
            res.render('test.ejs', {like : like_result, list: list_result});
        })
        
        })
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
app.get('/login.css', function(req, res){
    res.sendFile(__dirname + '/css/login.css');
});
app.get('/enter.css', function(req, res){
    res.sendFile(__dirname + '/css/enter.css');
});
app.get('/mypage.css', function(req, res){
    res.sendFile(__dirname + '/css/mypage.css');
});
app.get('/list.css', function(req, res){
    res.sendFile(__dirname + '/css/list.css');
});
app.get('/signup.css', function(req, res){
    res.sendFile(__dirname + '/css/signup.css');
});