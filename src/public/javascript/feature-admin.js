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

document
  .querySelectorAll('.map-image-box-send')
    .forEach((element) => {
        element
            .addEventListener('mouseup', (e) => {
                console.log(e);
                let message = e.target.parentNode.parentNode.dataset.path;
                util.post('/admin/changeMap', { mapFile: message });
                socket.emit('message', { type: 'log', content: "Map was updated to " + message });
            });
    });

document
    .querySelectorAll('.message-image-box-send')
    .forEach((element) => {
        element
            .addEventListener('mouseup', (e) => {
                console.log(e);
                let message = e.target.parentNode.parentNode.dataset.path;
                socket.emit('message', { type: 'image', content: message });
            });
    });