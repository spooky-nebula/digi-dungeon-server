// CHAT MESSAGES

let messageBoxElement = document.querySelector(
  '.message-box .message-box-send'
);

messageBoxElement.addEventListener('mouseup', function (event) {
  let message = document.querySelector('.message-box-text');
  sendMessage(message.value);
  message.value = '';
});

document
  .querySelector('.message-box .message-box-text')
  .addEventListener('keyup', (e) => {
    if (e.key.toString() === 'Enter') {
      let message = e.target.value;
      sendMessage(message);
      e.target.value = '';
    }
  });

let sendMessage = function (message) {
  message = message.trim();
  if (message == '') {
    return false;
  }
  socket.emit('message', { type: 'text', content: message });
  return true;
};

// ROLLS

let rollMenuOpen = false;
let selectedRollType = 20;

let requestDiceRoll = function (diceType, diceQuantity, modifier) {
  if (diceQuantity < 0) {
    addChatLogMessage('Cannot roll quantities under 0');
    toggleRollMenu(false);
    return;
  }
  let data = {
    diceType: diceType,
    diceQuantity: diceQuantity,
    modifier: modifier,
    player: 'Anon',
  };
  socket.emit('roll-dice', data);
  toggleRollMenu(false);
};

let toggleRollMenu = function (open) {
  // Select the roll menu
  let rollMenu = document.querySelector('.menu-overlay .roll-menu');

  if (open == undefined || open == null) {
    if (rollMenuOpen) {
      // If open is false then close the menu
      rollMenu.classList.add('hidden');
      rollMenuOpen = false;
    } else {
      // If open is true then open the menu
      rollMenu.classList.remove('hidden');
      rollMenuOpen = true;
    }
  } else {
    if (!open) {
      // If open is false then close the menu
      rollMenu.classList.add('hidden');
      rollMenuOpen = false;
    } else {
      // If open is true then open the menu
      rollMenu.classList.remove('hidden');
      rollMenuOpen = true;
    }
  }
};

let messageRollElement = document.querySelector(
  '.message-box .message-box-roll'
);

messageRollElement.addEventListener('mouseup', function (event) {
  handleOpenRollMenuEvent(event);
});

let handleOpenRollMenuEvent = function (mouseUpEvent) {
  // Select the roll menu element
  let rollMenu = document.querySelector('.menu-overlay .roll-menu');
  // Check if it's already open
  if (rollMenuOpen) {
    // Close it
    toggleRollMenu(false);
  } else {
    // Position it
    let x = mouseUpEvent.clientX;
    let y = mouseUpEvent.clientY;
    // Open it (we need it open to modify width and height)
    toggleRollMenu(true);
    // Check if the menu would be outside the window and prevent it
    x = x - rollMenu.clientWidth / 2;
    if (x + rollMenu.clientWidth > window.innerWidth) {
      x = window.innerWidth - rollMenu.clientWidth;
    }
    y = y - rollMenu.clientHeight - 20;
    if (y + rollMenu.clientHeight > window.innerHeight) {
      y = window.innerHeight - rollMenu.clientHeight;
    }
    // Finally attribute the position
    rollMenu.style.left = x + 'px';
    rollMenu.style.top = y + 'px';
  }
};

// This handles selecting a dice in the roll menu
document
  .querySelectorAll('.menu-overlay .roll-menu .roll-type-selector a')
  .forEach((rollElement) => {
    rollElement.addEventListener('mouseup', function (event) {
      // Record what dice was selected
      let diceTypeText = event.target.textContent;
      // This here parses the number part of "d20" selected
      selectedRollType = parseInt(diceTypeText.substring(1));

      // Remove the selected class of the previous selected dice
      document
        .querySelector('.roll-type-selector .selected')
        .classList.remove('selected');

      // Attribute the selected class to the element seleced
      event.target.classList.add('selected');

      // Change the text over the roll button
      document.querySelector(
        '.roll-quantity-descriptor'
      ).textContent = diceTypeText;
    });
  });

// Handles the click on the ROLL button in the Roll Menu
document
  .querySelector('.roll-roll-roll')
  .addEventListener('mouseup', (event) => {
    // Parse the number in the quantity selector
    let diceQuantity = document.querySelector(
      '.menu-overlay .roll-menu .roll-quantity-selector'
    ).value;
    diceQuantity = parseInt(diceQuantity);
    // Parse the number in the modifier selector
    let modifier = document.querySelector(
      '.menu-overlay .roll-menu .roll-modifier-selector'
    ).value;
    modifier = parseInt(modifier);
    // Request a Dice Roll to the server
    requestDiceRoll(selectedRollType, diceQuantity, modifier);
  });

// CONNECTION AND ERROR LOGS

socket.on('connect', () => {
  let messageElement = util.createLogMessage('Connected!');
  document.querySelector('.game-log .messages').append(messageElement);
  scrollToBottom();
});

socket.on('error', (err) => {
  let messageElement = util.createLogMessage('Disconnected from the chat room');
  document.querySelector('.game-log .messages').append(messageElement);
  scrollToBottom();
});

// SOCKET EVENTS RECIEVED

socket.on('chat-text', (data) => {
  addChatTextMessage(data.text, data.username);
});

let addChatTextMessage = function (text, user) {
  let messageElement = util.createChatTextMessage(text, user);
  document.querySelector('.game-log .messages').append(messageElement);
  scrollToBottom();
};

socket.on('chat-image', (imagePath) => {
  let messageElement = util.createChatImageMessage(imagePath);
  document.querySelector('.game-log .messages').append(messageElement);
  scrollToBottom();
});

socket.on('chat-log', (text) => {
  addChatLogMessage(text);
});

let addChatLogMessage = function (text) {
  let messageElement = util.createLogMessage(text);
  document.querySelector('.game-log .messages').append(messageElement);
  scrollToBottom();
};

let createRollDiceResultElement = function (data) {
  /*
	The data that comes back on this one must be according to the ancient
	diagrams, alike so:

	data = {
		diceType: 20,
		diceQuantity: 1,
		modifier: +0,
		player: "Anon",
    rolls: [1]
		result: 1
	}

	The result is an array because there can be multiple dice rolled.
	*/
  let diceElement;
  // Clone the dice roll template
  switch (data.diceQuantity) {
    // 1 dice
    case 1:
      diceElement = document
        .querySelector('#game-log-roll-singular-template .roll-singular')
        .cloneNode(true);
      let numba = data.rolls[0];
      let rollElement = diceElement.querySelector('.roll');
      rollElement.textContent = numba;
      rollElement.classList.add('d' + data.diceType);
      if (numba == data.diceType) {
        rollElement.classList.add('nat-20');
      }
      if (numba == 1) {
        rollElement.classList.add('nat-1');
      }
      break;

    // Anything over 1 dice
    case 2:
    case 3:
    case 4:
      diceElement = document
        .querySelector('#game-log-roll-multiple-template .roll-multiple')
        .cloneNode(true);

      let rolls = diceElement.querySelectorAll('.roll');

      rolls.forEach((roll, index) => {
        let numba = data.rolls[index];
        roll.textContent = numba;
        roll.classList.add('d' + data.diceType);
        if (numba == data.diceType) {
          roll.classList.add('nat-20');
        }
        if (numba == 1) {
          roll.classList.add('nat-1');
        }
      });

      for (let i = rolls.length - 1; i >= data.rolls.length; i--) {
        rolls[i].remove();
      }
      break;

    // Anything over than 4 dice
    default:
      diceElement = document
        .querySelector('#game-log-roll-lot-template .roll-lot')
        .cloneNode(true);
      let rollTotalElement = diceElement.querySelector('.roll-total');
      rollTotalElement.classList.add('d' + data.diceType);

      rollTotalElement.textContent = data.rolls.reduce((a, b) => a + b, 0);

      rollTotalElement.dataset.rolls = JSON.stringify(data.rolls);

      rollTotalElement.addEventListener('mouseenter', (event) => {
        let text = JSON.parse(rollTotalElement.dataset.rolls).reduce(
          (a, b) => a + '+' + b
        );
        let position = {
          x: event.clientX,
          y: event.clientY,
        };
        console.log(event);
        Note(text, position);
      });

      rollTotalElement.addEventListener('mouseleave', (event) => {
        UnNote();
      });
      break;
  }
  // Modify the details
  diceElement.querySelector('.roll-type').textContent =
    data.diceQuantity + 'd' + data.diceType;
  if (data.modifier < 0) {
    diceElement.querySelector('.modifier').classList.add('negative');
  } else {
    diceElement.querySelector('.modifier').classList.add('positive');
  }
  diceElement.querySelector('.modifier').textContent = Math.abs(data.modifier);
  diceElement.querySelector('.result').textContent = data.result;
  // Add to the game log
  document.querySelector('.game-log .messages').append(diceElement);
  // Scroll the game-log
  scrollToBottom();
  return true;
};

socket.on('roll-dice-result', (data) => {
  createRollDiceResultElement(data);
});

let scrollToBottom = function () {
  let messagesDiv = document.querySelector('.game-log .messages');
  // Scroll to the bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// GAMELOG HIDE

let gameLogIsHidden = false;

document
  .querySelector('.game-log-toggle')
  .addEventListener('mouseup', (event) => {
    if (gameLogIsHidden) {
      document.querySelector('.game-log').classList.remove('hidden');
      gameLogIsHidden = false;
    } else {
      document.querySelector('.game-log').classList.add('hidden');
      gameLogIsHidden = true;
    }
  });
