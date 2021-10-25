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
            ignoreBluetoothAvailable: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmVhY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxJQUFNLEdBQUcsR0FBRyxNQUFNLEVBQWMsQ0FBQztBQUVqQyxJQUFJLENBQUM7SUFDSCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsRUFBVztRQUNqQixTQUFTLEVBQUUsRUFBVztRQUN0QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsT0FBTyxFQUFFLElBQVc7SUFDcEIsWUFBWSxFQUFFLENBQUM7SUFDZixTQUFTLEVBQUUsQ0FBQztJQUNaLFFBQVEsRUFBRSxDQUFDO0lBRVgsSUFBSTtRQUFKLGlCQXFCQztRQXBCQyxFQUFFLENBQUMsb0JBQW9CLENBQUM7WUFDdEIsd0JBQXdCLEVBQUUsSUFBSTtZQUM5QixLQUFLLEVBQUUsQ0FBQyxzQ0FBc0MsQ0FBQztZQUMvQyxPQUFPLEVBQUUsVUFBQyxHQUFHO2dCQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzlDLEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM1QixFQUFFLENBQUMsU0FBUyxDQUFDO29CQUNYLEtBQUssRUFBRSxhQUFhO29CQUNwQixJQUFJLEVBQUUsU0FBUztvQkFDZixRQUFRLEVBQUUsSUFBSTtpQkFDZixDQUFDLENBQUM7Z0JBQ0gsS0FBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25CLENBQUM7WUFDRCxJQUFJLEVBQUUsVUFBQyxHQUFHO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2hELElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUU7b0JBQ2xELEtBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDaEI7WUFDSCxDQUFDO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVM7UUFBVCxpQkFtRkM7UUFqRkMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFDLEdBQUc7WUFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUN6QyxLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDM0IsSUFBTSxRQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxLQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBQ2xDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsSUFBTSxjQUFZLEdBQUcsR0FBRyxHQUFHLEtBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzdDLElBQU0sZUFBYSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzQyxJQUFNLGNBQVksR0FBRyxHQUFHLEdBQUcsS0FBSSxDQUFDLFFBQVEsQ0FBQztnQkFDekMsS0FBSSxDQUFDLE9BQU8sQ0FDVjtvQkFDRSxJQUFJLEVBQUU7d0JBQ0o7NEJBQ0UsVUFBVSxFQUFFLFFBQU0sQ0FBQyxJQUFJOzRCQUN2QixJQUFJLEVBQUssUUFBTSxDQUFDLElBQUksUUFBSzs0QkFDekIsWUFBWSxFQUFLLGNBQVksR0FBRyxJQUFJLE1BQUc7NEJBQ3ZDLGFBQWEsRUFBSyxlQUFhLEdBQUcsSUFBSSxNQUFHOzRCQUN6QyxZQUFZLEVBQUssY0FBWSxHQUFHLElBQUksTUFBRzt5QkFDeEM7cUJBQ0Y7aUJBQ0YsRUFDRDtvQkFjRSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO3dCQUMzQixLQUFJLENBQUMsV0FBVyxDQUFDOzRCQUNmLElBQUksRUFBRSxTQUFTOzRCQUNmLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNoQixVQUFVLEVBQUUsUUFBTSxDQUFDLElBQUk7NEJBQ3ZCLElBQUksRUFBRSxRQUFNLENBQUMsSUFBSTs0QkFDakIsWUFBWSxnQkFBQTs0QkFDWixhQUFhLGlCQUFBOzRCQUNiLFlBQVksZ0JBQUE7NEJBQ1osVUFBVSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRTs0QkFDbEMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSTs0QkFDekIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUTs0QkFDakMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUTt5QkFDbEMsQ0FBQyxDQUFDO3FCQUNKO3lCQUFNO3dCQUNMLEtBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxJQUFJLENBQUM7NEJBQ3ZCLEtBQUksQ0FBQyxXQUFXLENBQUM7Z0NBQ2YsSUFBSSxFQUFFLFNBQVM7Z0NBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0NBQ2hCLFVBQVUsRUFBRSxRQUFNLENBQUMsSUFBSTtnQ0FDdkIsSUFBSSxFQUFFLFFBQU0sQ0FBQyxJQUFJO2dDQUNqQixZQUFZLGdCQUFBO2dDQUNaLGFBQWEsaUJBQUE7Z0NBQ2IsWUFBWSxnQkFBQTtnQ0FDWixVQUFVLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFO2dDQUNsQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJO2dDQUN6QixRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRO2dDQUNqQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFROzZCQUNsQyxDQUFDLENBQUM7d0JBQ0wsQ0FBQyxDQUFDLENBQUM7cUJBQ0o7Z0JBQ0gsQ0FBQyxDQUNGLENBQUM7Z0JBR0YsRUFBRSxDQUFDLG1CQUFtQixDQUFDO29CQUNyQixPQUFPLEVBQUUsVUFBQyxDQUFDO3dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLENBQUM7b0JBQ0QsSUFBSSxFQUFFLFVBQUMsQ0FBQzt3QkFDTixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxDQUFDO2lCQUNGLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTztRQUNMLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDWCxPQUFPLEVBQ0wsK0NBQStDO1lBQ2pELFVBQVUsRUFBRSxLQUFLO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTO1FBQVQsaUJBdURDO1FBdERDLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDL0IsT0FBTyxDQUFDLEtBQUssR0FBRztZQUFDLGNBQU87aUJBQVAsVUFBTyxFQUFQLHFCQUFPLEVBQVAsSUFBTztnQkFBUCx5QkFBTzs7WUFDdEIsS0FBSSxDQUFDLE9BQU8sQ0FDVjtnQkFDRSxTQUFTLEVBQUUsS0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO29CQUNwQzt3QkFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDYixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzdCLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO3FCQUNqQjtpQkFDRixDQUFDO2FBQ0gsRUFDRDtnQkFZRSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO29CQUMzQixLQUFJLENBQUMsWUFBWSxDQUFDO3dCQUNoQixJQUFJLEVBQUUsU0FBUzt3QkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTt3QkFDaEIsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNiLFVBQVUsRUFBRSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7d0JBQ2xDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUk7d0JBQ3pCLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7d0JBQ2pDLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7cUJBQ2xDLENBQUMsQ0FBQztpQkFDSjtxQkFBTTtvQkFDTCxLQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDO3dCQUN2QixLQUFJLENBQUMsWUFBWSxDQUFDOzRCQUNoQixJQUFJLEVBQUUsU0FBUzs0QkFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTs0QkFDaEIsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzRCQUNiLFVBQVUsRUFBRSxFQUFFLENBQUMsaUJBQWlCLEVBQUU7NEJBQ2xDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUk7NEJBQ3pCLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7NEJBQ2pDLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVE7eUJBQ2xDLENBQUMsQ0FBQztvQkFDTCxDQUFDLENBQUMsQ0FBQztpQkFDSjtZQUNILENBQUMsQ0FDRixDQUFDO1lBRUYsUUFBUSxDQUFDLElBQUksT0FBYixRQUFRLEdBQU0sT0FBTyxTQUFLLElBQUksR0FBRTtRQUNsQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0QsV0FBVyxZQUFDLElBQVM7UUFDbkIsRUFBRSxDQUFDLFdBQVcsQ0FBQztZQUNiLEtBQUssRUFBRSxTQUFTO1lBQ2hCLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLE9BQU8sQ0FBQztZQUNULEdBQUcsRUFBRSw2Q0FBNkM7WUFDbEQsSUFBSSxNQUFBO1lBQ0osTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsVUFBQyxHQUFHO2dCQUNYLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLElBQUssR0FBRyxDQUFDLElBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO29CQUMxRCxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2pCLEVBQUUsQ0FBQyxTQUFTLENBQUM7d0JBQ1gsS0FBSyxFQUFFLFFBQVE7d0JBQ2YsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsUUFBUSxFQUFFLElBQUk7cUJBQ2YsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQztZQUNELElBQUksRUFBRSxVQUFDLEdBQUc7Z0JBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDO29CQUNYLEtBQUssRUFBRSxRQUFRO29CQUNmLElBQUksRUFBRSxTQUFTO29CQUNmLFFBQVEsRUFBRSxJQUFJO2lCQUNmLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsWUFBWSxZQUFDLElBQVM7UUFDcEIsRUFBRSxDQUFDLFdBQVcsQ0FBQztZQUNiLEtBQUssRUFBRSxTQUFTO1lBQ2hCLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO1FBQ0gsRUFBRSxDQUFDLE9BQU8sQ0FBQztZQUNULEdBQUcsRUFBRSw2Q0FBNkM7WUFDbEQsSUFBSSxNQUFBO1lBQ0osTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUUsVUFBQyxHQUFHO2dCQUNYLElBQUksR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLElBQUssR0FBRyxDQUFDLElBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO29CQUMxRCxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2pCLEVBQUUsQ0FBQyxTQUFTLENBQUM7d0JBQ1gsS0FBSyxFQUFFLFFBQVE7d0JBQ2YsSUFBSSxFQUFFLE1BQU07d0JBQ1osUUFBUSxFQUFFLElBQUk7cUJBQ2YsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQztZQUNELElBQUksRUFBRSxVQUFDLEdBQUc7Z0JBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEIsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixFQUFFLENBQUMsU0FBUyxDQUFDO29CQUNYLEtBQUssRUFBRSxRQUFRO29CQUNmLElBQUksRUFBRSxNQUFNO29CQUNaLFFBQVEsRUFBRSxJQUFJO2lCQUNmLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsS0FBSztRQUFMLGlCQU1DO1FBTEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7WUFDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQztnQkFDWCxLQUFLLEVBQUUsS0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQzthQUMzQixDQUFDLENBQUM7UUFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDWCxDQUFDO0lBQ0QsTUFBTTtRQUNKLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsWUFBWTtRQUNWLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPO1lBQ3pCLE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLHNCQUFzQjtnQkFFN0IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLE9BQU8sRUFBRSxVQUFDLEdBQUc7b0JBRVgsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFO3dCQUVmLElBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFFNUQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztxQkFDdkM7eUJBQU07d0JBQ0wsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO3FCQUM5QjtvQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkMsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNELE1BQU07UUFJSixJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ1gsSUFBSSxFQUFFLEVBQUU7WUFDUixTQUFTLEVBQUUsRUFBRTtZQUNiLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQyxDQUFDO1FBQ0gsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUVsQixFQUFFLENBQUMsZUFBZSxDQUFDLGNBQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0IsRUFBRSxDQUFDLG1CQUFtQixFQUFFLENBQUM7SUFDM0IsQ0FBQztDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGluZGV4LnRzXG4vLyDojrflj5blupTnlKjlrp7kvotcbi8vIEB0cy1pZ25vcmVcbmNvbnN0IGFwcCA9IGdldEFwcDxJQXBwT3B0aW9uPigpO1xuXG5QYWdlKHtcbiAgZGF0YToge1xuICAgIGxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGVycm9yTGlzdDogW10gYXMgYW55W10sXG4gICAgY291bnQ6IDAsXG4gIH0sXG4gIHRpbWVySWQ6IG51bGwgYXMgYW55LFxuICBwYWdlU2hvd1RpbWU6IDAsXG4gIHN0YXJ0VGltZTogMCxcbiAgc2NhblRpbWU6IDAsXG4gIC8vIOS6i+S7tuWkhOeQhuWHveaVsFxuICBpbml0KCkge1xuICAgIHd4LnN0YXJ0QmVhY29uRGlzY292ZXJ5KHtcbiAgICAgIGlnbm9yZUJsdWV0b290aEF2YWlsYWJsZTogdHJ1ZSxcbiAgICAgIHV1aWRzOiBbXCJGREE1MDY5My1BNEUyLTRGQjEtQUZDRi1DNkVCMDc2NDc4MjRcIl0sIC8vIOS4gOS4quWFrOS8l+WPt+WvueW6lOeahOiuvuWkh+eahHV1aWRcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJzdGFydEJlYWNvbkRpc2NvdmVyeSBzdWNjXCIsIHJlcyk7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLlvIDlp4vmkJzntKJpQmVhY29uXCIsXG4gICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnN0YXJ0U2NhbigpO1xuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcInN0YXJ0QmVhY29uRGlzY292ZXJ5IGZhaWxcIiwgcmVzKTtcbiAgICAgICAgaWYgKHJlcy5lcnJDb2RlID09PSAxMTAwMSB8fCByZXMuZXJyQ29kZSA9PT0gMTEwMDIpIHtcbiAgICAgICAgICB0aGlzLmVyclRpcHMoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfSxcbiAgc3RhcnRTY2FuKCkge1xuICAgIC8vIOajgOe0omlCZWFjb25cbiAgICB3eC5vbkJlYWNvblVwZGF0ZSgocmVzKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhcIm9uQmVhY29uVXBkYXRlIGZpbmQgcmVzdWx0XCIsIHJlcyk7XG4gICAgICBpZiAocmVzLmJlYWNvbnMgJiYgcmVzLmJlYWNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLnNjYW5UaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgYmVhY29uID0gcmVzLmJlYWNvbnNbMF07XG4gICAgICAgIGlmICh0aGlzLmRhdGEubGlzdC5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3Qgb3BlbkludGVydmFsID0gbm93IC0gdGhpcy5wYWdlU2hvd1RpbWU7XG4gICAgICAgIGNvbnN0IHN0YXJ0SW50ZXJ2YWwgPSBub3cgLSB0aGlzLnN0YXJ0VGltZTtcbiAgICAgICAgY29uc3Qgc2NhbkludGVydmFsID0gbm93IC0gdGhpcy5zY2FuVGltZTtcbiAgICAgICAgdGhpcy5zZXREYXRhKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxpc3Q6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJlYWNvblVVSUQ6IGJlYWNvbi51dWlkLFxuICAgICAgICAgICAgICAgIFJTU0k6IGAke2JlYWNvbi5yc3NpfWRCbWAsXG4gICAgICAgICAgICAgICAgb3BlbkludGVydmFsOiBgJHtvcGVuSW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWw6IGAke3N0YXJ0SW50ZXJ2YWwgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbDogYCR7c2NhbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHR5cGU6IGlCZWFjb25cbiAgICAgICAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICAgICAgICogYmVhY29uVXVpZDpVVUlEXG4gICAgICAgICAgICAgKiDkv6Hlj7flvLrluqZcbiAgICAgICAgICAgICAqIOmhtemdouaXtumXtOW3rlxuICAgICAgICAgICAgICog5ZCv5Yqo5pe26Ze05beuXG4gICAgICAgICAgICAgKiDmkJzntKLml7bpl7Tlt65cbiAgICAgICAgICAgICAqIOiuvuWkh+S/oeaBryBKU09OLnN0cmluZyh3eC5nZXRTeXN0ZW1JbmZvU3luYygpKVxuICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXVpZFxuICAgICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJuYW1lXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGlmIChhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSkge1xuICAgICAgICAgICAgICB0aGlzLnJlcXVlc3REYXRhKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImlCZWFjb25cIixcbiAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgIGJlYWNvblVVSUQ6IGJlYWNvbi51dWlkLFxuICAgICAgICAgICAgICAgIFJTU0k6IGJlYWNvbi5yc3NpLFxuICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBzdGFydEludGVydmFsLFxuICAgICAgICAgICAgICAgIHNjYW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnNldE5hbWVNb2RhbCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdERhdGEoe1xuICAgICAgICAgICAgICAgICAgdHlwZTogXCJpQmVhY29uXCIsXG4gICAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgYmVhY29uVVVJRDogYmVhY29uLnV1aWQsXG4gICAgICAgICAgICAgICAgICBSU1NJOiBiZWFjb24ucnNzaSxcbiAgICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgIHN0YXJ0SW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIOWBnOatomlCZWFjb27mkJzntKJcbiAgICAgICAgd3guc3RvcEJlYWNvbkRpc2NvdmVyeSh7XG4gICAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3RvcEJlYWNvbkRpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmVhY29uRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGVyclRpcHMoKSB7XG4gICAgd3guc2hvd01vZGFsKHtcbiAgICAgIGNvbnRlbnQ6XG4gICAgICAgIFwiaUJlYWNvbuWIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogdHlwZTogaUJlYWNvblxuICAgICAgICAgICAqIHV1aWRcbiAgICAgICAgICAgKiDplJnor6/nsbvlnotcbiAgICAgICAgICAgKiDkv6Hmga9cbiAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgICAgICogYXBwLmdsb2JhbERhdGEudXNlckluZm9cbiAgICAgICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VybmFtZVxuICAgICAgICAgICAqL1xuICAgICAgICAgIGlmIChhcHAuZ2xvYmFsRGF0YS51c2VyTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RXJyb3Ioe1xuICAgICAgICAgICAgICB0eXBlOiBcImlCZWFjb25cIixcbiAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogYXJnc1sxXSxcbiAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICAgICAgICB1c2VyTmFtZTogYXBwLmdsb2JhbERhdGEudXNlck5hbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZXROYW1lTW9kYWwoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0RXJyb3Ioe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAgICBqc29uOiBhcmdzWzFdLFxuICAgICAgICAgICAgICAgIGRldmljZUluZm86IHd4LmdldFN5c3RlbUluZm9TeW5jKCksXG4gICAgICAgICAgICAgICAgdXVpZDogYXBwLmdsb2JhbERhdGEudXVpZCxcbiAgICAgICAgICAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6IGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgT2xkRXJyb3IuY2FsbChjb25zb2xlLCAuLi5hcmdzKTtcbiAgICB9O1xuICB9LFxuICByZXF1ZXN0RGF0YShkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLkuIrkvKDlrp7pqoznu5PmnpzkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIuWunumqjOS4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHJlcXVlc3RFcnJvcihkYXRhOiBhbnkpIHtcbiAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICB0aXRsZTogXCLplJnor6/kv6Hmga/kuIrmiqXkuK1cIixcbiAgICAgIG1hc2s6IHRydWUsXG4gICAgfSk7XG4gICAgd3gucmVxdWVzdCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgZGF0YSxcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgZHVyYXRpb246IDUwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihyZXMpO1xuICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeWksei0pVwiLFxuICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgIGR1cmF0aW9uOiA1MDAwLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHRpbWVyKCkge1xuICAgIHRoaXMudGltZXJJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICAgIGNvdW50OiB0aGlzLmRhdGEuY291bnQgKyAxLFxuICAgICAgfSk7XG4gICAgfSwgMTAwMCk7XG4gIH0sXG4gIG9uU2hvdygpIHtcbiAgICB0aGlzLnBhZ2VTaG93VGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5wb3N0RXJyb3IoKTtcbiAgICB0aGlzLnRpbWVyKCk7XG4gICAgdGhpcy5pbml0KCk7XG4gIH0sXG4gIHNldE5hbWVNb2RhbCgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHJldHVybiB3eC5zaG93TW9kYWwoe1xuICAgICAgICB0aXRsZTogXCLor7fovpPlhaXmgqjnmoTkvIHlvq7lkI3vvIzmlrnkvr/miJHku6zlgZrlkI7mnJ/pl67popjosIPmn6VcIixcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBlZGl0YWJsZTogdHJ1ZSxcbiAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgaWYgKHJlcy5jb250ZW50KSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCB1c2VyTmFtZSA9IHd4LnNldFN0b3JhZ2VTeW5jKFwidXNlck5hbWVcIiwgcmVzLmNvbnRlbnQpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSByZXMuY29udGVudDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlck5hbWUgPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKGFwcC5nbG9iYWxEYXRhLnVzZXJOYW1lKTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuICBvbkhpZGUoKSB7XG4gICAgLyoqXG4gICAgICogY2xlYXJcbiAgICAgKi9cbiAgICB0aGlzLnNldERhdGEoe1xuICAgICAgbGlzdDogW10sXG4gICAgICBlcnJvckxpc3Q6IFtdLFxuICAgICAgY291bnQ6IDAsXG4gICAgfSk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgIHRoaXMudGltZXJJZCA9IG51bGw7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSAwO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICB0aGlzLnNjYW5UaW1lID0gMDtcblxuICAgIHd4Lm9mZkJlYWNvblVwZGF0ZSgoKSA9PiB7fSk7XG4gICAgd3guc3RvcEJlYWNvbkRpc2NvdmVyeSgpO1xuICB9LFxufSk7XG4iXX0=