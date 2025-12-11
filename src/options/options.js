// 默认搜索引擎列表
const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', enabled: true },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', enabled: true },
  { name: '必应', url: 'https://www.bing.com/search?q=', enabled: true }
];

// 加载搜索引擎配置
function loadEngines() {
  const container = document.getElementById('enginesContainer');
  container.innerHTML = '';

  chrome.storage.sync.get(['searchEngines'], function(result) {
    const engines = result.searchEngines || defaultEngines;

    engines.forEach((engine, index) => {
      const div = document.createElement('div');
      div.className = 'engine-item';
      div.innerHTML = `
        <input type="checkbox" id="enabled-${index}" ${engine.enabled ? 'checked' : ''}>
        <input type="text" id="name-${index}" value="${engine.name}" placeholder="搜索引擎名称">
        <input type="text" id="url-${index}" value="${engine.url}" placeholder="搜索引擎URL">
        <button onclick="removeEngine(${index})">删除</button>
      `;
      container.appendChild(div);
    });
  });
}

// 添加新的搜索引擎
function addEngine() {
  const container = document.getElementById('enginesContainer');
  const div = document.createElement('div');
  div.className = 'engine-item';
  const index = container.children.length;
  div.innerHTML = `
    <input type="checkbox" id="enabled-${index}" checked>
    <input type="text" id="name-${index}" placeholder="搜索引擎名称">
    <input type="text" id="url-${index}" placeholder="搜索引擎URL" value="https://www.example.com/search?q=">
    <button onclick="removeEngine(${index})">删除</button>
  `;
  container.appendChild(div);
}

// 删除搜索引擎
function removeEngine(index) {
  const engineDiv = document.querySelector(`#enabled-${index}`).closest('.engine-item');
  if (engineDiv) {
    engineDiv.remove();
  }
}

// 加载自动打开设置
function loadAutoOpen() {
  chrome.storage.sync.get(['autoOpen'], (result) => {
    document.getElementById('autoOpen').checked = result.autoOpen || false;
  });
}

// 保存设置（包含自动打开）
function saveSettings() {
  const autoOpen = document.getElementById('autoOpen').checked;
  const container = document.getElementById('enginesContainer');
  const engines = [];

  const items = container.querySelectorAll('.engine-item');
  items.forEach((item, i) => {
    const enabled = item.querySelector(`#enabled-${i}`)?.checked;
    const name = item.querySelector(`#name-${i}`)?.value;
    const url = item.querySelector(`#url-${i}`)?.value;
    if (name && url) {
      engines.push({ name, url, enabled });
    }
  });

  chrome.storage.sync.set({ autoOpen, searchEngines: engines }, () => {
    alert('设置已保存！');
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  loadAutoOpen();
  loadEngines();
});
document.getElementById('addEngine').addEventListener('click', addEngine);
document.getElementById('saveSettings').addEventListener('click', saveSettings);