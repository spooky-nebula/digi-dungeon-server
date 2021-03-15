// General Utility modules
const path = require('path');
const fs = require('fs');
// For the HTTP server
const express = require('express');
const app = express();
const http = require('http').createServer(app);
// Import the Nunjucks package
const nunjucks = require('nunjucks');

// Import the Util js
const util = require('./util.js');

// Start the socket server
const { Server, Socket } = require('socket.io');
const io = new Server(http, {
  // Allow cross origin requests
  // This allows for third party clients for the chat
  cors: {
    // The `*` is used as the wildcard here.
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['content-type'],
  },
});

// Set nunjucks as the render engine
nunjucks.configure('views', {
  autoescape: true,
  express: app,
});
app.set('view engine', 'html');

// Tell the server what port it should use. 8080 is for testing purposes
const PORT = parseInt(process.env.PORT) || 8080;

// Set up the parser for requests that are json type
app.use(require('body-parser').json('application/json'));

// Use the public directory for files
app.use('/public', express.static(path.join(__dirname, 'public')));

// GAME DATA

let Shard = {};

Shard.partyList = [];

Shard.map = {};

Shard.gamelog = [];

Shard.getSharableData = function () {
  let data = {
    partyList: this.partyList,
    map: this.map,
    gamelog: this.gamelog,
  };
  return data;
};

// SERVER RESPONSES

app.get('/', function (req, res) {
  res.status(200).render('index');
});

// SOCKET IO RESPONSES

// On socket connection
io.on('connection', (socket) => {
  console.log(socket.id + ' connected');

  socket.join('universal');

  socket.on('request-shard-data', (data) => {
    io.to(socket.id).emit(
      'request-shard-data-response',
      Shard.getSharableData()
    );
  });

  socket.on('message', (data) => {
    switch (data.type) {
      case 'text':
        data.username = socket.id;
        if (typeof data.content != 'string') {
          return false;
        }
        data.content = data.content.trim();
        if (data.content == '') {
          return false;
        }
        let textEvent = {
          text: data.content,
          username: data.username,
        };
        addEvent('chat-text', textEvent);
        io.to('universal').emit('chat-text', {
          text: data.content,
          username: data.username,
        });
        break;
    }
  });

  socket.on('roll-dice', (data) => {
    console.log(data);
    util
      .rollDice(data.diceQuantity, data.diceType, data.modifier)
      .then((dice) => {
        data = { ...data, ...dice };
        addEvent('roll-dice', data);
        io.to('universal').emit('roll-dice-result', data);
      });
  });

  socket.on('drawing-add', (finishedLine) => {
    console.log(finishedLine);

    if (finishedLine.points == undefined || finishedLine.points.length == 0) {
      return;
    }

    let data = {
      finishedLine: finishedLine,
    };

    addEvent('drawing-add', data);
    io.to('universal').emit('drawing-added', data);
  });

  socket.on('clear-drawings', (data) => {
    data.all = data.all || true;
    addEvent('clear-drawings', data);
    io.to('universal').emit('drawing-clear-all', data);
  });

  socket.on('drawing-undo', (data) => {
    addEvent('drawing-undo', data);
    io.to('universal').emit('drawing-undone', data);
  });

  socket.on('disconnect', () => {
    console.log(socket.id + ' disconnected');
  });
});

let addEvent = function (eventName, data) {
  let event = {
    name: eventName,
    timestamp: new Date(),
    data: data,
  };
  Shard.gamelog.push(event);
};

http.listen(PORT, function () {
  console.log('Listening on *:', PORT);
});
