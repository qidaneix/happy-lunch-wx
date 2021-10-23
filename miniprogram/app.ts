// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    const setUUID = () => {
      const uuid = Math.random().toString().slice(2, 15);
      this.globalData.uuid = uuid;
      wx.setStorageSync("uuid", {
        uuid,
        time: Date.now(),
      });
    };

    const { time, uuid } = wx.getStorageSync("uuid");
    if (!time || !uuid || Date.now() - time > 1000 * 4 * 60 * 60) {
      // 不存在或者超过4小时，重置
      setUUID();
    } else {
      this.globalData.uuid = uuid;
    }

    const userName = wx.getStorageSync("userName");
    if (userName) {
      this.globalData.userName = userName;
    }

    // 获取用户信息
    wx.getSetting({
      success: (res) => {
        if (res.authSetting["scope.userInfo"]) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: (res) => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            },
          });
        }
      },
    });
  },
  onShow() {
    const { time } = wx.getStorageSync("uuid");
    const userName = wx.getStorageSync("userName");
    console.log("uuid", wx.getStorageSync("uuid"));
    console.log("userName", userName);
    console.log(
      "timeout",
      Date.now() - time,
      Date.now() - time > 1000 * 4 * 60 * 60
    );
  },
});
