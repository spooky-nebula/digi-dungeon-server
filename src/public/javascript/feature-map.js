let canvasMap = {};

canvasMap.backgroundLayer = [];
canvasMap.tokenLayer = [];
canvasMap.drawingLayer = [];

canvasMap.camera2d = {
  x: 0,
  y: 0,
};

canvasMap.canvasElement = document.querySelector('canvas.map');
canvasMap.canvasContext = document.querySelector('canvas.map').getContext('2d');

canvasMap.init = function () {
  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener('resize', canvasMap.resizeCanvas, false);
  // Draw canvas border for the first time.
  canvasMap.resizeCanvas();
  // Start the draw cycle
  setInterval(() => {
    canvasMap.draw();
  }, 0.166666666666667);
  // Start the update cycle
  setInterval(() => {
    canvasMap.update();
  }, 0.166666666666667);
};

// DRAW FUNCTION
canvasMap.draw = function () {
  var ctx = this.canvasContext;
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  // Clear
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  canvasMap.drawingLayer.forEach((drawing) => {
    /* ctx.fillStyle = 'black';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      'Colour:' + drawing.color + ',Width:' + drawing.width,
      drawing.points[0].x,
      drawing.points[0].y
    ); */
    // Set style and width
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.width;
    // Begin the line
    ctx.beginPath();
    // Add each point
    drawing.points.forEach((point) => {
      ctx.lineTo(point.x + this.camera2d.x, point.y + this.camera2d.y);
    });
    // Finish the line and draw it
    ctx.stroke();
  });

  toolset.tools.forEach((tool, index) => {
    tool.draw(ctx);
  });
};
// UPDATE FUNCTION
canvasMap.update = function () {};

// Display custom canvas. In this case it's a blue, 5 pixel
// border that resizes along with the browser window.
canvasMap.redraw = function () {
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

socket.on('drawing-added', (data) => {
  canvasMap.addDrawing(data.finishedLine);
});

// Start listening to resize events and draw canvas.
canvasMap.init();
