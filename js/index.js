$(function(){

    console.log('ready');
    var baseurl = 'http://s.chinabed.com',//接口根路径
    API = {
        GETCONFIG: baseurl + '/wx/getConfig',//微信分享活动
        GETACCESSTOKEN: baseurl + '/wx/code2token',//获取accesstoken
        REFRESHACCESSTOKEN: baseurl + '/wx/refreshToken',//刷新accesstoken 没有用到
        GETUSERINFO: baseurl + '/wx/getUserInfo',//获取用户信息
        SENDSMS: baseurl + '/sms/sendSMS',//发送短信
        CHECKRAFFLERIGHT: baseurl + '/activity/activity/checkRaffleRight',//查询是否有抽奖资格
        GETPRIZEINFO: baseurl + '/activity/activity/getPrizeInfo',//查询当前奖品的情况
        REGISTERUSER: baseurl + '/activity/activity/registerUserAndActivity',//进入活动时注册用户，并关联抽奖活动
        INSERTPRIZE: baseurl + '/activity/activity/insertGetPrizeInfo',//用户中奖后，插入中奖记录，并减少对应奖品数量
        UPDATEUSERINFO: baseurl + '/activity/activity/updateUserInfo',//填写个人资料更新
        GETUSERPRIZE: baseurl + '/activity/activity/getUserPrize',// 查询用户已获得奖品
        UPDATEGETPRIZEINFO: baseurl + '/activity/activity/updateGetPrizeInfo',//用户核销奖品，更新中奖记录
        UPDATESHARESTATE: baseurl + '/activity/activity/updateShareState',//分享后更新抽奖次数
        GETUSERPRIZERECORD: baseurl + '/activity/activity/getUserPrizeRecord',//返回最新5条中奖信息
        GETAUTH: baseurl + '/wx/getAuth',//获取微信授权
        UPDATEUSERQUESTIONS: baseurl + '/activity/activity/updateUserQuestions',//测试题插入答案
        ANSET:baseurl+'/activity/activity/getQuestionsByUserId'//测试题结果
    },
    access_token = '', 
    openid = '', 
    nickname = '', 
    userId = '', 
    smsCD = 0, 
    timer = null,
    prizes=[];

    var timeOutEvent=0;//定时器  

    //获取url地址中的code
    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) 
            return unescape(r[2]); 
        return null;
    }

    var urlCode = getQueryString('code');
    console.log(urlCode)
    //if(!urlCode) window.location.href = "http://s.chinabed.com/wx/getAuth";


    configWX();//分享接口函数
    getUserInfo();//获取用户微信中的信息函数
    getPrizeInfo();//获取奖品列表

    //获取用户微信中的信息
    function getUserInfo (){
        $.ajax({
            type: "POST",
            url: API.GETACCESSTOKEN,
            data:{
                code:getQueryString('code')
            },
            dataType: "json",
            success:function(res){
                if(res.state == 'ok'){
                    access_token = res.access_token;
                    openid = res.openid;
                    $.ajax({
                        type: "POST",
                        url: API.GETUSERINFO,
                        data:{
                            // code:getQueryString('code'),
                            access_token:res.access_token,
                            openid: res.openid
                        },
                        dataType: "json",
                        success: function(ress){
                            console.log(ress);
                            nickname = ress.nickname;
                            $.ajax({
                                type: "POST",
                                url: API.REGISTERUSER,
                                data:{
                                    nickname:ress.nickname,                                            
                                    openId: ress.openid,
                                    province:ress.province,
                                    avatarUrl:ress.headimgurl,
                                    country:ress.country,
                                    gender:ress.sex,
                                    language:ress.language
                                },
                                dataType: "json",
                                success:function(response){
                                    console.log(response)
                                    userId = response.userId
                                    sessionStorage.setItem("userId", userId);
                                }
                            })
                        }
                    })
                }
            }  
        })
    }



    //将用户选择的答案传入后台
    function postAfferent(data){
        $.ajax({
            type: "POST",
            url: API.UPDATEUSERQUESTIONS,
            data:data,
            dataType: "json",
            success:function(res){
                console.log(res);
            }
        })
    }

    //获取奖品列表
    function getPrizeInfo() {
        $.ajax({
            type: "POST",
            url: API.GETPRIZEINFO,
            data:{
                // code:getQueryString('code')
            },
            dataType: "json",
            success:function(res){
                console.log(res);
                prizes = res.data;
                // drawLottery(prizes);
            }
        })
    }


	

    //抽奖 首先检查一下是否有抽奖资格
    var rotating = false, currentPrizeIndex = 0, currentPrizeAngle = 90;
    $('.go_btn').on('click',function(e){
        //showLotteryTosat(1)
        if(rotating) return;
        $.ajax({
            type: "POST",
            url: API.CHECKRAFFLERIGHT,
            data:{
                userId:50
            },
            dataType: "json",
            success: function(res){
                console.log(res)
                // 有，可以抽奖
                if(res.state == 'ok'){
                    var prizeIndex = calculcatePrize();
                    console.log('prize index: ' + prizeIndex);
                    rotating = true;
                    $('.turn').animate({
                        rotateZ: parseInt(currentPrizeAngle) + parseInt('-' + (3 * 360 + (prizeIndex-currentPrizeIndex)*360/prizes.length )) + 'deg'
                    }, 3000,'ease-out',function(){
                        // save rotate result
                        // rotating = false;
                        currentPrizeAngle = parseInt(currentPrizeAngle) + parseInt('-' + (3 * 360 + (prizeIndex-currentPrizeIndex)*360/prizes.length ));
                        console.log('currentPrizeAngle: ' + currentPrizeAngle);
                        currentPrizeIndex = prizeIndex;
                        console.log('currentPrizeIndex: ' + currentPrizeIndex);
                        $.ajax({
                            type: "POST",
                            url: API.INSERTPRIZE,
                            data:{
                                userId:userId,
                                prizeId: prizes[prizeIndex].id
                            },
                            dataType: "json",
                            success:function(res){
                                console.log(res)                                            
                            }                
                        })
                        // show toast
                        if(prizeIndex==0){
                            $('.win_toast .win_content .prize_name').html("<span>赢得价值￥<span>"+prizes[prizeIndex].name+"</span>大奖</span>");
                        }
                        $('.win_toast .win_content .prize_name').html("<span>赢得<span>"+prizes[prizeIndex].name+"</span>大奖</span>");
                        console.log(prizes[prizeIndex].name)
                        showLotteryTosat(1);
                    });                                
                }else{
                    alert("暂无抽奖资格，分享可获得一次抽奖资格")
                }   
            }
        })
    })


    //获取短信验证码
    $('.win_content > div.verify > div').on('click',function(){
        if(smsCD > 0) return;
        var tel = $('.win_content > div.tel > input[type="tel"]').val();
        console.log(tel)
        if((/^1[34578]\d{9}$/.test(tel)) && smsCD == 0){
            $.ajax({
                type: "POST",
                url: API.SENDSMS,
                data:{
                    mobilenumber:tel
                },
                dataType: "json",
                success: function(res){
                    if(res.state == 'ok'){
                        smsCD = 30;
                        timer = setInterval(function(){
                            if(smsCD > 0){
                                smsCD --;
                                $('.win_content > div.verify > div').text(smsCD + 's后重发');
                            } else{
                                $('.win_content > div.verify > div').text('获取验证码');
                                clearInterval(timer);
                            }
                        },1000)
                    }
                }
            })
        }
    })

    //查看测试结果
    $('.see_btn').on('click',function(){
        // var tel = $('.win_content > div.tel > input[type="tel"]').val();
        // var scm = $('.win_content > div.verify > input[type="scm"]').val();
        // if(tel==''){
        //     alert("请填写手机号")
        //     return;
        // }
        // if(scm==''){
        //     alert("请填写验证码")
        //     return;
        // }
        switchScene(9);
        $.ajax({
            type:"GET",
            url:API.ANSET,
            data:{
                userId:50
            },
            dataType:'json',
            success:function(res){
                console.log(res)
                html2canvas($('.result').get(0), {   //$('.page-haibao').get(0)相当于doucument.getEelementsByClassName

                                         // ("page-haibao")，该参数是以需要html2canvas以.page-haibao标签为

                                         //画布，该画图是.container下的设计图的宽高，

                useCORS: true
              }).then((canvas) => {       
                var dataURL = canvas.toDataURL('image/jpeg');//保存 html2canvas生成图片的路径dataURL 。
                $('#haibao').attr('src', dataURL);//将图片保存在#haibao标签图片里面。
         
              })
                var list = res.list;
                var content = template('useranse',{items:list[0]});
                $('#cstjg').html('');//现将内容清空
                $('#cstjg').append(content);
            }
        })
    })


    //获取中奖列表
    getPrizeRecord();
    function getPrizeRecord(){
        console.log(111)
        $.ajax({
            type: "POST",
            url: API.GETUSERPRIZERECORD,
            data:{
                // code:getQueryString('code')
            },
            dataType: "json",
            success:function(res){
                console.log(res);
                var list = res.list;
                var content = template('userList',{items:list});
                $('#userContent').html('');//现将内容清空
                $('#userContent').append(content);
            }
        })
    }

    //顶部轮播中奖列表
    topgetPrizeRecord();
    function topgetPrizeRecord(){
        console.log(111)
        $.ajax({
            type: "POST",
            url: API.GETUSERPRIZERECORD,
            data:{
                // code:getQueryString('code')
            },
            dataType: "json",
            success:function(res){
                console.log(res);
                var list = res.list;
                var content = template('topuserList',{items:list});
                $('#topuserContent').html('');//现将内容清空
                $('#topuserContent').append(content);
            }
        })
    }

    //查询中奖纪录
    updateUserRecord();
    function updateUserRecord(){
        $.ajax({
            type: "POST",
            url: API.GETUSERPRIZE,
            data:{
                userId: 50
            },
            dataType: "json",
            success:function(response){
                console.log(response)
                if(response.state=='ok'){
                    var list = response.list;
                    var content = template('recordList',{items:list});
                    $('#recordContent').html('');//现将内容清空
                    $('#recordContent').append(content);
                }
            }
        })
    }


    //分享接口设置
    function configWX(){
        $.ajax({
            type: "POST",
            url: API.GETCONFIG,
            data:{
                conUrl:window.location.href
            },
            dataType: "json",
            success: function(res){
                console.log(res);
                // config wechat here
                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: res.appId, // 必填，公众号的唯一标识
                    timestamp: res.timestamp, // 必填，生成签名的时间戳
                    nonceStr: res.nonceStr, // 必填，生成签名的随机串
                    signature: res.signature,// 必填，签名，见附录1
                    jsApiList: [
                        'showOptionMenu',
                        'onMenuShareTimeline',
                        'onMenuShareAppMessage',
                        'getLocation'//获取用户地理位置
                        // 'onMenuShareQQ',
                        // 'onMenuShareWeibo',
                        // 'onMenuShareQZone'
                    ] // 必填，需要使用的JS接口列表
                });
            },
            error: function(xhr, type, err){
                console.log(err);
            }
        })
        wx.ready(function(){
            wx.onMenuShareTimeline({
                title: '床品见人品,喜临门一测便知',
                desc: '走进喜临门，蜜月时光，让爱更“亲密”',
                link: 'http://s.chinabed.com/wx/getAuth',
                imgUrl: 'http://s.chinabed.com/favicon.ico',
                trigger: function (res) {
                    // 不要尝试在trigger中使用ajax异步请求修改本次分享的内容，因为客户端分享操作是一个同步操作，这时候使用ajax的回包会还没有返回
                // alert('用户点击发送给朋友圈111');
                },
                success: function (res) {
                // alert('已分享');
                    $.ajax({
                        type: "POST",
                        url: API.UPDATESHARESTATE,
                        data:{
                            userId:userId
                        },
                        dataType: "json",
                        success: function(res){
                            console.log(res);
                            if(res.state == 'ok')
                                rotating = false;
                                console.log('share state updated')
                        }
                    })
                },
                cancel: function (res) {
                //   alert('已取消');
                },
                fail: function (res) {
                // alert(JSON.stringify(res));
                }
            });
            wx.onMenuShareAppMessage({
                title: '床品见人品,喜临门一测便知',
                desc: '走进喜临门，蜜月时光，让爱更“亲密”',
                link: 'http://s.chinabed.com/wx/getAuth',
                imgUrl: 'http://s.chinabed.com/favicon.ico',
                type: 'link', // 分享类型,music、video或link，不填默认为link
                dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                trigger: function (res) {
                    // 不要尝试在trigger中使用ajax异步请求修改本次分享的内容，因为客户端分享操作是一个同步操作，这时候使用ajax的回包会还没有返回
                // alert('用户点击发送给朋友111');
                },
                success: function (res) {
                // alert('已分享');
                    $.ajax({
                        type: "POST",
                        url: API.UPDATESHARESTATE,
                        data:{
                            userId:userId
                        },
                        dataType: "json",
                        success: function(res){
                            console.log(res);
                            if(res.state == 'ok')
                                console.log('share state updated')
                        }
                    })
                },
                cancel: function (res) {
                // alert('已取消');
                },
                fail: function (res) {
                // alert(JSON.stringify(res));
                }
            });

            wx.getLocation({
              success: function (res) {
                alert(JSON.stringify(res));
              },
              cancel: function (res) {
                alert('用户拒绝授权获取地理位置');
              }
            });

        });
    }


    function switchScene (number){
        $('.container > div > div').hide();
        $('.container > div > div:nth-child('+ number +')').show();
    }

    function showLotteryTosat(num){
        $('#app > div > div > .draw > div.win_mask').show();
        if(num == 1){//中奖了
            // console.log(num)
            $('div.win_mask > div.win_toast').show();
            $('div.win_mask > div.win_list').hide();
            $('div.win_mask > div.arrow').hide();
        }else if(num == 2){//中奖名单
            $('div.win_mask > div.win_toast').hide();
            $('div.win_mask > div.win_list').show();
            $('div.win_mask > div.arrow').hide();
        }else{//分享
            $('div.win_mask > div.win_toast').hide();
            $('div.win_mask > div.win_list').hide();
            $('div.win_mask > div.arrow').show();
        }
    }
    //隐藏所有弹框
    function hideLotteryToast(){
        $('.draw > div.win_mask').hide();
        $('.drawr > div.win_mask > div.win_toast').hide();
        $('.draw > div.win_mask > div.win_list').hide();
        $('.draw > div.win_mask > div.arrow').hide();
    }

    switchScene(6)
    //点击进入测试
    $('.goin_box').on('click',function(){
        var userName = $('.guide .input_box > input[type="username"]').val();
        if (userName=='') {alert('请填写你的姓名'); return}
        sessionStorage.setItem("userName", userName);
        switchScene(2);
    })

    //点击测一测
    $('.cyc_btn').on('click',function(){
        switchScene(2);
    })

    //第一题
    $('.problem').on('click', function(e){ 
        var id=$(this).attr('data-id');
        console.log(id)
        sessionStorage.setItem("one", id);
        switchScene(3);
    })
    //第二题
    $('.sleeping').on('click', function(e){ 
        var id=$(this).attr('data-id');
        console.log(id)
        sessionStorage.setItem("two", id);
        switchScene(4);
    })
    //第三题
    $('.bed').on('click', function(e){ 
        var id=$(this).attr('data-id');
        console.log(id)
        sessionStorage.setItem("three", id);
        switchScene(5);
    })
    //第四题
    $('.room').on('click', function(e){ 
        var id=$(this).attr('data-id');
        console.log(id)
        sessionStorage.setItem("four", id);
        var data={
            one:sessionStorage.getItem('one'),
            two:sessionStorage.getItem('two'),
            three:sessionStorage.getItem('three'),
            four:sessionStorage.getItem('four'),
            // userId:sessionStorage.getItem('userId')
            userId:50,
            realname:sessionStorage.getItem('userName'),
        }
        postAfferent(data);
        switchScene(6);
    })

    //抽奖规则
    $('.rule_btn').on('click',function(e){
    	switchScene(7);
    })

    //点击中奖名单
    $('.winning_btn').on('click',function(e){
        showLotteryTosat(2)
    })

    //点击分享
    $('.share').on('click',function(e){
        showLotteryTosat(3)
    })
    //点击我知道了
    $('.my_know').on('click',function(e){
        hideLotteryToast()
    })

    //点击我的中奖纪录
    $('.my_record').on('click',function(e){
        switchScene(8)
    })

    //点击门店地址
    $('.store_btn').on('click',function(e){
        switchScene(10)
    })

    //点击确认核销
    $('.exchange_btn').on('click',function(e){
        $('.record_mask').css("display","block");
    })
    //ok
    $('.sure_box').on('click',function(e){
        $.ajax({
            type: "POST",
            url: API.UPDATEGETPRIZEINFO,
            data:{
                userId: userId
            },
            dataType: "json",
            success:function(res){
                if(res.state == 'ok'){
                    alert("核销成功")
                    $('.record_mask').css("display","none");
                }
            }
        })
    })
    //取消
    $('.cancel_box').on('click',function(e){
        $('.record_mask').css("display","none");
    })

    //关闭按钮
    $('.colse_btn').on('click',function(e){
        hideLotteryToast();
    })

    //往期回顾
    $('.past_period').on('click',function(e){
        switchScene(11)
    })


    $('.loog').on({
        touchstart: function(e){
            console.log(e)
            timeOutEvent = setTimeout("longPress()",500);
            e.preventDefault();
        }
    })
    //门店返回按钮
    $('.back_btn').on('click',function(e){
        switchScene(8)
    })
    //开始长按
    // function gtouchstart(){   
    //     timeOutEvent = setTimeout("longPress()",500);//这里设置定时器，定义长按500毫秒触发长按事件，时间可以自己改，个人感觉500毫秒非常合适      
    // }; 

    //长按事件
    //真正长按后应该执行的内容   
    function longPress(){   
        timeOutEvent = 0;   
        //执行长按要执行的内容，如弹出菜单   
        alert("长按事件触发发");   
    }


    //转盘旋转角度
    function calculcatePrize(){ 
        var totalNum = 0, eachRatio = [];
        for(var i=0;i < prizes.length;i ++){
            totalNum += prizes[i].remain_num;
        }
        for(var i=0;i < prizes.length;i ++){
            var ratio = prizes[i].remain_num/totalNum;
            eachRatio.push(ratio);
        }
        console.log('ratio: ');
        console.log(eachRatio);
        var prizeRatio = Math.random();
        for(var i=0;i < prizes.length;i ++){
            if(prizeRatio <= eachRatio[i]) return i;
            else prizeRatio -= eachRatio[i];
        }
        return null;
    }
})