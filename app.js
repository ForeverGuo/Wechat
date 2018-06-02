//app.js
var amap = require('./utils/amap-wx.js');
App({
  data: {
    amap: amap,
    key: 'effb1d653a775883bdc9d8e61eeb4c5b',
    userOpenId:''
  },
  globalData:{
        plist:[]
    },
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId

              this.globalData.userInfo = res.userInfo
  
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    // wx.login({
    //   //获取code
    //   success: function (res) {
    //     var code = res.code; //返回code
    //     wx.request({
    //       url: 'https://wmhg.cenwei.net/wx/miniprogram/getopenid.php',
    //       method: 'POST',
    //       data: {
    //         code: res.code,
    //         totalfee: '0.01',
    //       },
    //       header: {
    //         'content-type': 'application/x-www-form-urlencoded',
    //       },
    //       success: function (res) {
    //         var openid = res['data'].openid;
    //         console.log(res['data'].openid)
    //         app.data.userOpenId = res['data'].openid;
    //         wx.request({
    //           url: 'https://wmhg.cenwei.net/wx/miniprogram/ispay.php',
    //           method: "POST",
    //           data: {
    //             openid: openid
    //           },
    //           header: {
    //             'content-type': 'application/x-www-form-urlencoded',
    //           },
    //           success: function (res) {
    //             console.log(res['data'].ispay)
    //             var flag = res['data'].ispay;
    //             switch (flag) {
    //               case 1:
    //                 wx.navigateTo({
    //                   url: '../map/map'
    //                 })
    //                 break;
    //               case 0:
    //                 wx.navigateTo({
    //                   url: '../pay/pay'
    //                 })
    //                 break;
    //               default:
                    
    //             }
    //           }
    //         })

    //       }
    //     })
    //   }
    // })

  },
  // getUserInfo: function (cb) {
  //   var that = this;
  //   if (this.globalData.userInfo) {
  //     typeof cb == "function" && cb(this.globalData.userInfo)
  //   } else {
  //     //调用登录接口  
  //     wx.login({
  //       success: function () {
  //         wx.getUserInfo({
  //           success: function (res) {
  //             that.globalData.userInfo = res.userInfo;
  //             typeof cb == "function" && cb(that.globalData.userInfo)
  //           }
  //         })
  //       }
  //     });
  //   }
  // },  
  // globalData: {
  //  userInfo: null
  // }
});