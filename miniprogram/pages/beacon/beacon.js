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
                    duration: 2000,
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
                    wx.showLoading({
                        title: "上传实验结果中",
                        mask: true,
                    });
                    wx.request({
                        url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
                        data: {
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
                        },
                        method: "POST",
                        success: function (res) {
                            if (res.statusCode === 200 && res.data.code === 0) {
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
            }, function () { });
            wx.showLoading({
                title: "错误信息上报中",
                mask: true,
            });
            wx.request({
                url: "https://tyg.weixiao.qq.com/fr/bluetooth/log",
                data: {
                    type: "iBeacon",
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
        wx.offBeaconUpdate(function () { });
        wx.stopBeaconDiscovery();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYmVhY29uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxJQUFNLEdBQUcsR0FBRyxNQUFNLEVBQWMsQ0FBQztBQUVqQyxJQUFJLENBQUM7SUFDSCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsRUFBVztRQUNqQixTQUFTLEVBQUUsRUFBVztRQUN0QixLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsT0FBTyxFQUFFLElBQVc7SUFDcEIsWUFBWSxFQUFFLENBQUM7SUFDZixTQUFTLEVBQUUsQ0FBQztJQUNaLFFBQVEsRUFBRSxDQUFDO0lBRVgsSUFBSTtRQUFKLGlCQW9CQztRQW5CQyxFQUFFLENBQUMsb0JBQW9CLENBQUM7WUFDdEIsS0FBSyxFQUFFLENBQUMsc0NBQXNDLENBQUM7WUFDL0MsT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUM5QyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDNUIsRUFBRSxDQUFDLFNBQVMsQ0FBQztvQkFDWCxLQUFLLEVBQUUsYUFBYTtvQkFDcEIsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsUUFBUSxFQUFFLElBQUk7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILEtBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixDQUFDO1lBQ0QsSUFBSSxFQUFFLFVBQUMsR0FBRztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFO29CQUNsRCxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hCO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFD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SUFDRCxLQUFLO1FBQUwsaUJBTUM7UUFMQyxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQztZQUN6QixLQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNYLEtBQUssRUFBRSxLQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO2FBQzNCLENBQUMsQ0FBQztRQUNMLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNYLENBQUM7SUFDRCxNQUFNO1FBQ0osSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxNQUFNO1FBSUosSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNYLElBQUksRUFBRSxFQUFFO1lBQ1IsU0FBUyxFQUFFLEVBQUU7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFFbEIsRUFBRSxDQUFDLGVBQWUsQ0FBQyxjQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbmRleC50c1xuLy8g6I635Y+W5bqU55So5a6e5L6LXG4vLyBAdHMtaWdub3JlXG5jb25zdCBhcHAgPSBnZXRBcHA8SUFwcE9wdGlvbj4oKTtcblxuUGFnZSh7XG4gIGRhdGE6IHtcbiAgICBsaXN0OiBbXSBhcyBhbnlbXSxcbiAgICBlcnJvckxpc3Q6IFtdIGFzIGFueVtdLFxuICAgIGNvdW50OiAwLFxuICB9LFxuICB0aW1lcklkOiBudWxsIGFzIGFueSxcbiAgcGFnZVNob3dUaW1lOiAwLFxuICBzdGFydFRpbWU6IDAsXG4gIHNjYW5UaW1lOiAwLFxuICAvLyDkuovku7blpITnkIblh73mlbBcbiAgaW5pdCgpIHtcbiAgICB3eC5zdGFydEJlYWNvbkRpc2NvdmVyeSh7XG4gICAgICB1dWlkczogW1wiRkRBNTA2OTMtQTRFMi00RkIxLUFGQ0YtQzZFQjA3NjQ3ODI0XCJdLCAvLyDkuIDkuKrlhazkvJflj7flr7nlupTnmoTorr7lpIfnmoR1dWlkXG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwic3RhcnRCZWFjb25EaXNjb3Zlcnkgc3VjY1wiLCByZXMpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi5byA5aeL5pCc57SiaUJlYWNvblwiLFxuICAgICAgICAgIGljb246IFwic3VjY2Vzc1wiLFxuICAgICAgICAgIGR1cmF0aW9uOiAyMDAwLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zdGFydFNjYW4oKTtcbiAgICAgIH0sXG4gICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJlYWNvbkRpc2NvdmVyeSBmYWlsXCIsIHJlcyk7XG4gICAgICAgIGlmIChyZXMuZXJyQ29kZSA9PT0gMTEwMDEgfHwgcmVzLmVyckNvZGUgPT09IDExMDAyKSB7XG4gICAgICAgICAgdGhpcy5lcnJUaXBzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIHN0YXJ0U2NhbigpIHtcbiAgICAvLyDmo4DntKJpQmVhY29uXG4gICAgd3gub25CZWFjb25VcGRhdGUoKHJlcykgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJvbkJlYWNvblVwZGF0ZSBmaW5kIHJlc3VsdFwiLCByZXMpO1xuICAgICAgaWYgKHJlcy5iZWFjb25zICYmIHJlcy5iZWFjb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zY2FuVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IGJlYWNvbiA9IHJlcy5iZWFjb25zWzBdO1xuICAgICAgICBpZiAodGhpcy5kYXRhLmxpc3QubGVuZ3RoKSByZXR1cm47XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IG9wZW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMucGFnZVNob3dUaW1lO1xuICAgICAgICBjb25zdCBzdGFydEludGVydmFsID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG4gICAgICAgIGNvbnN0IHNjYW5JbnRlcnZhbCA9IG5vdyAtIHRoaXMuc2NhblRpbWU7XG4gICAgICAgIHRoaXMuc2V0RGF0YShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsaXN0OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiZWFjb25VVUlEOiBiZWFjb24udXVpZCxcbiAgICAgICAgICAgICAgICBSU1NJOiBgJHtiZWFjb24ucnNzaX1kQm1gLFxuICAgICAgICAgICAgICAgIG9wZW5JbnRlcnZhbDogYCR7b3BlbkludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICBzdGFydEludGVydmFsOiBgJHtzdGFydEludGVydmFsIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWw6IGAke3NjYW5JbnRlcnZhbCAvIDEwMDB9c2AsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBUT0RPOiByZXF1ZXN0XG4gICAgICAgICAgICAgKiB0eXBlOiBpQmVhY29uXG4gICAgICAgICAgICAgKiDml7bpl7TmiLNcbiAgICAgICAgICAgICAqIGJlYWNvblV1aWQ6VVVJRFxuICAgICAgICAgICAgICog5L+h5Y+35by65bqmXG4gICAgICAgICAgICAgKiDpobXpnaLml7bpl7Tlt65cbiAgICAgICAgICAgICAqIOWQr+WKqOaXtumXtOW3rlxuICAgICAgICAgICAgICog5pCc57Si5pe26Ze05beuXG4gICAgICAgICAgICAgKiDorr7lpIfkv6Hmga8gSlNPTi5zdHJpbmcod3guZ2V0U3lzdGVtSW5mb1N5bmMoKSlcbiAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnV1aWRcbiAgICAgICAgICAgICAqIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHd4LnNob3dMb2FkaW5nKHtcbiAgICAgICAgICAgICAgdGl0bGU6IFwi5LiK5Lyg5a6e6aqM57uT5p6c5LitXCIsXG4gICAgICAgICAgICAgIG1hc2s6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHd4LnJlcXVlc3Qoe1xuICAgICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly90eWcud2VpeGlhby5xcS5jb20vZnIvYmx1ZXRvb3RoL2xvZ1wiLFxuICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJpQmVhY29uXCIsXG4gICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBiZWFjb25VVUlEOiBiZWFjb24udXVpZCxcbiAgICAgICAgICAgICAgICBSU1NJOiBiZWFjb24ucnNzaSxcbiAgICAgICAgICAgICAgICBvcGVuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgc3RhcnRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICBzY2FuSW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgZGV2aWNlSW5mbzogd3guZ2V0U3lzdGVtSW5mb1N5bmMoKSxcbiAgICAgICAgICAgICAgICB1dWlkOiBhcHAuZ2xvYmFsRGF0YS51dWlkLFxuICAgICAgICAgICAgICAgIHVzZXJJbmZvOiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mbyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwICYmIChyZXMuZGF0YSBhcyBhbnkpLmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgIHd4LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgICAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCLlrp7pqozkuIrmiqXmiJDlip9cIixcbiAgICAgICAgICAgICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAyMDAwLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmYWlsOiAocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKHJlcyk7XG4gICAgICAgICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICB3eC5zaG93VG9hc3Qoe1xuICAgICAgICAgICAgICAgICAgdGl0bGU6IFwi5a6e6aqM5LiK5oql5aSx6LSlXCIsXG4gICAgICAgICAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAyMDAwLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIOWBnOatomlCZWFjb27mkJzntKJcbiAgICAgICAgd3guc3RvcEJlYWNvbkRpc2NvdmVyeSh7XG4gICAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3RvcEJlYWNvbkRpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmVhY29uRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGVyclRpcHMoKSB7XG4gICAgd3guc2hvd01vZGFsKHtcbiAgICAgIGNvbnRlbnQ6XG4gICAgICAgIFwiaUJlYWNvbuWIneWni+WMluWksei0pe+8jOivt+ajgOafpeezu+e7n+iTneeJmeWPiuWumuS9jeWKn+iDveaYr+WQpuW8gOWQr+OAglxcbuW8gOWQr+WQjuivt+aJq+eggemHjeaWsOi/m+WFpemhtemdou+8gVwiLFxuICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgfSk7XG4gIH0sXG4gIHBvc3RFcnJvcigpIHtcbiAgICBjb25zdCBPbGRFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoXG4gICAgICAgIHtcbiAgICAgICAgICBlcnJvckxpc3Q6IHRoaXMuZGF0YS5lcnJvckxpc3QuY29uY2F0KFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogYXJnc1swXSxcbiAgICAgICAgICAgICAganNvbjogSlNPTi5zdHJpbmdpZnkoYXJnc1sxXSksXG4gICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pLFxuICAgICAgICB9LFxuICAgICAgICAoKSA9PiB7fVxuICAgICAgKTtcbiAgICAgIC8qKlxuICAgICAgICogVE9ETzogcmVxdWVzdFxuICAgICAgICogdHlwZTogaUJlYWNvblxuICAgICAgICogdXVpZFxuICAgICAgICog6ZSZ6K+v57G75Z6LXG4gICAgICAgKiDkv6Hmga9cbiAgICAgICAqIOaXtumXtOaIs1xuICAgICAgICog6K6+5aSH5L+h5oGvIEpTT04uc3RyaW5nKHd4LmdldFN5c3RlbUluZm9TeW5jKCkpXG4gICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51dWlkXG4gICAgICAgKiBhcHAuZ2xvYmFsRGF0YS51c2VySW5mb1xuICAgICAgICovXG4gICAgICB3eC5zaG93TG9hZGluZyh7XG4gICAgICAgIHRpdGxlOiBcIumUmeivr+S/oeaBr+S4iuaKpeS4rVwiLFxuICAgICAgICBtYXNrOiB0cnVlLFxuICAgICAgfSk7XG4gICAgICB3eC5yZXF1ZXN0KHtcbiAgICAgICAgdXJsOiBcImh0dHBzOi8vdHlnLndlaXhpYW8ucXEuY29tL2ZyL2JsdWV0b290aC9sb2dcIixcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHR5cGU6IFwiaUJlYWNvblwiLFxuICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgZXJyVHlwZTogYXJnc1swXSxcbiAgICAgICAgICBqc29uOiBKU09OLnN0cmluZ2lmeShhcmdzWzFdKSxcbiAgICAgICAgICBkZXZpY2VJbmZvOiB3eC5nZXRTeXN0ZW1JbmZvU3luYygpLFxuICAgICAgICAgIHV1aWQ6IGFwcC5nbG9iYWxEYXRhLnV1aWQsXG4gICAgICAgICAgdXNlckluZm86IGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvLFxuICAgICAgICB9LFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSAyMDAgJiYgKHJlcy5kYXRhIGFzIGFueSkuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgd3guaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICAgIHRpdGxlOiBcIumUmeivr+S4iuaKpeaIkOWKn1wiLFxuICAgICAgICAgICAgICBpY29uOiBcIm5vbmVcIixcbiAgICAgICAgICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4ocmVzKTtcbiAgICAgICAgICB3eC5oaWRlTG9hZGluZygpO1xuICAgICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgICB0aXRsZTogXCLplJnor6/kuIrmiqXlpLHotKVcIixcbiAgICAgICAgICAgIGljb246IFwibm9uZVwiLFxuICAgICAgICAgICAgZHVyYXRpb246IDEwMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgT2xkRXJyb3IuY2FsbChjb25zb2xlLCAuLi5hcmdzKTtcbiAgICB9O1xuICB9LFxuICB0aW1lcigpIHtcbiAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnNldERhdGEoe1xuICAgICAgICBjb3VudDogdGhpcy5kYXRhLmNvdW50ICsgMSxcbiAgICAgIH0pO1xuICAgIH0sIDEwMDApO1xuICB9LFxuICBvblNob3coKSB7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMucG9zdEVycm9yKCk7XG4gICAgdGhpcy50aW1lcigpO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9LFxuICBvbkhpZGUoKSB7XG4gICAgLyoqXG4gICAgICogY2xlYXJcbiAgICAgKi9cbiAgICB0aGlzLnNldERhdGEoe1xuICAgICAgbGlzdDogW10sXG4gICAgICBlcnJvckxpc3Q6IFtdLFxuICAgICAgY291bnQ6IDAsXG4gICAgfSk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySWQpO1xuICAgIHRoaXMudGltZXJJZCA9IG51bGw7XG4gICAgdGhpcy5wYWdlU2hvd1RpbWUgPSAwO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICB0aGlzLnNjYW5UaW1lID0gMDtcblxuICAgIHd4Lm9mZkJlYWNvblVwZGF0ZSgoKSA9PiB7fSk7XG4gICAgd3guc3RvcEJlYWNvbkRpc2NvdmVyeSgpO1xuICB9LFxufSk7XG4iXX0=