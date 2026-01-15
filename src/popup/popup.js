// 加载设置
async function loadSettings() {
  const result = await chrome.storage.sync.get(['autoOpen', 'engineIndex', 'searchEngines']);

  document.getElementById('autoOpen').checked = result.autoOpen || false;

  const engines = result.searchEngines;
  const select = document.getElementById('defaultEngine');
  select.innerHTML = '';
  engines.forEach((e, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = e.name;
    select.appendChild(opt);
  });
  select.value = result.engineIndex || 0;
}

// 保存设置
async function saveSettings() {
  const autoOpen = document.getElementById('autoOpen').checked;
  const engineIndex = parseInt(document.getElementById('defaultEngine').value);
  await chrome.storage.sync.set({ autoOpen, engineIndex });
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