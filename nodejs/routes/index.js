var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');

// ログインチェックの関数
function checkLogin(req, res){
  // ログインしていない場合
  if (req.session.login == null) {     
      // ログイン画面のURLへ
      res.redirect('/users');
    return true;
  } else {
    return false;
  }
}

// ホーム画面の表示
router.get('/', function(req, res, next) {
  // ログインのチェック
  if (checkLogin(req,res)){ return };
  // ホーム画面の表示
  res.render('index', { title: '競馬予想・戦績管理アプリ' });
});

module.exports = router;
