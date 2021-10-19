// index.ts
// 获取应用实例
const app = getApp<IAppOption>();

Page({
  data: {
    list: [],
  },
  // 事件处理函数
  bindViewTap() {
    const openTime = Date.now();
    let startTime: any;
    let stateChangeTog = false;
    const loop = () => {
      // 搜索外围蓝牙设备
      let scanTime = Date.now();
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        // interval: 3000,
        success: (e) => {
          console.log("startBluetoothDevicesDiscovery succ", e);
          wx.onBluetoothDeviceFound((res) => {
            res.devices.forEach((device) => {
              // 这里可以做一些过滤
              if (device.name.indexOf("hello") > -1) {
                try {
                  const view = new Uint8Array(device.advertisData);
                  const arr = [];
                  for (let i = 0; i < view.length; i++) {
                    arr.push(view[i].toString(16));
                  }
                  console.log(
                    "onBluetoothDeviceFound found!",
                    device,
                    device.name,
                    arr
                  );
                  const list = (this.data.list as any).concat([
                    {
                      name: device.localName,
                      arr: arr.join("-").toUpperCase(),
                      RSSI: `${device.RSSI}dBm`,
                      openInvertal: `${(Date.now() - openTime) / 1000}s`,
                      startInvertal: `${(Date.now() - startTime) / 1000}s`,
                      scanInvertal: `${(Date.now() - scanTime) / 1000}s`,
                    },
                  ]);
                  this.setData({
                    list,
                  });
                } catch (e) {
                  console.error(e);
                }
                // 找到要搜索的设备后，及时停止扫描
                wx.stopBluetoothDevicesDiscovery({
                  success: (e) => {
                    console.log("stopBluetoothDevicesDiscovery succ", e);
                    setTimeout(() => {
                      loop();
                    }, 8000);
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
          stateChangeTog = false;
          wx.getSystemInfo({
            success: (res) => {
              if (e.errCode === 10001 && e.errno === 1500102) {
                wx.showModal({
                  content: "蓝牙搜索广播失败，请检查系统定位功能是否开启",
                  showCancel: false,
                });
              } else if (
                res.platform === "android" &&
                e.errCode === -1 &&
                e.errno === 1509009
              ) {
                wx.showModal({
                  content: "蓝牙搜索广播失败，请检查系统定位功能是否开启",
                  showCancel: false,
                });
              }
            },
          });
        },
      });
    };
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log("openBluetoothAdapter succ", res);
        wx.showToast({
          title: "蓝牙初始化成功",
          icon: "success",
          duration: 2000,
        });
        startTime = Date.now();
        if (!stateChangeTog) {
          loop();
          stateChangeTog = true;
        }
      },
      fail: (res) => {
        console.error("openBluetoothAdapter fail", res);
        /**
         * TODO: 提示用户开启蓝牙及定位
         */
        wx.getSystemInfo({
          success: (res) => {
            if (res.platform === "ios") {
              wx.showModal({
                content: "蓝牙初始化失败，请检查系统蓝牙功能是否开启",
                showCancel: false,
                success: () => {
                  wx.getWifiList({
                    success: (e) => {
                      console.log("getWifiList succ", e);
                    },
                    fail: (e) => {
                      console.log("getWifiList fail", e);
                    },
                  });
                },
              });
            } else if (res.platform === "android") {
              wx.showModal({
                content: "蓝牙初始化失败，请检查系统蓝牙及定位功能是否开启",
                showCancel: false,
              });
            }
          },
        });

        if (res.errCode !== 10001) return;

        wx.onBluetoothAdapterStateChange((res) => {
          console.log("adapterState changed, now is", res);
          if (!res.available || !res.discovering) {
            stateChangeTog = false;
            /**
             * TODO: 提示用户开启蓝牙及定位
             */
            wx.getSystemInfo({
              success: (res) => {
                if (res.platform === "ios") {
                  wx.showModal({
                    content: "蓝牙初始化失败，请检查系统蓝牙功能是否开启",
                    showCancel: false,
                    success: () => {
                      wx.getWifiList({
                        success: (e) => {
                          console.log("getWifiList succ", e);
                        },
                        fail: (e) => {
                          console.log("getWifiList fail", e);
                        },
                      });
                    },
                  });
                } else if (res.platform === "android") {
                  wx.showModal({
                    content: "蓝牙初始化失败，请检查系统蓝牙及定位功能是否开启",
                    showCancel: false,
                  });
                }
              },
            });
            return;
          }
          if (!stateChangeTog) {
            startTime = Date.now();
            loop();
            stateChangeTog = true;
          }
        });
      },
    });
  },
  onLoad() {
    this.bindViewTap();
  },
  // onShow() {
  //   console.log("index show");
  // },
  // getUserInfo(e: any) {
  //   console.log(e);
  //   app.globalData.userInfo = e.detail.userInfo;
  //   this.setData({
  //     userInfo: e.detail.userInfo,
  //     hasUserInfo: true,
  //   });
  // },
  // onHide() {
  //   console.log("index hide");
  // },
  // onUnload() {
  //   console.log("index unload");
  // },
});
