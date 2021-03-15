// This is for when someone reloads the page
let reloadShardData = function () {
  socket.emit('request-shard-data');
};

socket.on('request-shard-data-response', (data) => {
  data.gamelog.forEach((event, index, gamelog) => {
    switch (event.name) {
      case 'roll-dice':
        createRollDiceResultElement(event.data);
        break;

      case 'chat-text':
        addChatTextMessage(event.data.text, event.data.username);
        break;

      case 'drawing-add':
        canvasMap.addDrawing(event.data.finishedLine);
        break;

      case 'clear-drawings':
        canvasMap.clearDrawings(event.data.all);
        break;

      default:
        break;
    }
  });
});

reloadShardData();
