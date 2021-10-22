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
                    duration: 2000,
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
                                    wx.showLoading({
                                        title: "上传实验结果中",
                                        mask: true,
                                    });
                                    wx.request({
                                        url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
                                        data: {
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
                                        },
                                        method: "POST",
                                        success: function (res) {
                                            if (res.statusCode === 200 &&
                                                res.data.code === 0) {
                                                wx.hideLoading();
                                                wx.showToast({
                                                    title: "实验上报成功",
                                                    icon: "success",
                                                    duration: 2000,
                                                });
                                            }
                                        },
                                        fail: function (res) {
                                            console.warn(res);
                                            wx.hideLoading();
                                            wx.showToast({
                                                title: "实验上报失败",
                                                icon: "success",
                                                duration: 2000,
                                            });
                                        },
                                    });
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
                wx.showLoading({
                    title: "错误信息上报中",
                    mask: true,
                });
                wx.request({
                    url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
                    data: {
                        type: "BLE",
                        time: Date.now(),
                        errType: args[0],
                        json: JSON.stringify(args[1]),
                        deviceInfo: wx.getSystemInfoSync(),
                        uuid: app.globalData.uuid,
                        userInfo: app.globalData.userInfo,
                    },
                    method: "POST",
                    success: function (res) {
                        if (res.statusCode === 200 && res.data.code === 0) {
                            wx.hideLoading();
                            wx.showToast({
                                title: "错误上报成功",
                                icon: "none",
                                duration: 1000,
                            });
                        }
                    },
                    fail: function (res) {
                        console.warn(res);
                        wx.hideLoading();
                        wx.showToast({
                            title: "错误上报失败",
                            icon: "none",
                            duration: 1000,
                        });
                    },
                });
            });
            OldError.call.apply(OldError, [console].concat(args));
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQVc7UUFDakIsU0FBUyxFQUFFLEVBQVc7UUFDdEIsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUNELE9BQU8sRUFBRSxJQUFXO0lBQ3BCLFlBQVksRUFBRSxDQUFDO0lBQ2YsU0FBUyxFQUFFLENBQUM7SUFDWixRQUFRLEVBQUUsQ0FBQztJQUlYLElBQUk7UUFBSixpQkErQkM7UUE5QkMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1lBQ3RCLE9BQU8sRUFBRSxVQUFDLEdBQUc7Z0JBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVCLEVBQUUsQ0FBQyxTQUFTLENBQUM7b0JBQ1gsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2YsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFjOUIsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBNkpDO1FBM0pDLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNoQyxrQkFBa0IsRUFBRSxJQUFJO1lBRXhCLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLE9BQU8sRUFBRSxVQUFDLENBQUM7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEQsS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzNCLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxVQUFDLEdBQUc7b0JBQzVCLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTTt3QkFFekIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTs0QkFDckMsSUFBSTtnQ0FDRixJQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7Z0NBQ2pELElBQU0sS0FBRyxHQUFVLEVBQUUsQ0FBQztnQ0FDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0NBQ3BDLEtBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lDQUNoQztnQ0FDRCxPQUFPLENBQUMsR0FBRyxDQUNULCtCQUErQixFQUMvQixNQUFNLEVBQ04sTUFBTSxDQUFDLElBQUksRUFDWCxLQUFHLENBQ0osQ0FBQztnQ0FDRixJQUFJLEtBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07b0NBQUUsT0FBTztnQ0FDbEMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dDQUN2QixJQUFNLGNBQVksR0FBRyxHQUFHLEdBQUcsS0FBSSxDQUFDLFlBQVksQ0FBQztnQ0FDN0MsSUFBTSxlQUFhLEdBQUcsR0FBRyxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUM7Z0NBQzNDLElBQU0sY0FBWSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUMsUUFBUSxDQUFDO2dDQUN6QyxLQUFJLENBQUMsT0FBTyxDQUNWO29DQUNFLElBQUksRUFBRTt3Q0FDSjs0Q0FDRSxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVM7NENBQ3RCLEdBQUcsRUFBRSxLQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRTs0Q0FDaEMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxJQUFJLFFBQUs7NENBQ3pCLFlBQVksRUFBSyxjQUFZLEdBQUcsSUFBSSxNQUFHOzRDQUN2QyxhQUFhLEVBQUssZUFBYSxHQUFHLElBQUksTUFBRzs0Q0FDekMsWUFBWSxFQUFLLGNBQVksR0FBRyxJQUFJLE1BQUc7eUNBQ3hDO3FDQUNGO2lDQUNGLEVBQ0Q7b0NBZUUsRUFBRSxDQUFDLFdBQVcsQ0FBQzt3Q0FDYixLQUFLLEVBQUUsU0FBUzt3Q0FDaEIsSUFBSSxFQUFFLElBQUk7cUNBQ1gsQ0FBQyxDQUFDO29DQUNILEVBQUUsQ0FBQyxPQUFPLENBQUM7d0NBQ1QsR0FBRyxFQUFFLDZDQUE2Qzt3Q0FDbEQsSUFBSSxFQUFFOzRDQUNKLElBQUksRUFBRSxLQUFLOzRDQUNYLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFOzRDQUNoQixJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVM7NENBQ3RCLElBQUksRUFBRSxLQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRTs0Q0FDakMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJOzRDQUNqQixZQUFZLGdCQUFBOzRDQUNaLGFBQWEsaUJBQUE7NENBQ2IsWUFBWSxnQkFBQTs0Q0FDWixVQUFVLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFOzRDQUNsQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJOzRDQUN6QixRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRO3lDQUNsQzt3Q0FDRCxNQUFNLEVBQUUsTUFBTTt3Q0FDZCxPQUFPLEVBQUUsVUFBQyxHQUFHOzRDQUNYLElBQ0UsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHO2dEQUNyQixHQUFHLENBQUMsSUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLEVBQzVCO2dEQUNBLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnREFDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvREFDWCxLQUFLLEVBQUUsUUFBUTtvREFDZixJQUFJLEVBQUUsU0FBUztvREFDZixRQUFRLEVBQUUsSUFBSTtpREFDZixDQUFDLENBQUM7NkNBQ0o7d0NBQ0gsQ0FBQzt3Q0FDRCxJQUFJLEVBQUUsVUFBQyxHQUFHOzRDQUNSLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7NENBQ2xCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs0Q0FDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQztnREFDWCxLQUFLLEVBQUUsUUFBUTtnREFDZixJQUFJLEVBQUUsU0FBUztnREFDZixRQUFRLEVBQUUsSUFBSTs2Q0FDZixDQUFDLENBQUM7d0NBQ0wsQ0FBQztxQ0FDRixDQUFDLENBQUM7Z0NBQ0wsQ0FBQyxDQUNGLENBQUM7NkJBQ0g7NEJBQUMsT0FBTyxDQUFDLEVBQUU7Z0NBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQzs2QkFDOUM7NEJBRUQsRUFBRSxDQUFDLDZCQUE2QixDQUFDO2dDQUMvQixPQUFPLEVBQUUsVUFBQyxDQUFDO29DQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0NBQ3ZELENBQUM7Z0NBQ0QsSUFBSSxFQUFFLFVBQUMsQ0FBQztvQ0FDTixPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUN6RCxDQUFDOzZCQUNGLENBQUMsQ0FBQzt5QkFDSjtvQkFDSCxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBQyxDQUFNO2dCQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBSXhELEVBQUUsQ0FBQyxhQUFhLENBQUM7b0JBQ2YsT0FBTyxFQUFFLFVBQUMsR0FBRzt3QkFDWCxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFFOzRCQUM5QyxFQUFFLENBQUMsU0FBUyxDQUFDO2dDQUNYLE9BQU8sRUFDTCx3Q0FBd0M7Z0NBQzFDLFVBQVUsRUFBRSxLQUFLOzZCQUNsQixDQUFDLENBQUM7eUJBQ0o7NkJBQU0sSUFDTCxHQUFHLENBQUMsUUFBUSxLQUFLLFNBQVM7NEJBQzFCLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDOzRCQUNoQixDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU8sRUFDbkI7NEJBQ0EsRUFBRSxDQUFDLFNBQVMsQ0FBQztnQ0FDWCxPQUFPLEVBQ0wsd0NBQXdDO2dDQUMxQyxVQUFVLEVBQUUsS0FBSzs2QkFDbEIsQ0FBQyxDQUFDO3lCQUNKOzZCQUFNLElBQ0wsR0FBRyxDQUFDLFFBQVEsS0FBSyxTQUFTOzRCQUMxQixDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQzs0QkFDaEIsQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLEVBQ25COzRCQUNBLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0NBQ1gsT0FBTyxFQUNMLHlDQUF5QztnQ0FDM0MsVUFBVSxFQUFFLEtBQUs7NkJBQ2xCLENBQUMsQ0FBQzt5QkFDSjtvQkFDSCxDQUFDO2lCQUNGLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTztRQUNMLEVBQUUsQ0FBQyxhQUFhLENBQUM7WUFFZixPQUFPLEVBQUUsVUFBQyxHQUFHO2dCQUNYLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7b0JBQzFCLEVBQUUsQ0FBQyxTQUFTLENBQUM7d0JBQ1gsT0FBTyxFQUNMLHlDQUF5Qzt3QkFDM0MsVUFBVSxFQUFFLEtBQUs7cUJBQ2xCLENBQUMsQ0FBQztpQkFDSjtxQkFBTSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUNyQyxFQUFFLENBQUMsU0FBUyxDQUFDO3dCQUNYLE9BQU8sRUFDTCw0Q0FBNEM7d0JBQzlDLFVBQVUsRUFBRSxLQUFLO3FCQUNsQixDQUFDLENBQUM7aUJBQ0o7WUFDSCxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVM7UUFBVCxpQkFrRUM7UUFqRUMsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUMvQixPQUFPLENBQUMsS0FBSyxHQUFHO1lBQUMsY0FBTztpQkFBUCxVQUFPLEVBQVAscUJBQU8sRUFBUCxJQUFPO2dCQUFQLHlCQUFPOztZQUN0QixLQUFJLENBQUMsT0FBTyxDQUNWO2dCQUNFLFNBQVMsRUFBRSxLQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7b0JBQ3BDO3dCQUNFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNiLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7cUJBQ2pCO2lCQUNGLENBQUM7YUFDSCxFQUNEO2dCQVlFLEVBQUUsQ0FBQyxXQUFXLENBQUM7b0JBQ2IsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLElBQUksRUFBRSxJQUFJO2lCQUNYLENBQUMsQ0FBQztnQkFDSCxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUNULEdBQUcsRUFBRSw2Q0FBNkM7b0JBQ2xELElBQUksRUFBRTt3QkFDSixJQUFJLEVBQUUsS0FBSzt3QkFDWCxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDaEIsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0IsVUFBVSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTt3QkFDbEMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSTt3QkFDekIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUTtxQkFDbEM7b0JBQ0QsTUFBTSxFQUFFLE1BQU07b0JBQ2QsT0FBTyxFQUFFLFVBQUMsR0FBRzt3QkFDWCxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxJQUFLLEdBQUcsQ0FBQyxJQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTs0QkFDMUQsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDOzRCQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDO2dDQUNYLEtBQUssRUFBRSxRQUFRO2dDQUNmLElBQUksRUFBRSxNQUFNO2dDQUNaLFFBQVEsRUFBRSxJQUFJOzZCQUNmLENBQUMsQ0FBQzt5QkFDSjtvQkFDSCxDQUFDO29CQUNELElBQUksRUFBRSxVQUFDLEdBQUc7d0JBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDbEIsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDOzRCQUNYLEtBQUssRUFBRSxRQUFROzRCQUNmLElBQUksRUFBRSxNQUFNOzRCQUNaLFFBQVEsRUFBRSxJQUFJO3lCQUNmLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FDRixDQUFDO1lBRUYsUUFBUSxDQUFDLElBQUksT0FBYixRQUFRLEdBQU0sT0FBTyxTQUFLLElBQUksR0FBRTtRQUNsQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0QsS0FBSztRQUFMLGlCQU1DO1FBTEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7WUFDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQztnQkFDWCxLQUFLLEVBQUUsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQzthQUMzQixDQUFDLENBQUM7UUFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDWCxDQUFDO0lBQ0QsTUFBTTtRQUNKLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsTUFBTTtRQUlKLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDWCxJQUFJLEVBQUUsRUFBRTtZQUNSLFNBQVMsRUFBRSxFQUFFO1lBQ2IsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUM7UUFDSCxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBT2xCLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQ25DLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0F5QkYsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW5kZXgudHNcbi8vIOiOt+WPluW6lOeUqOWunuS+i1xuLy8gQHRzLWlnbm9yZVxuY29uc3QgYXBwID0gZ2V0QXBwPElBcHBPcHRpb24+KCk7XG5cblBhZ2Uoe1xuICBkYXRhOiB7XG4gICAgbGlzdDogW10gYXMgYW55W10sXG4gICAgZXJyb3JMaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBjb3VudDogMCxcbiAgfSxcbiAgdGltZXJJZDogbnVsbCBhcyBhbnksXG4gIHBhZ2VTaG93VGltZTogMCxcbiAgc3RhcnRUaW1lOiAwLFxuICBzY2FuVGltZTogMCxcbiAgLy8gc3RhdGVDaGFuZ2VBdmFUb2c6IGZhbHNlLFxuICAvLyBzdGF0ZUNoYW5nZU5vdEF2YVRvZzogZmFsc2UsXG4gIC8vIOS6i+S7tuWkhOeQhuWHveaVsFxuICBpbml0KCkge1xuICAgIHd4Lm9wZW5CbHVldG9vdGhBZGFwdGVyKHtcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBzdWNjXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLok53niZnlkK/liqjmiJDlip9cIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogMjAwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwib3BlbkJsdWV0b290aEFkYXB0ZXIgZmFpbFwiLCByZXMpO1xuICAgICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIC8vIGlmIChyZXMuZXJyQ29kZSAhPT0gMTAwMDEpIHJldHVybjtcblxuICAgICAgICAvLyB3eC5vbkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgocmVzKSA9PiB7XG4gICAgICAgIC8vICAgY29uc29sZS5sb2coXCJhZGFwdGVyU3RhdGUgY2hhbmdlZCwgbm93IGlzXCIsIHJlcyk7XG4gICAgICAgIC8vICAgaWYgKHJlcy5hdmFpbGFibGUgJiYgIXRoaXMuc3RhdGVDaGFuZ2VBdmFUb2cpIHtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhcnRTY2FuKCk7XG4gICAgICAgIC8vICAgICB0aGlzLnN0YXRlQ2hhbmdlQXZhVG9nID0gdHJ1ZTtcbiAgICAgICAgLy8gICB9IGVsc2UgaWYgKCFyZXMuYXZhaWxhYmxlICYmICF0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nKSB7XG4gICAgICAgIC8vICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgLy8gICAgIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSB0cnVlO1xuICAgICAgICAvLyAgIH1cbiAgICAgICAgLy8gfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICBzdGFydFNjYW4oKSB7XG4gICAgLy8g5pCc57Si5aSW5Zu06JOd54mZ6K6+5aSHXG4gICAgd3guc3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgIGFsbG93RHVwbGljYXRlc0tleTogdHJ1ZSxcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHBvd2VyTGV2ZWw6IFwiaGlnaFwiLFxuICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkgc3VjY1wiLCBlKTtcbiAgICAgICAgdGhpcy5zY2FuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4Lm9uQmx1ZXRvb3RoRGV2aWNlRm91bmQoKHJlcykgPT4ge1xuICAgICAgICAgIHJlcy5kZXZpY2VzLmZvckVhY2goKGRldmljZSkgPT4ge1xuICAgICAgICAgICAgLy8g6L+Z6YeM5Y+v5Lul5YGa5LiA5Lqb6L+H5rukXG4gICAgICAgICAgICBpZiAoZGV2aWNlLm5hbWUuaW5kZXhPZihcImhlbGxvXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGV2aWNlLmFkdmVydGlzRGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJyOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgYXJyLnB1c2godmlld1tpXS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgIFwib25CbHVldG9vdGhEZXZpY2VGb3VuZCBmb3VuZCFcIixcbiAgICAgICAgICAgICAgICAgIGRldmljZSxcbiAgICAgICAgICAgICAgICAgIGRldmljZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgYXJyXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRhLmxpc3QubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcGVuSW50ZXJ2YWwgPSBub3cgLSB0aGlzLnBhZ2VTaG93VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydEludGVydmFsID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbkludGVydmFsID0gbm93IC0gdGhpcy5zY2FuVGltZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyOiBhcnIuam9pbihcIi1cIikudG9VcHBlckNhc2UoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJTU0k6IGAke2RldmljZS5SU1NJfWRCbWAsXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWw6IGAke29wZW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsOiBgJHtzdGFydEludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbDogYCR7c2NhbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFRPRE86IHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICogdHlwZTogQkxFXG4gICAgICAgICAgICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAgICAgICAgICAgKiDok53niZnlkI3np7BcbiAgICAgICAgICAgICAgICAgICAgICog6aqM6K+B56CBXG4gICAgICAgICAgICAgICAgICAgICAqIOS/oeWPt+W8uuW6plxuICAgICAgICAgICAgICAgICAgICAgKiDpobXpnaLml7bpl7Tlt65cbiAgICAgICAgICAgICAgICAgICAgICog5ZCv5Yqo5pe26Ze05beuXG4gICAgICAgICAgICAgICAgICAgICAqIOaQnOe0ouaXtumXtOW3rlxuICAgICAgICAgICAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIuS4iuS8oOWunumqjOe7k+aenOS4rVwiLFxuICAgICAgICAgICAgICAgICAgICAgIG1hc2s6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3eC5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiQkxFXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogZGV2aWNlLmxvY2FsTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6IGFyci5qb2luKFwiLVwiKS50b1VwcGVyQ2FzZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgUlNTSTogZGV2aWNlLlJTU0ksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMjAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXlpLHotKVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAyMDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwYXJzZSBhZHZlcnRpc0RhdGEgZXJyb3JcIiwgZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8g5om+5Yiw6KaB5pCc57Si55qE6K6+5aSH5ZCO77yM5Y+K5pe25YGc5q2i5omr5o+PXG4gICAgICAgICAgICAgIHd4LnN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZTogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzLnN0YXRlQ2hhbmdlTm90QXZhVG9nID0gZmFsc2U7XG5cbiAgICAgICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZXJyQ29kZSA9PT0gMTAwMDEgJiYgZS5lcnJubyA9PT0gMTUwMDEwMikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgZS5lcnJDb2RlID09PSAtMSAmJlxuICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA5XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgd3guc2hvd01vZGFsKHtcbiAgICAgICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICAgICAgXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/lrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICByZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiICYmXG4gICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDpcbiAgICAgICAgICAgICAgICAgIFwi6JOd54mZ5pCc57Si5bm/5pKt5aSx6LSl77yM6K+35qOA5p+l5piv5ZCm5Li65b6u5L+h5o6I5p2D5a6a5L2N5Yqf6IO944CCXFxu5byA5ZCv5ZCO6K+35omr56CB6YeN5paw6L+b5YWl6aG16Z2i77yBXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgZXJyVGlwcygpIHtcbiAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJpb3NcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIikge1xuICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICBjb250ZW50OlxuICAgICAgICAgICAgICBcIuiTneeJmeaooeWdl+WIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogVE9ETzogcmVxdWVzdFxuICAgICAgICAgICAqIHR5cGU6IEJMRVxuICAgICAgICAgICAqIHV1aWRcbiAgICAgICAgICAgKiDplJnor6/nsbvlnotcbiAgICAgICAgICAgKiDkv6Hmga9cbiAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgKi9cbiAgICAgICAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICAgICAgICB0aXRsZTogXCLplJnor6/kv6Hmga/kuIrmiqXkuK1cIixcbiAgICAgICAgICAgIG1hc2s6IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgd3gucmVxdWVzdCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICB0eXBlOiBcIkJMRVwiLFxuICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICBlcnJUeXBlOiBhcmdzWzBdLFxuICAgICAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeWksei0pVwiLFxuICAgICAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAxMDAwLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIE9sZEVycm9yLmNhbGwoY29uc29sZSwgLi4uYXJncyk7XG4gICAgfTtcbiAgfSxcbiAgdGltZXIoKSB7XG4gICAgdGhpcy50aW1lcklkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy5zZXREYXRhKHtcbiAgICAgICAgY291bnQ6IHRoaXMuZGF0YS5jb3VudCArIDEsXG4gICAgICB9KTtcbiAgICB9LCAxMDAwKTtcbiAgfSxcbiAgb25TaG93KCkge1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLnBvc3RFcnJvcigpO1xuICAgIHRoaXMudGltZXIoKTtcbiAgICB0aGlzLmluaXQoKTtcbiAgfSxcbiAgb25IaWRlKCkge1xuICAgIC8qKlxuICAgICAqIGNsZWFyXG4gICAgICovXG4gICAgdGhpcy5zZXREYXRhKHtcbiAgICAgIGxpc3Q6IFtdLFxuICAgICAgZXJyb3JMaXN0OiBbXSxcbiAgICAgIGNvdW50OiAwLFxuICAgIH0pO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcklkKTtcbiAgICB0aGlzLnRpbWVySWQgPSBudWxsO1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gMDtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgdGhpcy5zY2FuVGltZSA9IDA7XG4gICAgLy8gdGhpcy5zdGF0ZUNoYW5nZUF2YVRvZyA9IGZhbHNlO1xuICAgIC8vIHRoaXMuc3RhdGVDaGFuZ2VOb3RBdmFUb2cgPSBmYWxzZTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgLy8gd3gub2ZmQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKCk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIC8vIHd4Lm9mZkJsdWV0b290aERldmljZUZvdW5kKCk7XG4gICAgd3guc3RvcEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkoKTtcbiAgICB3eC5jbG9zZUJsdWV0b290aEFkYXB0ZXIoKTtcbiAgfSxcbiAgLy8gdG9CbHVldG9vdGhTZXR0aW5nKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiYmUgaGVyZVwiKTtcbiAgLy8gICAvLyBAdHMtaWdub3JlXG4gIC8vICAgd3gub3BlblN5c3RlbUJsdWV0b290aFNldHRpbmcoe1xuICAvLyAgICAgc3VjY2VzcyhyZXM6IGFueSkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuICAvLyAgICAgfSxcbiAgLy8gICAgIGZhaWwoZTogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gIC8vICAgICB9LFxuICAvLyAgIH0pO1xuICAvLyB9LFxuICAvLyB0b0FwcEF1dGhvcml6ZVNldHRpbmcoKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJiZSBoZXJlXCIpO1xuICAvLyAgIC8vIEB0cy1pZ25vcmVcbiAgLy8gICB3eC5vcGVuQXBwQXV0aG9yaXplU2V0dGluZyh7XG4gIC8vICAgICBzdWNjZXNzKHJlczogYW55KSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gIC8vICAgICB9LFxuICAvLyAgICAgZmFpbChlOiBhbnkpIHtcbiAgLy8gICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgLy8gICAgIH0sXG4gIC8vICAgfSk7XG4gIC8vIH0sXG59KTtcbiJdfQ==