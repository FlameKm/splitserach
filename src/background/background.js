const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', pattern: 'google.com', trigger: true },
  { name: 'Google.hk', url: 'https://www.google.com.hk/search?q=', pattern: 'google.com.hk', trigger: true },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', pattern: 'baidu.com', trigger: true },
  { name: '必应', url: 'https://cn.bing.com/search?q=', pattern: 'bing.com', trigger: true },
  { name: '360', url: 'https://www.so.com/s?q=', pattern: 'so.com', trigger: false },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', pattern: 'sogou.com', trigger: false },
  { name: '搜狗翻译', url: 'https://fanyi.sogou.com/?keyword=', pattern: 'fanyi.sogou.com', trigger: false },
  { name: '知乎', url: 'https://www.zhihu.com/search?q=', pattern: 'zhihu.com', trigger: false },
];


// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ searchEngines: defaultEngines, autoOpen: true, engineIndex: 3 });
  console.log('Split Search extension installed');
});
