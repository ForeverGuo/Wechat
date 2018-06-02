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
    scan_pay:'../pic/61.png',
    hand_pay:'../pic/6.png'
  },
  onShow:function(){
    
  },
  onReady:function(e){
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
            app.data.userOpenId = res['data'].openid;
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
                  default:

                }
              }
            })

          }
        })
      }
    })

  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
     app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  payMoney:function(){
    var that = this;
    wx.showToast({
      title: '正在加载中',
    })
    var flag = that.data.hand_pay === '../pic/6.png' ? true : false;
    if(flag){
        that.handCode()
    }else{
       that.scanCode()
    }
  
  },
  wmhg_voice:function(){
    backgroundAudioManager.title = "伪满皇宫导览简介";
    backgroundAudioManager.src = 'https://wmhg.cenwei.net/wx/miniprogram/vioce/first-info.mp3';
    backgroundAudioManager.coverImgUrl = '../../images/2.jpg';
  },
  scanCode: function () {
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        var str = res.result;
        wx.request({
          url: 'https://wmhg.cenwei.net/wx/miniprogram/Api_dlticket.php',
          method: 'POST',
          data: {
            openid: app.data.userOpenId,
            str: str,
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          success: function (res) {
              wx.showToast({
                title: '扫码成功',
              })
              var code = res['data'].static;
              switch (code) {
                case 1:
                  wx.redirectTo({
                    url: '../map/map'
                  })
                  break;
                case 2:
                  wx.showToast({
                    title: '无效导览卷',
                    duration: 3000
                  })
                  break;
                case 3:
                  wx.showToast({
                    title: '已经拥有使用资格',
                    duration: 3000
                  })
                  break;
                default:

              }
          },
          fail:function(res){
            
          },
          complete:function(){
           
          }

        })  
      },
      fail:(res)=>{
        wx.showToast({
          title: '扫码失败',
        })
      },
      complete:(res)=>{
        wx.showToast({
          title: '扫码完成',
        })
      }
    })
  },
  handCode:function(){
    wx.login({
      //获取code
      success: function (res) {
        var code = res.code; //返回code
        
        wx.request({
          url: 'https://wmhg.cenwei.net/wx/miniprogram/Api_dl_pay_orderceshi.php',
          method: 'POST',
          data: {
            code: res.code,
            totalfee: '1.00',
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          success: function (res) {
            wx.requestPayment(
              {
                'timeStamp': res.data.timeStamp,
                'nonceStr': res.data.nonce_str,
                'package': "prepay_id=" + res.data.prepay_id,
                'signType': 'MD5',
                'paySign': res.data.paysign,
                'success': function (res1) {
                  wx.showToast({
                    title: '支付成功',
                    icon: 'success',
                    duration: 2000
                  })
                  wx.redirectTo({
                    url: '../map/map'
                  })
                },
                'fail': function (res1) {
                  wx.showToast({
                    title: '支付失败,请重新支付',
                  })
                },
                'complete': function (res1) {
                  
                }
              })
          }
        })
      }
    })
  },
  handPay:function(){
      var that =this;
      var flag = that.data.hand_pay === '../pic/6.png' ? true : false;
      if(flag){    
      }else{
        that.setData({
          hand_pay:'../pic/6.png',
          scan_pay:'../pic/61.png'
        })
      }
  },
  scanPay: function () {
    var that = this;
    var flag = that.data.scan_pay === '../pic/61.png' ? true : false;
    if (flag) {
      that.setData({
        scan_pay:'../pic/6.png',
        hand_pay:'../pic/61.png'
      })
    } else {
    }
  }

})
