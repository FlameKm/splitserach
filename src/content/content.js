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

const getCurrentEngine = async () => {
  const { searchEngines = [] } = await chrome.storage.sync.get(['searchEngines']);
  return findEngineByHost(searchEngines, window.location.hostname);
};

const getFilteredEngines = async (engines, engineIndex) => {
  const currentEngine = await getCurrentEngine();
  const filteredEngines = filterByPattern(currentEngine?.pattern)(engines);
  const initialIndex = findInitialIndex(engines[engineIndex], currentEngine?.pattern)(filteredEngines);
  return { filteredEngines, initialIndex };
};

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

const createPanel = (engines, query, initialIndex) => {
  const iframe = createIframe(buildSearchUrl(query)(engines[initialIndex]));
  const header = createHeader(engines, initialIndex, closeSplitPanel);

  header.querySelector('select').onchange = (e) =>
    iframe.src = buildSearchUrl(query)(engines[parseInt(e.target.value)]);

  return [header, iframe]
    .reduce((panel, child) => (panel.appendChild(child), panel),
      createElement('div')({ className: 'split-search-panel', id: 'split-search-panel' }));
};

const createWrapper = (engines, query, initialIndex) => {
  const original = Array.from(document.body.childNodes)
    .reduce((div, child) => (div.appendChild(child), div),
      createElement('div')({ className: 'split-search-original' }));

  return [original, createPanel(engines, query, initialIndex)]
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

const mountSplitPanel = (engines, query, initialIndex) =>
  engines.length > 0 && (
    document.body.appendChild(createWrapper(engines, query, initialIndex)),
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

  const query = extractQuery(window.location.search);
  if (!query) return;

  const { searchEngines = [], engineIndex = 0 } = await chrome.storage.sync.get(['searchEngines', 'engineIndex']);
  const { filteredEngines, initialIndex } = await getFilteredEngines(searchEngines, engineIndex);

  mountSplitPanel(filteredEngines, query, initialIndex);
};

const shouldAutoOpen = async () => {
  const { autoOpen } = await chrome.storage.sync.get(['autoOpen']);
  if (!autoOpen) return false;

  const currentEngine = await getCurrentEngine();
  return currentEngine?.trigger ?? false;
};

const init = async () => {
  console.log('Split Search: content script 已加载');
  if (await shouldAutoOpen()) {
    openSplitPanel();
  }
};

init();
