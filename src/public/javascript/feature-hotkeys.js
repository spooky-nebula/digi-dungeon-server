// This should be the last one to be loaded

let hotKeyListener = {};

// HotKey array, easily accessible for the settings
hotKeyListener.hotKeys = [];
// To easily add a hotkey to the array
hotKeyListener.addHotKey = (hotKey) => {
  hotKeyListener.hotKeys.push(hotKey);
};

// This is for creating a HotKey
/**
 * Creates a HotKey to add to the HotKeyListener
 * @param {string} key key to trigger the HotKey
 * @param {function} fn function that will be triggered
 */
let HotKey = function (key, fn) {
  this.key = key;
  this.fn = fn;
};

// Check if each tool has a hotkey
toolset.tools.forEach((tool, index) => {
  if (tool.hotKey) {
    /* addChatLogMessage(
      tool.name + '(' + index + ') added on: "' + tool.hotKey + '"'
    ); */
    let hk = new HotKey(tool.hotKey, () => {
      toolset.switchTo(index);
    });
    hotKeyListener.addHotKey(hk);
  }
});

// Add the default hotkeys
hotKeyListener.addHotKey(
  new HotKey('r', () => {
    toggleRollMenu();
  })
);

// Listen for keypresses and check with each HotKey
window.addEventListener('keydown', (event) => {
  // Check if the keypress was on an input box (like the chat)
  if (event.target.nodeName == 'INPUT') {
    // Abort the event
    return true;
  }
  // Get the key, this will be "r" or "B"
  let keypress = event.key;

  hotKeyListener.hotKeys.forEach((hotKey, index) => {
    if (hotKey.key == keypress) {
      hotKey.fn();
    }
  });

  return true;
});
