const express = require('express');
const router = express.Router();
const db = require('../models/index');
const { Op, col } = require('sequelize');
const client = require('cheerio-httpcli');
const { text } = require('express');

const placeArr = ["札幌", "函館", "福島", "新潟", "東京", 
                    "中山", "中京", "京都", "阪神", "小倉"];

const kindArr = ["単勝", "複勝", "枠連", "馬連", "ワイド", 
                    "馬単", "3連複", "3連単"];

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
    db.Horse.findAll({   
        where: {userId: req.session.login.id},
        order: [
            ['raceId', 'DESC']
        ]             
    }).then(hoese => {     
        db.BettingTicket.findAll({   
            where: {userId: req.session.login.id},
            order: [
                ['raceId', 'DESC']
            ]             
        }).then(bets => {        
            if(bets == ""){            
                print("該当なし", "");  
                // htmlに送るデータ
                var data = {
                    title: "馬券戦績",     
                    bet: bets,   
                    horse: hoese,
                    err: null,                    
                }
                // 馬券戦績画面の表示
                res.render('bets/index', data);    
                return;     
            }      
            var raceId;
            
            if(Array.isArray(bets)){
                for(var i = 0; i < bets.length; i++){
                    raceId = bets[i].raceId;  
                    var url = createUrl(raceId, "result"); 
                    setRefund(url, raceId);
    
                }              
            }else{
                raceId = bets.raceId;
                var url = createUrl(raceId, "result"); 
                setRefund(url, raceId);
    
            }            
            
            db.Refund.findAll({
    
            })

            // htmlに送るデータ
            var data = {
                title: "馬券戦績",     
                bet: bets,   
                horse: hoese,
                err: null,                    
            }
            // 馬券戦績画面の表示
            res.render('bets/index', data);    
            return;                         
        });    
    });
});

// 払い戻しをホームページから取得
function setRefund(url, raceId){    
    // スクレイピングを開始
    client.fetch(url, function(urlerr, $, result, body){  
        db.Refund.findAll({         
            where: {raceId: raceId},
            order: [
                ['raceId', 'DESC']
            ]               

        }).then(ref => {     
            if(ref != ""){          
                print("すでに結果があります", raceId);

            }else{
                // 結果を取得
                var first;
                var second;
                var third;
                var win = [];
                var place = [];
                var bracket;
                var quinella;
                var wid = [];
                var exacta;
                var trio;
                var trifecta;                            
                var kind = ['Tansho', 'Fukusho', 'Wakuren', 'Umaren', 'Wide', 'Umatan', 'Fuku3', 'Tan3'];

                for(var j = 0; j < kind.length; j++){
                    var tr = 'tr[class='+kind[j]+']';
                    var text = "";
                    var result = $(tr).html(); 
                    // 結果が見つからない場合
                    if(result == null){
                        break;              
                    // 結果が見つかった場合
                    }else{
                    // 結果を取得
                        if(kind[j] == 'Tansho'){                                                                              
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            win = Number(tmp.replace(',', ''));                                    

                        }else if(kind[j] == 'Fukusho'){                                
                            text = '<td class="Result">'+'\n'+
                                '<div><span>';
                            tmp = getInfo(result, text, '<', 'num');
                            first = tmp;

                            text = '<div><span>'+ first +'</span></div>'+'\n'+
                            '<div><span></span></div>'+'\n'+
                            '<div><span></span></div><div><span>';
                            tmp = getInfo(result, text, '<', 'num');
                            second = tmp;

                            text = '<div><span>'+second+'</span></div>'+'\n'+
                            '<div><span></span></div>' +'\n'+
                            '<div><span></span></div><div><span>';
                            tmp = getInfo(result, text, '<', 'num');
                            third = tmp;                                

                            text = '<td class="Payout"><span>'
                            var tmp0 = getInfo(result, text, '円', 'text');
                            place.push(Number(tmp0.replace(',', '')));

                            text = '<td class="Payout"><span>' + tmp0 + '円<br>'
                            var tmp1 = getInfo(result, text, '円', 'text');
                            place.push(Number(tmp1.replace(',', '')));

                            text = '<td class="Payout"><span>'+ tmp0 + '円<br>'+ tmp1 + '円<br>'
                            tmp = getInfo(result, text, '円', 'text');
                                place.push(Number(tmp.replace(',', '')));                                         

                        }else if(kind[j] == 'Wakuren'){                                
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            bracket = Number(tmp.replace(',', ''));                                

                        }else if(kind[j] == 'Umaren'){                                
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            quinella = Number(tmp.replace(',', ''));                                

                        }else if(kind[j] == 'Wide'){                                
                            text = '<td class="Payout"><span>'
                            var tmp0 = getInfo(result, text, '円', 'text');
                            wid.push(Number(tmp0.replace(',', '')));

                        text = '<td class="Payout"><span>' + tmp0 + '円<br>'
                            var tmp1 = getInfo(result, text, '円', 'text');
                            wid.push(Number(tmp1.replace(',', '')));

                            text = '<td class="Payout"><span>'+ tmp0 + '円<br>'+ tmp1 + '円<br>'
                            tmp = getInfo(result, text, '円', 'text');
                            wid.push(Number(tmp.replace(',', '')));                                

                        }else if(kind[j] == 'Umatan'){                                
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            exacta = Number(tmp.replace(',', ''));                                                                

                        }else if(kind[j] == 'Fuku3'){                                
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            trio = Number(tmp.replace(',', ''));                                

                        }else{                                
                            text = '<td class="Payout"><span>'                            
                            tmp = getInfo(result, text, '円', 'text');
                            trifecta = Number(tmp.replace(',', ''));                                
                            
                        }                         
                    }                             
                }                       

                db.Refund.create({
                    raceId: raceId,
                    first: first,
                    second: second,
                    third: third,
                    win: win,                    
                    place: place,
                    bracket: bracket,
                    quinella: quinella,
                    wid: wid,
                    exacta: exacta,
                    trio: trio,
                    trifecta: trifecta,
                
                });       
                print("処理終了", raceId);          
            }
        });          
    });   

    return   
}  

// データを削除する
router.get('delete/:id', function(req, res, next){

})

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
        raceId: null,
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
            raceId: null,
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
        var raceId = getRaceId(date, place, count, day, num);
        // スクレイピングするwebのURLを取得
        var url = createUrl(raceId, "shutuba");
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
                raceId: raceId,
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
    betsScreen(req, res, err, null, null, null);
    
})

// 馬券登録の処理
router.post('/select/:id', (req, res, next) => {
    // エラーを格納する
    var err = [];
    // 式別の取得
    var kind = req.body.hidkind;    
    // 方式の取得
    var comb = req.body.hidcomb;
    // 入力されているかチェック
    for(var i = 0; i < req.body.typeLen; i++){
        var tmp;
        switch(i){            
            case 0:                 
                tmp = req.body.btn1;                
            break;
            case 1: 
                tmp = req.body.btn2;
            break;
            case 2: 
                tmp = req.body.btn3;
            break;
        }       
        if(tmp == undefined){
            err.push("買い目が入力されていません。");
            break;
        }
    }
    if(req.body.money == 0){
        err.push('金額が入力されていません。');

    }

    // エラーがある場合
    if(err != ""){        
        betsScreen(req, res, err, null, kind, comb);

    // エラーがない場合
    }else{
        // ユーザIDを取得
    var userId = req.session.login.id;
    // レースIDを取得
    var raceId = req.params.id;
    // レース名
    var racename = req.body.racename;
    // 開催日時
    var date = String(raceId).substring(0, 4);
    // 開催場所
    var n = Number(String(raceId).substring(4, 6));
    var place = placeArr[n-1];   
    // 第何R
    var num = String(raceId).substring(10,12);    
    // 方式の数
    var combArr = getCombArr(kind);        
    // ボタンの数
    var elmLen = req.body.typeLen;
    // buttonの値
    var elm1 = [];
    var elm2 = [];
    var elm3 = [];
    for(var i = 0; i < elmLen; i++){
        var tmp;
        switch(i){            
            case 0:                 
                tmp = req.body.btn1;                
            break;
            case 1: 
                tmp = req.body.btn2;
            break;
            case 2: 
                tmp = req.body.btn3;
            break;
        }            
        
        print('tmp', Array.isArray(tmp)); 
        if(Array.isArray(tmp)){
            for(var j = 0; j < tmp.length; j++){
                switch(i){            
                    case 0:                 
                        elm1.push(tmp[j]);  
                        print('elm1', elm1)        
                    break;
                    case 1: 
                        elm2.push(tmp[j]);
                    break;
                    case 2: 
                        elm3.push(tmp[j]); 
                    break;
                }        
            }   
        }else{
            elmLen = 1;
            switch(i){            
                case 0:                 
                    elm1 = tmp;                        
                break;
                case 1: 
                    elm2 = tmp;  
                break;
                case 2: 
                    elm3 = tmp;  
                break;
            }        
        }             
    }
    
    var elm = [elm1, elm2, elm3];

    // 組み合わせ総数を取得    
    var combNum = calcCombNum(kind, comb, combArr, elm);    
    if(comb == "フォーメーション"){
        var combDel = 0;
        if(elmLen == 2){            
            for(var i = 0; i < elm[0].length; i++){
                for(var j = 0; j < elm[1].length; j++){
                    if(elm[0][i] == elm[1][j]){
                        combDel++;
                    }
                }
            }            
        }else{
            for(var i = 0; i < elm[0].length; i++){
                for(var j = 0; j < elm[1].length; j++){
                    for(var k = 0; k < elm[2].length; k++){
                        if(elm[0][i] == elm[1][j]){
                            combDel++;
                        }
                        if(elm[0][i] == elm[2][k]){
                            combDel++;
                        }
                        if(elm[1][j] == elm[2][k]){
                            combDel++;
                        }
                    }
                }
            }     

        }     
        combNum -= combDel;
        
    }
    
    // 賭け金の取得
    var money = req.body.money * combNum;
        

    // 入力内容が正しいかチェック
    if(money % 100 != 0){
        err.push('金額は100円単位で入力してください。');

    }
    if(comb == "通常"){

        if(elmLen == 2){            
            for(var i = 0; i < elm[0].length; i++){
                for(var j = 0; j < elm[1].length; j++){
                    if(elm[0][i] == elm[1][j]){
                        err.push("同じ出走馬を選択しています。");
                    }
                }
            }            
        }else{
            for(var i = 0; i < elm[0].length; i++){
                for(var j = 0; j < elm[1].length; j++){
                    for(var k = 0; k < elm[2].length; k++){
                        if(elm[0][i] == elm[1][j]){
                            err.push("同じ出走馬を選択しています。");
                        }else if(elm[0][i] == elm[2][k]){
                            err.push("同じ出走馬を選択しています。");
                        }else if(elm[1][j] == elm[2][k]){
                            err.push("同じ出走馬を選択しています。");
                        }
                    }
                }
            }     
        }
    }     
    // エラーがない場合
    if(err == ""){
        const dbBettingTicket = {
            userId: userId,
            raceId: raceId,
            date: date,
            place: place,
            num: num,
            racename: racename,   
            money: money,     
            kind: kind,
            comb: comb,
            elm: elm,
            elmLen: elmLen,
            combNum: combNum,
        }   
        db.BettingTicket.create({
            userId: dbBettingTicket.userId,
            raceId: dbBettingTicket.raceId,
            date: dbBettingTicket.date,
            place: dbBettingTicket.place,
            num: dbBettingTicket.num,
            racename: dbBettingTicket.racename,   
            money: dbBettingTicket.money,     
            kind: dbBettingTicket.kind,
            comb: dbBettingTicket.comb,
            elm: dbBettingTicket.elm,
            elmLen: dbBettingTicket.elmLen,
            combNum: dbBettingTicket.combNum,
        });
        print("馬券登録完了", 'hoge');

        db.BettingTicket.findAll({   
            where: {userId: req.session.login.id},
            order: [
                ['createdAt', 'DESC']
            ]             
        }).then(bets => { 
            var betId;          
            if(Array.isArray(bets)){
                betId = bets[0].id;
            }else{
                betId = bets.id;
            }                                           
        var name = "";
        var horseMoney = 0;
        for(var n = 0; n < 50; n++){
            switch(n){            
                case 0:                 
                    tmp = req.body.name1;                
                break;
                case 1: 
                    tmp = req.body.name2;
                break;
                case 2: 
                    tmp = req.body.name3;
                break;
                case 3: 
                    tmp = req.body.name4;
                break;
                case 4: 
                    tmp = req.body.name5;
                break;
                case 5: 
                    tmp = req.body.name6;
                break;
                case 6: 
                    tmp = req.body.name7;
                break;
                case 7: 
                    tmp = req.body.name8;
                break;
                case 8: 
                    tmp = req.body.name9;
                break;
                case 9: 
                    tmp = req.body.name10;
                break;
                case 10: 
                    tmp = req.body.name11;
                break;
                case 11: 
                    tmp = req.body.name12;
                break;
                case 12: 
                    tmp = req.body.name13;
                break;
                case 13: 
                    tmp = req.body.name14;
                break;
                case 14: 
                    tmp = req.body.name15;
                break;
                case 15: 
                    tmp = req.body.name16;
                break;
                case 16: 
                    tmp = req.body.name17;
                break;
                case 17: 
                    tmp = req.body.name18;
                break;                
            }                              
            if(tmp == undefined){
                break;
            }
            print("tmp", tmp);
            print("elmLen", elmLen);
            // 買った馬を登録             
            for(var i = 0; i < elmLen; i++){
                if(Array.isArray(elm[i])){
                    for(var j = 0; j < elm[i].length; j++){                  
                        if((n+1) == elm[i][j]){
                            name = tmp;
                            
                            if(kind == kindArr[2] || kind == kindArr[3] || kind == kindArr[4] || kind == kindArr[5]){                            
                                if(comb != "通常" && comb != "ボックス" && comb != "フォーメーション"){
                                    if(i == 0){
                                        horseMoney += money;
                                    }else{
                                        horseMoney += money/combNum;
                                    }
        
                                }else if(comb == "ボックス"){                                
                                    horseMoney = money*2/combNum; 
                                }else{
                                    horseMoney += money/combNum;
                                }
                            }else if(kind == kindArr[6] || kind == kindArr[7]){
                                if(comb != "通常" && comb != "ボックス" && comb != "フォーメーション"){
                                    if(elm[i].length == 1){
                                        horseMoney += money;
                                    }else{
                                        horseMoney += money/combNum;
                                    }
        
                                }else if(comb == "ボックス"){                                
                                    horseMoney = money*3/combNum; 
                                }else{
                                    horseMoney += money/combNum;
                                }
    
                            }else{
                                horseMoney += money/combNum;
                            }                                         
                        }
                    }       
                }else{
                    if((n+1) == elm[i]){                        
                        name = tmp;
                        horseMoney = money;

                    }                    
                }   
                const dbHorse = {
                    userId: userId,
                    betId: betId,
                    raceId: raceId,
                    name: name,
                    date: date,
                    place: place,
                    num: num,
                    racename: racename,   
                    money: horseMoney,             
                }    
                if(horseMoney != 0){
                    db.Horse.create({
                        userId: dbHorse.userId,
                        betId: dbHorse.betId,
                        raceId: dbHorse.raceId,
                        name: dbHorse.name,
                        date: dbHorse.date,
                        place: dbHorse.place,
                        num: dbHorse.num,
                        racename: dbHorse.racename,   
                        money: dbHorse.money, 
                    })
                    print("name", name);
                    print("horseMoney", horseMoney);   
                }
            }                                                        
            name = "";
            horseMoney = 0;
        }           

        betsScreen(req, res, err, dbBettingTicket, kind, comb);
        })
    // エラーがある場合
    }else{
        betsScreen(req, res, err, null, null, kind, comb);
        

    }        
    
    

    }    
});

function betsScreen(req, res, err, dbBet, k, c){        
    // レースIDを取得
    var raceId = req.params.id;    
    // 開催年を取得
    var year = raceId.substring(0, 4);
    // スクレイピングするwebのURLを取得
    var url = createUrl(raceId, "shutuba");
    // 馬券の種類を取得(最初は単勝)
    var kind = req.query.kind;    
    if(kind == undefined){   
        if(k != null){
            kind = k;
        }else{
            kind = kindArr[0];            
        }          
    }

    // 馬券の種類に応じた組み合わせを取得
    var combArr = getCombArr(kind);    
    // 組み合わせを取得(最初は通常);
    var comb = req.query.comb;    
    if(c != null){
        comb = c;
    }
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
    // ヘッダーの長さ
    var headerLen;
    for(var i = 0; i < 3; i++){
        if(header[i] != ""){
            headerLen = i + 1;

        }
    }

    // ボタンのタイプを取得
    var type = getType(kind, comb, combArr);
    // ボタンのタイプの長さ
    var typeLen;
    for(var i = 0; i < 3; i++){
        if(type[i] != ""){
            typeLen = i + 1;

        }
    }
    // ヘッダーをボタンの長さと合わせるための値

    var colspan = typeLen - headerLen + 1;        
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
            id: raceId,
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
            err: err,          
            racename: racename,
            dbBet: dbBet,            
        }

        res.render('bets/add', data);            

    });                 

}

// 組み合わせの数を計算
function calcCombNum(k, c, cArr, btn){
    var combNum = 0;
    switch(k){
        // 単勝
        case kindArr[0]:        
            if(Array.isArray(btn[0])){
                combNum = btn[0].length;            
            }else{
                combNum = 1;
            }           
            break;

        // 複勝
        case kindArr[1]:
            if(Array.isArray(btn[0])){
                combNum = btn[0].length;            
            }else{
                combNum = 1;
            }    
            break;

        // 枠連
        case kindArr[2]:              
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1;    

                break;
                // ながし
                case cArr[1]:
                    if(Array.isArray(btn[1])){
                        combNum = btn[1].length;            
                    }else{
                        combNum = 1;
                    }
                
                break;
                // ボックス
                case cArr[2]:
                    combNum = btn[0].length*(btn[0].length - 1)/2;                     
                
                break;
                // フォーメーション
                case cArr[3]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length;
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length;
                    }else{
                        combNum = btn[0].length * btn[1].length;

                    }                                
                break;

            }
                   
            break;

        // 馬連
        case kindArr[3]:
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1;

                break;
                // ながし
                case cArr[1]:
                    if(Array.isArray(btn[1])){
                        combNum = btn[1].length;            
                    }else{
                        combNum = 1;
                    }
                
                break;
                // ボックス
                case cArr[2]:
                    combNum = btn[0].length*(btn[0].length - 1)/2;                     
                
                break;
                // フォーメーション
                case cArr[3]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length;
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length;
                    }else{
                        combNum = btn[0].length * btn[1].length;

                    }                                
                break;


            }
            break;
            
        // ワイド
        case kindArr[4]:
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1;

                break;
                // ながし
                case cArr[1]:
                    if(Array.isArray(btn[1])){
                        combNum = btn[1].length;            
                    }else{
                        combNum = 1;
                    }
                
                break;
                // ボックス
                case cArr[2]:
                    combNum = btn[0].length*(btn[0].length - 1)/2;                     
                
                break;
                // フォーメーション
                case cArr[3]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length;
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length;
                    }else{
                        combNum = btn[0].length * btn[1].length;

                    }                                
                break;

            }
            break;

        // 馬単
        case kindArr[5]:
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1;

                break;
                // 1着ながし
                case cArr[1]:
                    if(Array.isArray(btn[1])){
                        combNum = btn[1].length;            
                    }else{
                        combNum = 1;
                    }                    
                
                break;
                // 2着ながし
                case cArr[2]:
                    if(Array.isArray(btn[0])){
                        combNum = btn[0].length;            
                    }else{
                        combNum = 1;
                    }                    
                
                break;
                // ボックス
                case cArr[3]:
                    combNum = btn[0].length*(btn[0].length - 1)/2;     
                
                break;
                // フォーメーション
                case cArr[4]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length;
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length;
                    }else{
                        combNum = btn[0].length * btn[1].length;

                    }   
                
                break;

            }        
            break;

        // 3連複
        case kindArr[6]:
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1;

                break;
                // 軸1頭ながし
                case cArr[1]:
                    combNum = btn[1].length*(btn[1].length - 1)/2;  
                
                break;
                // 軸2頭ながし
                case cArr[2]:
                    if(Array.isArray(btn[2])){
                        combNum = btn[2].length;  

                    }else{
                        combNum = 1;

                    }                       
                
                break;
                // ボックス
                case cArr[3]:
                    combNum = btn[0].length*(btn[0].length - 1)*(btn[0].length - 2)/3;  
                
                break;
                // フォーメーション
                case cArr[4]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1]) && Array.isArray(btn[2])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = btn[2].length;  
                    }else if(Array.isArray(btn[0]) && Array.isArray(btn[2])){
                        combNum = btn[1].length;  
                    }else if(Array.isArray(btn[1]) && Array.isArray(btn[2])){
                        combNum = btn[0].length;  
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length*btn[2].length;  
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length*btn[2].length;  
                    }else if(Array.isArray(btn[2])){
                        combNum = btn[0].length*btn[1].length;  
                    }else{
                        combNum = btn[0].length*btn[1].length*btn[2].length;  

                    }   
                    
                
                break;                

            }        
        
            break;

        // 3連単
        case kindArr[7]:
            switch(c){
                // 通常
                case cArr[0]:
                    combNum = 1; 

                break;
                // 1着ながし
                case cArr[1]:
                    combNum = btn[1].length*(btn[1].length - 1)/2;  
                
                break;
                // 2着ながし
                case cArr[2]:
                    combNum = btn[1].length*(btn[1].length - 1)/2;  
                
                break;
                // 3着ながし
                case cArr[3]:
                    combNum = btn[1].length*(btn[1].length - 1)/2;  
                
                break;
                // 1・2着ながし
                case cArr[4]:
                    if(Array.isArray(btn[2])){
                        combNum = btn[2].length;  

                    }else{
                        combNum = 1;

                    }                         
                
                break;     
                // 1・3着ながし           
                case cArr[5]:
                    if(Array.isArray(btn[1])){
                        combNum = btn[1].length;  

                    }else{
                        combNum = 1;

                    }                         
                
                break;             
                // 2・3着ながし   
                case cArr[6]:
                    if(Array.isArray(btn[0])){
                        combNum = btn[0].length;  

                    }else{
                        combNum = 1;

                    }                         
                
                break;             
                // ボックス   
                case cArr[7]:
                    combNum = btn[0].length * (btn[0].length - 1) * (btn[0].length - 2); 
                // フォーメーションs
                break;                
                case cArr[8]:
                    if(Array.isArray(btn[0]) && Array.isArray(btn[1]) && Array.isArray(btn[2])){
                        combNum = 1;         
                    }else if(Array.isArray(btn[0]) && Array.isArray(btn[1])){
                        combNum = btn[2].length;  
                    }else if(Array.isArray(btn[0]) && Array.isArray(btn[2])){
                        combNum = btn[1].length;  
                    }else if(Array.isArray(btn[1]) && Array.isArray(btn[2])){
                        combNum = btn[0].length;  
                    }else if(Array.isArray(btn[0])){
                        combNum = btn[1].length*btn[2].length;  
                    }else if(Array.isArray(btn[1])){
                        combNum = btn[0].length*btn[2].length;  
                    }else if(Array.isArray(btn[2])){
                        combNum = btn[0].length*btn[1].length;  
                    }else{
                        combNum = btn[0].length*btn[1].length*btn[2].length;  

                    }                                       
                break;                                          

            }        
        
            break;
    }
    return combNum;
}

// 馬券に応じた組み合わせ方を取得
function getCombArr(k){
    var combArr = [];
    combArr.push("通常");
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

    if(k != kindArr[0] && k != kindArr[1]){
        combArr.push("ボックス");
        combArr.push("フォーメーション");
    }
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