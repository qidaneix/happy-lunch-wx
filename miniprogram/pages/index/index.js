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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkErQkM7UUE5QkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFjOUIsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBbUpDO1FBakpDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNoQyxrQkFBa0IsRUFB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OUI7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNO1FBSUosSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNYLElBQUksRUFBRSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFPbEIsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDbkMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDN0IsQ0FBQztDQXlCRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbmRleC50c1xuLy8g6I635Y+W5bqU55So5a6e5L6LXG4vLyBAdHMtaWdub3JlXG5jb25zdCBhcHAgPSBnZXRBcHA8SUFwcE9wdGlvbj4oKTtcblxuUGFnZSh7XG4gIGRhdGE6IHtcbiAgICBsaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBlcnJvckxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGNvdW50OiAwLFxuICB9LFxuICB0aW1lcklkOiBudWxsIGFzIGFueSxcbiAgcGFnZVNob3dUaW1lOiAwLFxuICBzdGFydFRpbWU6IDAsXG4gIHNjYW5UaW1lOiAwLFxuICAvLyBzdGF0ZUNoYW5nZUF2YVRvZzogZmFsc2UsXG4gIC8vIHN0YXRlQ2hhbmdlTm90QXZhVG9nOiBmYWxzZSxcbiAgLy8g5LqL5Lu25aSE55CG5Ye95pWwXG4gIGluaXQoKSB7XG4gICAgd3gub3BlbkJsdWV0b290aEFkYXB0ZXIoe1xuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm9wZW5CbHVldG9vdGhBZGFwdGVyIHN1Y2NcIiwgcmVzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuiTneeJmeWQr+WKqOaIkOWKn1wiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBmYWlsXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLy8gaWYgKHJlcy5lcnJDb2RlICE9PSAxMDAwMSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHd4Lm9uQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKChyZXMpID0+IHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhcImFkYXB0ZXJTdGF0ZSBjaGFuZ2VkLCBub3cgaXNcIiwgcmVzKTtcbiAgICAgICAgLy8gICBpZiAocmVzLmF2YWlsYWJsZSAmJiAhdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZykge1xuICAgICAgICAvLyAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH0gZWxzZSBpZiAoIXJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICAvLyAgICAgdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IHRydWU7XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHN0YXJ0U2NhbigpIHtcbiAgICAvLyDmkJzntKLlpJblm7Tok53niZnorr7lpIdcbiAgICB3eC5zdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgYWxsb3dEdXBsaWNhdGVzS2V5OiB0cnVlLFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcG93ZXJMZXZlbDogXCJoaWdoXCIsXG4gICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0Qmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICB0aGlzLnNjYW5UaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3gub25CbHVldG9vdGhEZXZpY2VGb3VuZCgocmVzKSA9PiB7XG4gICAgICAgICAgcmVzLmRldmljZXMuZm9yRWFjaCgoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgICAvLyDov5nph4zlj6/ku6XlgZrkuIDkupvov4fmu6RcbiAgICAgICAgICAgIGlmIChkZXZpY2UubmFtZS5pbmRleE9mKFwiaGVsbG9cIikgPiAtMSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShkZXZpY2UuYWR2ZXJ0aXNEYXRhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnI6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBhcnIucHVzaCh2aWV3W2ldLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgXCJvbkJsdWV0b290aERldmljZUZvdW5kIGZvdW5kIVwiLFxuICAgICAgICAgICAgICAgICAgZGV2aWNlLFxuICAgICAgICAgICAgICAgICAgZGV2aWNlLm5hbWUsXG4gICAgICAgICAgICAgICAgICBhcnJcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmRhdGEubGlzdC5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wZW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMucGFnZVNob3dUaW1lO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0SW50ZXJ2YWwgPSBub3cgLSB0aGlzLnN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnNjYW5UaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdDogW1xuICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnI6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgUlNTSTogYCR7ZGV2aWNlLlJTU0l9ZEJtYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbDogYCR7b3BlbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWw6IGAke3N0YXJ0SW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsOiBgJHtzY2FuSW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAgICAgICAgICAgKiDok53niZnlkI3np7BcbiAgICAgICAgICAgICAgICAgICAgICog6aqM6K+B56CBXG4gICAgICAgICAgICAgICAgICAgICAqIOS/oeWPt+W8uuW6plxuICAgICAgICAgICAgICAgICAgICAgKiDpobXpnaLml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog5ZCv5Yqo5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOaQnOe0ouaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5sb2NhbE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGRldmljZS5SU1NJLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV2aWNlLmxvY2FsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZTogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGRldmljZS5SU1NJLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwicGFyc2UgYWR2ZXJ0aXNEYXRhIGVycm9yXCIsIGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIOaJvuWIsOimgeaQnOe0oueahOiuvuWkh+WQju+8jOWPiuaXtuWBnOatouaJq+aPj1xuICAgICAgICAgICAgICB3eC5zdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3RvcEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkgc3VjY1wiLCBlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZhaWw6IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwic3RvcEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKGU6IGFueSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwic3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSBmYWxzZTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IGZhbHNlO1xuXG4gICAgICAgIHd4LmdldFN5c3RlbUluZm8oe1xuICAgICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlLmVyckNvZGUgPT09IDEwMDAxICYmIGUuZXJybm8gPT09IDE1MDAxMDIpIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICByZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiICYmXG4gICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l57O757uf5a6a5L2N5Yqf6IO95piv5ZCm5byA5ZCv44CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgcmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIiAmJlxuICAgICAgICAgICAgICBlLmVyckNvZGUgPT09IC0xICYmXG4gICAgICAgICAgICAgIGUuZXJybm8gPT09IDE1MDkwMDhcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeaYr+WQpuS4uuW+ruS/oeaOiOadg+WumuS9jeWKn+iDveOAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIGVyclRpcHMoKSB7XG4gICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMucGxhdGZvcm0gPT09IFwiaW9zXCIpIHtcbiAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgXCLok53niZnmqKHlnZfliJ3lp4vljJblpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIpIHtcbiAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgXCLok53niZnmqKHlnZfliJ3lp4vljJblpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlj4rlrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBwb3N0RXJyb3IoKSB7XG4gICAgY29uc3QgT2xkRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuICAgIGNvbnNvbGUuZXJyb3IgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5zZXREYXRhKFxuICAgICAgICB7XG4gICAgICAgICAgZXJyb3JMaXN0OiB0aGlzLmRhdGEuZXJyb3JMaXN0LmNvbmNhdChbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IEpTT04uc3RyaW5naWZ5KGFyZ3NbMV0pLFxuICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIHR5cGU6IEJMRVxuICAgICAgICAgICAqIHV1aWRcbiAgICAgICAgICAgKiDplJnor6/nsbvlnotcbiAgICAgICAgICAgKiDkv6Hmga9cbiAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VybmFtZVxuICAgICAgICAgICAqL1xuICAgICAgICAgIGlmIChhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RXJyb3Ioe1xuICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICBlcnJUeXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICBqc29uOiBhcmdzWzFdLFxuICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNldE5hbWVNb2RhbCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJCTEVcIixcbiAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgICAganNvbjogYXJnc1sxXSxcbiAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIE9sZEVycm9yLmNhbGwoY29uc29sZSwgLi4uYXJncyk7XG4gICAgfTtcbiAgfSxcbiAgcmVxdWVzdERhdGEoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi5LiK5Lyg5a6e6aqM57uT5p6c5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICByZXF1ZXN0RXJyb3IoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi6ZSZ6K+v5L+h5oGv5LiK5oql5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi6ZSZ6K+v5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICB0aW1lcigpIHtcbiAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoe1xuICAgICAgICBjb3VudDogdGhpcy5kYXRhLmNvdW50ICsgMSxcbiAgICAgIH0pO1xuICAgIH0sIDEwMDApO1xuICB9LFxuICBvblNob3coKSB7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMucG9zdEVycm9yKCk7XG4gICAgdGhpcy50aW1lcigpO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9LFxuICBzZXROYW1lTW9kYWwoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICByZXR1cm4gd3guc2hvd01vZGFsKHtcbiAgICAgICAgdGl0bGU6IFwi6K+36L6T5YWl5oKo55qE5LyB5b6u5ZCN77yM5pa55L6/5oiR5Lus5YGa5ZCO5pyf6Zeu6aKY6LCD5p+lXCIsXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZWRpdGFibGU6IHRydWUsXG4gICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGlmIChyZXMuY29udGVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgdXNlck5hbWUgPSB3eC5zZXRTdG9yYWdlU3luYyhcInVzZXJOYW1lXCIsIHJlcy5jb250ZW50KTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gcmVzLmNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgb25IaWRlKCkge1xuICAgIC8qKlxuICAgICAqIGNsZWFyXG4gICAgICovXG4gICAgdGhpcy5zZXREYXRhKHtcbiAgICAgIGxpc3Q6IFtdLFxuICAgICAgZXJyb3JMaXN0OiBbXSxcbiAgICAgIGNvdW50OiAwLFxuICAgIH0pO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcklkKTtcbiAgICB0aGlzLnRpbWVySWQgPSBudWxsO1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gMDtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgdGhpcy5zY2FuVGltZSA9IDA7XG4gICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSBmYWxzZTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgLy8gd3gub2ZmQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIC8vIHd4Lm9mZkJsdWV0b290aERldmljZUZvdW5kKCk7XG4gICAgd3guc3RvcEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkoKTtcbiAgICB3eC5jbG9zZUJsdWV0b290aEFkYXB0ZXIoKTtcbiAgfSxcbiAgLy8gdG9CbHVldG9vdGhTZXR0aW5nKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiYmUgaGVyZVwiKTtcbiAgLy8gICAvLyBAdHMtaWdub3JlXG4gIC8vICAgd3gub3BlblN5c3RlbUJsdWV0b290aFNldHRpbmcoe1xuICAvLyAgICAgc3VjY2VzcyhyZXM6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAvLyAgICAgfSxcbiAgLy8gICAgIGZhaWwoZTogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIC8vICAgICB9LFxuICAvLyAgIH0pO1xuICAvLyB9LFxuICAvLyB0b0FwcEF1dGhvcml6ZVNldHRpbmcoKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJiZSBoZXJlXCIpO1xuICAvLyAgIC8vIEB0cy1pZ25vcmVcbiAgLy8gICB3eC5vcGVuQXBwQXV0aG9yaXplU2V0dGluZyh7XG4gIC8vICAgICBzdWNjZXNzKHJlczogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gIC8vICAgICB9LFxuICAvLyAgICAgZmFpbChlOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgfSk7XG4gIC8vIH0sXG59KTtcbiJdfQ==