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

const createSelect = (engines, initialIndex) =>
  engines
    .map((e, i) => createOption(i)(e))
    .reduce((select, opt) => (select.appendChild(opt), select),
      Object.assign(createElement('select')({ id: 'split-search-select' }), { value: initialIndex }));

const createCloseButton = (onClick) =>
  Object.assign(createElement('button')({ textContent: '✕' }), {
    onclick: onClick
  });

const createHeader = (engines, initialIndex, onClose) =>
  [createSelect(engines, initialIndex), createCloseButton(onClose)]
    .reduce((header, child) => (header.appendChild(child), header),
      createElement('div')({ className: 'split-search-header' }));

const createIframe = (url) =>
  createElement('iframe')({
    className: 'split-search-frame',
    sandbox: 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation',
    src: url
  });

const createPanel = (engine, query) => {
  const iframe = createIframe(buildSearchUrl(query)(engine));
  const header = createHeader([engine], 0, closeSplitPanel);

  header.querySelector('select').onchange = (e) =>
    iframe.src = buildSearchUrl(query)([engine][parseInt(e.target.value)]);

  return [header, iframe]
    .reduce((panel, child) => (panel.appendChild(child), panel),
      createElement('div')({ className: 'split-search-panel', id: 'split-search-panel' }));
};

const createWrapper = (engine, query) => {
  const original = Array.from(document.body.childNodes)
    .reduce((div, child) => (div.appendChild(child), div),
      createElement('div')({ className: 'split-search-original' }));

  return [original, createPanel(engine, query)]
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

const mountSplitPanel = (engine, query) =>
(
  document.body.appendChild(createWrapper(engine, query)),
  injectStyles(),
  chrome.storage.sync.set({ splitActive: true })
);

const restoreOriginalContent = () => {
  const wrapper = document.querySelector('.split-search-container');
  wrapper && (
    Array.from(wrapper.querySelector('.split-search-original').childNodes)
      .forEach(child => document.body.appendChild(child)),
    wrapper.remove()
  );
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

  mountSplitPanel(splitEngine, query);
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
