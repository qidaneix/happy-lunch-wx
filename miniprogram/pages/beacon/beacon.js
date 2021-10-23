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
                            type: "iBeacon",
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
        wx.offBeaconUpdate(function () { });
        wx.stopBeaconDiscovery();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmVhY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxJQUFNLEdBQUcsR0FBRyxNQUFNLEVBQWMsQ0FBQztBQUVqQyxJQUFJLENBQUM7SUFDSCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsRUFBVztRQUNqQixTQUFTLEVBQUUsRUFBVztRQUN0QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsT0FBTyxFQUFFLElBQVc7SUFDcEIsWUFBWSxFQUFFLENBQUM7SUFDZixTQUFTLEVBQUUsQ0FBQztJQUNaLFFBQVEsRUFBRSxDQUFDO0lBRVgsSUFBSTtRQUFKLGlCQW9CQztRQW5CQyxFQUFFLENBQUMsb0JBQW9CLENBQUM7WUFDdEIsS0FBSyxFQUFFLENBQUMsc0NBQXNDLENBQUM7WUFDL0MsT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM5QyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDNUIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDWCxLQUFLLEVBQUUsYUFBYTtvQkFDcEIsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFO29CQUNsRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBbUZDO1FBakZDLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBQyxHQUFHO1lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0MsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDekMsS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzNCLElBQU0sUUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLElBQUksS0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTTtvQkFBRSxPQUFPO2dCQUNsQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZCLElBQU0sY0FBWSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDO2dCQUM3QyxJQUFNLGVBQWEsR0FBRyxHQUFHLEdBQUcsS0FBSSxDQUFDLFNBQVMsQ0FBQztnQkFDM0MsSUFBTSxjQUFZLEdBQUcsR0FBRyxHQUFHLEtBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ3pDLEtBQUksQ0FBQyxPQUFPLENBQ1Y7b0JBQ0UsSUFBSSxFQUFFO3dCQUNKOzRCQUNFLFVBQVUsRUFBRSxRQUFNLENBQUMsSUFBSTs0QkFDdkIsSUFBSSxFQUFLLFFBQU0sQ0FBQyxJQUFJLFFBQUs7NEJBQ3pCLFlBQVksRUFBSyxjQUFZLEdBQUcsSUFBSSxNQUFHOzRCQUN2QyxhQUFhLEVBQUssZUFBYSxHQUFHLElBQUksTUFBRzs0QkFDekMsWUFBWSxFQUFLLGNBQVksR0FBRyxJQUFJLE1BQUc7eUJBQ3hDO3FCQUNGO2lCQUNGLEVBQ0Q7b0JBY0UsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRTt3QkFDM0IsS0FBSSxDQUFDLFdBQVcsQ0FBQzs0QkFDZixJQUFJLEVBQUUsU0FBUzs0QkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTs0QkFDaEIsVUFBVSxFQUFFLFFBQU0sQ0FBQyxJQUFJOzRCQUN2QixJQUFJLEVBQUUsUUFBTSxDQUFDLElBQUk7NEJBQ2pCLFlBQVksZ0JBQUE7NEJBQ1osYUFBYSxpQkFBQTs0QkFDYixZQUFZLGdCQUFBOzRCQUNaLFVBQVUsRUFBRSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7NEJBQ2xDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUk7NEJBQ3pCLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7NEJBQ2pDLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7eUJBQ2xDLENBQUMsQ0FBQztxQkFDSjt5QkFBTTt3QkFDTCxLQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDOzRCQUN2QixLQUFJLENBQUMsV0FBVyxDQUFDO2dDQUNmLElBQUksRUFBRSxTQUFTO2dDQUNmLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO2dDQUNoQixVQUFVLEVBQUUsUUFBTSxDQUFDLElBQUk7Z0NBQ3ZCLElBQUksRUFBRSxRQUFNLENBQUMsSUFBSTtnQ0FDakIsWUFBWSxnQkFBQTtnQ0FDWixhQUFhLGlCQUFBO2dDQUNiLFlBQVksZ0JBQUE7Z0NBQ1osVUFBVSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTtnQ0FDbEMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSTtnQ0FDekIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUTtnQ0FDakMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUTs2QkFDbEMsQ0FBQyxDQUFDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO3FCQUNKO2dCQUNILENBQUMsQ0FDRixDQUFDO2dCQUdGLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztvQkFDckIsT0FBTyxFQUFFLFVBQUMsQ0FBQzt3QkFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxDQUFDO29CQUNELElBQUksRUFBRSxVQUFDLENBQUM7d0JBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztpQkFDRixDQUFDLENBQUM7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU87UUFDTCxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ1gsT0FBTyxFQUNMLCtDQUErQztZQUNqRCxVQUFVLEVBQUUsS0FBSztTQUNsQixDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsU0FBUztRQUFULGlCQXVEQztRQXREQyxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQy9CLE9BQU8sQ0FBQyxLQUFLLEdBQUc7WUFBQyxjQUFPO2lCQUFQLFVBQU8sRUFBUCxxQkFBTyxFQUFQLElBQU87Z0JBQVAseUJBQU87O1lBQ3RCLEtBQUksQ0FBQyxPQUFPLENBQ1Y7Z0JBQ0UsU0FBUyxFQUFFLEtBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztvQkFDcEM7d0JBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM3QixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtxQkFDakI7aUJBQ0YsQ0FBQzthQUNILEVBQ0Q7Z0JBWUUsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRTtvQkFDM0IsS0FBSSxDQUFDLFlBQVksQ0FBQzt3QkFDaEIsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ2hCLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDYixVQUFVLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFO3dCQUNsQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJO3dCQUN6QixRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRO3dCQUNqQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRO3FCQUNsQyxDQUFDLENBQUM7aUJBQ0o7cUJBQU07b0JBQ0wsS0FBSSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQzt3QkFDdkIsS0FBSSxDQUFDLFlBQVksQ0FBQzs0QkFDaEIsSUFBSSxFQUFFLFNBQVM7NEJBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ2hCLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzRCQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs0QkFDYixVQUFVLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFOzRCQUNsQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJOzRCQUN6QixRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFROzRCQUNqQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRO3lCQUNsQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7aUJBQ0o7WUFDSCxDQUFDLENBQ0YsQ0FBQztZQUVGLFFBQVEsQ0FBQyxJQUFJLE9BQWIsUUFBUSxHQUFNLE9BQU8sU0FBSyxJQUFJLEdBQUU7UUFDbEMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUNELFdBQVcsWUFBQyxJQUFTO1FBQ25CLEVBQUUsQ0FBQyxXQUFXLENBQUM7WUFDYixLQUFLLEVBQUUsU0FBUztZQUNoQixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUNILEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDVCxHQUFHLEVBQUUsNkNBQTZDO1lBQ2xELElBQUksTUFBQTtZQUNKLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxJQUFLLEdBQUcsQ0FBQyxJQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDO3dCQUNYLEtBQUssRUFBRSxRQUFRO3dCQUNmLElBQUksRUFBRSxTQUFTO3dCQUNmLFFBQVEsRUFBRSxJQUFJO3FCQUNmLENBQUMsQ0FBQztpQkFDSjtZQUNILENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBQyxHQUFHO2dCQUNSLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDWCxLQUFLLEVBQUUsUUFBUTtvQkFDZixJQUFJLEVBQUUsU0FBUztvQkFDZixRQUFRLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQUM7WUFDTCxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELFlBQVksWUFBQyxJQUFTO1FBQ3BCLEVBQUUsQ0FBQyxXQUFXLENBQUM7WUFDYixLQUFLLEVBQUUsU0FBUztZQUNoQixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUNILEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDVCxHQUFHLEVBQUUsNkNBQTZDO1lBQ2xELElBQUksTUFBQTtZQUNKLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxJQUFLLEdBQUcsQ0FBQyxJQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtvQkFDMUQsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDO3dCQUNYLEtBQUssRUFBRSxRQUFRO3dCQUNmLElBQUksRUFBRSxNQUFNO3dCQUNaLFFBQVEsRUFBRSxJQUFJO3FCQUNmLENBQUMsQ0FBQztpQkFDSjtZQUNILENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBQyxHQUFHO2dCQUNSLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDakIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDWCxLQUFLLEVBQUUsUUFBUTtvQkFDZixJQUFJLEVBQUUsTUFBTTtvQkFDWixRQUFRLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQUM7WUFDTCxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELEtBQUs7UUFBTCxpQkFNQztRQUxDLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDO1lBQ3pCLEtBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ1gsS0FBSyxFQUFFLEtBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUM7YUFDM0IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUNELE1BQU07UUFDSixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUNELFlBQVk7UUFDVixPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTztZQUN6QixPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxzQkFBc0I7Z0JBRTdCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixPQUFPLEVBQUUsVUFBQyxHQUFHO29CQUVYLElBQUksR0FBRyxDQUFDLE9BQU8sRUFBRTt3QkFFZixJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBRTVELEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7cUJBQ3ZDO3lCQUFNO3dCQUNMLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztxQkFDOUI7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNO1FBSUosSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNYLElBQUksRUFBRSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFFbEIsRUFBRSxDQUFDLGVBQWUsQ0FBQyxjQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbmRleC50c1xuLy8g6I635Y+W5bqU55So5a6e5L6LXG4vLyBAdHMtaWdub3JlXG5jb25zdCBhcHAgPSBnZXRBcHA8SUFwcE9wdGlvbj4oKTtcblxuUGFnZSh7XG4gIGRhdGE6IHtcbiAgICBsaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBlcnJvckxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGNvdW50OiAwLFxuICB9LFxuICB0aW1lcklkOiBudWxsIGFzIGFueSxcbiAgcGFnZVNob3dUaW1lOiAwLFxuICBzdGFydFRpbWU6IDAsXG4gIHNjYW5UaW1lOiAwLFxuICAvLyDkuovku7blpITnkIblh73mlbBcbiAgaW5pdCgpIHtcbiAgICB3eC5zdGFydEJlYWNvbkRpc2NvdmVyeSh7XG4gICAgICB1dWlkczogW1wiRkRBNTA2OTMtQTRFMi00RkIxLUFGQ0YtQzZFQjA3NjQ3ODI0XCJdLCAvLyDkuIDkuKrlhazkvJflj7flr7nlupTnmoTorr7lpIfnmoR1dWlkXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3RhcnRCZWFjb25EaXNjb3Zlcnkgc3VjY1wiLCByZXMpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi5byA5aeL5pCc57SiaUJlYWNvblwiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJlYWNvbkRpc2NvdmVyeSBmYWlsXCIsIHJlcyk7XG4gICAgICAgIGlmIChyZXMuZXJyQ29kZSA9PT0gMTEwMDEgfHwgcmVzLmVyckNvZGUgPT09IDExMDAyKSB7XG4gICAgICAgICAgdGhpcy5lcnJUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHN0YXJ0U2NhbigpIHtcbiAgICAvLyDmo4DntKJpQmVhY29uXG4gICAgd3gub25CZWFjb25VcGRhdGUoKHJlcykgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJvbkJlYWNvblVwZGF0ZSBmaW5kIHJlc3VsdFwiLCByZXMpO1xuICAgICAgaWYgKHJlcy5iZWFjb25zICYmIHJlcy5iZWFjb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zY2FuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IGJlYWNvbiA9IHJlcy5iZWFjb25zWzBdO1xuICAgICAgICBpZiAodGhpcy5kYXRhLmxpc3QubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IG9wZW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMucGFnZVNob3dUaW1lO1xuICAgICAgICBjb25zdCBzdGFydEludGVydmFsID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG4gICAgICAgIGNvbnN0IHNjYW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMuc2NhblRpbWU7XG4gICAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiZWFjb25VVUlEOiBiZWFjb24udXVpZCxcbiAgICAgICAgICAgICAgICBSU1NJOiBgJHtiZWFjb24ucnNzaX1kQm1gLFxuICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbDogYCR7b3BlbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICBzdGFydEludGVydmFsOiBgJHtzdGFydEludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWw6IGAke3NjYW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiB0eXBlOiBpQmVhY29uXG4gICAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgICAqIGJlYWNvblV1aWQ6VVVJRFxuICAgICAgICAgICAgICog5L+h5Y+35by65bqmXG4gICAgICAgICAgICAgKiDpobXpnaLml7bpl7Tlt65cbiAgICAgICAgICAgICAqIOWQr+WKqOaXtumXtOW3rlxuICAgICAgICAgICAgICog5pCc57Si5pe26Ze05beuXG4gICAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvXG4gICAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VybmFtZVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RGF0YSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJpQmVhY29uXCIsXG4gICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBiZWFjb25VVUlEOiBiZWFjb24udXVpZCxcbiAgICAgICAgICAgICAgICBSU1NJOiBiZWFjb24ucnNzaSxcbiAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zZXROYW1lTW9kYWwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhKHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgIGJlYWNvblVVSUQ6IGJlYWNvbi51dWlkLFxuICAgICAgICAgICAgICAgICAgUlNTSTogYmVhY29uLnJzc2ksXG4gICAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgc2NhbkludGVydmFsLFxuICAgICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyDlgZzmraJpQmVhY29u5pCc57SiXG4gICAgICAgIHd4LnN0b3BCZWFjb25EaXNjb3Zlcnkoe1xuICAgICAgICAgIHN1Y2Nlc3M6IChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0b3BCZWFjb25EaXNjb3Zlcnkgc3VjY1wiLCBlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhaWw6IChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwic3RvcEJlYWNvbkRpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBlcnJUaXBzKCkge1xuICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICBjb250ZW50OlxuICAgICAgICBcImlCZWFjb27liJ3lp4vljJblpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlj4rlrprkvY3lip/og73mmK/lkKblvIDlkK/jgIJcXG7lvIDlkK/lkI7or7fmiavnoIHph43mlrDov5vlhaXpobXpnaLvvIFcIixcbiAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgIH0pO1xuICB9LFxuICBwb3N0RXJyb3IoKSB7XG4gICAgY29uc3QgT2xkRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuICAgIGNvbnNvbGUuZXJyb3IgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5zZXREYXRhKFxuICAgICAgICB7XG4gICAgICAgICAgZXJyb3JMaXN0OiB0aGlzLmRhdGEuZXJyb3JMaXN0LmNvbmNhdChbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IEpTT04uc3RyaW5naWZ5KGFyZ3NbMV0pLFxuICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfSxcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIHR5cGU6IGlCZWFjb25cbiAgICAgICAgICAgKiB1dWlkXG4gICAgICAgICAgICog6ZSZ6K+v57G75Z6LXG4gICAgICAgICAgICog5L+h5oGvXG4gICAgICAgICAgICog5pe26Ze05oizXG4gICAgICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlcm5hbWVcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBpZiAoYXBwLmdsb2JhbERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdEVycm9yKHtcbiAgICAgICAgICAgICAgdHlwZTogXCJpQmVhY29uXCIsXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgIGpzb246IGFyZ3NbMV0sXG4gICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TmFtZU1vZGFsKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVxdWVzdEVycm9yKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImlCZWFjb25cIixcbiAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIGVyclR5cGU6IGFyZ3NbMF0sXG4gICAgICAgICAgICAgICAganNvbjogYXJnc1sxXSxcbiAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIE9sZEVycm9yLmNhbGwoY29uc29sZSwgLi4uYXJncyk7XG4gICAgfTtcbiAgfSxcbiAgcmVxdWVzdERhdGEoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi5LiK5Lyg5a6e6aqM57uT5p6c5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICByZXF1ZXN0RXJyb3IoZGF0YTogYW55KSB7XG4gICAgd3guc2hvd0xvYWRpbmcoe1xuICAgICAgdGl0bGU6IFwi6ZSZ6K+v5L+h5oGv5LiK5oql5LitXCIsXG4gICAgICBtYXNrOiB0cnVlLFxuICAgIH0pO1xuICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgIGRhdGEsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICBpZiAocmVzLnN0YXR1c0NvZGUgPT09IDIwMCAmJiAocmVzLmRhdGEgYXMgYW55KS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgdGl0bGU6IFwi6ZSZ6K+v5LiK5oql5oiQ5YqfXCIsXG4gICAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZmFpbDogKHJlcykgPT4ge1xuICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXlpLHotKVcIixcbiAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICBkdXJhdGlvbjogNTAwMCxcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9LFxuICB0aW1lcigpIHtcbiAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoe1xuICAgICAgICBjb3VudDogdGhpcy5kYXRhLmNvdW50ICsgMSxcbiAgICAgIH0pO1xuICAgIH0sIDEwMDApO1xuICB9LFxuICBvblNob3coKSB7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMucG9zdEVycm9yKCk7XG4gICAgdGhpcy50aW1lcigpO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9LFxuICBzZXROYW1lTW9kYWwoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICByZXR1cm4gd3guc2hvd01vZGFsKHtcbiAgICAgICAgdGl0bGU6IFwi6K+36L6T5YWl5oKo55qE5LyB5b6u5ZCN77yM5pa55L6/5oiR5Lus5YGa5ZCO5pyf6Zeu6aKY6LCD5p+lXCIsXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZWRpdGFibGU6IHRydWUsXG4gICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGlmIChyZXMuY29udGVudCkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgdXNlck5hbWUgPSB3eC5zZXRTdG9yYWdlU3luYyhcInVzZXJOYW1lXCIsIHJlcy5jb250ZW50KTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gcmVzLmNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzb2x2ZShhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgb25IaWRlKCkge1xuICAgIC8qKlxuICAgICAqIGNsZWFyXG4gICAgICovXG4gICAgdGhpcy5zZXREYXRhKHtcbiAgICAgIGxpc3Q6IFtdLFxuICAgICAgZXJyb3JMaXN0OiBbXSxcbiAgICAgIGNvdW50OiAwLFxuICAgIH0pO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcklkKTtcbiAgICB0aGlzLnRpbWVySWQgPSBudWxsO1xuICAgIHRoaXMucGFnZVNob3dUaW1lID0gMDtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgdGhpcy5zY2FuVGltZSA9IDA7XG5cbiAgICB3eC5vZmZCZWFjb25VcGRhdGUoKCkgPT4ge30pO1xuICAgIHd4LnN0b3BCZWFjb25EaXNjb3ZlcnkoKTtcbiAgfSxcbn0pO1xuIl19