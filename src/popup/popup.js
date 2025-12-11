const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', pattern: 'google.com' },
  { name: 'Google.hk', url: 'https://www.google.com.hk/search?q=', pattern: 'google.com.hk' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', pattern: 'baidu.com' },
  { name: '必应', url: 'https://cn.bing.com/search?q=', pattern: 'bing.com' },
  { name: '360', url: 'https://www.so.com/s?q=', pattern: 'so.com' },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', pattern: 'sogou.com' },
  { name: '翻译', url: 'https://fanyi.sogou.com/?keyword=', pattern: 'fanyi.sogou.com' }
];

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.sync.get(['autoOpen', 'defaultEngineIndex', 'searchEngines']);

  document.getElementById('autoOpen').checked = result.autoOpen || false;

  const engines = result.searchEngines || defaultEngines;
  const select = document.getElementById('defaultEngine');
  select.innerHTML = '';
  engines.forEach((e, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
  select.value = result.defaultEngineIndex || 0;
}

// 保存设置
async function saveSettings() {
  const autoOpen = document.getElementById('autoOpen').checked;
  const defaultEngineIndex = parseInt(document.getElementById('defaultEngine').value);
  await chrome.storage.sync.set({ autoOpen, defaultEngineIndex });
}

// 自动打开开关
document.getElementById('autoOpen').addEventListener('change', saveSettings);

// 默认搜索引擎
document.getElementById('defaultEngine').addEventListener('change', saveSettings);

// 更多设置
document.getElementById('moreSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

loadSettings();