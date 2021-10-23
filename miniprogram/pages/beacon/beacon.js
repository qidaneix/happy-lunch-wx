"use strict";
var app = getApp();
Page({
    data: {
        list: [],
        errorList: [],
        count: 0,
    },
    timerId: null,
    pageShowTime: 0,
    startTime: 0,
    scanTime: 0,
    init: function () {
        var _this = this;
        wx.startBeaconDiscovery({
            uuids: ["FDA50693-A4E2-4FB1-AFCF-C6EB07647824"],
            success: function (res) {
                console.log("startBeaconDiscovery succ", res);
                _this.startTime = Date.now();
                wx.showToast({
                    title: "开始搜索iBeacon",
                    icon: "success",
                    duration: 5000,
                });
                _this.startScan();
            },
            fail: function (res) {
                console.error("startBeaconDiscovery fail", res);
                if (res.errCode === 11001 || res.errCode === 11002) {
                    _this.errTips();
                }
            },
        });
    },
    startScan: function () {
        var _this = this;
        wx.onBeaconUpdate(function (res) {
            console.log("onBeaconUpdate find result", res);
            if (res.beacons && res.beacons.length > 0) {
                _this.scanTime = Date.now();
                var beacon_1 = res.beacons[0];
                if (_this.data.list.length)
                    return;
                var now = Date.now();
                var openInterval_1 = now - _this.pageShowTime;
                var startInterval_1 = now - _this.startTime;
                var scanInterval_1 = now - _this.scanTime;
                _this.setData({
                    list: [
                        {
                            beaconUUID: beacon_1.uuid,
                            RSSI: beacon_1.rssi + "dBm",
                            openInterval: openInterval_1 / 1000 + "s",
                            startInterval: startInterval_1 / 1000 + "s",
                            scanInterval: scanInterval_1 / 1000 + "s",
                        },
                    ],
                }, function () {
                    if (app.globalData.userName) {
                        _this.requestData({
                            type: "iBeacon",
                            time: Date.now(),
                            beaconUUID: beacon_1.uuid,
                            RSSI: beacon_1.rssi,
                            openInterval: openInterval_1,
                            startInterval: startInterval_1,
                            scanInterval: scanInterval_1,
                            deviceInfo: wx.getSystemInfoSync(),
                            uuid: app.globalData.uuid,
                            userInfo: app.globalData.userInfo,
                            userName: app.globalData.userName,
                        });
                    }
                    else {
                        _this.setNameModal().then(function () {
                            _this.requestData({
                                type: "iBeacon",
                                time: Date.now(),
                                beaconUUID: beacon_1.uuid,
                                RSSI: beacon_1.rssi,
                                openInterval: openInterval_1,
                                startInterval: startInterval_1,
                                scanInterval: scanInterval_1,
                                deviceInfo: wx.getSystemInfoSync(),
                                uuid: app.globalData.uuid,
                                userInfo: app.globalData.userInfo,
                                userName: app.globalData.userName,
                            });
                        });
                    }
                });
                wx.stopBeaconDiscovery({
                    success: function (e) {
                        console.log("stopBeaconDiscovery succ", e);
                    },
                    fail: function (e) {
                        console.error("stopBeaconDiscovery fail", e);
                    },
                });
            }
        });
    },
    errTips: function () {
        wx.showModal({
            content: "iBeacon初始化失败，请检查系统蓝牙及定位功能是否开启。\n开启后请扫码重新进入页面！",
            showCancel: false,
        });
    },
    postError: function () {
        var _this = this;
        var OldError = console.error;
        console.error = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.setData({
                errorList: _this.data.errorList.concat([
                    {
                        type: args[0],
                        json: JSON.stringify(args[1]),
                        time: Date.now(),
                    },
                ]),
            }, function () {
                if (app.globalData.userName) {
                    _this.requestError({
                        type: "iBeacon",
                        time: Date.now(),
                        errType: args[0],
                        json: JSON.stringify(args[1]),
                        deviceInfo: wx.getSystemInfoSync(),
                        uuid: app.globalData.uuid,
                        userInfo: app.globalData.userInfo,
                        userName: app.globalData.userName,
                    });
                }
                else {
                    _this.setNameModal().then(function () {
                        _this.requestError({
                            type: "iBeacon",
                            time: Date.now(),
                            errType: args[0],
                            json: JSON.stringify(args[1]),
                            deviceInfo: wx.getSystemInfoSync(),
                            uuid: app.globalData.uuid,
                            userInfo: app.globalData.userInfo,
                            userName: app.globalData.userName,
                        });
                    });
                }
            });
            OldError.call.apply(OldError, [console].concat(args));
        };
    },
    requestData: function (data) {
        wx.showLoading({
            title: "上传实验结果中",
            mask: true,
        });
        wx.request({
            url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
            data: data,
            method: "POST",
            success: function (res) {
                if (res.statusCode === 200 && res.data.code === 0) {
                    wx.hideLoading();
                    wx.showToast({
                        title: "实验上报成功",
                        icon: "success",
                        duration: 5000,
                    });
                }
            },
            fail: function (res) {
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
    requestError: function (data) {
        wx.showLoading({
            title: "错误信息上报中",
            mask: true,
        });
        wx.request({
            url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
            data: data,
            method: "POST",
            success: function (res) {
                if (res.statusCode === 200 && res.data.code === 0) {
                    wx.hideLoading();
                    wx.showToast({
                        title: "错误上报成功",
                        icon: "none",
                        duration: 5000,
                    });
                }
            },
            fail: function (res) {
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
    timer: function () {
        var _this = this;
        this.timerId = setInterval(function () {
            _this.setData({
                count: _this.data.count + 1,
            });
        }, 1000);
    },
    onShow: function () {
        this.pageShowTime = Date.now();
        this.postError();
        this.timer();
        this.init();
    },
    setNameModal: function () {
        return new Promise(function (resolve) {
            return wx.showModal({
                title: "请输入您的企微名，方便我们做后期问题调查",
                editable: true,
                showCancel: false,
                success: function (res) {
                    if (res.content) {
                        var userName = wx.setStorageSync("userName", res.content);
                        app.globalData.userName = res.content;
                    }
                    else {
                        app.globalData.userName = "";
                    }
                    resolve(app.globalData.userName);
                },
            });
        });
    },
    onHide: function () {
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
        wx.offBeaconUpdate(function () { });
        wx.stopBeaconDiscovery();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmVhY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxJQUFNLEdBQUcsR0FBRyxNQUFNLEVBQWMsQ0FBQztBQUVqQyxJQUFJLENBQUM7SUFDSCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsRUFBVztRQUNqQixTQUFTLEVBQUUsRUFBVztRQUN0QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsT0FBTyxFQUFFLElBQVc7SUFDcEIsWUFBWSxFQUFFLENBQUM7SUFDZixTQUFTLEVBQUUsQ0FBQztJQUNaLFFBQVEsRUFBRSxDQUFDO0lBRVgsSUFBSTtRQUFKLGlCQW9CQztRQW5CQyxFQUFFLENBQUMsb0JBQW9CLENBQUM7WUFDdEIsS0FBSyxFQUFFLENBQUMsc0NBQXNDLENBQUM7WUFDL0MsT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM5QyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDNUIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDWCxLQUFLLEVBQUUsYUFBYTtvQkFDcEIsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFO29CQUNsRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFD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LE9BQU8sQ0FBQyxDQUFDO3dCQUU1RCxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO3FCQUN2Qzt5QkFBTTt3QkFDTCxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7cUJBQzlCO29CQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsTUFBTTtRQUlKLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDWCxJQUFJLEVBQUUsRUFBRTtZQUNSLFNBQVMsRUFBRSxFQUFFO1lBQ2IsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUM7UUFDSCxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLEVBQUUsQ0FBQyxlQUFlLENBQUMsY0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3QixFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW5kZXgudHNcbi8vIOiOt+WPluW6lOeUqOWunuS+i1xuLy8gQHRzLWlnbm9yZVxuY29uc3QgYXBwID0gZ2V0QXBwPElBcHBPcHRpb24+KCk7XG5cblBhZ2Uoe1xuICBkYXRhOiB7XG4gICAgbGlzdDogW10gYXMgYW55W10sXG4gICAgZXJyb3JMaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBjb3VudDogMCxcbiAgfSxcbiAgdGltZXJJZDogbnVsbCBhcyBhbnksXG4gIHBhZ2VTaG93VGltZTogMCxcbiAgc3RhcnRUaW1lOiAwLFxuICBzY2FuVGltZTogMCxcbiAgLy8g5LqL5Lu25aSE55CG5Ye95pWwXG4gIGluaXQoKSB7XG4gICAgd3guc3RhcnRCZWFjb25EaXNjb3Zlcnkoe1xuICAgICAgdXVpZHM6IFtcIkZEQTUwNjkzLUE0RTItNEZCMS1BRkNGLUM2RUIwNzY0NzgyNFwiXSwgLy8g5LiA5Liq5YWs5LyX5Y+35a+55bqU55qE6K6+5aSH55qEdXVpZFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0QmVhY29uRGlzY292ZXJ5IHN1Y2NcIiwgcmVzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuW8gOWni+aQnOe0omlCZWFjb25cIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwic3RhcnRCZWFjb25EaXNjb3ZlcnkgZmFpbFwiLCByZXMpO1xuICAgICAgICBpZiAocmVzLmVyckNvZGUgPT09IDExMDAxIHx8IHJlcy5lcnJDb2RlID09PSAxMTAwMikge1xuICAgICAgICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBzdGFydFNjYW4oKSB7XG4gICAgLy8g5qOA57SiaUJlYWNvblxuICAgIHd4Lm9uQmVhY29uVXBkYXRlKChyZXMpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwib25CZWFjb25VcGRhdGUgZmluZCByZXN1bHRcIiwgcmVzKTtcbiAgICAgIGlmIChyZXMuYmVhY29ucyAmJiByZXMuYmVhY29ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuc2NhblRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBiZWFjb24gPSByZXMuYmVhY29uc1swXTtcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5saXN0Lmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBvcGVuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnBhZ2VTaG93VGltZTtcbiAgICAgICAgY29uc3Qgc3RhcnRJbnRlcnZhbCA9IG5vdyAtIHRoaXMuc3RhcnRUaW1lO1xuICAgICAgICBjb25zdCBzY2FuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnNjYW5UaW1lO1xuICAgICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVhY29uVVVJRDogYmVhY29uLnV1aWQsXG4gICAgICAgICAgICAgICAgUlNTSTogYCR7YmVhY29uLnJzc2l9ZEJtYCxcbiAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWw6IGAke29wZW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbDogYCR7c3RhcnRJbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgc2NhbkludGVydmFsOiBgJHtzY2FuSW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogdHlwZTogaUJlYWNvblxuICAgICAgICAgICAgICog5pe26Ze05oizXG4gICAgICAgICAgICAgKiBiZWFjb25VdWlkOlVVSURcbiAgICAgICAgICAgICAqIOS/oeWPt+W8uuW6plxuICAgICAgICAgICAgICog6aG16Z2i5pe26Ze05beuXG4gICAgICAgICAgICAgKiDlkK/liqjml7bpl7Tlt65cbiAgICAgICAgICAgICAqIOaQnOe0ouaXtumXtOW3rlxuICAgICAgICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlcm5hbWVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgYmVhY29uVVVJRDogYmVhY29uLnV1aWQsXG4gICAgICAgICAgICAgICAgUlNTSTogYmVhY29uLnJzc2ksXG4gICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgc2NhbkludGVydmFsLFxuICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgICB0eXBlOiBcImlCZWFjb25cIixcbiAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICBiZWFjb25VVUlEOiBiZWFjb24udXVpZCxcbiAgICAgICAgICAgICAgICAgIFJTU0k6IGJlYWNvbi5yc3NpLFxuICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8g5YGc5q2iaUJlYWNvbuaQnOe0olxuICAgICAgICB3eC5zdG9wQmVhY29uRGlzY292ZXJ5KHtcbiAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdG9wQmVhY29uRGlzY292ZXJ5IHN1Y2NcIiwgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInN0b3BCZWFjb25EaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgZXJyVGlwcygpIHtcbiAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgY29udGVudDpcbiAgICAgICAgXCJpQmVhY29u5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Y+K5a6a5L2N5Yqf6IO95piv5ZCm5byA5ZCv44CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICB9KTtcbiAgfSxcbiAgcG9zdEVycm9yKCkge1xuICAgIGNvbnN0IE9sZEVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICBjb25zb2xlLmVycm9yID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAge1xuICAgICAgICAgIGVycm9yTGlzdDogdGhpcy5kYXRhLmVycm9yTGlzdC5jb25jYXQoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiB0eXBlOiBpQmVhY29uXG4gICAgICAgICAgICogdXVpZFxuICAgICAgICAgICAqIOmUmeivr+exu+Wei1xuICAgICAgICAgICAqIOS/oeaBr1xuICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICovXG4gICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICBlcnJUeXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXROYW1lTW9kYWwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RXJyb3Ioe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIE9sZEVycm9yLmNhbGwoY29uc29sZSwgLi4uYXJncyk7XG4gICAgfTtcbiAgfSxcbiAgcmVxdWVzdERhdGEoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi5LiK5Lyg5a6e6aqM57uT5p6c5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICByZXF1ZXN0RXJyb3IoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi6ZSZ6K+v5L+h5oGv5LiK5oql5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi6ZSZ6K+v5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICB0aW1lcigpIHtcbiAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoe1xuICAgICAgICBjb3VudDogdGhpcy5kYXRhLmNvdW50ICsgMSxcbiAgICAgIH0pO1xuICAgIH0sIDEwMDApO1xuICB9LFxuICBvblNob3coKSB7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMucG9zdEVycm9yKCk7XG4gICAgdGhpcy50aW1lcigpO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9LFxuICBzZXROYW1lTW9kYWwoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICByZXR1cm4gd3guc2hvd01vZGFsKHtcbiAgICAgICAgdGl0bGU6IFwi6K+36L6T5YWl5oKo55qE5LyB5b6u5ZCN77yM5pa55L6/5oiR5Lus5YGa5ZCO5pyf6Zeu6aKY6LCD5p+lXCIsXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZWRpdGFibGU6IHRydWUsXG4gICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGlmIChyZXMuY29udGVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgdXNlck5hbWUgPSB3eC5zZXRTdG9yYWdlU3luYyhcInVzZXJOYW1lXCIsIHJlcy5jb250ZW50KTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gcmVzLmNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgb25IaWRlKCkge1xuICAgIC8qKlxuICAgICAqIGNsZWFyXG4gICAgICovXG4gICAgdGhpcy5zZXREYXRhKHtcbiAgICAgIGxpc3Q6IFtdLFxuICAgICAgZXJyb3JMaXN0OiBbXSxcbiAgICAgIGNvdW50OiAwLFxuICAgIH0pO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcklkKTtcbiAgICB0aGlzLnRpbWVySWQgPSBudWxsO1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gMDtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgdGhpcy5zY2FuVGltZSA9IDA7XG5cbiAgICB3eC5vZmZCZWFjb25VcGRhdGUoKCkgPT4ge30pO1xuICAgIHd4LnN0b3BCZWFjb25EaXNjb3ZlcnkoKTtcbiAgfSxcbn0pO1xuIl19