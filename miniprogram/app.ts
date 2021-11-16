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
  },
  onShow() {},
});
