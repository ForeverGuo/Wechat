//自动扫描时间
const SCANTIME = 2200
//决定是否使用依赖
var USERELAYON = true
//依赖补偿址
var RELAYONVALUE = 18
//android与ios差异
var ANDROIDDIFFIOS = 15
var ACCURACY = 50
var ROUNDTIMES = 4
var INDEXRSSI = -65

//存放自动扫描结果
var newPlayList = []
//存放手动扫描(假扫，利用自动扫描的结果)结果
var newPlayListManual = []
//存放平台信息
var platform = 'ios'

//ajax从数据库获得的信标信息
var deviceInfo
var placeInfo = {}

//以下三行设置手动扫描间隔
var manualScanFlag = true
var enableManualScan = ()=>{manualScanFlag = true}
setInterval(enableManualScan,3000)

//停止扫描的话，将autoScanFlag设置为false即可
var autoScanFlag = true

function getnewPlayList() { return newPlayList }

function getDeviceInfo(){return deviceInfo}

function cleannewPlayList() { newPlayList = [] }

function getACCURACY() {return ACCURACY}

function getROUNDTIMES() { return ROUNDTIMES}

/*
 * addAppendValue,initPlaceInfo,setDepend三个函数可以在一个函数中
 * 使用一个for循环完成
 * 但是分成三个函数，对性能几乎没有一点影响，O(n)类型相加任然是O(n)
 * 反而程序可读性更好
*/

//向ajax获得的数据里面添加appendValue字段
function addAppendValue(){
  if(deviceInfo !== undefined){
    for(let i in deviceInfo){
      deviceInfo[i].appendValue = 0
    }
  }
}

//使用格式：placeInfo.place_gid = major+'_'+minor
//使用deviceInfo中的每一个元素的place_gid来进行索引
//placeInfo.place_gid中索引到的值就是这个设备的依赖
function initPlaceInfo(){
  if(deviceInfo !== undefined){
    for(let i in deviceInfo){
      //TODO !== undefined
      if(deviceInfo[i].roomid === ''){
        placeInfo[deviceInfo[i].place_gid] = deviceInfo[i].major + '_' +deviceInfo[i].minor
        //ignore = false 表示appendValue不可忽略
        deviceInfo[i].ignore = false
      }
    }
  }
}

//设置依赖，
//第一步，先将室内景点阈值的appendValue加上一个值（表示对距离要求更严格，要求更近）
//然后，如果室外景点触发，或者室内景点也被触发，那么就可以正常触发
function setDepend(){
  if(deviceInfo !== undefined){
    for(let i in deviceInfo){
      if(deviceInfo[i].roomid !== ''){
          //距离调近
          deviceInfo[i].appendValue += RELAYONVALUE
        }
    }
  }
}


function getnewPlayListManual() { return newPlayListManual }

function setautoScanFlag(flag) {
  autoScanFlag = flag;
}


//减小阈值，用于android手机
var modifyThreshold = () => {
  if (deviceInfo !== undefined) {
    for (let i in deviceInfo) {
      if(deviceInfo[i] != undefined && typeof deviceInfo[i] === 'object'){
        deviceInfo[i].rssi -= ANDROIDDIFFIOS
      }
    }
  }
}

//获取平台信息，查看是android还是ios
//用来设置ios和android的不同阈值
var getPlatformInfo = () => {
  wx.getSystemInfo({
    success: function (res) {
      platform = res.platform
      if(platform === 'android')
        modifyThreshold()
    }
  })
}



var getDeviceInfoByAjex = function (callback) {
  if (deviceInfo === undefined) {
    // 保持屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    })    
    wx.request({
      url: 'https://wmhg.cenwei.net/wx/api/Api_beacon_info_soble.php',
      data: {
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: function (res) {
        //呵呵
        deviceInfo = res.data.ble
        USERELAYON = res.data.config.USERELAYON
        RELAYONVALUE = res.data.config.RELAYONVALUE
        ANDROIDDIFFIOS = res.data.config.ANDROIDDIFFIOS
        ACCURACY = res.data.config.ACCURACY,
        ROUNDTIMES = res.data.config.ROUNDTIMES
        INDEXRSSI = res.data.config.INDEXRSSI
        

        addAppendValue()
        initPlaceInfo()
        setDepend()
        //console.log(placeInfo)
        getPlatformInfo()
        callback()
      }
    })
  }
  else
    callback()
}


var getAvg = function (array) {
  let sum = 0
  for (let i = 0; i < array.length; i++) {
    sum += array[i]
  }
  return sum / array.length
}

function seo() {
  var devices = ["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"]
  var devicesObj
  var devicesRssi = []

  //将deviceObj转换为devices
  var transition = function () {
    let newDevices = []
    let i = 0
    for (let key in devicesObj) {
      //let newRssi = eval(devicesRssi[key].join("+")) / devicesRssi[key].length
      let newRssi = getAvg(devicesRssi[key])
      newDevices[i] = devicesObj[key]
      newDevices[i].rssi = newRssi
      i++
    }
    devices = newDevices
  }

  var filter = function () {
    //初始化newPlayList，避免上次干扰
    if(manualScanFlag)
      newPlayListManual = []
    newPlayList = []
    let j = 0
    let k = 0
    for (let i = 0; i < devices.length; i++) {
      let currentID = devices[i].major + '_' + devices[i].minor
      let currentDevice = deviceInfo[currentID]

      //更新newPlayListManual
      if(manualScanFlag){
        if (currentDevice != null && devices[i].rssi !== 0){
          newPlayListManual[k] = {
            major: devices[i].major, minor: devices[i].minor, rssi: devices[i].rssi,
            sound_url: currentDevice.sound_url,
            play_title: currentDevice.play_title,
            soundimage_url: currentDevice.soundimage_url,
            isroom: currentDevice.roomid,
            innerMap_url: currentDevice.innerMap_url,
            isPlayed: currentDevice.ispalyed,
            id: currentDevice.id
          }
          k++
        }
      }

      if (currentDevice != null && currentDevice.isplayed === 0 && devices[i].rssi > currentDevice.rssi && devices[i].rssi !== 0) {
        if(USERELAYON === true){
          var relayOn = placeInfo[currentDevice.place_gid]
          //如果依赖没有播放，并且不可忽略，加上appendValue，查看rssi是否满足新的条件
          //console.log('isPlayed '+deviceInfo[relayOn].isplayed)
          //console.log('ignore '+deviceInfo[relayOn].ignore)
          if (deviceInfo[relayOn].isplayed === 0 && deviceInfo[relayOn].ignore === false && currentDevice.roomid != ''){
            if(devices[i].rssi < (currentDevice.rssi + currentDevice.appendValue)){
              //直接将该节点过滤掉
              //console.log('依赖没有播放，跳出  ' + devices[i].rssi + ' ' + (currentDevice.rssi + currentDevice.appendValue))
              //console.log('appendValue = '+currentDevice.appendValue)
              continue
            }
            else{
              //表示以后可以忽略
              deviceInfo[relayOn].ignore = true
              //console.log('已经达到极限近了  ' + devices[i].rssi + ' ' + (currentDevice.rssi + currentDevice.appendValue))
              //console.log('appendValue = ' + currentDevice.appendValue)
            }
          }
        }

        var newRSSI = devices[i].rssi
        newPlayList[j] = {
          major: devices[i].major, minor: devices[i].minor, rssi: newRSSI,
          sound_url: currentDevice.sound_url,
          play_title: currentDevice.play_title,
          soundimage_url: currentDevice.soundimage_url,
          isroom: currentDevice.roomid,
          innerMap_url: currentDevice.innerMap_url,
          isPlayed:currentDevice.isplayed,
          id: currentDevice.id
        }
        //经过过滤，就认为音频已经被播放
        //deviceInfo[currentID].isplayed = 1
        j++
      }
    }

    if(newPlayListManual.length > 0)
      manualScanFlag = false
  }

  function isScanned(minor) {
    for(let i = 0;i < devices.length;i++){
      if(devices[i].minor === minor)
      {
        if(devices[i].rssi >= INDEXRSSI)
          return true
        else
          return false
      }
    }
    return false
  }

  var appendTheSameRoom = function () {
    if (newPlayList.length === 0) {
      //console.log("in seoManual: 没有扫描到数据")
      return
    }
    var currentID = newPlayList[0].major + '_' + newPlayList[0].minor
    var roomID = deviceInfo[currentID].roomid
    var placeIndex = deviceInfo[currentID].placeIndex
    if (roomID === '') {
      //console.log("in seoManual: 最大信号为室外景点，直接返回")
      return
    }
    var i = 1
    for (let item in deviceInfo) {
      if (item === currentID)
        continue
      let item = deviceInfo[item]
      if (item.roomid === roomID && item.isplayed === 0 && item.place_index > placeIndex && isScanned(item.minor)) {
        /*
        var length = newPlayListManual.length
        newPlayListManual[length] = newPlayListManual[i]
        */
        newPlayList[i] = {
          major: item.major,
          minor: item.minor,
          rssi: -1000,
          sound_url: item.sound_url,
          play_title: item.play_title,
          soundimage_url: item.soundimage_url,
          isroom: item.roomid,
          isPlayed: item.isplayed,
          id: item.id
        }
        //console.log("in seoManual: forEach: "+i)
        i++
      }

    }
  }


  //对过滤完的数据进行排序
  var sortDevice = function () {
    newPlayList.sort((a, b) => {
      return b.rssi - a.rssi
    })
    newPlayList = newPlayList.slice(0, 1)

    //查看优先级高的是否已经播放
    appendTheSameRoom()

    console.log(newPlayList)

    newPlayList.sort((a, b) => {
      return b.place_index - a.place_index
    })

    newPlayList = newPlayList.slice(0, 1)

    if (newPlayList.length === 1) {
      var deviceID = newPlayList[0].major + '_' + newPlayList[0].minor
      //console.log(deviceInfo[deviceID])
      //将音频设为已播放
      deviceInfo[deviceID].isplayed = 1
      //console.log(deviceInfo[deviceID])
    }

  }

  var getAroundeDevice = function () {
    devicesObj = []
    devicesRssi = []
    var that = this;
    devices = ["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"]
    //获取位置信息
    //getLocation()
    wx.startBeaconDiscovery({
      uuids: devices,
      success: function () {
        //console.log("开始扫描设备...");
        wx.onBeaconUpdate(function (res) {
          if (res && res.beacons && res.beacons.length > 0) {
            res.beacons.forEach((item, index) => {
              devicesObj[item.major + '_' + item.minor] = item
              //用来做平均的
              if (devicesRssi[item.major + '_' + item.minor] === undefined)
                devicesRssi[item.major + '_' + item.minor] = []
              devicesRssi[item.major + '_' + item.minor].push(item.rssi)
            })
          }
        });
      }
    });

    //设置3s以后停止扫描
    //超时停止扫描
    setTimeout(function () {
      wx.stopBeaconDiscovery({
        success: function () {
          //console.log("停止设备扫描成功！");
          transition()
          filter()
          sortDevice()
          //console.log(devices)
        }
      });
    }, SCANTIME);
  }

  if (autoScanFlag === true)
    getDeviceInfoByAjex(getAroundeDevice)

}



/*
 *手动扫描
*/
function seoManual() {


  //对过滤完的数据进行排序
  var sortDevice = function () {
    //console.log(newPlayListManual)
    newPlayListManual.sort((a, b) => {
      return b.rssi - a.rssi
    })
    // console.log("???????????????????????????????????")
    // console.log(newPlayListManual)
    // console.log("???????????????????????????????????")
  }

  var appendTheSameRoom = function () {
    if (newPlayListManual.length === 0) {
      //console.log("in seoManual: 没有扫描到数据")
      return
    }
    var currentID = newPlayListManual[0].major + '_' + newPlayListManual[0].minor
    var roomID = deviceInfo[currentID].roomid
    if (roomID === '') {
      //console.log("in seoManual: 最大信号为室外景点，直接返回")
      return
    }
    var i = 1
    for(let item in deviceInfo){
      if(item === currentID)
        continue
      let item = deviceInfo[item]
      if (item.roomid === roomID) {
        /*
        var length = newPlayListManual.length
        newPlayListManual[length] = newPlayListManual[i]
        */
        newPlayListManual[i] = {
          major: item.major,
          minor: item.minor,
          rssi: -1000,
          sound_url: item.sound_url,
          play_title: item.play_title,
          soundimage_url: item.soundimage_url,
          isroom:item.roomid,
          isPlayed:item.isplayed,
          id:item.id
        }
        //console.log("in seoManual: forEach: "+i)
        i++
      }
      
    }
  }


  var getAroundeDevice = function () {

    //transition()
    sortDevice()
    appendTheSameRoom()

    
    for(let i in newPlayListManual)
    {
      let tempID = newPlayListManual[i].major + '_' +newPlayListManual[i].minor
      newPlayListManual[i].isPlayed = deviceInfo[tempID].isplayed
    }
    
    /*
    if(newPlayListManual.length > 0)
      newPlayListManual[0].isPlayed = deviceInfo[newPlayListManual[0].major+"_"+newPlayListManual[0].minor].isplayed
      */

  }

  getDeviceInfoByAjex(getAroundeDevice)

}



module.exports = {
  seo: seo,
  seoManual: seoManual,
  getnewPlayList: getnewPlayList,
  getnewPlayListManual: getnewPlayListManual,
  setautoScanFlag: setautoScanFlag,
  cleannewPlayList: cleannewPlayList,
  getACCURACY: getACCURACY,
  getROUNDTIMES: getROUNDTIMES
}
