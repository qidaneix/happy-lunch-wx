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
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log("openBluetoothAdapter succ", res);
                _this.startTime = Date.now();
                wx.showToast({
                    title: "蓝牙启动成功",
                    icon: "success",
                    duration: 5000,
                });
                _this.retry();
            },
            fail: function (res) {
                console.error("openBluetoothAdapter fail", res);
                _this.errTips();
                _this.startTime = Date.now();
            },
        });
    },
    retry: function () {
        var _this = this;
        this.startScan();
        setTimeout(function () {
            if (_this.data.list.length)
                return;
            _this.stopScan();
            console.error("stop scan", "for retry");
            setTimeout(function () {
                _this.retry();
                console.error("start scan", "for retry");
            }, 1000);
        }, 4000);
    },
    stopScan: function () {
        wx.stopBluetoothDevicesDiscovery({
            success: function (e) {
                console.log("stopBluetoothDevicesDiscovery succ", e);
            },
            fail: function (e) {
                console.error("stopBluetoothDevicesDiscovery fail", e);
            },
        });
    },
    startScan: function () {
        var _this = this;
        wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            powerLevel: "high",
            success: function (e) {
                console.log("startBluetoothDevicesDiscovery succ", e);
                _this.scanTime = Date.now();
                wx.onBluetoothDeviceFound(function (res) {
                    res.devices.forEach(function (device) {
                        if (device.name.indexOf("hello") > -1) {
                            try {
                                var view = new Uint8Array(device.advertisData);
                                var arr_1 = [];
                                for (var i = 0; i < view.length; i++) {
                                    arr_1.push(view[i].toString(16));
                                }
                                console.log("onBluetoothDeviceFound found!", device, device.name, arr_1);
                                if (_this.data.list.length)
                                    return;
                                var now = Date.now();
                                var openInterval_1 = now - _this.pageShowTime;
                                var startInterval_1 = now - _this.startTime;
                                var scanInterval_1 = now - _this.scanTime;
                                _this.setData({
                                    list: [
                                        {
                                            name: device.localName,
                                            arr: arr_1.join("-").toUpperCase(),
                                            RSSI: device.RSSI + "dBm",
                                            openInterval: openInterval_1 / 1000 + "s",
                                            startInterval: startInterval_1 / 1000 + "s",
                                            scanInterval: scanInterval_1 / 1000 + "s",
                                        },
                                    ],
                                }, function () {
                                    if (app.globalData.userName) {
                                        _this.requestData({
                                            type: "BLE",
                                            time: Date.now(),
                                            name: device.localName,
                                            code: arr_1.join("-").toUpperCase(),
                                            RSSI: device.RSSI,
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
                                                type: "BLE",
                                                time: Date.now(),
                                                name: device.localName,
                                                code: arr_1.join("-").toUpperCase(),
                                                RSSI: device.RSSI,
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
                            }
                            catch (e) {
                                console.error("parse advertisData error", e);
                            }
                            _this.stopScan();
                        }
                    });
                });
            },
            fail: function (e) {
                console.error("startBluetoothDevicesDiscovery fail", e);
                wx.getSystemInfo({
                    success: function (res) {
                        if (e.errCode === 10001 && e.errno === 1500102) {
                            wx.showModal({
                                content: "蓝牙搜索广播失败，请检查系统蓝牙功能是否开启。\n开启后请扫码重新进入页面！",
                                showCancel: false,
                            });
                        }
                        else if (res.platform === "android" &&
                            e.errCode === -1 &&
                            e.errno === 1509009) {
                            wx.showModal({
                                content: "蓝牙搜索广播失败，请检查系统定位功能是否开启。\n开启后请扫码重新进入页面！",
                                showCancel: false,
                            });
                        }
                        else if (res.platform === "android" &&
                            e.errCode === -1 &&
                            e.errno === 1509008) {
                            wx.showModal({
                                content: "蓝牙搜索广播失败，请检查是否为微信授权定位功能。\n开启后请扫码重新进入页面！",
                                showCancel: false,
                            });
                        }
                    },
                });
            },
        });
    },
    errTips: function () {
        wx.getSystemInfo({
            success: function (res) {
                if (res.platform === "ios") {
                    wx.showModal({
                        content: "蓝牙模块初始化失败，请检查系统蓝牙功能是否开启。\n开启后请扫码重新进入页面！",
                        showCancel: false,
                    });
                }
                else if (res.platform === "android") {
                    wx.showModal({
                        content: "蓝牙模块初始化失败，请检查系统蓝牙及定位功能是否开启。\n开启后请扫码重新进入页面！",
                        showCancel: false,
                    });
                }
            },
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
                        type: "BLE",
                        time: Date.now(),
                        errType: args[0],
                        json: args[1],
                        deviceInfo: wx.getSystemInfoSync(),
                        uuid: app.globalData.uuid,
                        userInfo: app.globalData.userInfo,
                        userName: app.globalData.userName,
                    });
                }
                else {
                    _this.setNameModal().then(function () {
                        _this.requestError({
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
        wx.stopBluetoothDevicesDiscovery();
        wx.closeBluetoothAdapter();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkFnQ0M7UUEvQkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUVILEtBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNmLENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBQyxHQUFHO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELEtBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZixLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQWM5QixDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELEtBQUs7UUFBTCxpQkFhQztRQVpDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQixVQUFVLENBQUM7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O0NBeUJGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGluZGV4LnRzXG4vLyDojrflj5blupTnlKjlrp7kvotcbi8vIEB0cy1pZ25vcmVcbmNvbnN0IGFwcCA9IGdldEFwcDxJQXBwT3B0aW9uPigpO1xuXG5QYWdlKHtcbiAgZGF0YToge1xuICAgIGxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGVycm9yTGlzdDogW10gYXMgYW55W10sXG4gICAgY291bnQ6IDAsXG4gIH0sXG4gIHRpbWVySWQ6IG51bGwgYXMgYW55LFxuICBwYWdlU2hvd1RpbWU6IDAsXG4gIHN0YXJ0VGltZTogMCxcbiAgc2NhblRpbWU6IDAsXG4gIC8vIHN0YXRlQ2hhbmdlQXZhVG9nOiBmYWxzZSxcbiAgLy8gc3RhdGVDaGFuZ2VOb3RBdmFUb2c6IGZhbHNlLFxuICAvLyDkuovku7blpITnkIblh73mlbBcbiAgaW5pdCgpIHtcbiAgICB3eC5vcGVuQmx1ZXRvb3RoQWRhcHRlcih7XG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwib3BlbkJsdWV0b290aEFkYXB0ZXIgc3VjY1wiLCByZXMpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi6JOd54mZ5ZCv5Yqo5oiQ5YqfXCIsXG4gICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyB0aGlzLnN0YXJ0U2NhbigpO1xuICAgICAgICB0aGlzLnJldHJ5KCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwib3BlbkJsdWV0b290aEFkYXB0ZXIgZmFpbFwiLCByZXMpO1xuICAgICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIC8vIGlmIChyZXMuZXJyQ29kZSAhPT0gMTAwMDEpIHJldHVybjtcblxuICAgICAgICAvLyB3eC5vbkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgocmVzKSA9PiB7XG4gICAgICAgIC8vICAgY29uc29sZS5sb2coXCJhZGFwdGVyU3RhdGUgY2hhbmdlZCwgbm93IGlzXCIsIHJlcyk7XG4gICAgICAgIC8vICAgaWYgKHJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICAgIC8vICAgICB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gdHJ1ZTtcbiAgICAgICAgLy8gICB9IGVsc2UgaWYgKCFyZXMuYXZhaWxhYmxlICYmICF0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICByZXRyeSgpIHtcbiAgICB0aGlzLnN0YXJ0U2NhbigpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGF0YS5saXN0Lmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgICB0aGlzLnN0b3BTY2FuKCk7XG4gICAgICBjb25zb2xlLmVycm9yKFwic3RvcCBzY2FuXCIsIFwiZm9yIHJldHJ5XCIpO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5yZXRyeSgpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwic3RhcnQgc2NhblwiLCBcImZvciByZXRyeVwiKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0sIDQwMDApO1xuICB9LFxuICBzdG9wU2NhbigpIHtcbiAgICB3eC5zdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSh7XG4gICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IHN1Y2NcIiwgZSk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBzdGFydFNjYW4oKSB7XG4gICAgLy8g5pCc57Si5aSW5Zu06JOd54mZ6K6+5aSHXG4gICAgd3guc3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgIGFsbG93RHVwbGljYXRlc0tleTogdHJ1ZSxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHBvd2VyTGV2ZWw6IFwiaGlnaFwiLFxuICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkgc3VjY1wiLCBlKTtcbiAgICAgICAgdGhpcy5zY2FuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4Lm9uQmx1ZXRvb3RoRGV2aWNlRm91bmQoKHJlcykgPT4ge1xuICAgICAgICAgIHJlcy5kZXZpY2VzLmZvckVhY2goKGRldmljZSkgPT4ge1xuICAgICAgICAgICAgLy8g6L+Z6YeM5Y+v5Lul5YGa5LiA5Lqb6L+H5rukXG4gICAgICAgICAgICBpZiAoZGV2aWNlLm5hbWUuaW5kZXhPZihcImhlbGxvXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGV2aWNlLmFkdmVydGlzRGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJyOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godmlld1tpXS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgIFwib25CbHVldG9vdGhEZXZpY2VGb3VuZCBmb3VuZCFcIixcbiAgICAgICAgICAgICAgICAgIGRldmljZSxcbiAgICAgICAgICAgICAgICAgIGRldmljZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgYXJyXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhLmxpc3QubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcGVuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnBhZ2VTaG93VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydEludGVydmFsID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbkludGVydmFsID0gbm93IC0gdGhpcy5zY2FuVGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGAke2RldmljZS5SU1NJfWRCbWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWw6IGAke29wZW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsOiBgJHtzdGFydEludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbDogYCR7c2NhbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIHR5cGU6IEJMRVxuICAgICAgICAgICAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgICAgICAgICAgICog6JOd54mZ5ZCN56ewXG4gICAgICAgICAgICAgICAgICAgICAqIOmqjOivgeeggVxuICAgICAgICAgICAgICAgICAgICAgKiDkv6Hlj7flvLrluqZcbiAgICAgICAgICAgICAgICAgICAgICog6aG16Z2i5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOWQr+WKqOaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDmkJzntKLml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgICAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlcm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBSU1NJOiBkZXZpY2UuUlNTSSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE5hbWVNb2RhbCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBSU1NJOiBkZXZpY2UuUlNTSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInBhcnNlIGFkdmVydGlzRGF0YSBlcnJvclwiLCBlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyDmib7liLDopoHmkJzntKLnmoTorr7lpIflkI7vvIzlj4rml7blgZzmraLmiavmj49cbiAgICAgICAgICAgICAgdGhpcy5zdG9wU2NhbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZTogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG5cbiAgICAgICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZXJyQ29kZSA9PT0gMTAwMDEgJiYgZS5lcnJubyA9PT0gMTUwMDEwMikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgZS5lcnJDb2RlID09PSAtMSAmJlxuICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/lrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICByZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiICYmXG4gICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l5piv5ZCm5Li65b6u5L+h5o6I5p2D5a6a5L2N5Yqf6IO944CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgZXJyVGlwcygpIHtcbiAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJpb3NcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICogdXVpZFxuICAgICAgICAgICAqIOmUmeivr+exu+Wei1xuICAgICAgICAgICAqIOS/oeaBr1xuICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICovXG4gICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IGFyZ3NbMV0sXG4gICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVxdWVzdEVycm9yKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAgICBqc29uOiBhcmdzWzFdLFxuICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgT2xkRXJyb3IuY2FsbChjb25zb2xlLCAuLi5hcmdzKTtcbiAgICB9O1xuICB9LFxuICByZXF1ZXN0RGF0YShkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLkuIrkvKDlrp7pqoznu5PmnpzkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuWunumqjOS4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHJlcXVlc3RFcnJvcihkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLplJnor6/kv6Hmga/kuIrmiqXkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHRpbWVyKCkge1xuICAgIHRoaXMudGltZXJJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICAgIGNvdW50OiB0aGlzLmRhdGEuY291bnQgKyAxLFxuICAgICAgfSk7XG4gICAgfSwgMTAwMCk7XG4gIH0sXG4gIG9uU2hvdygpIHtcbiAgICB0aGlzLnBhZ2VTaG93VGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5wb3N0RXJyb3IoKTtcbiAgICB0aGlzLnRpbWVyKCk7XG4gICAgdGhpcy5pbml0KCk7XG4gIH0sXG4gIHNldE5hbWVNb2RhbCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHJldHVybiB3eC5zaG93TW9kYWwoe1xuICAgICAgICB0aXRsZTogXCLor7fovpPlhaXmgqjnmoTkvIHlvq7lkI3vvIzmlrnkvr/miJHku6zlgZrlkI7mnJ/pl67popjosIPmn6VcIixcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcbiAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgaWYgKHJlcy5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB1c2VyTmFtZSA9IHd4LnNldFN0b3JhZ2VTeW5jKFwidXNlck5hbWVcIiwgcmVzLmNvbnRlbnQpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSByZXMuY29udGVudDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuICBvbkhpZGUoKSB7XG4gICAgLyoqXG4gICAgICogY2xlYXJcbiAgICAgKi9cbiAgICB0aGlzLnNldERhdGEoe1xuICAgICAgbGlzdDogW10sXG4gICAgICBlcnJvckxpc3Q6IFtdLFxuICAgICAgY291bnQ6IDAsXG4gICAgfSk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgIHRoaXMudGltZXJJZCA9IG51bGw7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSAwO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICB0aGlzLnNjYW5UaW1lID0gMDtcbiAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gZmFsc2U7XG4gICAgLy8gdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IGZhbHNlO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAvLyB3eC5vZmZCbHVldG9vdGhBZGFwdGVyU3RhdGVDaGFuZ2UoKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgLy8gd3gub2ZmQmx1ZXRvb3RoRGV2aWNlRm91bmQoKTtcbiAgICB3eC5zdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSgpO1xuICAgIHd4LmNsb3NlQmx1ZXRvb3RoQWRhcHRlcigpO1xuICB9LFxuICAvLyB0b0JsdWV0b290aFNldHRpbmcoKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJiZSBoZXJlXCIpO1xuICAvLyAgIC8vIEB0cy1pZ25vcmVcbiAgLy8gICB3eC5vcGVuU3lzdGVtQmx1ZXRvb3RoU2V0dGluZyh7XG4gIC8vICAgICBzdWNjZXNzKHJlczogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gIC8vICAgICB9LFxuICAvLyAgICAgZmFpbChlOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgfSk7XG4gIC8vIH0sXG4gIC8vIHRvQXBwQXV0aG9yaXplU2V0dGluZygpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImJlIGhlcmVcIik7XG4gIC8vICAgLy8gQHRzLWlnbm9yZVxuICAvLyAgIHd4Lm9wZW5BcHBBdXRob3JpemVTZXR0aW5nKHtcbiAgLy8gICAgIHN1Y2Nlc3MocmVzOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgICBmYWlsKGU6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAvLyAgICAgfSxcbiAgLy8gICB9KTtcbiAgLy8gfSxcbn0pO1xuIl19