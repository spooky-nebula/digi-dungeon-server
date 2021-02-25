let socket = io.connect();

socket.on('connect', () => {
  let messageElement = util.createLogMessage('Connected!');
  document.querySelector('.chat .messages').append(messageElement);
  scrollToBottom();
});

socket.on('error', (err) => {
  let messageElement = util.createLogMessage('Disconnected from the chat room');
  document.querySelector('.chat .messages').append(messageElement);
  scrollToBottom();
});

socket.on('chat-text', (text) => {
  let messageElement = util.createChatTextMessage(text);
  document.querySelector('.chat .messages').append(messageElement);
  scrollToBottom();
});

socket.on('chat-image', (imagePath) => {
  let messageElement = util.createChatImageMessage(imagePath);
  document.querySelector('.chat .messages').append(messageElement);
  scrollToBottom();
});

socket.on('chat-log', (text) => {
  let messageElement = util.createLogMessage(text);
  document.querySelector('.chat .messages').append(messageElement);
  scrollToBottom();
});

let scrollToBottom = function () {
  let messagesDiv = document.querySelector('.chat .messages');
  // Scroll to the bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};
