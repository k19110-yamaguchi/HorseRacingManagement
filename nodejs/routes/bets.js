var express = require('express');
var router = express.Router();
const db = require('../models/index');
const { Op, col } = require('sequelize');
const client = require('cheerio-httpcli');

const placeArr = ["札幌", "函館", "福島", "新潟", "東京", 
                    "中山", "中京", "京都", "阪神", "小倉"];

const kindArr = ["単勝", "複勝", "枠連", "馬連", "ワイド", 
                    "馬単", "3連複", "3連単"];

const buttonName = ["first", "second", "third"];

var url = "";


// デバック用
function print(type, data){
    console.log(type + ": " + data);

}

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

// 馬券戦績画面の表示
router.get('/', function(req, res, next) {
    // ログインのチェック
    if (checkLogin(req,res)){ return };
    // htmlに送るデータ
    var data = {
        title: "馬券戦績",        
        err: null,                    
    }
    // 馬券戦績画面の表示
    res.render('bets/index', data);

  });

// レース選択画面の表示
router.get('/select', function(req, res, next) {
    // ログインのチェック
    if (checkLogin(req,res)){ return };
    // htmlに送るデータ
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
    // レース選択画面の表示
    res.render('bets/select', data);
  });

// レース選択の処理
router.post('/select', (req, res, next) => {    
    // エラー配列
    var err = []
    // 日付を取得
    var date = req.body.date;      
    // 日付が定義されていない場合
    if(date == ""){
        err.push("dateが未入力です。");

    }
    // 開催場所を取得
    var place = req.body.place;
    // 開催場所が定義されていない場合
    if(place == ""){
        err.push("placeが未入力です。");
        
    }
    // 第何回かを取得
    var count = req.body.count;
    // 第何回か定義されていない場合
    if(count == ""){
        err.push("countが未入力です。");
        
    }
    // 何日目かを取得
    var day = req.body.day;
    // 何日目か定義されていない場合
    if(day == ""){
        err.push("dayが未入力です。");
        
    }
    // 第何Rかを取得
    var num = req.body.num;
    // 第何Rか定義されていない場合
    if(num == ""){
        err.push("numが未入力です。");
        
    }

    // エラーがある場合
    if(err != ""){    
        // htmlに送るデータ    
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
        // レース選択画面の表示
        res.render('bets/select', data);

    // 入力に関するエラーがない場合
    }else{
        // レースIDを取得
        var raceid = getRaceId(date, place, count, day, num);
        // スクレイピングするwebのURLを取得
        var url = createUrl(raceid, "shutuba");
        // 開催年を取得
        var year = changedate(date, "year");       
        var racename = null;                                  

        // スクレイピングを開始
        client.fetch(url, function(urlerr, $, result, body){   
            // レース名の取得
            var tmp = $('div[class=RaceName]').html(); 
            // レース名が見つからない場合
            if(tmp == null){
                err.push("入力したレースが見つかりません。")                

            // レース名が見つかった場合
            }else{
                // レース名を取得
                racename = getInfo(tmp, '', '<', 'text');   

            }                    
            // htmlに送るデータ                                                                                                                    
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
    
            // レース選択画面の表示
            res.render('bets/select', data);            

        });                       
    }
  });

// 指定のレースの馬券登録画面を表示
router.get('/select/:id', (req, res, next) => {
    // ログインチェック
    if(checkLogin(req, res)){return};
    // エラーを格納する配列
    var err = [];
    // レースIDを取得
    var raceid = req.params.id;
    print("raceid", raceid);
    // 開催年を取得
    var year = raceid.substring(0, 4);
    // スクレイピングするwebのURLを取得
    var url = createUrl(raceid, "shutuba");
    // 馬券の種類を取得(最初は単勝)
    var kind = req.query.kind;
    print("kind", kind);
    if(kind == undefined){
        kind = kindArr[0];
    }
    // 馬券の種類に応じた組み合わせを取得
    var combArr = getCombArr(kind);
    print("combArr", combArr);
    // 組み合わせを取得(最初は通常);
    var comb = req.query.comb;    
    for(var i = 0; i < combArr.length; i++){
        if(comb == combArr[i]){
            break;

        }
        if(i == combArr.length - 1){
            comb = combArr[0];
        }
    }

    // テーブルのヘッダーを取得
    var header = getHeader(kind, comb, combArr);
    var headerLen;
    for(var i = 0; i < 3; i++){
        if(header[i] != ""){
            headerLen = i + 1;

        }
    }
    // ボタンのタイプを取得
    var type = getType(kind, comb, combArr);

    var typeLen;
    for(var i = 0; i < 3; i++){
        if(type[i] != ""){
            typeLen = i + 1;

        }
    }
    var colspan = typeLen - headerLen + 1;    
    print("type", typeLen);
    print("header", headerLen);
    print("colspan", colspan);

    // ウェブスクレイピング開始
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

        // 枠を検索するためのテキスト                    
        var text_waku =  'Waku';
        // 馬番を検索するためのテキスト
        var text_umaban = '';
        // 馬名を検索するためのテキスト
        var text_horsename = 'title="';  
        // 枠を格納するための配列
        var waku = [];
        // 馬番を格納するための配列
        var umaban = [];
        // 馬名を格納するための配列
        var horsename = [];
        // 出馬数
        var total = 0;                                   
            
        for(var i in tr){        
            // 枠を取得  
            waku[i] = getInfo(tr[i], text_waku, ' ', "num");                                                                    

            // 馬番を取得
            text_umaban = 'Umaban' + String(waku[i]) + ' Txt_C">';
            umaban[i] = getInfo(tr[i], text_umaban, '<', "num");                                    

            // 馬名を取得
            horsename[i] = getInfo(tr[i], text_horsename, '"', "text");                                    

        }       
        // 出馬数を取得 
        total = umaban.length;                       
                       
        // htmlに送るデータ
        var data = {
            title: year + "年" +racename +"の馬券登録",                                                                                
            id: raceid,
            racename: racename,            
            year: year, 
            waku: waku,
            umaban: umaban,
            horsename: horsename,
            total: total,
            kind: kind,
            comb: comb,            
            header: header,
            headerLen: headerLen,
            type: type,     
            typeLen: typeLen,
            colspan: colspan,       
            kindArr: kindArr,            
            combArr: combArr,
            buttonName: buttonName,
            err: err          
        }

        res.render('bets/add', data);            

    });                       
    
})

// 馬券に応じた組み合わせ方を取得
function getCombArr(k){
    var combArr = [];
    combArr.push("通常");
    print("step", 1);
   if(k == kindArr[2] || k == kindArr[3] || k == kindArr[4]){
        combArr.push("ながし");
        
    }else if(k == kindArr[5] || k == kindArr[7]){
        combArr.push("1着ながし");
        combArr.push("2着ながし");
        if(k == kindArr[7]){
            combArr.push("3着ながし");
            combArr.push("1・2着ながし");
            combArr.push("1・3着ながし");
            combArr.push("2・3着ながし");
        }

    }else if(k == kindArr[6]){
        combArr.push("軸1頭ながし");
        combArr.push("軸2頭ながし");
    }
    print("step", 2);

    if(k != kindArr[0] && k != kindArr[1]){
        combArr.push("ボックス");
        combArr.push("フォーメーション");
    }
    print("step", 3);
    return combArr;

}

// 馬券・組み合わせ方に応じたボタンの種類を取得
function getType(k, c, cArr){
    var type = [];
    var typeArr = ["checkbox", "radio", ""];
    switch(k){
        // 単勝
        case kindArr[0]:
            type[0] = typeArr[0];
            type[1] = typeArr[2];
            type[2] = typeArr[2];
            break;

        // 複勝
        case kindArr[1]:
            type[0] = typeArr[0];
            type[1] = typeArr[2];
            type[2] = typeArr[2];        
            break;

        // 枠連
        case kindArr[2]:            
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[2]; 

                break;
                // ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // ボックス
                case cArr[2]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;

            }
                   
            break;

        // 馬連
        case kindArr[3]:
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[2]; 

                break;
                // ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // ボックス
                case cArr[2]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;

            }
            break;
            
        // ワイド
        case kindArr[4]:
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[2]; 

                break;
                // ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // ボックス
                case cArr[2]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;

            }
            break;

        // 馬単
        case kindArr[5]:
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[2]; 

                break;
                // 1着ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // 2着ながし
                case cArr[2]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[1];
                    type[2] = typeArr[2]; 
                
                break;
                // ボックス
                case cArr[3]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                
                break;
                // フォーメーション
                case cArr[4]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;

            }        
            break;

        // 3連複
        case kindArr[6]:
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[1]; 

                break;
                // 軸1頭ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // 軸2頭ながし
                case cArr[2]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[0]; 
                
                break;
                // ボックス
                case cArr[3]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                
                break;
                // フォーメーション
                case cArr[4]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[0]; 
                
                break;                

            }        
        
            break;

        // 3連単
        case kindArr[7]:
            switch(c){
                // 通常
                case cArr[0]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[1]; 

                break;
                // 1着ながし
                case cArr[1]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // 2着ながし
                case cArr[2]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // 3着ながし
                case cArr[3]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[2]; 
                
                break;
                // 1・2着ながし
                case cArr[4]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[1];
                    type[2] = typeArr[0]; 
                
                break;     
                // 1・3着ながし           
                case cArr[5]:
                    type[0] = typeArr[1];
                    type[1] = typeArr[0];
                    type[2] = typeArr[1]; 
                
                break;             
                // 2・3着ながし   
                case cArr[6]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[1];
                    type[2] = typeArr[1]; 
                
                break;             
                // ボックス   
                case cArr[7]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[2];
                    type[2] = typeArr[2]; 
                // フォーメーションs
                break;                
                case cArr[8]:
                    type[0] = typeArr[0];
                    type[1] = typeArr[0];
                    type[2] = typeArr[0]; 
                
                break;                                          

            }        
        
            break;
    }

    return type;

}

function getHeader(k, c, cArr){
    var header = [];
    switch(k){
        // 単勝
        case kindArr[0]:
            header[0] = "1着";
            header[1] = "";
            header[2] = "";
            break;

        // 複勝
        case kindArr[1]:
            header[0] = "1〜3着";
            header[1] = "";
            header[2] = "";        
            break;

        // 枠連
        case kindArr[2]:            
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 

                break;
                // ながし
                case cArr[1]:
                    header[0] = "1〜2着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // ボックス
                case cArr[2]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;

            }
                   
            break;

        // 馬連
        case kindArr[3]:
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 

                break;
                // ながし
                case cArr[1]:
                    header[0] = "1〜2着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // ボックス
                case cArr[2]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;

            }
            break;
            
        // ワイド
        case kindArr[4]:
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 

                break;
                // ながし
                case cArr[1]:
                    header[0] = "1〜3着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // ボックス
                case cArr[2]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;
                // フォーメーション
                case cArr[3]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;

            }
            break;

        // 馬単
        case kindArr[5]:
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = ""; 

                break;
                // 1着ながし
                case cArr[1]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = ""; 
                
                break;
                // 2着ながし
                case cArr[2]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = ""; 
                
                break;
                // ボックス
                case cArr[3]:
                    header[0] = "1〜2着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;
                // フォーメーション
                case cArr[4]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = ""; 
                
                break;

            }        
            break;

        // 3連複
        case kindArr[6]:
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 

                break;
                // 軸1頭ながし
                case cArr[1]:
                    header[0] = "1〜3着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // 軸2頭ながし
                case cArr[2]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = "相手"; 
                
                break;
                // ボックス
                case cArr[3]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;
                // フォーメーション
                case cArr[4]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 
                
                break;                

            }        
        
            break;

        // 3連単
        case kindArr[7]:
            switch(c){
                // 通常
                case cArr[0]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = "3着"; 

                break;
                // 1着ながし
                case cArr[1]:
                    header[0] = "1着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // 2着ながし
                case cArr[2]:
                    header[0] = "2着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // 3着ながし
                case cArr[3]:
                    header[0] = "3着";
                    header[1] = "相手";
                    header[2] = ""; 
                
                break;
                // 1・2着ながし
                case cArr[4]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = "3着"; 
                
                break;     
                // 1・3着ながし           
                case cArr[5]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = "3着"; 
                
                break;             
                // 2・3着ながし   
                case cArr[6]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = "3着"; 
                
                break;             
                // ボックス   
                case cArr[7]:
                    header[0] = "1〜3着";
                    header[1] = "";
                    header[2] = ""; 
                // フォーメーションs
                break;                
                case cArr[8]:
                    header[0] = "1着";
                    header[1] = "2着";
                    header[2] = "3着"; 
                
                break;                                          

            }        
        
            break;
    }

    return header;

}

function getInfo(html, text, breakText, type){
    var info;
    var tmp = "";
    var n = 0;
    var start = 0;
    var end = start + 1;        
    if(text != ""){
        n = html.indexOf(text);        
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