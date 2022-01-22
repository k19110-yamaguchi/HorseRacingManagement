var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');
const placeArr = ["札幌", "函館", "福島", "新潟", "東京", 
                    "中山", "中京", "京都", "阪神", "小倉"]

// デバック用
function print(type, data){
    console.log(type + ": " + data);

}


// ログインチェックの関数
function checkLogin(req, res){
    if (req.session.login == null) {    
      res.redirect('/users');
      return true;
    } else {
      return false;
    }
}

// レース選択画面の表示
router.get('/', function(req, res, next) {
    if (checkLogin(req,res)){ return };
    var data = {
        title: "レース選択",
        date: null,
        place: "中京",
        day: 1,
        count: 1,
        num: 11,    
        url: null, 
        err: null,    
        placeArr: placeArr        
    }
    res.render('bets/index', data);
  });

// 馬券のレース選択の処理
router.post('/', (req, res, next) => {
    var err = []

    var date = req.body.date;  
    
    if(date == ""){
        err.push("date");

    }
    var place = req.body.place;
    if(place == ""){
        err.push("place");
        
    }
    var count = req.body.count;
    if(count == ""){
        err.push("count");
        
    }
    var day = req.body.day;
    if(day == ""){
        err.push("day");
        
    }
    var num = req.body.num;
    if(num == ""){
        err.push("num");
        
    }

    // エラーがある場合
    if(err != ""){
        print("err", err);
        var data = {
            title: "レース選択",
            date: date,
            place: place,
            day: day,
            count: count,
            num: num,
            url: null,  
            err: err,
            placeArr: placeArr
        }

        res.render('bets/index', data);

    // エラーがない場合
    }else{
        
        var url = createUrl(date, place, count, day, num);  
        print("URL", url);
        var data = {
            title: "レース選択",
            date: date,
            place: place,
            day: day,
            count: count,
            num: num,
            url: url,  
            err: err,
            placeArr: placeArr
        }

        res.render('bets/index', data);        
    }

  });

function createUrl(y, p, c, d, n){        
    var uy = changedate(y, "year");    
    print("uy", uy);
    var np = changePlace(p)
    print("np", np);
    var up = changeNum(np);
    print("up", up);
    var uc = changeNum(c);
    print("uc", uc);
    var ud = changeNum(d);
    print("ud", ud);
    var un = changeNum(n);  
    print("un", un);
    
    var url = "https://race.netkeiba.com/race/result.html?race_id=" + 
            + uy + up + uc + ud + un +
            "&rf=race_list";

    return url;
}

// 日付の表示を変更
function changedate(d, mode){
    var str = String(d);
    var ud = str.replace('-', '');

    while(ud !== str) {
        str = str.replace('-', '');
        ud = ud.replace('-', '');
     
    }

    var res;
    if(mode == "year"){
        res = ud.substring(0, 4);

    }else if(mode == "date"){
        res = ud.substring(4, 8);

    }else{
        res = ud;
    }
    return res;

}

// 場所<->数字変換
function changePlace(p){
    var res = null;
    for(var i = 0; i < placeArr.length; i++){
        print(i, placeArr[i]);
        if(p == placeArr[i]){
            res = i + 1;
        }
    }      

    return res;

}

// 第何レースの変更
function changeNum(n){
    var cn; 
    if(n < 10){
        cn = "0" + String(n);
    }else{
        cn = String(n);
    }
    return cn;
}


module.exports = router;