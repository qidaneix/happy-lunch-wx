// index.ts
// 获取应用实例
const app = getApp<IAppOption>();

Page({
  data: {
    list: [],
  },
  // 事件处理函数
  bindViewTap() {
    const loop = () => {
      // 搜索外围蓝牙设备
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
                      name: device.name,
                      arr: arr.join("-").toUpperCase(),
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
          wx.getSystemInfo({
            success: (res) => {
              if (
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
    let stateChangeTog = false;
    wx.openBluetoothAdapter({
      success(res) {
        console.log("openBluetoothAdapter succ", res);
        wx.showToast({
          title: "蓝牙初始化成功",
          icon: "success",
          duration: 2000,
        });
        loop();
      },
      fail(res) {
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

        // if (res.errCode !== 10001) return;

        wx.onBluetoothAdapterStateChange((res) => {
          console.log("adapterState changed, now is", res);
          if (!res.available) return;
          if (!stateChangeTog) {
            loop();
            stateChangeTog = true;
          }
        });
      },
    });
  },
  // onLoad() {
  //   console.log("index load");
  //   if (app.globalData.userInfo) {
  //     this.setData({
  //       userInfo: app.globalData.userInfo,
  //       hasUserInfo: true,
  //     });
  //   } else if (this.data.canIUse) {
  //     // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
  //     // 所以此处加入 callback 以防止这种情况
  //     app.userInfoReadyCallback = (res) => {
  //       this.setData({
  //         userInfo: res.userInfo,
  //         hasUserInfo: true,
  //       });
  //     };
  //   } else {
  //     // 在没有 open-type=getUserInfo 版本的兼容处理
  //     wx.getUserInfo({
  //       success: (res) => {
  //         app.globalData.userInfo = res.userInfo;
  //         this.setData({
  //           userInfo: res.userInfo,
  //           hasUserInfo: true,
  //         });
  //       },
  //     });
  //   }
  // },
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
