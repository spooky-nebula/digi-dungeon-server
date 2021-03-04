let socket = io.connect();

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
			let message = e.target;
			sendMessage(message.value);
			message.value = '';
		}
	});

let sendMessage = function (message) {
	socket.emit('message', { type: 'text', content: message });
};

// ROLLS

let messageRollElement = document.querySelector(
	'.message-box .message-box-roll'
);

messageRollElement.addEventListener('mouseup', function (event) {
	let data = {
		diceType: 20,
		diceQuatity: 1,
		modifier: +0,
		player: 'Anon',
	};
	socket.emit('roll-dice', data);
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

socket.on('chat-text', (text) => {
	let messageElement = util.createChatTextMessage(text);
	document.querySelector('.game-log .messages').append(messageElement);
	scrollToBottom();
});

socket.on('chat-image', (imagePath) => {
	let messageElement = util.createChatImageMessage(imagePath);
	document.querySelector('.game-log .messages').append(messageElement);
	scrollToBottom();
});

socket.on('chat-log', (text) => {
	let messageElement = util.createLogMessage(text);
	document.querySelector('.game-log .messages').append(messageElement);
	scrollToBottom();
});

socket.on('roll-dice-result', (data) => {
	/*
	The data that comes back on this one must be according to the ancient
	diagrams, alike so:

	data = {
		diceType: 20,
		diceQuantity: 1,
		modifier: +0,
		player: "Anon",
		result: [1]
	}

	The result is an array because there can be multiple dice rolled.
	*/
	// Clone the dice roll template
	// Modify the details
	// Add to the game log
});

let scrollToBottom = function () {
	let messagesDiv = document.querySelector('.chat .messages');
	// Scroll to the bottom
	messagesDiv.scrollTop = messagesDiv.scrollHeight;
};
