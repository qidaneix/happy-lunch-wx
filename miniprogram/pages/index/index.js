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
                _this.startScan();
            },
            fail: function (res) {
                console.error("openBluetoothAdapter fail", res);
                _this.errTips();
                _this.startTime = Date.now();
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
                                            });
                                        });
                                    }
                                });
                            }
                            catch (e) {
                                console.error("parse advertisData error", e);
                            }
                            wx.stopBluetoothDevicesDiscovery({
                                success: function (e) {
                                    console.log("stopBluetoothDevicesDiscovery succ", e);
                                },
                                fail: function (e) {
                                    console.error("stopBluetoothDevicesDiscovery fail", e);
                                },
                            });
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
                            type: "BLE",
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
        wx.stopBluetoothDevicesDiscovery();
        wx.closeBluetoothAdapter();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkErQkM7UUE5QkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFjOUIsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBaUpDO1FBL0lDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNoQyxrQkFBa0IsRUFB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VSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsTUFBTTtRQUlKLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDWCxJQUFJLEVBQUUsRUFBRTtZQUNSLFNBQVMsRUFBRSxFQUFFO1lBQ2IsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUM7UUFDSCxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBT2xCLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQ25DLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0F5QkYsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW5kZXgudHNcbi8vIOiOt+WPluW6lOeUqOWunuS+i1xuLy8gQHRzLWlnbm9yZVxuY29uc3QgYXBwID0gZ2V0QXBwPElBcHBPcHRpb24+KCk7XG5cblBhZ2Uoe1xuICBkYXRhOiB7XG4gICAgbGlzdDogW10gYXMgYW55W10sXG4gICAgZXJyb3JMaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBjb3VudDogMCxcbiAgfSxcbiAgdGltZXJJZDogbnVsbCBhcyBhbnksXG4gIHBhZ2VTaG93VGltZTogMCxcbiAgc3RhcnRUaW1lOiAwLFxuICBzY2FuVGltZTogMCxcbiAgLy8gc3RhdGVDaGFuZ2VBdmFUb2c6IGZhbHNlLFxuICAvLyBzdGF0ZUNoYW5nZU5vdEF2YVRvZzogZmFsc2UsXG4gIC8vIOS6i+S7tuWkhOeQhuWHveaVsFxuICBpbml0KCkge1xuICAgIHd4Lm9wZW5CbHVldG9vdGhBZGFwdGVyKHtcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBzdWNjXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLok53niZnlkK/liqjmiJDlip9cIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwib3BlbkJsdWV0b290aEFkYXB0ZXIgZmFpbFwiLCByZXMpO1xuICAgICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIC8vIGlmIChyZXMuZXJyQ29kZSAhPT0gMTAwMDEpIHJldHVybjtcblxuICAgICAgICAvLyB3eC5vbkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgocmVzKSA9PiB7XG4gICAgICAgIC8vICAgY29uc29sZS5sb2coXCJhZGFwdGVyU3RhdGUgY2hhbmdlZCwgbm93IGlzXCIsIHJlcyk7XG4gICAgICAgIC8vICAgaWYgKHJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICAgIC8vICAgICB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gdHJ1ZTtcbiAgICAgICAgLy8gICB9IGVsc2UgaWYgKCFyZXMuYXZhaWxhYmxlICYmICF0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBzdGFydFNjYW4oKSB7XG4gICAgLy8g5pCc57Si5aSW5Zu06JOd54mZ6K6+5aSHXG4gICAgd3guc3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgIGFsbG93RHVwbGljYXRlc0tleTogdHJ1ZSxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHBvd2VyTGV2ZWw6IFwiaGlnaFwiLFxuICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkgc3VjY1wiLCBlKTtcbiAgICAgICAgdGhpcy5zY2FuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4Lm9uQmx1ZXRvb3RoRGV2aWNlRm91bmQoKHJlcykgPT4ge1xuICAgICAgICAgIHJlcy5kZXZpY2VzLmZvckVhY2goKGRldmljZSkgPT4ge1xuICAgICAgICAgICAgLy8g6L+Z6YeM5Y+v5Lul5YGa5LiA5Lqb6L+H5rukXG4gICAgICAgICAgICBpZiAoZGV2aWNlLm5hbWUuaW5kZXhPZihcImhlbGxvXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGV2aWNlLmFkdmVydGlzRGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJyOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godmlld1tpXS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgIFwib25CbHVldG9vdGhEZXZpY2VGb3VuZCBmb3VuZCFcIixcbiAgICAgICAgICAgICAgICAgIGRldmljZSxcbiAgICAgICAgICAgICAgICAgIGRldmljZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgYXJyXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhLmxpc3QubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcGVuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnBhZ2VTaG93VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydEludGVydmFsID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbkludGVydmFsID0gbm93IC0gdGhpcy5zY2FuVGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGAke2RldmljZS5SU1NJfWRCbWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWw6IGAke29wZW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsOiBgJHtzdGFydEludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbDogYCR7c2NhbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIHR5cGU6IEJMRVxuICAgICAgICAgICAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgICAgICAgICAgICog6JOd54mZ5ZCN56ewXG4gICAgICAgICAgICAgICAgICAgICAqIOmqjOivgeeggVxuICAgICAgICAgICAgICAgICAgICAgKiDkv6Hlj7flvLrluqZcbiAgICAgICAgICAgICAgICAgICAgICog6aG16Z2i5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOWQr+WKqOaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDmkJzntKLml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgICAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlcm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBSU1NJOiBkZXZpY2UuUlNTSSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldE5hbWVNb2RhbCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBSU1NJOiBkZXZpY2UuUlNTSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwYXJzZSBhZHZlcnRpc0RhdGEgZXJyb3JcIiwgZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8g5om+5Yiw6KaB5pCc57Si55qE6K6+5aSH5ZCO77yM5Y+K5pe25YGc5q2i5omr5o+PXG4gICAgICAgICAgICAgIHd4LnN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZTogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG5cbiAgICAgICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZXJyQ29kZSA9PT0gMTAwMDEgJiYgZS5lcnJubyA9PT0gMTUwMDEwMikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgZS5lcnJDb2RlID09PSAtMSAmJlxuICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/lrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICByZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiICYmXG4gICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l5piv5ZCm5Li65b6u5L+h5o6I5p2D5a6a5L2N5Yqf6IO944CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgZXJyVGlwcygpIHtcbiAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJpb3NcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICogdXVpZFxuICAgICAgICAgICAqIOmUmeivr+exu+Wei1xuICAgICAgICAgICAqIOS/oeaBr1xuICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICovXG4gICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IEpTT04uc3RyaW5naWZ5KGFyZ3NbMV0pLFxuICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldE5hbWVNb2RhbCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBPbGRFcnJvci5jYWxsKGNvbnNvbGUsIC4uLmFyZ3MpO1xuICAgIH07XG4gIH0sXG4gIHJlcXVlc3REYXRhKGRhdGE6IGFueSkge1xuICAgIHd4LnNob3dMb2FkaW5nKHtcbiAgICAgIHRpdGxlOiBcIuS4iuS8oOWunumqjOe7k+aenOS4rVwiLFxuICAgICAgbWFzazogdHJ1ZSxcbiAgICB9KTtcbiAgICB3eC5yZXF1ZXN0KHtcbiAgICAgIHVybDogXCJodHRwczovL3R5Zy53ZWl4aWFvLnFxLmNvbS9mci9ibHVldG9vdGgvbG9nXCIsXG4gICAgICBkYXRhLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgKHJlcy5kYXRhIGFzIGFueSkuY29kZSA9PT0gMCkge1xuICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICAgIHRpdGxlOiBcIuWunumqjOS4iuaKpeaIkOWKn1wiLFxuICAgICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKHJlcyk7XG4gICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5aSx6LSlXCIsXG4gICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgcmVxdWVzdEVycm9yKGRhdGE6IGFueSkge1xuICAgIHd4LnNob3dMb2FkaW5nKHtcbiAgICAgIHRpdGxlOiBcIumUmeivr+S/oeaBr+S4iuaKpeS4rVwiLFxuICAgICAgbWFzazogdHJ1ZSxcbiAgICB9KTtcbiAgICB3eC5yZXF1ZXN0KHtcbiAgICAgIHVybDogXCJodHRwczovL3R5Zy53ZWl4aWFvLnFxLmNvbS9mci9ibHVldG9vdGgvbG9nXCIsXG4gICAgICBkYXRhLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgKHJlcy5kYXRhIGFzIGFueSkuY29kZSA9PT0gMCkge1xuICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeaIkOWKn1wiLFxuICAgICAgICAgICAgaWNvbjogXCJub25lXCIsXG4gICAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKHJlcyk7XG4gICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi6ZSZ6K+v5LiK5oql5aSx6LSlXCIsXG4gICAgICAgICAgaWNvbjogXCJub25lXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgdGltZXIoKSB7XG4gICAgdGhpcy50aW1lcklkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy5zZXREYXRhKHtcbiAgICAgICAgY291bnQ6IHRoaXMuZGF0YS5jb3VudCArIDEsXG4gICAgICB9KTtcbiAgICB9LCAxMDAwKTtcbiAgfSxcbiAgb25TaG93KCkge1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLnBvc3RFcnJvcigpO1xuICAgIHRoaXMudGltZXIoKTtcbiAgICB0aGlzLmluaXQoKTtcbiAgfSxcbiAgc2V0TmFtZU1vZGFsKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgcmV0dXJuIHd4LnNob3dNb2RhbCh7XG4gICAgICAgIHRpdGxlOiBcIuivt+i+k+WFpeaCqOeahOS8geW+ruWQje+8jOaWueS+v+aIkeS7rOWBmuWQjuacn+mXrumimOiwg+afpVwiLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGVkaXRhYmxlOiB0cnVlLFxuICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBpZiAocmVzLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHVzZXJOYW1lID0gd3guc2V0U3RvcmFnZVN5bmMoXCJ1c2VyTmFtZVwiLCByZXMuY29udGVudCk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSA9IHJlcy5jb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSA9IFwiXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIG9uSGlkZSgpIHtcbiAgICAvKipcbiAgICAgKiBjbGVhclxuICAgICAqL1xuICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICBsaXN0OiBbXSxcbiAgICAgIGVycm9yTGlzdDogW10sXG4gICAgICBjb3VudDogMCxcbiAgICB9KTtcbiAgICBjbGVhckludGVydmFsKHRoaXMudGltZXJJZCk7XG4gICAgdGhpcy50aW1lcklkID0gbnVsbDtcbiAgICB0aGlzLnBhZ2VTaG93VGltZSA9IDA7XG4gICAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICAgIHRoaXMuc2NhblRpbWUgPSAwO1xuICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSBmYWxzZTtcbiAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIC8vIHd4Lm9mZkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgpO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAvLyB3eC5vZmZCbHVldG9vdGhEZXZpY2VGb3VuZCgpO1xuICAgIHd4LnN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KCk7XG4gICAgd3guY2xvc2VCbHVldG9vdGhBZGFwdGVyKCk7XG4gIH0sXG4gIC8vIHRvQmx1ZXRvb3RoU2V0dGluZygpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImJlIGhlcmVcIik7XG4gIC8vICAgLy8gQHRzLWlnbm9yZVxuICAvLyAgIHd4Lm9wZW5TeXN0ZW1CbHVldG9vdGhTZXR0aW5nKHtcbiAgLy8gICAgIHN1Y2Nlc3MocmVzOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgICBmYWlsKGU6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAvLyAgICAgfSxcbiAgLy8gICB9KTtcbiAgLy8gfSxcbiAgLy8gdG9BcHBBdXRob3JpemVTZXR0aW5nKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiYmUgaGVyZVwiKTtcbiAgLy8gICAvLyBAdHMtaWdub3JlXG4gIC8vICAgd3gub3BlbkFwcEF1dGhvcml6ZVNldHRpbmcoe1xuICAvLyAgICAgc3VjY2VzcyhyZXM6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAvLyAgICAgfSxcbiAgLy8gICAgIGZhaWwoZTogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIC8vICAgICB9LFxuICAvLyAgIH0pO1xuICAvLyB9LFxufSk7XG4iXX0=