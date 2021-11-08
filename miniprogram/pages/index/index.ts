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
  // stateChangeAvaTog: false,
  // stateChangeNotAvaTog: false,
  // 事件处理函数
  init() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log("openBluetoothAdapter succ", res);
        this.startTime = Date.now();
        wx.showToast({
          title: "蓝牙启动成功",
          icon: "success",
          duration: 5000,
        });
        this.startScan();
      },
      fail: (res) => {
        console.error("openBluetoothAdapter fail", res);
        this.errTips();
        this.startTime = Date.now();

        // if (res.errCode !== 10001) return;

        // wx.onBluetoothAdapterStateChange((res) => {
        //   console.log("adapterState changed, now is", res);
        //   if (res.available && !this.stateChangeAvaTog) {
        //     this.startScan();
        //     this.stateChangeAvaTog = true;
        //   } else if (!res.available && !this.stateChangeNotAvaTog) {
        //     this.errTips();
        //     this.stateChangeNotAvaTog = true;
        //   }
        // });
      },
    });
  },
  startScan() {
    // 搜索外围蓝牙设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      // @ts-ignore
      powerLevel: "high",
      success: (e) => {
        console.log("startBluetoothDevicesDiscovery succ", e);
        this.scanTime = Date.now();
        wx.onBluetoothDeviceFound((res) => {
          res.devices.forEach((device) => {
            // 这里可以做一些过滤
            if (device.name.indexOf("weixiao_test") > -1) {
              try {
                const view = new Uint8Array(device.advertisData);
                const arr: any[] = [];
                for (let i = 0; i < view.length; i++) {
                  arr.push(view[i].toString(16));
                }
                console.log(
                  "onBluetoothDeviceFound found!",
                  device,
                  device.name,
                  arr
                );
                if (this.data.list.length) return;
                const now = Date.now();
                const openInterval = now - this.pageShowTime;
                const startInterval = now - this.startTime;
                const scanInterval = now - this.scanTime;
                this.setData(
                  {
                    list: [
                      {
                        name: device.localName,
                        arr: arr.join("-").toUpperCase(),
                        RSSI: `${device.RSSI}dBm`,
                        openInterval: `${openInterval / 1000}s`,
                        startInterval: `${startInterval / 1000}s`,
                        scanInterval: `${scanInterval / 1000}s`,
                      },
                    ],
                  },
                  () => {
                    /**
                     * type: BLE
                     * 时间戳
                     * 蓝牙名称
                     * 验证码
                     * 信号强度
                     * 页面时间差
                     * 启动时间差
                     * 搜索时间差
                     * 设备信息 JSON.string(wx.getSystemInfoSync())
                     * app.globalData.uuid
                     * app.globalData.userInfo
                     * app.globalData.username
                     */
                    if (app.globalData.userName) {
                      this.requestData({
                        type: "BLE",
                        time: Date.now(),
                        name: device.localName,
                        code: arr.join("-").toUpperCase(),
                        RSSI: device.RSSI,
                        openInterval,
                        startInterval,
                        scanInterval,
                        deviceInfo: wx.getSystemInfoSync(),
                        uuid: app.globalData.uuid,
                        userInfo: app.globalData.userInfo,
                        userName: app.globalData.userName,
                      });
                    } else {
                      this.setNameModal().then(() => {
                        this.requestData({
                          type: "BLE",
                          time: Date.now(),
                          name: device.localName,
                          code: arr.join("-").toUpperCase(),
                          RSSI: device.RSSI,
                          openInterval,
                          startInterval,
                          scanInterval,
                          deviceInfo: wx.getSystemInfoSync(),
                          uuid: app.globalData.uuid,
                          userInfo: app.globalData.userInfo,
                          userName: app.globalData.userName,
                        });
                      });
                    }
                  }
                );
              } catch (e) {
                console.error("parse advertisData error", e);
              }
              // 找到要搜索的设备后，及时停止扫描
              wx.stopBluetoothDevicesDiscovery({
                success: (e) => {
                  console.log("stopBluetoothDevicesDiscovery succ", e);
                },
                fail: (e) => {
                  console.error("stopBluetoothDevicesDiscovery fail", e);
                },
              });
            }
          });
        });
      },
      fail: (e: any) => {
        console.error("startBluetoothDevicesDiscovery fail", e);
        // this.stateChangeAvaTog = false;
        // this.stateChangeNotAvaTog = false;

        wx.getSystemInfo({
          success: (res) => {
            if (e.errCode === 10001 && e.errno === 1500102) {
              wx.showModal({
                content:
                  "蓝牙搜索广播失败，请检查系统蓝牙功能是否开启。\n开启后请扫码重新进入页面！",
                showCancel: false,
              });
            } else if (
              res.platform === "android" &&
              e.errCode === -1 &&
              e.errno === 1509009
            ) {
              wx.showModal({
                content:
                  "蓝牙搜索广播失败，请检查系统定位功能是否开启。\n开启后请扫码重新进入页面！",
                showCancel: false,
              });
            } else if (
              res.platform === "android" &&
              e.errCode === -1 &&
              e.errno === 1509008
            ) {
              wx.showModal({
                content:
                  "蓝牙搜索广播失败，请检查是否为微信授权定位功能。\n开启后请扫码重新进入页面！",
                showCancel: false,
              });
            }
          },
        });
      },
    });
  },
  errTips() {
    wx.getSystemInfo({
      // @ts-ignore
      success: (res) => {
        if (res.platform === "ios") {
          wx.showModal({
            content:
              "蓝牙模块初始化失败，请检查系统蓝牙功能是否开启。\n开启后请扫码重新进入页面！",
            showCancel: false,
          });
        } else if (res.platform === "android") {
          wx.showModal({
            content:
              "蓝牙模块初始化失败，请检查系统蓝牙及定位功能是否开启。\n开启后请扫码重新进入页面！",
            showCancel: false,
          });
        }
      },
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
        () => {
          /**
           * type: BLE
           * uuid
           * 错误类型
           * 信息
           * 时间戳
           * 设备信息 JSON.string(wx.getSystemInfoSync())
           * app.globalData.uuid
           * app.globalData.userInfo
           * app.globalData.username
           */
          if (app.globalData.userName) {
            this.requestError({
              type: "BLE",
              time: Date.now(),
              errType: args[0],
              json: args[1],
              deviceInfo: wx.getSystemInfoSync(),
              uuid: app.globalData.uuid,
              userInfo: app.globalData.userInfo,
              userName: app.globalData.userName,
            });
          } else {
            this.setNameModal().then(() => {
              this.requestError({
                type: "BLE",
                time: Date.now(),
                errType: args[0],
                json: args[1],
                deviceInfo: wx.getSystemInfoSync(),
                uuid: app.globalData.uuid,
                userInfo: app.globalData.userInfo,
                userName: app.globalData.userName,
              });
            });
          }
        }
      );

      OldError.call(console, ...args);
    };
  },
  requestData(data: any) {
    wx.showLoading({
      title: "上传实验结果中",
      mask: true,
    });
    wx.request({
      url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
      data,
      method: "POST",
      success: (res) => {
        if (res.statusCode === 200 && (res.data as any).code === 0) {
          wx.hideLoading();
          wx.showToast({
            title: "实验上报成功",
            icon: "success",
            duration: 5000,
          });
        }
      },
      fail: (res) => {
        console.warn(res);
        wx.hideLoading();
        wx.showToast({
          title: "实验上报失败",
          icon: "success",
          duration: 5000,
        });
      },
    });
  },
  requestError(data: any) {
    wx.showLoading({
      title: "错误信息上报中",
      mask: true,
    });
    wx.request({
      url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
      data,
      method: "POST",
      success: (res) => {
        if (res.statusCode === 200 && (res.data as any).code === 0) {
          wx.hideLoading();
          wx.showToast({
            title: "错误上报成功",
            icon: "none",
            duration: 5000,
          });
        }
      },
      fail: (res) => {
        console.warn(res);
        wx.hideLoading();
        wx.showToast({
          title: "错误上报失败",
          icon: "none",
          duration: 5000,
        });
      },
    });
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
  setNameModal() {
    return new Promise((resolve) => {
      return wx.showModal({
        title: "请输入您的企微名，方便我们做后期问题调查",
        // @ts-ignore
        editable: true,
        showCancel: false,
        success: (res) => {
          // @ts-ignore
          if (res.content) {
            // @ts-ignore
            const userName = wx.setStorageSync("userName", res.content);
            // @ts-ignore
            app.globalData.userName = res.content;
          } else {
            app.globalData.userName = "";
          }
          resolve(app.globalData.userName);
        },
      });
    });
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
    // this.stateChangeAvaTog = false;
    // this.stateChangeNotAvaTog = false;
    // @ts-ignore
    // wx.offBluetoothAdapterStateChange();
    // @ts-ignore
    // wx.offBluetoothDeviceFound();
    wx.stopBluetoothDevicesDiscovery();
    wx.closeBluetoothAdapter();
  },
  // toBluetoothSetting() {
  //   console.log("be here");
  //   // @ts-ignore
  //   wx.openSystemBluetoothSetting({
  //     success(res: any) {
  //       console.log(res);
  //     },
  //     fail(e: any) {
  //       console.error(e);
  //     },
  //   });
  // },
  // toAppAuthorizeSetting() {
  //   console.log("be here");
  //   // @ts-ignore
  //   wx.openAppAuthorizeSetting({
  //     success(res: any) {
  //       console.log(res);
  //     },
  //     fail(e: any) {
  //       console.error(e);
  //     },
  //   });
  // },
});
