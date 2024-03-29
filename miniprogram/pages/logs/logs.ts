// logs.ts
// const util = require('../../utils/util.js')
import { formatTime } from '../../utils/util'

Page({
  data: {
    logs: [],
  },
  onLoad() {
    console.log('logs load')
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map((log: string) => {
        return formatTime(new Date(log))
      }),
    })
  },
  onShow() {
    console.log('logs show')
  },
  onHide() {
    console.log('logs hide')
  },
  onUnload() {
    console.log('logs unload')
  }
})
