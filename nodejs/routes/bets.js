var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');
const client = require('cheerio-httpcli');
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
        waku: null,
        umaban: null,
        horsename: null,
        total: 0, 
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
        var data = {
            title: "レース選択",
            date: date,
            place: place,
            day: day,
            count: count,
            num: num,
            waku: null,
            umaban: null,
            horsename: null,
            total: 0,
            url: null,  
            err: err,
            placeArr: placeArr
        }

        res.render('bets/index', data);

    // エラーがない場合
    }else{
        
        var url = createUrl(date, place, count, day, num, "shutuba");                                 

        client.fetch(url, function(err, $, result, body){            
            var tr = [];
            for(var i = 0; i < 50; i++){
                var hoge = 'tr[id=tr_' + i + ']';
                var tmp = $(hoge).html();
                if(tmp != null){
                    tr.push(tmp);
                }
                                
            }   
                                
            var text_waku =  'Waku';
            var text_umaban = '';
            var text_horsename = 'title="';  
            var waku = [];
            var umaban = [];
            var horsename = [];
            var total = 0;                   
            
            var n = null;  
            var tmp = null;
            var start = null;
            var end = null;
             
            for(var i in tr){
                // 枠を取得  
                n = tr[i].indexOf(text_waku);                
                if(n == -1){
                    print("waku", "エラー発生");
                    break;
                }else{                    
                    start = n + text_waku.length;
                    end = start + 1;
                    tmp = tr[i].substring(start, end);                    
                }                
                waku[i] = Number(tmp);                           

                // 馬番を取得
                text_umaban = 'Umaban' + String(waku[i]) + ' Txt_C">'
                n = tr[i].indexOf(text_umaban);                
                tmp = "";
                if(n == -1){
                    print("umaban", "エラー発生");
                    break;
                }else{
                    for(var j = 0; j < 20; j++){
                        start = n + text_umaban.length + j;
                        end = start + 1;   
                        if(tr[i].substring(start, end) == '<'){
                            break;
                        }else{
                            start = n + text_umaban.length + j;
                            end = start + 1;                            
                            tmp += tr[i].substring(start, end);
                        }
                    }                                     
                }
                umaban[i] = Number(tmp);                

                // 馬名を取得
                n = tr[i].indexOf(text_horsename);
                var tmp = "";
                if(n == -1){
                    print("horsename", "エラー発生");
                    break;
                }else{
                    for(var j = 0; j < 20; j++){
                        start = n + text_horsename.length + j;
                            end = start + 1;
                        if(tr[i].substring(start, end) == '"'){
                            break;
                        }else{
                            start = n + text_horsename.length + j;
                            end = start + 1;
                            tmp += tr[i].substring(start, end);
                        }
                    }
                    horsename[i] = tmp                    
                    
                }                
                
                
            }
            total = umaban.length;        
            print("中total", total);        
            var data = {
                title: "レース選択",
                date: date,
                place: place,
                day: day,
                count: count,
                num: num,
                waku: waku,
                umaban: umaban,
                horsename: horsename,
                total: total,
                url: url,  
                err: err,
                placeArr: placeArr
            }
    
            res.render('bets/index', data);            

        });                       
    }
  });


function createUrl(y, p, c, d, n, mode){        
    var uy = changedate(y, "year");    
    
    var np = changePlace(p)
    
    var up = changeNum(np);
    
    var uc = changeNum(c);
    
    var ud = changeNum(d);
    
    var un = changeNum(n);  
    
    
    var url = "https://race.netkeiba.com/race/" + mode + 
        ".html?race_id=" + uy + up + uc + ud + un + 
        "&rf=race_submenu";
    
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