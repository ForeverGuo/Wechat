//index.js
//获取应用实例
const app = getApp()
const backgroundAudioManager = wx.getBackgroundAudioManager()
Page({
  data: {
    motto: '',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    wmhg:'../../images/wmhg-bak.jpg'
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onShow:function(){
    wx.login({
      //获取code
      success: function (res) {
        var code = res.code; //返回code
        wx.request({
          url: 'https://wmhg.cenwei.net/wx/miniprogram/getopenid.php',
          method: 'POST',
          data: {
            code: res.code,
            totalfee: '0.01',
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          success: function (res) {
            var openid = res['data'].openid;
            app.data.userOpenId = res['data'].openid
            wx.request({
              url: 'https://wmhg.cenwei.net/wx/miniprogram/ispay.php',
              method: "POST",
              data: {
                openid: openid
              },
              header: {
                'content-type': 'application/x-www-form-urlencoded',
              },
              success: function (res) {
                var flag = res['data'].ispay;
                switch (flag) {
                  case 1:
                    wx.redirectTo({
                      url: '../map/map'
                    })
                    break;
                  case 0:
                    wx.redirectTo({
                      url: '../pay/pay'
                    })
                    break;
                  default:

                }
              }
            })

          }
        })
      }
    })
  },
  onReady:function(e){
    this.wmhg_voice()
  },
  onLoad: function () {
  },
  wmhg_voice:function(){
    backgroundAudioManager.title = "伪满皇宫导览简介";
    backgroundAudioManager.src = 'https://wmhg.cenwei.net/wx/miniprogram/vioce/first-info.mp3';
    backgroundAudioManager.coverImgUrl = '../../images/2.jpg';
  },
  

})
