let canvasMap = {};

canvasMap.backgroundLayer = [];
canvasMap.tokenLayer = [];
canvasMap.drawingLayer = [];

canvasMap.grid = {
  size: {
    x: 0,
    y: 0,
  },
  tileSize: {
    x: 0,
    y: 0,
  },
  tileCount: {
    x: 0,
    y: 0,
  },
};

canvasMap.camera2d = {
  x: 0,
  y: 0,
};

canvasMap.canvasElement = document.querySelector('canvas.map');
canvasMap.canvasContext = document.querySelector('canvas.map').getContext('2d');

canvasMap.init = () => {
  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener('resize', canvasMap.resizeCanvas, false);
  // Draw canvas border for the first time.
  canvasMap.resizeCanvas();
  // Resize the grid to the default size,
  canvasMap.resizeGrid(1024, 576, 32, 32);
  // Start the draw cycle
  setInterval(() => {
    canvasMap.draw();
  }, 0.166666666666667);
  // Start the update cycle
  setInterval(() => {
    canvasMap.update();
  }, 0.166666666666667);
  // Set the camera to the middle of the map
  canvasMap.camera2d.x = window.innerWidth / 2 - canvasMap.grid.size.x / 2;
  canvasMap.camera2d.y = window.innerHeight / 2 - canvasMap.grid.size.y / 2;
};

/**
 * Resizes the grid and tiles
 * @param {number} mapWidth
 * @param {number} mapHeight
 * @param {number} tileWidth
 * @param {number} tileHeight
 */
canvasMap.resizeGrid = (mapWidth, mapHeight, tileWidth, tileHeight) => {
  canvasMap.grid.size.x = mapWidth;
  canvasMap.grid.size.y = mapHeight;
  canvasMap.grid.tileSize.x = tileWidth;
  canvasMap.grid.tileSize.y = tileHeight;
  canvasMap.grid.tileCount.x = Math.floor(mapWidth / tileWidth);
  canvasMap.grid.tileCount.y = Math.floor(mapHeight / tileHeight);
};

// DRAW FUNCTION
canvasMap.draw = () => {
  var ctx = canvasMap.canvasContext;
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  // Clear
  ctx.fillStyle = 'white';

  // TODO: Draw Grid
  ctx.fillRect(
    0 + canvasMap.camera2d.x,
    0 + canvasMap.camera2d.y,
    canvasMap.grid.size.x,
    canvasMap.grid.size.y
  );
  for (let x = 0; x < canvasMap.grid.tileCount.x + 1; x++) {
    // Set style and width
    ctx.strokeStyle = '#f1f1f1';
    ctx.lineWidth = 1;
    // Begin the line
    ctx.beginPath();
    ctx.lineTo(
      x * canvasMap.grid.tileSize.x + canvasMap.camera2d.x,
      0 + canvasMap.camera2d.y
    );
    ctx.lineTo(
      x * canvasMap.grid.tileSize.x + canvasMap.camera2d.x,
      canvasMap.grid.size.y + canvasMap.camera2d.y
    );
    ctx.stroke();
  }

  for (let y = 0; y < canvasMap.grid.tileCount.y + 1; y++) {
    // Set style and width
    ctx.strokeStyle = '#f1f1f1';
    ctx.lineWidth = 1;
    // Begin the line
    ctx.beginPath();
    ctx.lineTo(
      0 + canvasMap.camera2d.x,
      y * canvasMap.grid.tileSize.y + canvasMap.camera2d.y
    );
    ctx.lineTo(
      canvasMap.grid.size.x + canvasMap.camera2d.x,
      y * canvasMap.grid.tileSize.y + canvasMap.camera2d.y
    );
    ctx.stroke();
  }

  canvasMap.drawingLayer.forEach((drawing) => {
    // Set style and width
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.width;
    // Begin the line
    ctx.beginPath();
    // Add each point
    drawing.points.forEach((point) => {
      /* This is to not draw drawings off the edge, doesn't look good
      if (
        point.x > window.innerWidth - this.camera2d.x ||
        point.x < 0 - this.camera2d.x
      ) {
        return;
      }
      if (
        point.y > window.innerHeight - this.camera2d.y ||
        point.y < 0 - this.camera2d.y
      ) {
        return;
      } */
      ctx.lineTo(
        point.x + canvasMap.camera2d.x,
        point.y + canvasMap.camera2d.y
      );
    });
    // Finish the line and draw it
    ctx.stroke();
  });

  canvasMap.backgroundLayer.forEach((entity) => {
    let x = entity.x + canvasMap.camera2d.x;
    let y = entity.y + canvasMap.camera2d.y;
    let width = entity.width;
    let height = entity.height;
    let rotation = entity.rotation;
    let source = entity.src;
  });

  canvasMap.tokenLayer.forEach((token) => {
    let x = token.x * canvasMap.grid.tileSize.x + canvasMap.camera2d.x;
    let y = token.y * canvasMap.grid.tileSize.y + canvasMap.camera2d.y;

    let source = token.src;

    ctx.drawImage(source, x, y, token.size.x, token.size.y);
  });

  toolset.tools.forEach((tool, index) => {
    tool.draw(ctx, canvasMap.camera2d);
  });
  /* 
  // DEBUG
  ctx.font = 'italics 48px serif';
  ctx.fillStyle = 'black';
  ctx.fillText(
    JSON.stringify(hotKeyListener.lastKeys),
    canvasMap.camera2d.x,
    canvasMap.camera2d.y
  );
  ctx.fillText(
    JSON.stringify(hotKeyListener.modifier),
    canvasMap.camera2d.x,
    canvasMap.camera2d.y + 40
  ); */
};
// UPDATE FUNCTION
canvasMap.update = () => {};

// Display custom canvas. In this case it's a blue, 5 pixel
// border that resizes along with the browser window.
canvasMap.redraw = () => {
  canvasMap.canvasContext.fillStyle = 'white';
  canvasMap.canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);

  canvasMap.canvasContext.strokeStyle = 'black';
  canvasMap.canvasContext.lineWidth = '10';
  canvasMap.canvasContext.strokeRect(
    5,
    5,
    window.innerWidth - 5,
    window.innerHeight - 5
  );
};

// Runs each time the DOM window resize event fires.
// Resets the canvas dimensions to match window,
// then draws the new borders accordingly.
canvasMap.resizeCanvas = function () {
  canvasMap.canvasElement.width = window.innerWidth;
  canvasMap.canvasElement.height = window.innerHeight;
  canvasMap.redraw();
};

/**
 * Adds a drawing to the drawing layer
 * @param {Object} drawingObject
 * @param {[Object]} drawingObject.points array of x,y points
 * @param {string} drawingObject.color colour of line
 * @param {number} drawingObject.width width of line
 */
canvasMap.addDrawing = function (drawingObject) {
  if (drawingObject.points.length == 0) {
    return;
  }
  canvasMap.drawingLayer.push(drawingObject);
};

canvasMap.clearDrawings = function (all) {
  if (all) {
    canvasMap.drawingLayer = [];
  }
};

canvasMap.undoLast = function (data) {
  canvasMap.drawingLayer.pop();
};

socket.on('drawing-added', (data) => {
  canvasMap.addDrawing(data.finishedLine);
});

socket.on('drawing-clear-all', (data) => {
  canvasMap.clearDrawings(data.all);
});

socket.on('drawing-undone', (data) => {
  canvasMap.undoLast(data);
});

// Start listening to resize events and draw canvas.
canvasMap.init();
