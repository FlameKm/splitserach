const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', pattern: 'google.com' },
  { name: 'Google.hk', url: 'https://www.google.com.hk/search?q=', pattern: 'google.com.hk' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', pattern: 'baidu.com' },
  { name: '必应', url: 'https://cn.bing.com/search?q=', pattern: 'bing.com' },
  { name: '360', url: 'https://www.so.com/s?q=', pattern: 'so.com' },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', pattern: 'sogou.com' },
  { name: '翻译', url: 'https://fanyi.sogou.com/?keyword=', pattern: 'fanyi.sogou.com' }
];

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ searchEngines: defaultEngines, autoOpen: true, defaultEngineIndex: 3 });
  console.log('Split Search extension installed');
});
