const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', pattern: 'google.com' },
  { name: 'Google.hk', url: 'https://www.google.com.hk/search?q=', pattern: 'google.com.hk' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', pattern: 'baidu.com' },
  { name: '必应', url: 'https://cn.bing.com/search?q=', pattern: 'bing.com' },
  { name: '360', url: 'https://www.so.com/s?q=', pattern: 'so.com' },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', pattern: 'sogou.com' },
  { name: '翻译', url: 'https://fanyi.sogou.com/?keyword=', pattern: 'fanyi.sogou.com' }
];

let isActive = false;

// 从当前 URL 提取搜索关键词
function extractQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || params.get('wd') || params.get('query') || '';
}

// 获取当前页面所属的搜索引擎
function getCurrentEngine() {
  const host = window.location.hostname;
  return defaultEngines.find(e => host.includes(e.pattern));
}

// 创建分屏面板
function createSplitPanel(engines, query, defaultEngineIndex) {
  // 过滤掉当前搜索引擎
  const currentEngine = getCurrentEngine();
  const otherEngines = engines.filter(e => e.pattern !== currentEngine?.pattern);
  if (otherEngines.length === 0) return;

  // 包装原始内容
  const wrapper = document.createElement('div');
  wrapper.className = 'split-search-container';

  const original = document.createElement('div');
  original.className = 'split-search-original';
  while (document.body.firstChild) {
    original.appendChild(document.body.firstChild);
  }

  // 创建分屏面板
  const panel = document.createElement('div');
  panel.className = 'split-search-panel';
  panel.id = 'split-search-panel';

  // 头部：搜索引擎选择 + 关闭按钮
  const header = document.createElement('div');
  header.className = 'split-search-header';

  const select = document.createElement('select');
  select.id = 'split-search-select';
  otherEngines.forEach((e, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = e.name;
    select.appendChild(opt);
  });

  // 找到默认引擎在 otherEngines 中的索引
  const defaultEngine = engines[defaultEngineIndex];
  let initialIndex = 0;
  if (defaultEngine) {
    const pattern = defaultEngine.pattern || defaultEngine.url;
    const currentPattern = currentEngine?.pattern || currentEngine?.url;
    if (pattern !== currentPattern) {
      const idx = otherEngines.findIndex(e => {
        const ePattern = e.pattern || e.url;
        return ePattern === pattern;
      });
      if (idx !== -1) initialIndex = idx;
    }
  }
  select.value = initialIndex;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', closeSplitPanel);

  header.appendChild(select);
  header.appendChild(closeBtn);

  // iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'split-search-frame';
  iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';
  iframe.src = otherEngines[initialIndex].url + encodeURIComponent(query);

  // 切换搜索引擎
  select.addEventListener('change', () => {
    const idx = parseInt(select.value);
    iframe.src = otherEngines[idx].url + encodeURIComponent(query);
  });

  panel.appendChild(header);
  panel.appendChild(iframe);

  wrapper.appendChild(original);
  wrapper.appendChild(panel);
  document.body.appendChild(wrapper);

  // 注入CSS样式
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('src/content/content.css');
  document.head.appendChild(link);

  isActive = true;
}

// 关闭分屏
function closeSplitPanel() {
  const wrapper = document.querySelector('.split-search-container');
  if (!wrapper) return;

  const original = wrapper.querySelector('.split-search-original');
  while (original.firstChild) {
    document.body.appendChild(original.firstChild);
  }
  wrapper.remove();
  isActive = false;

  chrome.storage.sync.set({ splitActive: false });
}

// 打开分屏
async function openSplitPanel() {
  if (isActive) return;

  const query = extractQuery();
  if (!query) return;

  const result = await chrome.storage.sync.get(['searchEngines', 'defaultEngineIndex']);
  const engines = result.searchEngines || defaultEngines;
  const defaultEngineIndex = result.defaultEngineIndex || 0;
  createSplitPanel(engines, query, defaultEngineIndex);

  chrome.storage.sync.set({ splitActive: true });
}

// 初始化
async function init() {
  const query = extractQuery();
  console.log('Split Search: 当前关键词:', query);

  if (!query) {
    console.log('Split Search: 非搜索结果页，跳过');
    return;
  }

  const result = await chrome.storage.sync.get(['autoOpen', 'searchEngines']);
  console.log('Split Search: autoOpen =', result.autoOpen);

  if (!result.autoOpen) return;

  // 检查当前搜索引擎是否被启用
  const currentEngine = getCurrentEngine();
  const engines = result.searchEngines || defaultEngines;
  const isEnabled = engines.some(e =>
    (e.pattern || e.url).includes(currentEngine?.pattern) && e.enabled
  );

  console.log('Split Search: 当前引擎已启用 =', isEnabled);

  if (isEnabled) {
    openSplitPanel();
  }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((msg) => {
  console.log('Split Search: 收到消息', msg);
  if (msg.action === 'toggleSplit') {
    if (isActive) {
      closeSplitPanel();
    } else {
      openSplitPanel();
    }
  }
});

console.log('Split Search: content script 已加载');
init();
