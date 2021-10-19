"use strict";
var app = getApp();
Page({
    data: {
        list: [],
    },
    bindViewTap: function () {
        var _this = this;
        var openTime = Date.now();
        var startTime;
        var stateChangeTog = false;
        var loop = function () {
            var scanTime = Date.now();
            wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: true,
                success: function (e) {
                    console.log("startBluetoothDevicesDiscovery succ", e);
                    wx.onBluetoothDeviceFound(function (res) {
                        res.devices.forEach(function (device) {
                            if (device.name.indexOf("hello") > -1) {
                                try {
                                    var view = new Uint8Array(device.advertisData);
                                    var arr = [];
                                    for (var i = 0; i < view.length; i++) {
                                        arr.push(view[i].toString(16));
                                    }
                                    console.log("onBluetoothDeviceFound found!", device, device.name, arr);
                                    var list = _this.data.list.concat([
                                        {
                                            name: device.localName,
                                            arr: arr.join("-").toUpperCase(),
                                            RSSI: device.RSSI + "dBm",
                                            openInvertal: (Date.now() - openTime) / 1000 + "s",
                                            startInvertal: (Date.now() - startTime) / 1000 + "s",
                                            scanInvertal: (Date.now() - scanTime) / 1000 + "s",
                                        },
                                    ]);
                                    _this.setData({
                                        list: list,
                                    });
                                }
                                catch (e) {
                                    console.error(e);
                                }
                                wx.stopBluetoothDevicesDiscovery({
                                    success: function (e) {
                                        console.log("stopBluetoothDevicesDiscovery succ", e);
                                        setTimeout(function () {
                                            loop();
                                        }, 8000);
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
                    stateChangeTog = false;
                    wx.getSystemInfo({
                        success: function (res) {
                            if (e.errCode === 10001 && e.errno === 1500102) {
                                wx.showModal({
                                    content: "蓝牙搜索广播失败，请检查系统定位功能是否开启",
                                    showCancel: false,
                                });
                            }
                            else if (res.platform === "android" &&
                                e.errCode === -1 &&
                                e.errno === 1509009) {
                                wx.showModal({
                                    content: "蓝牙搜索广播失败，请检查系统定位功能是否开启",
                                    showCancel: false,
                                });
                            }
                        },
                    });
                },
            });
        };
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log("openBluetoothAdapter succ", res);
                wx.showToast({
                    title: "蓝牙初始化成功",
                    icon: "success",
                    duration: 2000,
                });
                startTime = Date.now();
                if (!stateChangeTog) {
                    loop();
                    stateChangeTog = true;
                }
            },
            fail: function (res) {
                console.error("openBluetoothAdapter fail", res);
                wx.getSystemInfo({
                    success: function (res) {
                        if (res.platform === "ios") {
                            wx.showModal({
                                content: "蓝牙初始化失败，请检查系统蓝牙功能是否开启",
                                showCancel: false,
                                success: function () {
                                    wx.getWifiList({
                                        success: function (e) {
                                            console.log("getWifiList succ", e);
                                        },
                                        fail: function (e) {
                                            console.log("getWifiList fail", e);
                                        },
                                    });
                                },
                            });
                        }
                        else if (res.platform === "android") {
                            wx.showModal({
                                content: "蓝牙初始化失败，请检查系统蓝牙及定位功能是否开启",
                                showCancel: false,
                            });
                        }
                    },
                });
                if (res.errCode !== 10001)
                    return;
                wx.onBluetoothAdapterStateChange(function (res) {
                    console.log("adapterState changed, now is", res);
                    if (!res.available || !res.discovering) {
                        stateChangeTog = false;
                        wx.getSystemInfo({
                            success: function (res) {
                                if (res.platform === "ios") {
                                    wx.showModal({
                                        content: "蓝牙初始化失败，请检查系统蓝牙功能是否开启",
                                        showCancel: false,
                                        success: function () {
                                            wx.getWifiList({
                                                success: function (e) {
                                                    console.log("getWifiList succ", e);
                                                },
                                                fail: function (e) {
                                                    console.log("getWifiList fail", e);
                                                },
                                            });
                                        },
                                    });
                                }
                                else if (res.platform === "android") {
                                    wx.showModal({
                                        content: "蓝牙初始化失败，请检查系统蓝牙及定位功能是否开启",
                                        showCancel: false,
                                    });
                                }
                            },
                        });
                        return;
                    }
                    if (!stateChangeTog) {
                        startTime = Date.now();
                        loop();
                        stateChangeTog = true;
                    }
                });
            },
        });
    },
    onLoad: function () {
        this.bindViewTap();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQUU7S0FDVDtJQUVELFdBQVc7UUFBWCxpQkE4S0M7UUE3S0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksU0FBYyxDQUFDO1FBQ25CLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQztRQUMzQixJQUFNLElBQUksR0FBRztZQUVYLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUMxQixFQUFFLENBQUMsOEJBQThCLENBQUM7Z0JBQ2hDLGtCQUFrQixFQUFFLElBQUk7Z0JBRXhCLE9BQU8sRUFBRSxVQUFDLENBQUM7b0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsRUFBRSxDQUFDLHNCQUFzQixDQUFDLFVBQUMsR0FBRzt3QkFDNUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNOzRCQUV6QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dDQUNyQyxJQUFJO29DQUNGLElBQU0sSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQ0FDakQsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO29DQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO3dDQUNwQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxR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QUUsQ0FBQzt3QkFDUCxjQUFjLEdBQUcsSUFBSSxDQUFDO3FCQUN2QjtnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBQ0QsTUFBTTtRQUNKLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyQixDQUFDO0NBa0JGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGluZGV4LnRzXG4vLyDojrflj5blupTnlKjlrp7kvotcbmNvbnN0IGFwcCA9IGdldEFwcDxJQXBwT3B0aW9uPigpO1xuXG5QYWdlKHtcbiAgZGF0YToge1xuICAgIGxpc3Q6IFtdLFxuICB9LFxuICAvLyDkuovku7blpITnkIblh73mlbBcbiAgYmluZFZpZXdUYXAoKSB7XG4gICAgY29uc3Qgb3BlblRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGxldCBzdGFydFRpbWU6IGFueTtcbiAgICBsZXQgc3RhdGVDaGFuZ2VUb2cgPSBmYWxzZTtcbiAgICBjb25zdCBsb29wID0gKCkgPT4ge1xuICAgICAgLy8g5pCc57Si5aSW5Zu06JOd54mZ6K6+5aSHXG4gICAgICBsZXQgc2NhblRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgd3guc3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5KHtcbiAgICAgICAgYWxsb3dEdXBsaWNhdGVzS2V5OiB0cnVlLFxuICAgICAgICAvLyBpbnRlcnZhbDogMzAwMCxcbiAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInN0YXJ0Qmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgIHd4Lm9uQmx1ZXRvb3RoRGV2aWNlRm91bmQoKHJlcykgPT4ge1xuICAgICAgICAgICAgcmVzLmRldmljZXMuZm9yRWFjaCgoZGV2aWNlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIOi/memHjOWPr+S7peWBmuS4gOS6m+i/h+a7pFxuICAgICAgICAgICAgICBpZiAoZGV2aWNlLm5hbWUuaW5kZXhPZihcImhlbGxvXCIpID4gLTEpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KGRldmljZS5hZHZlcnRpc0RhdGEpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgYXJyID0gW107XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2godmlld1tpXS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICAgIFwib25CbHVldG9vdGhEZXZpY2VGb3VuZCBmb3VuZCFcIixcbiAgICAgICAgICAgICAgICAgICAgZGV2aWNlLFxuICAgICAgICAgICAgICAgICAgICBkZXZpY2UubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXJyXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbGlzdCA9ICh0aGlzLmRhdGEubGlzdCBhcyBhbnkpLmNvbmNhdChbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBkZXZpY2UubG9jYWxOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIGFycjogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgUlNTSTogYCR7ZGV2aWNlLlJTU0l9ZEJtYCxcbiAgICAgICAgICAgICAgICAgICAgICBvcGVuSW52ZXJ0YWw6IGAkeyhEYXRlLm5vdygpIC0gb3BlblRpbWUpIC8gMTAwMH1zYCxcbiAgICAgICAgICAgICAgICAgICAgICBzdGFydEludmVydGFsOiBgJHsoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSkgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICAgIHNjYW5JbnZlcnRhbDogYCR7KERhdGUubm93KCkgLSBzY2FuVGltZSkgLyAxMDAwfXNgLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldERhdGEoe1xuICAgICAgICAgICAgICAgICAgICBsaXN0LFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5om+5Yiw6KaB5pCc57Si55qE6K6+5aSH5ZCO77yM5Y+K5pe25YGc5q2i5omr5o+PXG4gICAgICAgICAgICAgICAgd3guc3RvcEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgICAgICAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBsb29wKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDgwMDApO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGZhaWw6IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSBmYWlsXCIsIGUpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6IChlOiBhbnkpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwic3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgICAgc3RhdGVDaGFuZ2VUb2cgPSBmYWxzZTtcbiAgICAgICAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGUuZXJyQ29kZSA9PT0gMTAwMDEgJiYgZS5lcnJubyA9PT0gMTUwMDEwMikge1xuICAgICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgICBjb250ZW50OiBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+WumuS9jeWKn+iDveaYr+WQpuW8gOWQr1wiLFxuICAgICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgcmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIiAmJlxuICAgICAgICAgICAgICAgIGUuZXJyQ29kZSA9PT0gLTEgJiZcbiAgICAgICAgICAgICAgICBlLmVycm5vID09PSAxNTA5MDA5XG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgICBjb250ZW50OiBcIuiTneeJmeaQnOe0ouW5v+aSreWksei0pe+8jOivt+ajgOafpeezu+e7n+WumuS9jeWKn+iDveaYr+WQpuW8gOWQr1wiLFxuICAgICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHd4Lm9wZW5CbHVldG9vdGhBZGFwdGVyKHtcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJvcGVuQmx1ZXRvb3RoQWRhcHRlciBzdWNjXCIsIHJlcyk7XG4gICAgICAgIHd4LnNob3dUb2FzdCh7XG4gICAgICAgICAgdGl0bGU6IFwi6JOd54mZ5Yid5aeL5YyW5oiQ5YqfXCIsXG4gICAgICAgICAgaWNvbjogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgZHVyYXRpb246IDIwMDAsXG4gICAgICAgIH0pO1xuICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAoIXN0YXRlQ2hhbmdlVG9nKSB7XG4gICAgICAgICAgbG9vcCgpO1xuICAgICAgICAgIHN0YXRlQ2hhbmdlVG9nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChyZXMpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIm9wZW5CbHVldG9vdGhBZGFwdGVyIGZhaWxcIiwgcmVzKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRPRE86IOaPkOekuueUqOaIt+W8gOWQr+iTneeJmeWPiuWumuS9jVxuICAgICAgICAgKi9cbiAgICAgICAgd3guZ2V0U3lzdGVtSW5mbyh7XG4gICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJpb3NcIikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwi6JOd54mZ5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Yqf6IO95piv5ZCm5byA5ZCvXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgd3guZ2V0V2lmaUxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0V2lmaUxpc3Qgc3VjY1wiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldFdpZmlMaXN0IGZhaWxcIiwgZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzLnBsYXRmb3JtID09PSBcImFuZHJvaWRcIikge1xuICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwi6JOd54mZ5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Y+K5a6a5L2N5Yqf6IO95piv5ZCm5byA5ZCvXCIsXG4gICAgICAgICAgICAgICAgc2hvd0NhbmNlbDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXMuZXJyQ29kZSAhPT0gMTAwMDEpIHJldHVybjtcblxuICAgICAgICB3eC5vbkJsdWV0b290aEFkYXB0ZXJTdGF0ZUNoYW5nZSgocmVzKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJhZGFwdGVyU3RhdGUgY2hhbmdlZCwgbm93IGlzXCIsIHJlcyk7XG4gICAgICAgICAgaWYgKCFyZXMuYXZhaWxhYmxlIHx8ICFyZXMuZGlzY292ZXJpbmcpIHtcbiAgICAgICAgICAgIHN0YXRlQ2hhbmdlVG9nID0gZmFsc2U7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRPRE86IOaPkOekuueUqOaIt+W8gOWQr+iTneeJmeWPiuWumuS9jVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgICAgICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChyZXMucGxhdGZvcm0gPT09IFwiaW9zXCIpIHtcbiAgICAgICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwi6JOd54mZ5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Yqf6IO95piv5ZCm5byA5ZCvXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgd3guZ2V0V2lmaUxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRXaWZpTGlzdCBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhaWw6IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0V2lmaUxpc3QgZmFpbFwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIpIHtcbiAgICAgICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwi6JOd54mZ5Yid5aeL5YyW5aSx6LSl77yM6K+35qOA5p+l57O757uf6JOd54mZ5Y+K5a6a5L2N5Yqf6IO95piv5ZCm5byA5ZCvXCIsXG4gICAgICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghc3RhdGVDaGFuZ2VUb2cpIHtcbiAgICAgICAgICAgIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsb29wKCk7XG4gICAgICAgICAgICBzdGF0ZUNoYW5nZVRvZyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIG9uTG9hZCgpIHtcbiAgICB0aGlzLmJpbmRWaWV3VGFwKCk7XG4gIH0sXG4gIC8vIG9uU2hvdygpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImluZGV4IHNob3dcIik7XG4gIC8vIH0sXG4gIC8vIGdldFVzZXJJbmZvKGU6IGFueSkge1xuICAvLyAgIGNvbnNvbGUubG9nKGUpO1xuICAvLyAgIGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvID0gZS5kZXRhaWwudXNlckluZm87XG4gIC8vICAgdGhpcy5zZXREYXRhKHtcbiAgLy8gICAgIHVzZXJJbmZvOiBlLmRldGFpbC51c2VySW5mbyxcbiAgLy8gICAgIGhhc1VzZXJJbmZvOiB0cnVlLFxuICAvLyAgIH0pO1xuICAvLyB9LFxuICAvLyBvbkhpZGUoKSB7XG4gIC8vICAgY29uc29sZS5sb2coXCJpbmRleCBoaWRlXCIpO1xuICAvLyB9LFxuICAvLyBvblVubG9hZCgpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImluZGV4IHVubG9hZFwiKTtcbiAgLy8gfSxcbn0pO1xuIl19