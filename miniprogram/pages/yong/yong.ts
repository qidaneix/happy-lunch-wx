// logs.ts
// const util = require('../../utils/util.js')
import { formatTime } from '../../utils/util'

Page({
  data: {
    logs: [],
  },
  onLoad() {
    console.log('yong load')
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map((log: string) => {
        return formatTime(new Date(log))
      }),
    })
  },
  onShow() {
    console.log('yong show')
  },
  onHide() {
    console.log('yong hide')
  },
  onUnload() {
    console.log('yong unload')

  }
})
