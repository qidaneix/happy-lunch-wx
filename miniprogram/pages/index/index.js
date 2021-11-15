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
                        if (device.name.indexOf("weixiao") > -1) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkErQkM7UUE5QkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFjOUIsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBbUpDO1FBakpDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNoQyxrQkFBa0IsRUFB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OUI7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNO1FBSUosSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNYLElBQUksRUFBRSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFPbEIsRUFBRSxDQUFDLDZCQUE2QixFQUFFLENBQUM7UUFDbkMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUM7SUFDN0IsQ0FBQztDQXlCRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbmRleC50c1xuLy8g6I635Y+W5bqU55So5a6e5L6LXG4vLyBAdHMtaWdub3JlXG5jb25zdCBhcHAgPSBnZXRBcHA8SUFwcE9wdGlvbj4oKTtcblxuUGFnZSh7XG4gIGRhdGE6IHtcbiAgICBsaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBlcnJvckxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGNvdW50OiAwLFxuICB9LFxuICB0aW1lcklkOiBudWxsIGFzIGFueSxcbiAgcGFnZVNob3dUaW1lOiAwLFxuICBzdGFydFRpbWU6IDAsXG4gIHNjYW5UaW1lOiAwLFxuICAvLyBzdGF0ZUNoYW5nZUF2YVRvZzogZmFsc2UsXG4gIC8vIHN0YXRlQ2hhbmdlTm90QXZhVG9nOiBmYWxzZSxcbiAgLy8g5LqL5Lu25aSE55CG5Ye95pWwXG4gIGluaXQoKSB7XG4gICAgd3gub3BlbkJsdWV0b290aEFkYXB0ZXIoe1xuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm9wZW5CbHVldG9vdGhBZGFwdGVyIHN1Y2NcIiwgcmVzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuiTneeJmeWQr+WKqOaIkOWKn1wiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBmYWlsXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLy8gaWYgKHJlcy5lcnJDb2RlICE9PSAxMDAwMSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIHd4Lm9uQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKChyZXMpID0+IHtcbiAgICAgICAgLy8gICBjb25zb2xlLmxvZyhcImFkYXB0ZXJTdGF0ZSBjaGFuZ2VkLCBub3cgaXNcIiwgcmVzKTtcbiAgICAgICAgLy8gICBpZiAocmVzLmF2YWlsYWJsZSAmJiAhdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZykge1xuICAgICAgICAvLyAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH0gZWxzZSBpZiAoIXJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuZXJyVGlwcygpO1xuICAgICAgICAvLyAgICAgdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IHRydWU7XG4gICAgICAgIC8vICAgfVxuICAgICAgICAvLyB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHN0YXJ0U2NhbigpIHtcbiAgICAvLyDmkJzntKLlpJblm7Tok53niZnorr7lpIdcbiAgICB3eC5zdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgYWxsb3dEdXBsaWNhdGVzS2V5OiB0cnVlLFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcG93ZXJMZXZlbDogXCJoaWdoXCIsXG4gICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0Qmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICB0aGlzLnNjYW5UaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3gub25CbHVldG9vdGhEZXZpY2VGb3VuZCgocmVzKSA9PiB7XG4gICAgICAgICAgcmVzLmRldmljZXMuZm9yRWFjaCgoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgICAvLyDov5nph4zlj6/ku6XlgZrkuIDkupvov4fmu6RcbiAgICAgICAgICAgIGlmIChkZXZpY2UubmFtZS5pbmRleE9mKFwid2VpeGlhb1wiKSA+IC0xKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KGRldmljZS5hZHZlcnRpc0RhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFycjogYW55W10gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGFyci5wdXNoKHZpZXdbaV0udG9TdHJpbmcoMTYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICBcIm9uQmx1ZXRvb3RoRGV2aWNlRm91bmQgZm91bmQhXCIsXG4gICAgICAgICAgICAgICAgICBkZXZpY2UsXG4gICAgICAgICAgICAgICAgICBkZXZpY2UubmFtZSxcbiAgICAgICAgICAgICAgICAgIGFyclxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5saXN0Lmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3BlbkludGVydmFsID0gbm93IC0gdGhpcy5wYWdlU2hvd1RpbWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRJbnRlcnZhbCA9IG5vdyAtIHRoaXMuc3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjYW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMuc2NhblRpbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXREYXRhKFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV2aWNlLmxvY2FsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycjogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBSU1NJOiBgJHtkZXZpY2UuUlNTSX1kQm1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkludGVydmFsOiBgJHtvcGVuSW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbDogYCR7c3RhcnRJbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWw6IGAke3NjYW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiB0eXBlOiBCTEVcbiAgICAgICAgICAgICAgICAgICAgICog5pe26Ze05oizXG4gICAgICAgICAgICAgICAgICAgICAqIOiTneeJmeWQjeensFxuICAgICAgICAgICAgICAgICAgICAgKiDpqozor4HnoIFcbiAgICAgICAgICAgICAgICAgICAgICog5L+h5Y+35by65bqmXG4gICAgICAgICAgICAgICAgICAgICAqIOmhtemdouaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDlkK/liqjml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog5pCc57Si5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgICAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvXG4gICAgICAgICAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV2aWNlLmxvY2FsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgUlNTSTogZGV2aWNlLlJTU0ksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXROYW1lTW9kYWwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgUlNTSTogZGV2aWNlLlJTU0ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwYXJzZSBhZHZlcnRpc0RhdGEgZXJyb3JcIiwgZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8g5om+5Yiw6KaB5pCc57Si55qE6K6+5aSH5ZCO77yM5Y+K5pe25YGc5q2i5omr5o+PXG4gICAgICAgICAgICAgIHd4LnN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZTogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG5cbiAgICAgICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZXJyQ29kZSA9PT0gMTAwMDEgJiYgZS5lcnJubyA9PT0gMTUwMDEwMikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgZS5lcnJDb2RlID09PSAtMSAmJlxuICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/lrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICByZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiICYmXG4gICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l5piv5ZCm5Li65b6u5L+h5o6I5p2D5a6a5L2N5Yqf6IO944CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgZXJyVGlwcygpIHtcbiAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJpb3NcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICogdXVpZFxuICAgICAgICAgICAqIOmUmeivr+exu+Wei1xuICAgICAgICAgICAqIOS/oeaBr1xuICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICovXG4gICAgICAgICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RFcnJvcih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IGFyZ3NbMV0sXG4gICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVxdWVzdEVycm9yKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAgICBqc29uOiBhcmdzWzFdLFxuICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgT2xkRXJyb3IuY2FsbChjb25zb2xlLCAuLi5hcmdzKTtcbiAgICB9O1xuICB9LFxuICByZXF1ZXN0RGF0YShkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLkuIrkvKDlrp7pqoznu5PmnpzkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuWunumqjOS4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHJlcXVlc3RFcnJvcihkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLplJnor6/kv6Hmga/kuIrmiqXkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHRpbWVyKCkge1xuICAgIHRoaXMudGltZXJJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICAgIGNvdW50OiB0aGlzLmRhdGEuY291bnQgKyAxLFxuICAgICAgfSk7XG4gICAgfSwgMTAwMCk7XG4gIH0sXG4gIG9uU2hvdygpIHtcbiAgICB0aGlzLnBhZ2VTaG93VGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5wb3N0RXJyb3IoKTtcbiAgICB0aGlzLnRpbWVyKCk7XG4gICAgdGhpcy5pbml0KCk7XG4gIH0sXG4gIHNldE5hbWVNb2RhbCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHJldHVybiB3eC5zaG93TW9kYWwoe1xuICAgICAgICB0aXRsZTogXCLor7fovpPlhaXmgqjnmoTkvIHlvq7lkI3vvIzmlrnkvr/miJHku6zlgZrlkI7mnJ/pl67popjosIPmn6VcIixcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcbiAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgaWYgKHJlcy5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB1c2VyTmFtZSA9IHd4LnNldFN0b3JhZ2VTeW5jKFwidXNlck5hbWVcIiwgcmVzLmNvbnRlbnQpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSByZXMuY29udGVudDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuICBvbkhpZGUoKSB7XG4gICAgLyoqXG4gICAgICogY2xlYXJcbiAgICAgKi9cbiAgICB0aGlzLnNldERhdGEoe1xuICAgICAgbGlzdDogW10sXG4gICAgICBlcnJvckxpc3Q6IFtdLFxuICAgICAgY291bnQ6IDAsXG4gICAgfSk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgIHRoaXMudGltZXJJZCA9IG51bGw7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSAwO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICB0aGlzLnNjYW5UaW1lID0gMDtcbiAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gZmFsc2U7XG4gICAgLy8gdGhpcy5zdGF0ZUNoYW5nZU5vdEF2YVRvZyA9IGZhbHNlO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICAvLyB3eC5vZmZCbHVldG9vdGhBZGFwdGVyU3RhdGVDaGFuZ2UoKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgLy8gd3gub2ZmQmx1ZXRvb3RoRGV2aWNlRm91bmQoKTtcbiAgICB3eC5zdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSgpO1xuICAgIHd4LmNsb3NlQmx1ZXRvb3RoQWRhcHRlcigpO1xuICB9LFxuICAvLyB0b0JsdWV0b290aFNldHRpbmcoKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJiZSBoZXJlXCIpO1xuICAvLyAgIC8vIEB0cy1pZ25vcmVcbiAgLy8gICB3eC5vcGVuU3lzdGVtQmx1ZXRvb3RoU2V0dGluZyh7XG4gIC8vICAgICBzdWNjZXNzKHJlczogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gIC8vICAgICB9LFxuICAvLyAgICAgZmFpbChlOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgfSk7XG4gIC8vIH0sXG4gIC8vIHRvQXBwQXV0aG9yaXplU2V0dGluZygpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImJlIGhlcmVcIik7XG4gIC8vICAgLy8gQHRzLWlnbm9yZVxuICAvLyAgIHd4Lm9wZW5BcHBBdXRob3JpemVTZXR0aW5nKHtcbiAgLy8gICAgIHN1Y2Nlc3MocmVzOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgICBmYWlsKGU6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAvLyAgICAgfSxcbiAgLy8gICB9KTtcbiAgLy8gfSxcbn0pO1xuIl19