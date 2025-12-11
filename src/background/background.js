// 搜索引擎 URL 匹配模式
const searchPatterns = [
  /^https:\/\/www\.google\.com\/search/,
  /^https:\/\/www\.baidu\.com\/s/,
  /^https:\/\/www\.bing\.com\/search/,
  /^https:\/\/duckduckgo\.com\/\?q=/
];

// 检查是否是搜索结果页
function isSearchPage(url) {
  return searchPatterns.some(pattern => pattern.test(url));
}

// 监听标签页更新，自动打开 Side Panel
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const result = await chrome.storage.sync.get(['autoOpen']);
  if (!result.autoOpen) return;

  if (isSearchPage(tab.url)) {
    chrome.sidePanel.open({ tabId });
  }
});

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Split Search extension installed');
});