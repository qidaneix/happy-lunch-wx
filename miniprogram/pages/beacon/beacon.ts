// index.ts
// 获取应用实例
// @ts-ignore
const app = getApp<IAppOption>();

Page({
  data: {
    list: [] as any[],
    errorList: [] as any[],
    count: 0,
  },
  timerId: null as any,
  pageShowTime: 0,
  startTime: 0,
  scanTime: 0,
  // 事件处理函数
  init() {
    wx.startBeaconDiscovery({
      uuids: ["FDA50693-A4E2-4FB1-AFCF-C6EB07647824"], // 一个公众号对应的设备的uuid
      success: (res) => {
        console.log("startBeaconDiscovery succ", res);
        this.startTime = Date.now();
        wx.showToast({
          title: "开始搜索iBeacon",
          icon: "success",
          duration: 2000,
        });
        this.startScan();
      },
      fail: (res) => {
        console.error("startBeaconDiscovery fail", res);
        if (res.errCode === 11001 || res.errCode === 11002) {
          this.errTips();
        }
      },
    });
  },
  startScan() {
    // 检索iBeacon
    wx.onBeaconUpdate((res) => {
      console.log("onBeaconUpdate find result", res);
      if (res.beacons && res.beacons.length > 0) {
        this.scanTime = Date.now();
        const beacon = res.beacons[0];
        if (this.data.list.length) return;
        const now = Date.now();
        const openInterval = now - this.pageShowTime;
        const startInterval = now - this.startTime;
        const scanInterval = now - this.scanTime;
        this.setData(
          {
            list: [
              {
                beaconUUID: beacon.uuid,
                RSSI: `${beacon.rssi}dBm`,
                openInterval: `${openInterval / 1000}s`,
                startInterval: `${startInterval / 1000}s`,
                scanInterval: `${scanInterval / 1000}s`,
              },
            ],
          },
          () => {
            /**
             * TODO: request
             * type: iBeacon
             * 时间戳
             * beaconUuid:UUID
             * 信号强度
             * 页面时间差
             * 启动时间差
             * 搜索时间差
             * 设备信息 JSON.string(wx.getSystemInfoSync())
             * app.globalData.uuid
             * app.globalData.userInfo
             */
            wx.showLoading({
              title: "上传实验结果中",
              mask: true,
            });
            wx.request({
              url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
              data: {
                type: "iBeacon",
                time: Date.now(),
                beaconUUID: beacon.uuid,
                RSSI: beacon.rssi,
                openInterval,
                startInterval,
                scanInterval,
                deviceInfo: wx.getSystemInfoSync(),
                uuid: app.globalData.uuid,
                userInfo: app.globalData.userInfo,
              },
              method: "POST",
              success: (res) => {
                if (res.statusCode === 200 && (res.data as any).code === 0) {
                  wx.hideLoading();
                  wx.showToast({
                    title: "实验上报成功",
                    icon: "success",
                    duration: 2000,
                  });
                }
              },
              fail: (res) => {
                console.warn(res);
                wx.hideLoading();
                wx.showToast({
                  title: "实验上报失败",
                  icon: "success",
                  duration: 2000,
                });
              },
            });
          }
        );

        // 停止iBeacon搜索
        wx.stopBeaconDiscovery({
          success: (e) => {
            console.log("stopBeaconDiscovery succ", e);
          },
          fail: (e) => {
            console.error("stopBeaconDiscovery fail", e);
          },
        });
      }
    });
  },
  errTips() {
    wx.showModal({
      content:
        "iBeacon初始化失败，请检查系统蓝牙及定位功能是否开启。\n开启后请扫码重新进入页面！",
      showCancel: false,
    });
  },
  postError() {
    const OldError = console.error;
    console.error = (...args) => {
      this.setData(
        {
          errorList: this.data.errorList.concat([
            {
              type: args[0],
              json: JSON.stringify(args[1]),
              time: Date.now(),
            },
          ]),
        },
        () => {}
      );
      /**
       * TODO: request
       * type: iBeacon
       * uuid
       * 错误类型
       * 信息
       * 时间戳
       * 设备信息 JSON.string(wx.getSystemInfoSync())
       * app.globalData.uuid
       * app.globalData.userInfo
       */
      wx.showLoading({
        title: "错误信息上报中",
        mask: true,
      });
      wx.request({
        url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
        data: {
          type: "iBeacon",
          time: Date.now(),
          errType: args[0],
          json: JSON.stringify(args[1]),
          deviceInfo: wx.getSystemInfoSync(),
          uuid: app.globalData.uuid,
          userInfo: app.globalData.userInfo,
        },
        method: "POST",
        success: (res) => {
          if (res.statusCode === 200 && (res.data as any).code === 0) {
            wx.hideLoading();
            wx.showToast({
              title: "错误上报成功",
              icon: "none",
              duration: 1000,
            });
          }
        },
        fail: (res) => {
          console.warn(res);
          wx.hideLoading();
          wx.showToast({
            title: "错误上报失败",
            icon: "none",
            duration: 1000,
          });
        },
      });

      OldError.call(console, ...args);
    };
  },
  timer() {
    this.timerId = setInterval(() => {
      this.setData({
        count: this.data.count + 1,
      });
    }, 1000);
  },
  onShow() {
    this.pageShowTime = Date.now();
    this.postError();
    this.timer();
    this.init();
  },
  onHide() {
    /**
     * clear
     */
    this.setData({
      list: [],
      errorList: [],
      count: 0,
    });
    clearInterval(this.timerId);
    this.timerId = null;
    this.pageShowTime = 0;
    this.startTime = 0;
    this.scanTime = 0;

    wx.offBeaconUpdate(() => {});
    wx.stopBeaconDiscovery();
  },
});
