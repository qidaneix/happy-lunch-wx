"use strict";
App({
    globalData: {},
    onLaunch: function () {
        var _this = this;
        var setUUID = function () {
            var uuid = Math.random().toString().slice(2, 15);
            _this.globalData.uuid = uuid;
            wx.setStorageSync("uuid", {
                uuid: uuid,
                time: Date.now(),
            });
        };
        var _a = wx.getStorageSync("uuid"), time = _a.time, uuid = _a.uuid;
        if (!time || !uuid || Date.now() - time > 1000 * 4 * 60 * 60) {
            setUUID();
        }
        else {
            this.globalData.uuid = uuid;
        }
        var userName = wx.getStorageSync("userName");
        if (userName) {
            this.globalData.userName = userName;
        }
        wx.getSetting({
            success: function (res) {
                if (res.authSetting["scope.userInfo"]) {
                    wx.getUserInfo({
                        success: function (res) {
                            _this.globalData.userInfo = res.userInfo;
                            if (_this.userInfoReadyCallback) {
                                _this.userInfoReadyCallback(res);
                            }
                        },
                    });
                }
            },
        });
    },
    onShow: function () {
        var time = wx.getStorageSync("uuid").time;
        var userName = wx.getStorageSync("userName");
        console.log("uuid", wx.getStorageSync("uuid"));
        console.log("userName", userName);
        console.log("timeout", Date.now() - time, Date.now() - time > 1000 * 4 * 60 * 60);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxHQUFHLENBQWE7SUFDZCxVQUFVLEVBQUUsRUFBRTtJQUNkLFFBQVE7UUFBUixpQkEwQ0M7UUF6Q0MsSUFBTSxPQUFPLEdBQUc7WUFDZCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRCxLQUFJLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDNUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hCLElBQUksTUFBQTtnQkFDSixJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTthQUNqQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7UUFFSSxJQUFBLDhCQUEwQyxFQUF4QyxjQUFJLEVBQUUsY0FBa0MsQ0FBQztRQUNqRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBRTVELE9BQU8sRUFBRSxDQUFDO1NBQ1g7YUFBTTtZQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUM3QjtRQUVELElBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsSUFBSSxRQUFRLEVBQUU7WUFDWixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7U0FDckM7UUFHRCxFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ1osT0FBTyxFQUFFLFVBQUMsR0FBRztnQkFDWCxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtvQkFFckMsRUFBRSxDQUFDLFdBQVcsQ0FBQzt3QkFDYixPQUFPLEVBQUUsVUFBQyxHQUFHOzRCQUVYLEtBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7NEJBR3hDLElBQUksS0FBSSxDQUFDLHFCQUFxQixFQUFFO2dDQUM5QixLQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7NkJBQ2pDO3dCQUNILENBQUM7cUJBQ0YsQ0FBQyxDQUFDO2lCQUNKO1lBQ0gsQ0FBQztTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNO1FBQ0ksSUFBQSxxQ0FBSSxDQUErQjtRQUMzQyxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNsQyxPQUFPLENBQUMsR0FBRyxDQUNULFNBQVMsRUFDVCxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxFQUNqQixJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FDdkMsQ0FBQztJQUNKLENBQUM7Q0FDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBhcHAudHNcbkFwcDxJQXBwT3B0aW9uPih7XG4gIGdsb2JhbERhdGE6IHt9LFxuICBvbkxhdW5jaCgpIHtcbiAgICBjb25zdCBzZXRVVUlEID0gKCkgPT4ge1xuICAgICAgY29uc3QgdXVpZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5zbGljZSgyLCAxNSk7XG4gICAgICB0aGlzLmdsb2JhbERhdGEudXVpZCA9IHV1aWQ7XG4gICAgICB3eC5zZXRTdG9yYWdlU3luYyhcInV1aWRcIiwge1xuICAgICAgICB1dWlkLFxuICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGNvbnN0IHsgdGltZSwgdXVpZCB9ID0gd3guZ2V0U3RvcmFnZVN5bmMoXCJ1dWlkXCIpO1xuICAgIGlmICghdGltZSB8fCAhdXVpZCB8fCBEYXRlLm5vdygpIC0gdGltZSA+IDEwMDAgKiA0ICogNjAgKiA2MCkge1xuICAgICAgLy8g5LiN5a2Y5Zyo5oiW6ICF6LaF6L+HNOWwj+aXtu+8jOmHjee9rlxuICAgICAgc2V0VVVJRCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdsb2JhbERhdGEudXVpZCA9IHV1aWQ7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlck5hbWUgPSB3eC5nZXRTdG9yYWdlU3luYyhcInVzZXJOYW1lXCIpO1xuICAgIGlmICh1c2VyTmFtZSkge1xuICAgICAgdGhpcy5nbG9iYWxEYXRhLnVzZXJOYW1lID0gdXNlck5hbWU7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W55So5oi35L+h5oGvXG4gICAgd3guZ2V0U2V0dGluZyh7XG4gICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuYXV0aFNldHRpbmdbXCJzY29wZS51c2VySW5mb1wiXSkge1xuICAgICAgICAgIC8vIOW3sue7j+aOiOadg++8jOWPr+S7peebtOaOpeiwg+eUqCBnZXRVc2VySW5mbyDojrflj5blpLTlg4/mmLXnp7DvvIzkuI3kvJrlvLnmoYZcbiAgICAgICAgICB3eC5nZXRVc2VySW5mbyh7XG4gICAgICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgICAgIC8vIOWPr+S7peWwhiByZXMg5Y+R6YCB57uZ5ZCO5Y+w6Kej56CB5Ye6IHVuaW9uSWRcbiAgICAgICAgICAgICAgdGhpcy5nbG9iYWxEYXRhLnVzZXJJbmZvID0gcmVzLnVzZXJJbmZvO1xuICAgICAgICAgICAgICAvLyDnlLHkuo4gZ2V0VXNlckluZm8g5piv572R57uc6K+35rGC77yM5Y+v6IO95Lya5ZyoIFBhZ2Uub25Mb2FkIOS5i+WQjuaJjei/lOWbnlxuICAgICAgICAgICAgICAvLyDmiYDku6XmraTlpITliqDlhaUgY2FsbGJhY2sg5Lul6Ziy5q2i6L+Z56eN5oOF5Ya1XG4gICAgICAgICAgICAgIGlmICh0aGlzLnVzZXJJbmZvUmVhZHlDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckluZm9SZWFkeUNhbGxiYWNrKHJlcyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG4gIH0sXG4gIG9uU2hvdygpIHtcbiAgICBjb25zdCB7IHRpbWUgfSA9IHd4LmdldFN0b3JhZ2VTeW5jKFwidXVpZFwiKTtcbiAgICBjb25zdCB1c2VyTmFtZSA9IHd4LmdldFN0b3JhZ2VTeW5jKFwidXNlck5hbWVcIik7XG4gICAgY29uc29sZS5sb2coXCJ1dWlkXCIsIHd4LmdldFN0b3JhZ2VTeW5jKFwidXVpZFwiKSk7XG4gICAgY29uc29sZS5sb2coXCJ1c2VyTmFtZVwiLCB1c2VyTmFtZSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBcInRpbWVvdXRcIixcbiAgICAgIERhdGUubm93KCkgLSB0aW1lLFxuICAgICAgRGF0ZS5ub3coKSAtIHRpbWUgPiAxMDAwICogNCAqIDYwICogNjBcbiAgICApO1xuICB9LFxufSk7XG4iXX0=