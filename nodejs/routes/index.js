var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');

// ログインチェックの関数
function checkLogin(req, res){
  if (req.session.login == null) {    
    res.redirect('/users');
    return true;
  } else {
    return false;
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if (checkLogin(req,res)){ return };
  res.render('index', { title: '競馬予想・戦績管理アプリ' });
});

module.exports = router;
