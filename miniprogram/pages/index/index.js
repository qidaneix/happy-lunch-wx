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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkErQkM7UUE5QkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFjOUIsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBaUpDO1FBL0lDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNoQyxrQkFBa0IsRUFB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TCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNO1FBSUosSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNYLElBQUksRUFBRSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFPbEIsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDbkMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDN0IsQ0FBQztDQXlCRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbmRleC50c1xuLy8g6I635Y+W5bqU55So5a6e5L6LXG4vLyBAdHMtaWdub3JlXG5jb25zdCBhcHAgPSBnZXRBcHA8SUFwcE9wdGlvbj4oKTtcblxuUGFnZSh7XG4gIGRhdGE6IHtcbiAgICBsaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBlcnJvckxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGNvdW50OiAwLFxuICB9LFxuICB0aW1lcklkOiBudWxsIGFzIGFueSxcbiAgcGFnZVNob3dUaW1lOiAwLFxuICBzdGFydFRpbWU6IDAsXG4gIHNjYW5UaW1lOiAwLFxuICAvLyBzdGF0ZUNoYW5nZUF2YVRvZzogZmFsc2UsXG4gIC8vIHN0YXRlQ2hhbmdlTm90QXZhVG9nOiBmYWxzZSxcbiAgLy8g5LqL5Lu25aSE55CG5Ye95pWwXG4gIGluaXQoKSB7XG4gICAgd3gub3BlbkJsdWV0b290aEFkYXB0ZXIoe1xuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm9wZW5CbHVldG9vdGhBZGFwdGVyIHN1Y2NcIiwgcmVzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuiTneeJmeWQr+WKqOaIkOWKn1wiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBmYWlsXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLy8gaWYgKHJlcy5lcnJDb2RlICE9PSAxMDAwMSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHd4Lm9uQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKChyZXMpID0+IHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhcImFkYXB0ZXJTdGF0ZSBjaGFuZ2VkLCBub3cgaXNcIiwgcmVzKTtcbiAgICAgICAgLy8gICBpZiAocmVzLmF2YWlsYWJsZSAmJiAhdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZykge1xuICAgICAgICAvLyAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH0gZWxzZSBpZiAoIXJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICAvLyAgICAgdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IHRydWU7XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHN0YXJ0U2NhbigpIHtcbiAgICAvLyDmkJzntKLlpJblm7Tok53niZnorr7lpIdcbiAgICB3eC5zdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgYWxsb3dEdXBsaWNhdGVzS2V5OiB0cnVlLFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcG93ZXJMZXZlbDogXCJoaWdoXCIsXG4gICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0Qmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICB0aGlzLnNjYW5UaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3gub25CbHVldG9vdGhEZXZpY2VGb3VuZCgocmVzKSA9PiB7XG4gICAgICAgICAgcmVzLmRldmljZXMuZm9yRWFjaCgoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgICAvLyDov5nph4zlj6/ku6XlgZrkuIDkupvov4fmu6RcbiAgICAgICAgICAgIGlmIChkZXZpY2UubmFtZS5pbmRleE9mKFwiaGVsbG9cIikgPiAtMSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShkZXZpY2UuYWR2ZXJ0aXNEYXRhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnI6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh2aWV3W2ldLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgXCJvbkJsdWV0b290aERldmljZUZvdW5kIGZvdW5kIVwiLFxuICAgICAgICAgICAgICAgICAgZGV2aWNlLFxuICAgICAgICAgICAgICAgICAgZGV2aWNlLm5hbWUsXG4gICAgICAgICAgICAgICAgICBhcnJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmRhdGEubGlzdC5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wZW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMucGFnZVNob3dUaW1lO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0SW50ZXJ2YWwgPSBub3cgLSB0aGlzLnN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnNjYW5UaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnI6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgUlNTSTogYCR7ZGV2aWNlLlJTU0l9ZEJtYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbDogYCR7b3BlbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWw6IGAke3N0YXJ0SW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsOiBgJHtzY2FuSW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAgICAgICAgICAgKiDok53niZnlkI3np7BcbiAgICAgICAgICAgICAgICAgICAgICog6aqM6K+B56CBXG4gICAgICAgICAgICAgICAgICAgICAqIOS/oeWPt+W8uuW6plxuICAgICAgICAgICAgICAgICAgICAgKiDpobXpnaLml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog5ZCv5Yqo5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOaQnOe0ouaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGRldmljZS5SU1NJLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV2aWNlLmxvY2FsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGRldmljZS5SU1NJLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInBhcnNlIGFkdmVydGlzRGF0YSBlcnJvclwiLCBlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyDmib7liLDopoHmkJzntKLnmoTorr7lpIflkI7vvIzlj4rml7blgZzmraLmiavmj49cbiAgICAgICAgICAgICAgd3guc3RvcEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IHN1Y2NcIiwgZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmYWlsOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIGZhaWw6IChlOiBhbnkpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcInN0YXJ0Qmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gZmFsc2U7XG4gICAgICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSBmYWxzZTtcblxuICAgICAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5lcnJDb2RlID09PSAxMDAwMSAmJiBlLmVycm5vID09PSAxNTAwMTAyKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Yqf6IO95piv5ZCm5byA5ZCv44CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgcmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIiAmJlxuICAgICAgICAgICAgICBlLmVyckNvZGUgPT09IC0xICYmXG4gICAgICAgICAgICAgIGUuZXJybm8gPT09IDE1MDkwMDlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+WumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgZS5lcnJDb2RlID09PSAtMSAmJlxuICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA4XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6XmmK/lkKbkuLrlvq7kv6HmjojmnYPlrprkvY3lip/og73jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBlcnJUaXBzKCkge1xuICAgIHd4LmdldFN5c3RlbUluZm8oe1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnBsYXRmb3JtID09PSBcImlvc1wiKSB7XG4gICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgIFwi6JOd54mZ5qih5Z2X5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Yqf6IO95piv5ZCm5byA5ZCv44CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChyZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiKSB7XG4gICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgIFwi6JOd54mZ5qih5Z2X5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Y+K5a6a5L2N5Yqf6IO95piv5ZCm5byA5ZCv44CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgcG9zdEVycm9yKCkge1xuICAgIGNvbnN0IE9sZEVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICBjb25zb2xlLmVycm9yID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAge1xuICAgICAgICAgIGVycm9yTGlzdDogdGhpcy5kYXRhLmVycm9yTGlzdC5jb25jYXQoW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0eXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSksXG4gICAgICAgIH0sXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiB0eXBlOiBCTEVcbiAgICAgICAgICAgKiB1dWlkXG4gICAgICAgICAgICog6ZSZ6K+v57G75Z6LXG4gICAgICAgICAgICog5L+h5oGvXG4gICAgICAgICAgICog5pe26Ze05oizXG4gICAgICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlcm5hbWVcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBpZiAoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEVycm9yKHtcbiAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogYXJnc1sxXSxcbiAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXROYW1lTW9kYWwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RXJyb3Ioe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBlcnJUeXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICAgIGpzb246IGFyZ3NbMV0sXG4gICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBPbGRFcnJvci5jYWxsKGNvbnNvbGUsIC4uLmFyZ3MpO1xuICAgIH07XG4gIH0sXG4gIHJlcXVlc3REYXRhKGRhdGE6IGFueSkge1xuICAgIHd4LnNob3dMb2FkaW5nKHtcbiAgICAgIHRpdGxlOiBcIuS4iuS8oOWunumqjOe7k+aenOS4rVwiLFxuICAgICAgbWFzazogdHJ1ZSxcbiAgICB9KTtcbiAgICB3eC5yZXF1ZXN0KHtcbiAgICAgIHVybDogXCJodHRwczovL3R5Zy53ZWl4aWFvLnFxLmNvbS9mci9ibHVldG9vdGgvbG9nXCIsXG4gICAgICBkYXRhLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgKHJlcy5kYXRhIGFzIGFueSkuY29kZSA9PT0gMCkge1xuICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICAgIHRpdGxlOiBcIuWunumqjOS4iuaKpeaIkOWKn1wiLFxuICAgICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKHJlcyk7XG4gICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5aSx6LSlXCIsXG4gICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgcmVxdWVzdEVycm9yKGRhdGE6IGFueSkge1xuICAgIHd4LnNob3dMb2FkaW5nKHtcbiAgICAgIHRpdGxlOiBcIumUmeivr+S/oeaBr+S4iuaKpeS4rVwiLFxuICAgICAgbWFzazogdHJ1ZSxcbiAgICB9KTtcbiAgICB3eC5yZXF1ZXN0KHtcbiAgICAgIHVybDogXCJodHRwczovL3R5Zy53ZWl4aWFvLnFxLmNvbS9mci9ibHVldG9vdGgvbG9nXCIsXG4gICAgICBkYXRhLFxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgKHJlcy5kYXRhIGFzIGFueSkuY29kZSA9PT0gMCkge1xuICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeaIkOWKn1wiLFxuICAgICAgICAgICAgaWNvbjogXCJub25lXCIsXG4gICAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKHJlcyk7XG4gICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi6ZSZ6K+v5LiK5oql5aSx6LSlXCIsXG4gICAgICAgICAgaWNvbjogXCJub25lXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgdGltZXIoKSB7XG4gICAgdGhpcy50aW1lcklkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy5zZXREYXRhKHtcbiAgICAgICAgY291bnQ6IHRoaXMuZGF0YS5jb3VudCArIDEsXG4gICAgICB9KTtcbiAgICB9LCAxMDAwKTtcbiAgfSxcbiAgb25TaG93KCkge1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLnBvc3RFcnJvcigpO1xuICAgIHRoaXMudGltZXIoKTtcbiAgICB0aGlzLmluaXQoKTtcbiAgfSxcbiAgc2V0TmFtZU1vZGFsKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgcmV0dXJuIHd4LnNob3dNb2RhbCh7XG4gICAgICAgIHRpdGxlOiBcIuivt+i+k+WFpeaCqOeahOS8geW+ruWQje+8jOaWueS+v+aIkeS7rOWBmuWQjuacn+mXrumimOiwg+afpVwiLFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGVkaXRhYmxlOiB0cnVlLFxuICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBpZiAocmVzLmNvbnRlbnQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0IHVzZXJOYW1lID0gd3guc2V0U3RvcmFnZVN5bmMoXCJ1c2VyTmFtZVwiLCByZXMuY29udGVudCk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSA9IHJlcy5jb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSA9IFwiXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIG9uSGlkZSgpIHtcbiAgICAvKipcbiAgICAgKiBjbGVhclxuICAgICAqL1xuICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICBsaXN0OiBbXSxcbiAgICAgIGVycm9yTGlzdDogW10sXG4gICAgICBjb3VudDogMCxcbiAgICB9KTtcbiAgICBjbGVhckludGVydmFsKHRoaXMudGltZXJJZCk7XG4gICAgdGhpcy50aW1lcklkID0gbnVsbDtcbiAgICB0aGlzLnBhZ2VTaG93VGltZSA9IDA7XG4gICAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICAgIHRoaXMuc2NhblRpbWUgPSAwO1xuICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSBmYWxzZTtcbiAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIC8vIHd4Lm9mZkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgpO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAvLyB3eC5vZmZCbHVldG9vdGhEZXZpY2VGb3VuZCgpO1xuICAgIHd4LnN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KCk7XG4gICAgd3guY2xvc2VCbHVldG9vdGhBZGFwdGVyKCk7XG4gIH0sXG4gIC8vIHRvQmx1ZXRvb3RoU2V0dGluZygpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImJlIGhlcmVcIik7XG4gIC8vICAgLy8gQHRzLWlnbm9yZVxuICAvLyAgIHd4Lm9wZW5TeXN0ZW1CbHVldG9vdGhTZXR0aW5nKHtcbiAgLy8gICAgIHN1Y2Nlc3MocmVzOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgICBmYWlsKGU6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAvLyAgICAgfSxcbiAgLy8gICB9KTtcbiAgLy8gfSxcbiAgLy8gdG9BcHBBdXRob3JpemVTZXR0aW5nKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiYmUgaGVyZVwiKTtcbiAgLy8gICAvLyBAdHMtaWdub3JlXG4gIC8vICAgd3gub3BlbkFwcEF1dGhvcml6ZVNldHRpbmcoe1xuICAvLyAgICAgc3VjY2VzcyhyZXM6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAvLyAgICAgfSxcbiAgLy8gICAgIGZhaWwoZTogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIC8vICAgICB9LFxuICAvLyAgIH0pO1xuICAvLyB9LFxufSk7XG4iXX0=