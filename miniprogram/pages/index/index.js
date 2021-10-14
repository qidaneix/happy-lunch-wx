"use strict";
var app = getApp();
Page({
    data: {
        list: [],
    },
    bindViewTap: function () {
        var _this = this;
        var loop = function () {
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
                                            name: device.name,
                                            arr: arr.join("-").toUpperCase(),
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
                    wx.getSystemInfo({
                        success: function (res) {
                            if (res.platform === "android" &&
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
        var stateChangeTog = false;
        wx.openBluetoothAdapter({
            success: function (res) {
                console.log("openBluetoothAdapter succ", res);
                wx.showToast({
                    title: "蓝牙初始化成功",
                    icon: "success",
                    duration: 2000,
                });
                loop();
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
                wx.onBluetoothAdapterStateChange(function (res) {
                    console.log("adapterState changed, now is", res);
                    if (!res.available)
                        return;
                    if (!stateChangeTog) {
                        loop();
                        stateChangeTog = true;
                    }
                });
            },
        });
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsSUFBTSxHQUFHLEdBQUcsTUFBTSxFQUFjLENBQUM7QUFFakMsSUFBSSxDQUFDO0lBQ0gsSUFBSSxFQUFFO1FBQ0osSUFBSSxFQUFFLEVBQUU7S0FDVDtJQUVELFdBQVc7UUFBWCxpQkE2SEM7UUE1SEMsSUFBTSxJQUFJLEdBQUc7WUFFWCxFQUFFLENBQUMsOEJBQThCLENBQUM7Z0JBQ2hDLGtCQUFrQixFQUFFLElBQUk7Z0JBRXhCLE9BQU8sRUFBRSxVQUFDLENBQUM7b0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdEQsRUFBRSxDQUFDLHNCQUFzQixDQUFDLFVBQUMsR0FBRzt3QkFDNUIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNOzRCQUV6QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dDQUNyQyxJQUFJO29DQUNGLElBQU0sSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztvQ0FDakQsSUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO29DQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO3dDQUNwQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztxQ0FDaEM7b0NBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FDVCwrQkFBK0IsRUFDL0IsTUFBTSxFQUNOLE1BQU0sQ0FBQyxJQUFJLEVBQ1gsR0FBRyxDQUNKLENBQUM7b0NBQ0YsSUFBTSxJQUFJLEdBQUksS0FB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QztnQ0FDTCxDQUFDOzZCQUNGLENBQUMsQ0FBQzt5QkFDSjs2QkFBTSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFOzRCQUNyQyxFQUFFLENBQUMsU0FBUyxDQUFDO2dDQUNYLE9BQU8sRUFBRSwwQkFBMEI7Z0NBQ25DLFVBQVUsRUFBRSxLQUFLOzZCQUNsQixDQUFDLENBQUM7eUJBQ0o7b0JBQ0gsQ0FBQztpQkFDRixDQUFDLENBQUM7Z0JBSUgsRUFBRSxDQUFDLDZCQUE2QixDQUFDLFVBQUMsR0FBRztvQkFDbkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDakQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTO3dCQUFFLE9BQU87b0JBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUU7d0JBQ25CLElBQUksRUFBRSxDQUFDO3dCQUNQLGNBQWMsR0FBRyxJQUFJLENBQUM7cUJBQ3ZCO2dCQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0ErQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW5kZXgudHNcbi8vIOiOt+WPluW6lOeUqOWunuS+i1xuY29uc3QgYXBwID0gZ2V0QXBwPElBcHBPcHRpb24+KCk7XG5cblBhZ2Uoe1xuICBkYXRhOiB7XG4gICAgbGlzdDogW10sXG4gIH0sXG4gIC8vIOS6i+S7tuWkhOeQhuWHveaVsFxuICBiaW5kVmlld1RhcCgpIHtcbiAgICBjb25zdCBsb29wID0gKCkgPT4ge1xuICAgICAgLy8g5pCc57Si5aSW5Zu06JOd54mZ6K6+5aSHXG4gICAgICB3eC5zdGFydEJsdWV0b290aERldmljZXNEaXNjb3Zlcnkoe1xuICAgICAgICBhbGxvd0R1cGxpY2F0ZXNLZXk6IHRydWUsXG4gICAgICAgIC8vIGludGVydmFsOiAzMDAwLFxuICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwic3RhcnRCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IHN1Y2NcIiwgZSk7XG4gICAgICAgICAgd3gub25CbHVldG9vdGhEZXZpY2VGb3VuZCgocmVzKSA9PiB7XG4gICAgICAgICAgICByZXMuZGV2aWNlcy5mb3JFYWNoKChkZXZpY2UpID0+IHtcbiAgICAgICAgICAgICAgLy8g6L+Z6YeM5Y+v5Lul5YGa5LiA5Lqb6L+H5rukXG4gICAgICAgICAgICAgIGlmIChkZXZpY2UubmFtZS5pbmRleE9mKFwiaGVsbG9cIikgPiAtMSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGV2aWNlLmFkdmVydGlzRGF0YSk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBhcnIgPSBbXTtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhcnIucHVzaCh2aWV3W2ldLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgICAgXCJvbkJsdWV0b290aERldmljZUZvdW5kIGZvdW5kIVwiLFxuICAgICAgICAgICAgICAgICAgICBkZXZpY2UsXG4gICAgICAgICAgICAgICAgICAgIGRldmljZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhcnJcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBsaXN0ID0gKHRoaXMuZGF0YS5saXN0IGFzIGFueSkuY29uY2F0KFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGRldmljZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIGFycjogYXJyLmpvaW4oXCItXCIpLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgIGxpc3QsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDmib7liLDopoHmkJzntKLnmoTorr7lpIflkI7vvIzlj4rml7blgZzmraLmiavmj49cbiAgICAgICAgICAgICAgICB3eC5zdG9wQmx1ZXRvb3RoRGV2aWNlc0Rpc2NvdmVyeSh7XG4gICAgICAgICAgICAgICAgICBzdWNjZXNzOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IHN1Y2NcIiwgZSk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGxvb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgODAwMCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZmFpbDogKGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInN0b3BCbHVldG9vdGhEZXZpY2VzRGlzY292ZXJ5IGZhaWxcIiwgZSk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFpbDogKGU6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdGFydEJsdWV0b290aERldmljZXNEaXNjb3ZlcnkgZmFpbFwiLCBlKTtcbiAgICAgICAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHJlcy5wbGF0Zm9ybSA9PT0gXCJhbmRyb2lkXCIgJiZcbiAgICAgICAgICAgICAgICBlLmVyckNvZGUgPT09IC0xICYmXG4gICAgICAgICAgICAgICAgZS5lcnJubyA9PT0gMTUwOTAwOVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB3eC5zaG93TW9kYWwoe1xuICAgICAgICAgICAgICAgICAgY29udGVudDogXCLok53niZnmkJzntKLlub/mkq3lpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/lrprkvY3lip/og73mmK/lkKblvIDlkK9cIixcbiAgICAgICAgICAgICAgICAgIHNob3dDYW5jZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICBsZXQgc3RhdGVDaGFuZ2VUb2cgPSBmYWxzZTtcbiAgICB3eC5vcGVuQmx1ZXRvb3RoQWRhcHRlcih7XG4gICAgICBzdWNjZXNzKHJlcykge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm9wZW5CbHVldG9vdGhBZGFwdGVyIHN1Y2NcIiwgcmVzKTtcbiAgICAgICAgd3guc2hvd1RvYXN0KHtcbiAgICAgICAgICB0aXRsZTogXCLok53niZnliJ3lp4vljJbmiJDlip9cIixcbiAgICAgICAgICBpY29uOiBcInN1Y2Nlc3NcIixcbiAgICAgICAgICBkdXJhdGlvbjogMjAwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxvb3AoKTtcbiAgICAgIH0sXG4gICAgICBmYWlsKHJlcykge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwib3BlbkJsdWV0b290aEFkYXB0ZXIgZmFpbFwiLCByZXMpO1xuICAgICAgICAvKipcbiAgICAgICAgICogVE9ETzog5o+Q56S655So5oi35byA5ZCv6JOd54mZ5Y+K5a6a5L2NXG4gICAgICAgICAqL1xuICAgICAgICB3eC5nZXRTeXN0ZW1JbmZvKHtcbiAgICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzLnBsYXRmb3JtID09PSBcImlvc1wiKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDogXCLok53niZnliJ3lp4vljJblpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlip/og73mmK/lkKblvIDlkK9cIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICB3eC5nZXRXaWZpTGlzdCh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IChlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXRXaWZpTGlzdCBzdWNjXCIsIGUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmYWlsOiAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0V2lmaUxpc3QgZmFpbFwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXMucGxhdGZvcm0gPT09IFwiYW5kcm9pZFwiKSB7XG4gICAgICAgICAgICAgIHd4LnNob3dNb2RhbCh7XG4gICAgICAgICAgICAgICAgY29udGVudDogXCLok53niZnliJ3lp4vljJblpLHotKXvvIzor7fmo4Dmn6Xns7vnu5/ok53niZnlj4rlrprkvY3lip/og73mmK/lkKblvIDlkK9cIixcbiAgICAgICAgICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gaWYgKHJlcy5lcnJDb2RlICE9PSAxMDAwMSkgcmV0dXJuO1xuXG4gICAgICAgIHd4Lm9uQmx1ZXRvb3RoQWRhcHRlclN0YXRlQ2hhbmdlKChyZXMpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImFkYXB0ZXJTdGF0ZSBjaGFuZ2VkLCBub3cgaXNcIiwgcmVzKTtcbiAgICAgICAgICBpZiAoIXJlcy5hdmFpbGFibGUpIHJldHVybjtcbiAgICAgICAgICBpZiAoIXN0YXRlQ2hhbmdlVG9nKSB7XG4gICAgICAgICAgICBsb29wKCk7XG4gICAgICAgICAgICBzdGF0ZUNoYW5nZVRvZyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIC8vIG9uTG9hZCgpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImluZGV4IGxvYWRcIik7XG4gIC8vICAgaWYgKGFwcC5nbG9iYWxEYXRhLnVzZXJJbmZvKSB7XG4gIC8vICAgICB0aGlzLnNldERhdGEoe1xuICAvLyAgICAgICB1c2VySW5mbzogYXBwLmdsb2JhbERhdGEudXNlckluZm8sXG4gIC8vICAgICAgIGhhc1VzZXJJbmZvOiB0cnVlLFxuICAvLyAgICAgfSk7XG4gIC8vICAgfSBlbHNlIGlmICh0aGlzLmRhdGEuY2FuSVVzZSkge1xuICAvLyAgICAgLy8g55Sx5LqOIGdldFVzZXJJbmZvIOaYr+e9kee7nOivt+axgu+8jOWPr+iDveS8muWcqCBQYWdlLm9uTG9hZCDkuYvlkI7miY3ov5Tlm55cbiAgLy8gICAgIC8vIOaJgOS7peatpOWkhOWKoOWFpSBjYWxsYmFjayDku6XpmLLmraLov5nnp43mg4XlhrVcbiAgLy8gICAgIGFwcC51c2VySW5mb1JlYWR5Q2FsbGJhY2sgPSAocmVzKSA9PiB7XG4gIC8vICAgICAgIHRoaXMuc2V0RGF0YSh7XG4gIC8vICAgICAgICAgdXNlckluZm86IHJlcy51c2VySW5mbyxcbiAgLy8gICAgICAgICBoYXNVc2VySW5mbzogdHJ1ZSxcbiAgLy8gICAgICAgfSk7XG4gIC8vICAgICB9O1xuICAvLyAgIH0gZWxzZSB7XG4gIC8vICAgICAvLyDlnKjmsqHmnIkgb3Blbi10eXBlPWdldFVzZXJJbmZvIOeJiOacrOeahOWFvOWuueWkhOeQhlxuICAvLyAgICAgd3guZ2V0VXNlckluZm8oe1xuICAvLyAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gIC8vICAgICAgICAgYXBwLmdsb2JhbERhdGEudXNlckluZm8gPSByZXMudXNlckluZm87XG4gIC8vICAgICAgICAgdGhpcy5zZXREYXRhKHtcbiAgLy8gICAgICAgICAgIHVzZXJJbmZvOiByZXMudXNlckluZm8sXG4gIC8vICAgICAgICAgICBoYXNVc2VySW5mbzogdHJ1ZSxcbiAgLy8gICAgICAgICB9KTtcbiAgLy8gICAgICAgfSxcbiAgLy8gICAgIH0pO1xuICAvLyAgIH1cbiAgLy8gfSxcbiAgLy8gb25TaG93KCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiaW5kZXggc2hvd1wiKTtcbiAgLy8gfSxcbiAgLy8gZ2V0VXNlckluZm8oZTogYW55KSB7XG4gIC8vICAgY29uc29sZS5sb2coZSk7XG4gIC8vICAgYXBwLmdsb2JhbERhdGEudXNlckluZm8gPSBlLmRldGFpbC51c2VySW5mbztcbiAgLy8gICB0aGlzLnNldERhdGEoe1xuICAvLyAgICAgdXNlckluZm86IGUuZGV0YWlsLnVzZXJJbmZvLFxuICAvLyAgICAgaGFzVXNlckluZm86IHRydWUsXG4gIC8vICAgfSk7XG4gIC8vIH0sXG4gIC8vIG9uSGlkZSgpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhcImluZGV4IGhpZGVcIik7XG4gIC8vIH0sXG4gIC8vIG9uVW5sb2FkKCkge1xuICAvLyAgIGNvbnNvbGUubG9nKFwiaW5kZXggdW5sb2FkXCIpO1xuICAvLyB9LFxufSk7XG4iXX0=