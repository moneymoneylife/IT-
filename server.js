
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
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/downloads', express.static(path.join(__dirname, 'public/file')));
app.use('/public/file', express.static(path.join(__dirname, 'public/file')));

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
app.get('/companies', function(req, res){
    console.log("companies");
    mydb
        .collection("list")
        .find()
        .toArray()
        .then((result)=>{
            res.render('companies.ejs', {data : result, user:req.session.user});
            })
});
app.get('/search',function(req,res){
    console.log(req.query.value);
    mydb
    .collection("list")
    .find({title:req.query.value}).toArray()
    .then((result)=>{
        console.log(result);
        res.render("sresult.ejs",{data : result, user:req.session.user});
    })
})
app.post('/sorting', (req, res) => {
    const selectedValue = req.body.sorting;
    if(selectedValue == '최근등록순'){
        mydb
        .collection("list")
        .find()
        .sort({currentDate:-1})
        .toArray()
        .then((result)=>{
            res.render('companies.ejs', {data : result, user:req.session.user});
            })
    }else if(selectedValue == '인기순' ){

    }else if(selectedValue == '인기순' ){
        mydb
        .collection("list")
        .find()
        .sort({id_:1})
        .toArray()
        .then((result)=>{
            res.render('companies.ejs', {data : result, user:req.session.user});
            })
    }
    
});
app.post('/delete', function(req, res){
    console.log("delete");
    console.log(req.body._id);
    mydb.collection('like').deleteOne({like_id:req.body._id, userid:req.session.user.userid})
    .then(result=>{
        console.log("삭제완료");
        res.status(200).send();
        res.redirect('/cart');
    }).catch(err=>{
        console.log(err);
        res.status(500).send();
    })
    
});
app.post('/list_delete', function(req, res){
    console.log("list_delete");
    req.body._id = new ObjectId(req.body._id);
    console.log(req.body._id);
    mydb.collection('list').deleteOne({_id:req.body._id, userid:req.session.user.userid})
    .then(result=>{
        console.log("삭제완료");
        res.status(200).send();
        res.redirect('/cart');
    }).catch(err=>{
        console.log(err);
        res.status(500).send();
    })
    
});
app.get('/contact', function(req, res){
    console.log("contact");
    res.render('contact.ejs',{user:req.session.user});
});
app.get('/introduction', function(req, res){
    console.log("introduction");
    res.render('introduction.ejs',{user:req.session.user});
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
                res.render('login.ejs');
            }else{
                req.session.user = result;
                console.log('로그인');
                console.log(req.session.user);
                res.redirect('/');
            }
        });
    
}); 
app.get("/logout",function(req,res){
    console.log("로그아웃");
    req.session.destroy();
    res.redirect('/');
});

app.get("/signup_user",function(req,res){
    res.render('signup_user.ejs');
});
app.post("/signup_user",function(req,res){
    console.log("signup_user");
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
            phone : signup_phone,
            type : "user"
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

app.get("/signup_company",function(req,res){
    res.render('signup_company.ejs');
});
app.post("/signup_company",function(req,res){
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
            phone : signup_phone,
            type : "company"
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


app.get("/update",function(req,res){
    console.log("update");
    res.render('update.ejs',{user:req.session.user});
});
app.post("/update",function(req,res){
    console.log("update");
    const userid = req.body.userid;
    const userpw = req.body.userpw;
    const new_userpw = req.body.new_userpw;
    const confirm_password = req.body.confirm_password;
    const username = req.body.username;
    const email = req.body.email;
    const phone = req.body.phone;
    console.log(userpw);
    if(userpw==''){
        //몽고 DB 추가
        mydb.collection('user').updateOne({userid : req.session.user.userid},
            {
            $set : {
            userid : userid, 
            username : username,
            email : email,
            phone : phone,
            }
            })
            .then(result => {
                console.log(result);
                console.log('데이터 수정 성공');
                console.log('업데이트');
                req.session.destroy();
            })
            res.status(200).send();
    }
    else if(userpw ==req.session.user.userpw){
        if(new_userpw == confirm_password){
            console.log(new_pw,confirm_password);
            console.log("아이디 : "+userid);
            console.log("비밀번호 : "+new_userpw);
            console.log("이름 : "+username);
            console.log("이메일 : "+email);
            console.log("전화번호 : "+phone);
        
            //몽고 DB 추가
            mydb.collection('user').insertOne({userid : req.session.user.userid},
                {
                    $set : {
                userid : userid, 
                userpw : new_userpw,
                username : username,
                email : email,
                phone : phone,
                }
                })
                .then(result => {
                    console.log(result);
                    console.log('데이터 수정 성공');
                    console.log("업데이트");
                    req.session.destroy();
                })
                res.status(200).send();
        }else{
            console.log('수정 실패');
            res.status(500).send();
        }
       

    }else{
        console.log('수정 실패');
        res.status(500).send();
    }

});

app.post("/confirm_userid",function(req,res){
    console.log("confirm_userid");
    const confirm_userid = req.body.confirm_userid;
    console.log(confirm_userid);
    console.log(req.body.confirm_userid);

    if(req.session.user){
        if(confirm_userid==req.session.user.userid){
            console.log('사용가능');
            res.status(200).send();
        }else{
                    
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
        }
    }else{

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

    }

});
app.get("/enter",function(req,res){
    console.log("enter");
    if(req.session.user){
    res.render('enter.ejs',{user:req.session.user});
    }else{
        res.redirect('/login');
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
    //몽고 DB 추가
    mydb.collection('list').insertOne(
        {
            title : req.body.title, 
            content : req.body.content,
            sal : req.body.sal, 
            email : req.body.email,
            userid : req.session.user.userid,
            local:req.body.local,
            path : imagepath,
            currentDate : currentDate
        }
        ).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
            
        })
        res.redirect('/companies');
        
})



app.get('/cart',function(req,res){
    console.log("cart");
    
    if(req.session.user){
        mydb
        .collection("like")
        .find({userid : req.session.user.userid})
        .toArray()
        .then((like_result)=>{
            if (like_result.length > 0) { // 배열에 결과가 있는지 확인
                console.log(like_result[0].like_id); // 첫 번째 객체의 like_id 출력
                const objectIdArray = like_result.map(item => new ObjectId(item.like_id));
                console.log(objectIdArray); // ObjectId 배열 출력

                mydb
                    .collection("list")
                    .find({ _id: { $in: objectIdArray } })
                    .toArray()
                    .then((list_result) => {
                        if(req.session.user.type == 'company'){
                        mydb
                        .collection("list")
                        .find({userid: req.session.user.userid})
                        .toArray()
                        .then((result) => {
                            res.render('cart.ejs', {list : result, data: list_result, user: req.session.user });
                    })}else{

                        console.log(list_result);
                        res.render('cart.ejs', { data: list_result, user: req.session.user });
                    } })
                    .catch(err => {
                        console.error("Error finding documents: ", err);
                        res.redirect('/error'); // 에러 페이지로 리다이렉트
                    });
            } else {
                res.render('cart.ejs', { data: null, user: req.session.user });
            }})
    }else{
        res.redirect('/login');
    }
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
app.get("/details/:id", (req, res) => {
    console.log(req.params.id);
    req.params.id = new ObjectId(req.params.id);
    mydb
    .collection("list")
    .findOne({_id : req.params.id})
    .then((result)=>{
        mydb
        .collection("list")
        .find({ _id: { $ne: req.params.id }})
        .toArray()
        .then((list_result)=>{
            console.log(result);
            res.render('details.ejs', {data : result,list :list_result,  user:req.session.user});
            })
        })
});

app.post("/details/:id", (req, res) => {
    console.log(req.params.id);
    console.log("/details/:id");
    const newid = req.params.id.substring(1); // 첫 번째 글자 제거
    console.log(newid); 
    if(req.session.user){
        mydb
        .collection("like")
        .findOne({like_id : newid, userid : req.session.user.userid})
        .then((result)=>{
            if(result==null){
                //몽고 DB 추가
            mydb.collection('like').insertOne(
                {
                    like_id : newid,
                    userid : req.session.user.userid
                })
                .then(result => {
                    console.log(result);
                    console.log('데이터 추가 성공');
                    res.redirect('/cart');
                })
            }else{
                console.log('데이터 추가 실패');
                res.status(500).send();
            }
        })
    }else{
        res.redirect('/login');
        console.log('찜 실패');
    }
});

//css
app.get('/style.css', function(req, res){
    res.sendFile(__dirname + '/css/style.css');
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
app.get('/signup.css', function(req, res){
    res.sendFile(__dirname + '/css/signup.css');
});
app.get('/details.css', function(req, res){
    res.sendFile(__dirname + '/css/details.css');
});
app.get('/cart.css', function(req, res){
    res.sendFile(__dirname + '/css/cart.css');
});