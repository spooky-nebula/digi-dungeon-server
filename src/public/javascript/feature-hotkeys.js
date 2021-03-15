// This should be the last one to be loaded

let hotKeyListener = {};

// HotKey array, easily accessible for the settings
hotKeyListener.hotKeys = [];
// To easily add a hotkey to the array
hotKeyListener.addHotKey = (hotKey) => {
  hotKeyListener.hotKeys.push(hotKey);
};
//
hotKeyListener.lastKeys = [];
//
hotKeyListener.sequenceKey = (key) => {
  hotKeyListener.lastKeys.unshift(key);
  if (hotKeyListener.lastKeys.length > 5) {
    hotKeyListener.lastKeys.pop();
  }
};
// Modifier
hotKeyListener.modifier = 'none';

// This is for creating a HotKey
/**
 * Creates a HotKey to add to the HotKeyListener
 * @param {string} key key to trigger the HotKey
 * @param {function} fn function that will be triggered
 */
let HotKey = function (key, fn) {
  this.type = 'simple';
  this.key = key;
  this.fn = fn;
};

/**
 * Creates a Combination HotKey to add to the HotKeyListener
 * @param {[string]} keys key sequence to trigger the HotKey
 * @param {function} fn function that will be triggered
 */
let CombiHotKey = function (keys, fn) {
  this.type = 'combination';
  this.keys = keys;
  this.fn = fn;
};

/**
 * Creates a Modifier HotKey to add to the HotKeyListener
 * @param {string} keys key sequence to trigger the HotKey
 * @param {function} fn function that will be triggered
 */
let ModHotKey = function (key, mod, fn) {
  this.type = 'modifier';
  this.key = key;
  this.mod = mod;
  this.fn = fn;
};

// Check if each tool has a hotkey
toolset.tools.forEach((tool, index) => {
  if (tool.hotKey == undefined || typeof tool.hotKey != 'object') {
    return;
  }
  tool.hotKey.forEach((key, key_index) => {
    switch (key.type) {
      case 'switch':
        let hk = new HotKey(key.key, () => {
          toolset.switchTo(index);
        });
        hotKeyListener.addHotKey(hk);
        break;

      case 'combination':
        hotKeyListener.addHotKey(
          new CombiHotKey(key.keys.reverse(), () => {
            toolset.tools[index].hotKey[key_index].fun();
          })
        );
        break;

      case 'modifier':
        hotKeyListener.addHotKey(
          new ModHotKey(key.key, key.mod, () => {
            toolset.tools[index].hotKey[key_index].fun();
          })
        );
        break;

      default:
        break;
    }
  });
});

// Add the default hotkeys
hotKeyListener.addHotKey(
  new HotKey('d', () => {
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

  // Check if it's a modifier
  if (keypress == 'Control' || keypress == 'Shift') {
    hotKeyListener.modifier = keypress;
    return;
  }

  // Add the keypress to the sequencer
  hotKeyListener.sequenceKey(keypress);

  hotKeyListener.hotKeys.forEach((hotKey, index) => {
    switch (hotKey.type) {
      case 'simple':
        if (hotKey.key == keypress) {
          hotKey.fn();
        }
        break;

      // TODO: FIX DOESN'T RECOGNIZE SEQUENCES
      case 'combination':
        // If the hotKey is an Array (sequence)
        if (hotKey.key[0] == keypress) {
          // If the first key matches
          let success = true;
          for (let i = 0; i <= hotKey.key.length - 1; i++) {
            if (hotKey.key[i] != hotKeyListener.lastKeys[i]) {
              success = false;
            }
            if (i == hotKey.key.length) {
              if (success) {
                hotKey.fn();
              }
              return;
            }
          }
        }
        break;

      case 'modifier':
        if (hotKey.key == keypress && hotKey.mod == hotKeyListener.modifier) {
          hotKey.fn();
        }
        break;

      default:
        break;
    }
  });

  return true;
});

window.addEventListener('keyup', (event) => {
  // Check if the keypress was on an input box (like the chat)
  if (event.target.nodeName == 'INPUT') {
    // Abort the event
    return true;
  }
  // Get the key, this will be "r" or "B"
  let keypress = event.key;

  // Check if it's a modifier
  if (keypress == 'Control' || keypress == 'Shift') {
    hotKeyListener.modifier = 'none';
    return;
  }
});
