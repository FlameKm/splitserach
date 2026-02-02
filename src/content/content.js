const extractQueryFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ['q', 'wd', 'query']
      .map(key => urlObj.searchParams.get(key))
      .find(Boolean) || '';
  } catch {
    return '';
  }
};

const extractQuery = (url) =>
  ['q', 'wd', 'query']
    .map(key => new URLSearchParams(url).get(key))
    .find(Boolean) || '';

const findEngineByHost = (engines, host) =>
  engines.find(e => host.includes(e.pattern));

const filterByPattern = (pattern) => (engines) =>
  engines.filter(e => e.pattern !== pattern);

const findInitialIndex = (defaultEngine, currentPattern) => (engines) =>
  !defaultEngine || defaultEngine.pattern === currentPattern
    ? 0
    : Math.max(0, engines.findIndex(e => e.pattern === defaultEngine.pattern));

const buildSearchUrl = (query) => (engine) =>
  engine.url + encodeURIComponent(query);

const setProps = (el) => (props) => {
  Object.entries(props)
    .filter(([key]) => key !== 'children')
    .forEach(([key, value]) => {
      key === 'textContent' ? el.textContent = value : el[key] = value;
    });
  return el;
};

const createElement = (tag) => (props = {}) =>
  setProps(document.createElement(tag))(props);

const createOption = (index) => (engine) =>
  createElement('option')({ value: index, textContent: engine.name });

const createSelect = (engines, initialIndex) => {
  const select = createElement('select')({ id: 'split-search-select' });
  engines.forEach((e, i) => {
    select.appendChild(createOption(i)(e));
  });
  select.value = initialIndex;
  return select;
};

const createCloseButton = (onClick) =>
  Object.assign(createElement('button')({ textContent: '✕' }), {
    onclick: onClick
  });

const createHeader = (engines, initialIndex, onClose) =>
  [createSelect(engines, initialIndex), createCloseButton(onClose)]
    .reduce((header, child) => (header.appendChild(child), header),
      createElement('div')({ className: 'split-search-header' }));

const createIframe = (url, className = 'split-search-frame') =>
  createElement('iframe')({
    className,
    sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation',
    src: url
  });

const createPanel = (engines, currentEngineIndex, query) => {
  const iframe = createIframe(buildSearchUrl(query)(engines[currentEngineIndex]));
  const header = createHeader(engines, currentEngineIndex, closeSplitPanel);

  header.querySelector('select').onchange = (e) =>
    iframe.src = buildSearchUrl(query)(engines[parseInt(e.target.value)]);

  return [header, iframe]
    .reduce((panel, child) => (panel.appendChild(child), panel),
      createElement('div')({ className: 'split-search-panel', id: 'split-search-panel' }));
};

const createOriginalFrame = () =>
  createIframe(window.location.href, 'split-search-original-frame');

const createWrapper = (engines, currentEngineIndex, initialQuery) => {
  const originalFrame = createOriginalFrame();
  const panel = createPanel(engines, currentEngineIndex, initialQuery);
  const rightIframe = panel.querySelector('.split-search-frame');
  const select = panel.querySelector('select');
  let currentQuery = initialQuery;
  let lastLeftUrl = window.location.href;

  // 覆盖 select 的 onchange 事件，使用当前搜索词
  select.onchange = (e) => {
    const selectedIndex = parseInt(e.target.value);
    rightIframe.src = buildSearchUrl(currentQuery)(engines[selectedIndex]);
  };

  // 轮询检测左侧 iframe URL 变化
  setInterval(() => {
    try {
      const leftUrl = originalFrame.contentWindow.location.href;
      if (leftUrl !== lastLeftUrl) {
        lastLeftUrl = leftUrl;
        const newQuery = extractQueryFromUrl(leftUrl);
        if (newQuery && newQuery !== currentQuery) {
          currentQuery = newQuery;
          // 更新浏览器 URL（不重新加载）
          history.pushState(null, '', leftUrl);
          // 更新右侧 iframe
          const selectedIndex = parseInt(select.value);
          rightIframe.src = buildSearchUrl(newQuery)(engines[selectedIndex]);
        }
      }
    } catch (e) {
      // 跨域访问会抛出异常，忽略
    }
  }, 100);

  return [originalFrame, panel]
    .reduce((wrapper, child) => (wrapper.appendChild(child), wrapper),
      createElement('div')({ className: 'split-search-container' }));
};

const injectStyles = () =>
  document.head.appendChild(
    createElement('link')({
      rel: 'stylesheet',
      type: 'text/css',
      href: chrome.runtime.getURL('src/content/content.css')
    })
  );

const isSplitActive = () => !!document.querySelector('.split-search-container');

const hideOriginalContent = () => {
  document.body.style.overflow = 'hidden';
  Array.from(document.body.children).forEach(child => {
    if (!child.classList.contains('split-search-container')) {
      child.dataset.splitSearchHidden = child.style.display;
      child.style.display = 'none';
    }
  });
};

const showOriginalContent = () => {
  document.body.style.overflow = '';
  Array.from(document.body.children).forEach(child => {
    if (child.dataset.splitSearchHidden !== undefined) {
      child.style.display = child.dataset.splitSearchHidden;
      delete child.dataset.splitSearchHidden;
    }
  });
};

const mountSplitPanel = (engines, currentEngineIndex, query) => {
  injectStyles();
  document.body.appendChild(createWrapper(engines, currentEngineIndex, query));
  hideOriginalContent();
  chrome.storage.sync.set({ splitActive: true });
};

const restoreOriginalContent = () => {
  const wrapper = document.querySelector('.split-search-container');
  if (wrapper) {
    wrapper.remove();
    showOriginalContent();
  }
};

const closeSplitPanel = () => (
  restoreOriginalContent(),
  chrome.storage.sync.set({ splitActive: false })
);

const openSplitPanel = async () => {
  if (isSplitActive()) return;

  console.log('Split Search: 打开分屏搜索面板');
  const query = extractQuery(window.location.search);
  if (!query) return;

  const { searchEngines = [], engineIndex = 0 } = await chrome.storage.sync.get(['searchEngines', 'engineIndex']);
  const splitEngine = searchEngines[engineIndex];

  if (window.location.hostname.includes(splitEngine.pattern)) {
    console.log('Split Search: 当前搜索引擎即为分屏引擎，取消分屏操作');
    return;
  }

  mountSplitPanel(searchEngines, engineIndex, query);
};

const shouldAutoOpen = async () => {
  const { autoOpen } = await chrome.storage.sync.get(['autoOpen']);
  if (!autoOpen) return false;

  const { searchEngines = [] } = await chrome.storage.sync.get(['searchEngines']);
  const currentEngine = searchEngines.find(engine => window.location.hostname.includes(engine.pattern));
  return currentEngine?.trigger ?? false;
};

const init = async () => {
  console.log('Split Search: content script 已加载');
  if (await shouldAutoOpen()) {
    console.log('Split Search: 自动打开分屏搜索面板');
    openSplitPanel();
  }
};

init();
