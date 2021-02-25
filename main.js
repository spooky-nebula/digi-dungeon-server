// General Utility modules
const path = require('path');
const fs = require('fs');
// For the HTTP server
const express = require('express');
const app = express();
const http = require('http').createServer(app);
// Import the Nunjucks package
const nunjucks = require('nunjucks');

// Import the config file
const config = require('./data/config.json');

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

let Game = {};

Game.currentMap = 'placeholder.png';

Game.getCurrentMap = function () {
  return '/public/assets/map/' + this.currentMap;
};

Game.setCurrentMap = function (mapFile) {
  this.currentMap = mapFile;
}

// SERVER RESPONSES

app.get('/', function (req, res) {
  res.status(200).render('index', {
    campaignName: config.campaignName,
  });
});

app.get('/map', function (req, res) {
  res.status(200).send({path: Game.getCurrentMap()});
});

app.get('/admin', function (req, res) {
  let propFiles = fs.readdirSync("./public/assets/props");
  let mapFiles = fs.readdirSync("./public/assets/map");

  propFiles = propFiles.filter(value => {return value.endsWith(".png")});
  mapFiles = mapFiles.filter(value => {return value.endsWith(".png")});

  res.status(200).render('admin', {
    campaignName: config.campaignName,
    props: propFiles,
    maps: mapFiles
  });
});

app.post('/admin/changeMap', function (req, res) {
  let newMap = req.body.mapFile;
  Game.setCurrentMap(newMap);
  res.status(200).send({ message: "Ok." });
});

// SOCKET IO RESPONSES

// On socket connection
io.on('connection', (socket) => {
  console.log(socket.id + ' connected');

  socket.join('universal');

  socket.on('message', (message) => {
    switch (message.type) {
      case 'image':
        io.to('universal').emit('chat-image', '/public/assets/props/' + message.content);
        break;
      case 'text':
        io.to('universal').emit('chat-text', message.content);
        break;
      case 'log':
        io.to('universal').emit('chat-log', message.content);
        break;
    }
  });

  socket.on('change-map', (data) => {});

  socket.on('disconnect', () => {
    console.log(socket.id + ' disconnected');
  });
});

http.listen(PORT, function () {
  console.log('Listening on *:', PORT);
});
