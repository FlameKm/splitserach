// 默认搜索引擎列表
const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=', enabled: true },
  { name: '百度', url: 'https://www.baidu.com/s?wd=', enabled: true },
  { name: '必应', url: 'https://cn.bing.com/search?q=', enabled: true },
  { name: '360', url: 'https://www.so.com/s?q=', enabled: true },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', enabled: true },
  { name: '翻译', url: 'https://fanyi.sogou.com/?keyword=', enabled: false },
  { name: '知乎', url: 'https://www.zhihu.com/search?q=', enabled: false }
];

// 加载搜索引擎配置
function loadEngines() {
  const container = document.getElementById('enginesContainer');
  container.innerHTML = '';

  chrome.storage.sync.get(['searchEngines', 'defaultEngineIndex'], function (result) {
    const engines = result.searchEngines || defaultEngines;
    const defaultEngineIndex = result.defaultEngineIndex || 0;

    // 填充默认引擎下拉框
    const select = document.getElementById('defaultEngine');
    select.innerHTML = '';
    engines.forEach((e, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = e.name;
      select.appendChild(opt);
    });
    select.value = defaultEngineIndex;

    // 填充引擎列表
    engines.forEach((engine, index) => {
      const div = document.createElement('div');
      div.className = 'engine-item';
      div.innerHTML = `
        <input type="checkbox" class="engine-checkbox" id="enabled-${index}" ${engine.enabled ? 'checked' : ''}>
        <input type="text" id="name-${index}" value="${engine.name}" placeholder="搜索引擎名称">
        <input type="text" id="url-${index}" value="${engine.url}" placeholder="搜索引擎URL">
        <button class="btn-remove">删除</button>
      `;
      const removeBtn = div.querySelector('.btn-remove');
      removeBtn.addEventListener('click', () => {
        div.remove();
      });
      container.appendChild(div);
    });
  });
}

// 更新默认引擎下拉框
function updateDefaultEngineSelect() {
  const select = document.getElementById('defaultEngine');
  const container = document.getElementById('enginesContainer');
  const currentValue = select.value;

  select.innerHTML = '';
  const items = container.querySelectorAll('.engine-item');
  items.forEach((item, i) => {
    const name = item.querySelector('input[type="text"]')?.value || '未命名';
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = name;
    select.appendChild(opt);
  });

  select.value = currentValue < select.options.length ? currentValue : select.options.length - 1;
}

// 添加新的搜索引擎
function addEngine() {
  const container = document.getElementById('enginesContainer');
  const div = document.createElement('div');
  div.className = 'engine-item';
  const index = container.children.length;
  div.innerHTML = `
    <input type="checkbox" class="engine-checkbox" id="enabled-${index}" checked>
    <input type="text" id="name-${index}" placeholder="搜索引擎名称">
    <input type="text" id="url-${index}" placeholder="搜索引擎URL" value="https://www.example.com/search?q=">
    <button class="btn-remove">删除</button>
  `;
  const removeBtn = div.querySelector('.btn-remove');
  removeBtn.addEventListener('click', () => {
    div.remove();
    updateDefaultEngineSelect();
  });
  container.appendChild(div);
  updateDefaultEngineSelect();
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
  const defaultEngineIndex = parseInt(document.getElementById('defaultEngine').value);
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

  chrome.storage.sync.set({ autoOpen, defaultEngineIndex, searchEngines: engines }, () => {
    alert('设置已保存！');
    loadAutoOpen();
    loadEngines();
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  loadAutoOpen();
  loadEngines();
});
document.getElementById('addEngine').addEventListener('click', addEngine);
document.getElementById('saveSettings').addEventListener('click', saveSettings);