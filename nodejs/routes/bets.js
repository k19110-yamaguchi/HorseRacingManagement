var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');
const client = require('cheerio-httpcli');
const placeArr = ["札幌", "函館", "福島", "新潟", "東京", 
                    "中山", "中京", "京都", "阪神", "小倉"]
var url = "";


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
        raceid: null,
        racename: null,
        year: null, 
        err: null,    
        placeArr: placeArr        
    }
    res.render('bets/index', data);
  });

// 馬券のレース選択の処理
router.post('/', (req, res, next) => {
    var err = [];

    var date = req.body.date;  
    
    if(date == ""){
        err.push("dateが未入力です。");

    }
    var place = req.body.place;
    if(place == ""){
        err.push("placeが未入力です。");
        
    }
    var count = req.body.count;
    if(count == ""){
        err.push("countが未入力です。");
        
    }
    var day = req.body.day;
    if(day == ""){
        err.push("dayが未入力です。");
        
    }
    var num = req.body.num;
    if(num == ""){
        err.push("numが未入力です。");
        
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
            raceid: null,
            racename: null,
            year: null,                  
            url: null,  
            err: err,
            placeArr: placeArr
        }

        res.render('bets/index', data);

    // 入力に関するエラーがない場合
    }else{
        var raceid = getRaceId(date, place, count, day, num);
        var url = createUrl(raceid, "shutuba");
        var year = changedate(date, "year");       
        var racename = null;                                  

        client.fetch(url, function(urlerr, $, result, body){   
            // レース名の取得
            var tmp = $('div[class=RaceName]').html(); 
            if(tmp == null){
                err.push("入力したレースが見つかりません。")                

            }else{
                racename = getInfo(tmp, '', '<', 'text');   

            }                                                                                                                                        
            var data = {
                title: "レース選択",
                date: date,
                place: place,
                day: day,
                count: count,
                num: num,                
                url: url, 
                raceid: raceid,
                racename: racename,
                year: year, 
                err: err,
                placeArr: placeArr
            }
    
            res.render('bets/index', data);            

        });                       
    }
  });

router.get('/:id', (req, res, next) => {
    if(checkLogin(req, res)){return};
    var err = [];
    var raceid = req.params.id;
    var year = raceid.substring(0, 4);
    var url = createUrl(raceid, "shutuba");
    client.fetch(url, function(urlerr, $, result, body){    
        //出走馬情報の取得
        var tr = [];            
        for(var i = 0; i < 50; i++){
            var elm = 'tr[id=tr_' + i + ']';
            var tmp = $(elm).html();
            if(tmp != null){
                tr.push(tmp);
            }
                            
        }   
        // レース名の取得
        var div = $('div[class=RaceName]').html();                                                          
        var racename = getInfo(div, "", '<', "text");    
                            
        var text_waku =  'Waku';
        var text_umaban = '';
        var text_horsename = 'title="';  
        var waku = [];
        var umaban = [];
        var horsename = [];
        var total = 0;                                   
            
        for(var i in tr){
            // 枠を取得  
            waku[i] = getInfo(tr[i], text_waku, ' ', "num");                                                           

            // 馬番を取得
            text_umaban = 'Umaban' + String(waku[i]) + ' Txt_C">';
            umaban[i] = getInfo(tr[i], text_umaban, '<', "num");                        


            // 馬名を取得
            horsename[i] = getInfo(tr[i], text_horsename, '"', "text");

            print(waku, umaban + ": ", +horsename);

        }        
        total = umaban.length;                                 
                        
        var data = {
            title: year + "年" +racename +"の馬券登録",                                                                                
            racename: racename,            
            year: year, 
            waku: waku,
            umaban: umaban,
            horsename: horsename,
            total: total,
            err: err,            
        }

        res.render('bets/add', data);            

    });                       
    
})

function getInfo(html, text, breakText, type){
    var info;
    var tmp = "";
    var n = 0;
    var start = 0;
    var end = start + 1;        
    if(text != ""){
        n = html.indexOf(text);
        print("n", n);
        if(n == -1){
            return null

        }
    }
    
    for(var i = 0; i < 20; i++){
        start = n + text.length + i;
            end = start + 1;
        if(html.substring(start, end) == breakText){
            break;

        }else{                        
            tmp += html.substring(start, end);

        }
    }
    

    if(type == "num"){
        info = Number(tmp);
    }else{
        info = tmp;
    }    
    return info;

}

function getRaceId(y, p, c, d, n){
    var uy = changedate(y, "year");    
    
    var np = changePlace(p)
    
    var up = changeNum(np);
    
    var uc = changeNum(c);
    
    var ud = changeNum(d);
    
    var un = changeNum(n);  

    return uy + up + uc + ud + un;
}

function createUrl(id, mode){            
    var url = "https://race.netkeiba.com/race/" + mode + 
        ".html?race_id=" + id + 
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