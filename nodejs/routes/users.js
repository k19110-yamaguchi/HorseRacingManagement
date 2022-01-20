const express = require('express');
const router = express.Router();
const db = require("../models/index");
const {Op} = require("sequelize");

router.get('/', function(req, res, next) {
  var data = {
    title: 'ユーザログイン',
    content: '名前とパスワードを入力'
  }
  res.render('users/login', data);

});

// ログインの処理
router.post('/', (req, res, next) => {
  db.User.findOne({
    where:{
      name:req.body.name,
      pass:req.body.pass,
    }

  }).then(usr => {
    if (usr != null) {  
      req.session.login = usr;    
      res.redirect('/');
    } else {
      var data = {
        title: 'ユーザログイン',
        content:'名前かパスワードに問題があります。再度入力下さい。'
      }
      res.render('users/login', data);
    }
  })
});


// ユーザ追加画面の表示
router.get('/add', (req, res, next) => {
  var data = {
    title: "ユーザ新規作成",
    form: new db.User(),
    pass2: null,
    err1: null,
    err2: null
  };
  res.render('users/add', data);

});

// 新規作成の処理
router.post('/add', (req, res, next) => {
  const form = {
    name: req.body.name,
    pass: req.body.pass1
  };
  var err2 = checkPass(req.body.pass1, req.body.pass2)

  db.sequelize.sync()
  .then(() => db.User.create(form)
  .then(usr => {      
    res.redirect('/users');
    
  })
  // エラーがあった場合
  .catch(err1 => {
    var data = {
      title: "ユーザ新規作成",
      form: form,
      pass2: req.body.pass2,
      err1: err1,
      err2: err2,
    }
    res.render('users/add', data);

  })
  )
});

// パスワードがあっているか調べる
function checkPass(pass1, pass2){
  if(pass1 == pass2){
    return null

  }else{
    return "パスワードが一致しません。"

  }
}

module.exports = router;
