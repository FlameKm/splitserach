// 检查 URL 是否匹配已启用的搜索引擎
async function isEnabledSearchPage(url) {
  const result = await chrome.storage.sync.get(['searchEngines']);
  console.log('Split Search: 检查搜索引擎配置', result);
  console.log('Split Search: 当前 URL', url);
  const engines = result.searchEngines || [];

  const matched = engines.find(engine => {
    if (!engine.enabled) return false;
    const baseUrl = new URL(engine.url).origin + new URL(engine.url).pathname;
    const isMatch = url.startsWith(baseUrl);
    console.log(`Split Search: 检查 ${engine.name} (${baseUrl}): ${isMatch}`);
    return isMatch;
  });

  console.log('Split Search: 匹配结果', matched);
  return !!matched;
}

// 监听标签页更新，自动打开 Side Panel
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const result = await chrome.storage.sync.get(['autoOpen']);
  if (!result.autoOpen) return;

  if (await isEnabledSearchPage(tab.url)) {
    chrome.sidePanel.open({ tabId });
  }
});

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Split Search extension installed');
});