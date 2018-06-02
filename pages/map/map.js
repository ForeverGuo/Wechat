var app = getApp();
const amap = app.data.amap;
const key = app.data.key;
var utils = require('../../utils/seo.js');
const backgroundAudioManager = wx.getBackgroundAudioManager()
var order = []
var interval;
var checkSeoBeacon
var musicTip = []
var playArray = []
var gpsIndex = 0
var SIGHTNAME

Page({
    data: {
      url: '',
      listData:[],
      scale: '19', //缩放
      Height:'0',
      controls:'40',//中心点
      latitude:'43.906000',
      longitude:'125.348980',
      aniStyle:false,
      position:'../../images/dingwei.png',
      down:'../../images/down.png',
      contentHigh:'50%',
      showView:true,     //显示隐藏标志位
      showViewScan:true,  //附件景点标志位
      audioSrc:'',
      markers:[],     //界面创建marker组
      points:[],
      polyline:[],
      sightName:'',
      audioImage:'',
      toView: '',
      scrollTop:0,
      viewPosition:'33%',
      playPo:'50.3%',
      onFlag:'播放中',
      router:'../../images/router.png',
      scanImage:'../../images/scan.png',
      autoImage:'../../images/listenClose.png',
      scanMenuList:'',
      scanListFlag:false,
      skipBtnFlag:false,
      roomMapFlag:false,
      audioPlayImage:'../../images/listen0.png',
      innerMapView: false, //界面室内地图标志位
      innerMapId:'',
      roomImage:'../../images/enter.png',
      scan_flag:'已播放',
      popupImage:'../../images/tips.png',
      popupFlag:false,                  //界面提示popup标志位
      playedFlag:'',                     //存放已播放
      gpsImage:'../../images/homeTip.png',
      gpsFlag:false,
      toptipsImage:'../../images/musicLoad.jpg',
      toptipsFlag:false,
      innerMapUrl:''
      
  },
  onShow:function(){
    var that = this;
    musicTip.pop();
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
          wx.request({
            url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
            method: 'POST',
            data: {
              s: 'location',
              openid: app.data.userOpenId,
              ac: res.accuracy,
              lat: res.latitude,
              lng: res.longitude,
              lon_type: 'onshow'
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
              console.log(res)
            }
          })
        }
      })
  },
  onHide:function(){
    var sound_url = {
      "sound_url":'https://wmhg.cenwei.net/wx/miniprogram/vioce/end.mp3'
    }
    musicTip.push(sound_url);
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        wx.request({
          url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
          method: 'POST',
          data: {
            s: 'location',
            openid: app.data.userOpenId,
            ac: res.accuracy,
            lat: res.latitude,
            lng: res.longitude,
            lon_type: 'onhide'
          },
          header: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          success: function (res) {
            console.log(res)
          }
        })
      }
    })
  },
  onReady: function (e) {
    // 使用 wx.createMapContext 获取 map 上下文
    this.mapCtx = wx.createMapContext('map')
    var that = this;
    wx.request({
      url: 'https://wmhg.cenwei.net/wx/api/Api_beacon_info_miniprogramceshi.php',
      dataType: "json",
      data: {
        "lan_type": 1, "sound_type": 2, "user_agent": '', "latitude": 43.913807, "longitude":125.35361
      },
      header: {//请求头
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      method: "POST",
      success: function (res) {
        var ld = [];
        res.data.forEach(function (item, index, array) {
          if(item.play_title.length > 7){
            item.play_title = item.play_title.substring(0,7)+'..'
          }
          ld.push(item)
        }) 
        
        that.data.listData = ld;
        var allMarkers = that.getAllMarkers();

        that.setData({
            listData:that.data.listData,
            markers: allMarkers,
            sights: allMarkers.length
        })
      },
      fail: function (err) {},
      complete: function () {}
    })
  },
  onLoad: function (options) {
    circleBackground:'';
    var that = this;
    that.setData({
      url: app.globalData.url,// 显示图片url,
      audioImage: '../../images/play.png'
    })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          view: {
            Height:(2/3)* res.windowHeight
          },
          Model: res.model
        })
      }
    })
    //启动时检查蓝牙设备是否开启
    wx.openBluetoothAdapter({
      success: function (res) {
      },
      fail(res) {
      },
      complete(res) {
        wx.getBluetoothAdapterState({
          success: function (res) { },
          fail: function (res) { },
          complete: function (res) {
            if (res.available != true) {
              wx.showModal({
                title: '蓝牙提示',
                content: '请手动打开蓝牙设备',
                success: function (res) {
                  if (res.confirm) {
                    //console.log('用户点击确定')
                  } else if (res.cancel) {
                    //console.log('用户点击取消')
                  }
                }
              })
            }
          },
        })
        //开始搜索  
      }
    })
   
  //that.setMusicMonitor();
  interval = setInterval(that.seoList,3000);
  var interScan = setInterval(that.interScan, 3000);
  checkSeoBeacon = setInterval(that.checkBeacon,5000)

},
//移动至location,定位检查
moveToLocation: function () {
  var that = this;
  this.load("获取中..",1000)
  this.mapCtx.moveToLocation()
  that.setData({
    markers:'',
    popupFlag:true,
    popupImage:'../../images/time.png'
  })
  setTimeout(function(){
    var allMarkers = that.getAllMarkers();

    that.setData({
      listData: that.data.listData,
      markers: allMarkers,
      popupImage:''
    })
  },3000)
},
//检查蓝牙设备函数
checkBeacon:function(){
  var that = this;
  
  if (gpsIndex % utils.getROUNDTIMES() === 0)
  {
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        //console.log(utils.getACCURACY())
        if (res && res.longitude) {
          that.setData({
            points: [{
              longitude: res.longitude,
              latitude: res.latitude
            }],
          })
          var accuracy = res.accuracy
          if (accuracy > utils.getACCURACY()){
            that.setData({
              gpsFlag:true
            })
          }else{
            that.setData({
              gpsFlag: false
            })
          } 
          wx.request({
            url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
            method: 'POST',
            data: {
              s:'location',
              openid: app.data.userOpenId,
              ac:res.accuracy,
              lat:res.latitude,
              lng:res.longitude,
              lon_type:'tc'
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
              console.log(res)
            }
            })
        }
      }
    })
  }
  gpsIndex++
  wx.openBluetoothAdapter({
    success: function (res) {
    },
    fail(res) {
    },
    complete(res) {
      wx.getBluetoothAdapterState({
        success: function (res) { },
        fail: function (res) { },
        complete: function (res) {
          if (res.available == true) {
            that.setData({
              popupFlag: false
            })
          }else{
            that.setData({
               popupFlag:true,
               popupImage: '../../images/tips.png'
            })
          }
        },
      })
      //开始搜索  
    }
  })
},
//设置marker函数
getAllMarkers() {
  var that = this;
  var market = [];  
  for (let item in that.data.listData ) {
    var po = that.data.listData[item]
    order.push('title'+item)
    let marker1 = this.createMarker(item,po);
    market.push(marker1)
  }
  return market;
},
strSub: function(a) {
  var str = a.split(".")[1];
  str = str.substring(0, str.length - 1)
  return a.split(".")[0] + '.' + str;
},
createMarker(item,point) {
  let latitude = point.lon_lat.split(',')[0];
  let longitude = point.lon_lat.split(',')[1];
  var title = point.play_title;
  let marker = {
    iconPath: "../../images/listen.png",
    id:item,
    title:title,
    latitude: latitude,
    longitude: longitude,
    width: 30,
    height: 30,
    callout:{
      content:title,
      display:'ALWAYS',
      color:'#b31c27',
      bgColor:'#ffffff',
      borderRadius:'2',
      padding:'3'
    }
  };
  return marker;
},
// onPageScroll: function (e) { // 获取滚动条当前位置
//   console.log(e)
// },
markertap:function(e){
  var that = this;
  that.setData({
    toptipsFlag:true
  })
  setTimeout(function(){
    that.setData({
      toptipsFlag:false
    })
  },3000)
  // this.showList();
  var i = e.markerId;
  this.markerToList(i)
  this.setData({
    innerMapView: false,
    roomMapFlag:false
  })
  var imgUrl = this.data.listData[i].image_url;
  var sightName = this.data.listData[i].play_title;
  var musicSrc = this.data.listData[i].sound_url;

  this.audioPlay(musicSrc,sightName,imgUrl);
},
musicPlayBtn:function(e){
  var that = this;
  that.setData({
    toptipsFlag: true
  })
  setTimeout(function () {
    that.setData({
      toptipsFlag: false
    })
  },3000)
  var that =this;
  var isroom = e.target.dataset.room
  var i = e.target.dataset.title
  if(isroom != ''){
    that.setData({
      innerMapId:i
    })
    setTimeout(function(){
      that.showInnerMap(i)
    },500)
  }else{
    this.setData({
      innerMapView:false,
      roomMapFlag:false
    })
  }
  var i = e.target.dataset.title
  var imgUrl = this.data.listData[i].image_url;
  var sightName = this.data.listData[i].play_title;
  var musicSrc = this.data.listData[i].sound_url;
  this.audioPlay(musicSrc, sightName, imgUrl);
},
musicPlayBtnScan:function(e){
  var that = this;
  that.setData({
    toptipsFlag: true
  })
  setTimeout(function () {
    that.setData({
      toptipsFlag: false
    })
  },3000)
  var that =this;
  var i = e.target.dataset.title;
  that.data.listData.forEach(function(item, index, array){
    if (item.play_title == i) {
      var imgUrl = item.image_url;
      var sightName = item.play_title;
      var musicSrc = item.sound_url;

      that.audioPlay(musicSrc, sightName, imgUrl);
      var inner_url = item.innerMap_url;
      if (inner_url != '') {
        that.SeoShowInnerMap(inner_url)
      }

    }
  })

},
showInnerMap:function(i){
  var that =this;
  wx.getSystemInfo({
    success: function (res) {
      var flag = that.data.view.Height < res.windowHeight ? true : false ;
      if(flag == true){
        that.setData({
          innerMapPosition:'49.7%'
        })
      }else{
        that.setData({
          innerMapPosition: '16.5%'
        })
      }
    }
  })
  var innerMapUrl = that.data.listData[i].innerMap_url;
  that.setData({
    innerMapView:true,
    roomMapFlag:true,
    innerMapUrl:innerMapUrl,
    roomImage: '../../images/enter.png' 
  })
},
SeoShowInnerMap: function (innerMap_url) {
  var that = this;
  wx.getSystemInfo({
    success: function (res) {
      var flag = that.data.view.Height < res.windowHeight ? true : false;
      if (flag == true) {
        that.setData({
          innerMapPosition: '49.7%'
        })
      } else {
        that.setData({
          innerMapPosition: '16.5%'
        })
      }
    }
  })
  var innerMapUrl = innerMap_url;
  that.setData({
    innerMapView: true,
    innerMapUrl: innerMapUrl,
    roomMapFlag: true,
    roomImage:'../../images/enter.png'  
  })
},
showList:function(){
  var that = this;
  that.setData({
    switchFlag: 'none',
    contentHigh: '50%',
    showView: true,
    down: '../../images/down.png',
    viewPosition: '33%'
  })
  wx.getSystemInfo({
    success: function (res) {
      var hegiht = (1 / 2) * res.windowHeight;
      that.setData({
        view: {
          Height: hegiht
        },
        Model: res.model
      })
    }
  })
},
tap(e){
  var that =this;
  //this.hideMeng();
  that.setData({
    polyline: [],
  })
},
hideMeng: function (e) {          
  var that = this;
  this.setData({
    aniStyle: false,
    innerMapView:false
  })
  setTimeout(function () {       
    that.setData({
      mengShow: false
    })
  }, 500)
},
audioPlay: function (musicSrc, sightName, imgUrl) {
  var that =this;
  that.setData({
    aniStyle: true,
    circleBackground: imgUrl,
    sightName: sightName,
    audioImage: '../../images/play.png',
    currentId: sightName,
    skipBtnFlag:false
  })
  SIGHTNAME = sightName
  backgroundAudioManager.title = sightName;
  backgroundAudioManager.src = musicSrc;
  backgroundAudioManager.coverImgUrl = imgUrl;
  

  var Model = that.data.Model;

  wx.request({
    url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
    method: 'POST',
    data: {
      s: 'audio',
      openid: app.data.userOpenId,
      play_type: 'manual',
      play_title: sightName,
      major: 0,
      minor: 0
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    success: function (res) {
      console.log(res)
    }
  })

  
},
audioBtn: function () {
  var that = this;
  wx.getBackgroundAudioPlayerState({
    success: function (res) {
      if(res.status == 1){
        that.musicPause()
      }
      if(res.status == 0){
        that.musicPlay()
      }
      if (res.status == 2) {
        that.musicPlay()
      }
    },
    fail: function (res) { },
    complete: function (res) { },
  })
},
setMusicMonitor:function(){
  var that = this;
  wx.onBackgroundAudioStop(function () {
    that.setData({
      audioImage: '../../images/pause.png',
    })
  })

},
musicPause:function(){
  var that = this;
  that.setData({
    audioImage: '../../images/pause.png'
  })
  backgroundAudioManager.pause();
},
musicPlay: function () {
  var that = this;
  that.setData({
    audioImage: '../../images/play.png',
    onFlag:'播放中'
  })
  backgroundAudioManager.play();
},
swithSight:function(){
  var that = this;
  var image = that.data.down === '../../images/down.png' ? '../../images/up.png' : '../../images/down.png';
  var contentHigh = that.data.contentHigh === '50%' ? 'auto':'50%';
  var viewPosition =that.data.viewPosition ==='33%' ? '0':'33%';
  var playPo = that.data.playPo === '50.3%' ? '83.5%' : '50.3%';
  that.setData({
    switchFlag:'none',
    contentHigh:contentHigh,
    showView:(!that.data.showView),
    down:image,
    viewPosition:viewPosition,
    playPo:playPo,
  })

  wx.getSystemInfo({
    success: function (res) {
      var  hegiht = that.data.view.Height < res.windowHeight ? res.windowHeight:(2/3)*res.windowHeight;
      var flag = that.data.view.Height < res.windowHeight ? false : true;
      that.setData({
        view: {
          Height: hegiht
        },
        Model: res.model
      })
      if (flag == true) {
        that.setData({
          innerMapPosition: '49.7%'
        })
      } else {
        that.setData({
          innerMapPosition: '16.5%'
        })
      }
    }
  })
  
},
markerToList: function(item) {
    this.setData({
      toView:order[item]
    })
},
tapMove: function(e) {
    this.setData({
      scrollTop: this.data.scrollTop + 10
    })
},
/*-----------------*/
load:function(loadName,second){
  wx.showToast({
    title: loadName,
    icon: 'loading',
    duration: second
  })
},
scan:function(){
  utils.seoManual()
  var that = this;
  wx.showToast({
    title: '搜索中',
    icon: 'loading',
    duration: 1000,
  })
  setTimeout(function () {
    var data = utils.getnewPlayListManual();
    if (data.length == 0) {
      wx.showToast({
        title: '暂时未发现景点',
        image: '../../images/closeLoad.png'
      })
      return;
    } else {
      //var flag = that.data.showList === 'true' ? 'false' : 'true'
      that.setData({
        showView: false,
        scanListFlag: true,
        showViewScan: false,
        scanMenuList: data
      })
      wx.getSystemInfo({
        success: function (res) {
          var hegiht = that.data.view.Height < res.windowHeight ? (2 / 3) * res.windowHeight : res.windowHeight;
          // var hegiht = (3 / 4) * res.windowHeight;

          that.setData({
            view: {
              Height: hegiht
            },
            Model: res.model
          })
        }
      })
    }
  }, 200)

},
interScan:function(){
  utils.seoManual()
  var that = this;
  setTimeout(function () {
    var data = utils.getnewPlayListManual();
    if (data.length == 0) {return;} else {
      //var flag = that.data.showList === 'true' ? 'false' : 'true'
      that.setData({
        showView: false,
        scanListFlag: true,
        showViewScan: false,
        scanMenuList: data
      })
      wx.getSystemInfo({
        success: function (res) {
          var hegiht = that.data.view.Height < res.windowHeight ? (2 / 3) * res.windowHeight : res.windowHeight;
          // var hegiht = (3 / 4) * res.windowHeight;

          that.setData({
            view: {
              Height: hegiht
            },
            Model: res.model
          })
        }
      })
    }
  }, 200)
},
swithToSight:function(){
  var that = this;
  wx.getSystemInfo({
    success: function (res) {
      var hegiht = that.data.view.Height < res.windowHeight ? (2 / 3) * res.windowHeight : res.windowHeight;
      // var hegiht = (3 / 4) * res.windowHeight;
     
      that.setData({
        view: {
          Height: hegiht
        },
        Model: res.model
      })

      if (hegiht != res.windowHeight) {
          that.setData({
            showView: (!that.data.showView),
          })
      }
    }
  })
  that.setData({
    scanListFlag: false,
    showViewScan: true,
  })
},
seoList:function(){
	 var that = this;
	 utils.seo();
	 setTimeout(that.seoPlayList,2850)
},
seoPlayList:function(){
	var seoArr = utils.getnewPlayList();
	 if (seoArr.length > 0) {
	   var that = this;
	   var seoIndex = 0
	   var flag = false;
     utils.setautoScanFlag(flag);
     utils.cleannewPlayList();
     var isroom = seoArr[seoIndex].isroom
     var innerImage = seoArr[seoIndex].innerMap_url
     if (isroom != '') {
       setTimeout(function () {
         that.SeoShowInnerMap(innerImage)
       }, 500)
     } else {
       that.setData({
         innerMapView: false,
         roomMapFlag: false
       })
     }

	   var imgUrl = seoArr[seoIndex].soundimage_url;
	   var sightName = seoArr[seoIndex].play_title;
	   var musicSrc = seoArr[seoIndex].sound_url;
     var id = seoArr[seoIndex].id;

     //playArray.pop()
     var playTitle = seoArr[seoIndex].play_title
     playArray.push(playTitle)
    
	   that.setData({
	     aniStyle: true,
	     circleBackground: imgUrl,
	     sightName: sightName,
	     audioImage: '../../images/play.png',
	     currentId: sightName,
	   })
     
     that.markerToList(id)

     that.SeoAudioPlay(musicSrc, sightName, imgUrl, seoArr[seoIndex].major, seoArr[seoIndex].minor);
	 }
},
auto:function(){
  var that = this
  var autoImage = that.data.autoImage === '../../images/listenClose.png' ? '../../images/listenAuto.png' : '../../images/listenClose.png';
  var autoFlag = that.data.autoImage === '../../images/listenClose.png' ? false : true;
  that.setData({
    autoImage : autoImage
  })

  if(autoFlag == false){
    utils.setautoScanFlag(autoFlag);
    that.load('正在关闭导览', 1000)
   
  }else{
    utils.setautoScanFlag(autoFlag);
    that.load('正在打开导览', 1000)
  } 
},

SeoAudioPlay: function (musicSrc, sightName, imgUrl,major,minor) {
  SIGHTNAME = sightName
  wx.request({
    url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
    method: 'POST',
    data: {
      s: 'audio',
      openid: app.data.userOpenId,
      play_type: 'auto',
      play_title: sightName,
      major: major,
      minor: minor
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    success: function (res) {
      console.log(res)
    }
  })
  var that = this;
  that.setData({
    aniStyle: true,
    circleBackground: imgUrl,
    sightName: sightName,
    audioImage: '../../images/play.png',
    currentId: sightName,
    skipBtnFlag:true
  })
  backgroundAudioManager.title = sightName;
  backgroundAudioManager.src = musicSrc;
  backgroundAudioManager.coverImgUrl = imgUrl;
  var Model = that.data.Model;

  if (Model.indexOf('iPhone') > (-1)) {
    var isoMusic = setInterval(function () {
      wx.getBackgroundAudioPlayerState({
        success: function (res) {
          if (res.status === 2) {
 
            if (musicTip.length == 1){
              backgroundAudioManager.title = '语音提示';
              backgroundAudioManager.src = musicTip[0].sound_url;
              backgroundAudioManager.coverImgUrl = '';
            }
            var flag = true;
            utils.setautoScanFlag(flag);
            that.setData({
              audioImage: '../../images/pause.png',
              playedFlag:playArray
            })
            clearInterval(isoMusic)
          }
        },
        fail: function (res){},
        complete: function (res){},
      })
    }, 2000)
  } else {
    var androidMusic = setInterval(function () {
      wx.getBackgroundAudioPlayerState({
        success: function (res) {
          if (res.currentPosition == res.duration) {
             if(musicTip.length == 1){
              backgroundAudioManager.title = '';
              backgroundAudioManager.src = musicTip[0].sound_url;
              backgroundAudioManager.coverImgUrl = '';
            }

            var flag = true;
            utils.setautoScanFlag(flag);
            var ii = 0;
            that.setData({
              audioImage: '../../images/pause.png',
              playedFlag: playArray
            })

            clearInterval(androidMusic)
          }
        },
        fail: function (res) {},
        complete: function (res) {},
      })

    }, 2000)
  }
},
skipSeoPlay:function(){
  var that = this;
  var flag = true;
  wx.request({
    url: 'https://wmhg.cenwei.net/wx/miniprogram/daq.php',
    method: 'POST',
    data: {
      s: 'audio',
      openid: app.data.userOpenId,
      play_type: 'jump',
      play_title: SIGHTNAME,
      major: 0,
      minor: 0
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    success: function (res) {
      console.log(res)
    }
  })
  utils.setautoScanFlag(flag);

  //that.musicPause();
  that.setData({
    audioImage: '../../images/pause.png'
  })
  backgroundAudioManager.stop();

  that.setData({
    playedFlag:playArray
  })


  that.load("请稍后",3000)
},
roomMap:function(e){
    var that =this;
    var flag = that.data.innerMapView === true ? true : false;
    var innerMapId = e.target.dataset.title;
    if(flag){
      that.setData({
        innerMapView:false,
        roomImage:'../../images/out.png'
      })      
    }else{
      that.setData({
        innerMapView:true,
        roomImage: '../../images/enter.png'
      })
    }
},
/*--------获取路线--------*/
goTo(e) {
  var that = this;
  that.load('规划中',1000);
  var po = [];
  wx.request({
    url: 'https://wmhg.cenwei.net/wx/miniprogram/Api_dl_mappath.php',
    dataType: "json",
    data: {},
    header: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    success: function (res) {
      console.log(res)
      for(var item in res['data']){
        // console.log(res['data'][item].latitude)
        var point = {
          longitude: res['data'][item].longitude,
          latitude: res['data'][item].latitude
        }
        po.push(point)
      }
      that.setData({
        polyline: [{
          points:po,
          color: '#0091ff',
          width: 6,
          arrowLine: true,
          border: "2px",
          borderColor: "#FF0000DD"
        }]
      })
    },
    fail:function(){
      
    }

  })
}


})
