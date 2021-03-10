let util = {};

util.createChatTextMessage = function (message, user) {
  let messageElement = document
    .querySelector('#game-log-chat-message-text-template .chat-message-text')
    .cloneNode(true);
  messageElement.querySelector('.username').textContent = user;
  messageElement.querySelector('.text').textContent = message;

  return messageElement;
};

util.createChatImageMessage = function (message) {
  let chatMessageImage = document.createElement('img');
  chatMessageImage.classList.add('chat-message-image');
  chatMessageImage.src = message;

  return chatMessageImage;
};

util.createLogMessage = function (message) {
  let chatMessageLog = document.createElement('p');
  chatMessageLog.classList.add('chat-message-log');
  chatMessageLog.innerHTML = message;

  return chatMessageLog;
};

util.createChatMessage = function (content) {
  let chatMessageRoot = document.createElement('div');
  chatMessageRoot.classList.add('chat-message');

  chatMessageRoot.append(content);

  return chatMessageRoot;
};

util.request = function (path) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open('GET', path, true);

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        let resp = this.response;
        resolve(JSON.parse(resp));
      } else {
        reject('what');
      }
    };

    request.onerror = function (err) {
      console.log('Could not connect to the web server');
      reject(err);
    };

    request.send();
  });
};

util.post = function (path, data) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open('POST', path, true);
    if (typeof data == 'object') {
      request.setRequestHeader('Content-Type', 'application/json');
    }

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        let resp = this.response;
        resolve(JSON.parse(resp));
      } else {
        reject('what');
      }
    };

    request.onerror = function (err) {
      console.log('Could not connect to the web server');
      reject(err);
    };

    if (typeof data == 'object') {
      request.send(JSON.stringify(data));
    } else {
      request.send(data);
    }
  });
};

util.copyObject = function (src) {
  return Object.assign({}, src);
};
