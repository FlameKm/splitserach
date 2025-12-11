const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?igu=1&q=', pattern: 'google.com' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', pattern: 'baidu.com' },
  { name: '必应', url: 'https://www.bing.com/search?q=', pattern: 'bing.com' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', pattern: 'duckduckgo.com' }
];

let engines = [];
let currentQuery = '';
let currentHost = '';

// 从 URL 提取搜索关键词
function extractQuery(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('q') || u.searchParams.get('wd') || '';
  } catch (e) {
    return '';
  }
}

// 获取当前页面的搜索引擎
function getCurrentEnginePattern(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

// 加载搜索引擎并过滤掉当前的
async function loadEngines() {
  const result = await chrome.storage.sync.get(['searchEngines', 'defaultEngineIndex']);
  const allEngines = result.searchEngines || defaultEngines;

  // 过滤掉当前页面的搜索引擎
  engines = allEngines.filter(e => !currentHost.includes(e.pattern));

  const select = document.getElementById('engineSelect');
  select.innerHTML = '';
  engines.forEach((e, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = e.name;
    select.appendChild(opt);
  });

  // 使用默认搜索引擎（如果在过滤后的列表中）
  const defaultIdx = result.defaultEngineIndex || 0;
  if (defaultIdx < engines.length) {
    select.value = defaultIdx;
    return defaultIdx;
  }
  return 0;
}

// 执行搜索
function doSearch(engineIndex = 0) {
  if (!currentQuery || engines.length === 0) {
    document.getElementById('status').textContent = '未检测到搜索关键词';
    return;
  }

  const engine = engines[engineIndex];
  const searchUrl = engine.url + encodeURIComponent(currentQuery);

  document.getElementById('status').style.display = 'none';
  document.getElementById('searchFrame').style.display = 'block';
  document.getElementById('searchFrame').src = searchUrl;
}

// 初始化
async function init() {
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  currentQuery = extractQuery(tab.url);
  currentHost = getCurrentEnginePattern(tab.url);

  if (!currentQuery) {
    document.getElementById('status').textContent = '请在搜索引擎页面使用';
    return;
  }

  const defaultIdx = await loadEngines();
  doSearch(defaultIdx);

  // 切换搜索引擎
  document.getElementById('engineSelect').addEventListener('change', (e) => {
    doSearch(parseInt(e.target.value));
  });
}

init();