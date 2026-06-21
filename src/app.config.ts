export default defineAppConfig({
  pages: [
    'pages/setup/index',
    'pages/transit/index',
    'pages/summary/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0EA5E9',
    navigationBarTitleText: '冷链温度监控',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/setup/index',
        text: '出车设置'
      },
      {
        pagePath: 'pages/transit/index',
        text: '途中提醒'
      },
      {
        pagePath: 'pages/summary/index',
        text: '到货摘要'
      }
    ]
  }
})
