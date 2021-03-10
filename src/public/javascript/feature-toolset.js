let toolset = {};

toolset.previousTool = 0;
toolset.currentTool = 0;

toolset.tools = [];

let Selector = function () {
  this.name = 'Selector';
  this.iconPath = '/public/assets/tools/selector_icon.png';
  this.pointerPath = '/public/assets/tools/selector_pointer.png';
  this.enable = false;
  this.updateRate = 3.3333;
  this.init = () => {};
  this.update = () => {};
  this.draw = () => {};
};

let Panner = function () {
  this.name = 'Panner';
  this.iconPath = '/public/assets/tools/panner_icon.png';
  this.pointerPath = '/public/assets/tools/panner_pointer.png';
  this.enabled = false;
  this.updateRate = 3.3333;
  this.init = () => {};
  this.update = () => {};
  this.draw = () => {};
};

let BrushieTool = function () {
  this.name = 'Brushie';
  this.iconPath = '/public/assets/tools/brushie_icon.png';
  this.pointerPath = '/public/assets/tools/brushie_pointer.png';
  this.enabled = false;
  this.updateRate = 6.6667;
  this.options = [
    {
      name: 'Colour Picker',
      html:
        '<input class="brushie-colour-picker" type="color" value="#000000">',
    },
    {
      name: 'Width Picker',
      html: '<input class="brushie-width-picker" type="number" value="1">',
    },
  ];
  this.hotKey = 'b';

  this.init = () => {
    this.mouseState.x = 69;
    this.mouseState.y = 420;
    document
      .querySelector('canvas.map')
      .addEventListener('mousemove', (event) => {
        if (!this.enabled) {
          return;
        }
        this.handleMousePosition(event.clientX, event.clientY);
      });
    document
      .querySelector('canvas.map')
      .addEventListener('mousedown', (event) => {
        if (!this.enabled) {
          return;
        }
        this.updateDetails();
        this.drawing = true;
      });
    document
      .querySelector('canvas.map')
      .addEventListener('mouseup', (event) => {
        if (!this.enabled) {
          return;
        }
        this.drawing = false;
        this.finishLine();
      });
  };
  this.update = () => {
    if (this.drawing) {
      if (
        this.mouseState.x == this.previousMouseState.x &&
        this.mouseState.y == this.previousMouseState.y
      ) {
        return;
      }
      this.addPoint(this.mouseState.x, this.mouseState.y);
    }
  };
  this.draw = (context2d) => {
    context2d.strokeStyle = this.tempLine.color;
    context2d.lineWidth = this.tempLine.width;
    context2d.beginPath();
    this.tempLine.points.forEach((point) => {
      context2d.lineTo(point.x, point.y);
    });
    context2d.stroke();
  };

  // TOOL PROPERTIES
  this.mouseState = {
    x: 0,
    y: 0,
  };
  this.previousMouseState = {
    x: 0,
    y: 0,
  };
  this.tempLine = {
    points: [],
    width: 1,
    color: 'black',
  };
  this.drawing = false;

  // TOOL FUNCTIONS
  this.handleMousePosition = (x, y) => {
    this.previousMouseState.x = this.mouseState.x;
    this.previousMouseState.y = this.mouseState.y;
    this.mouseState.x = x;
    this.mouseState.y = y;
  };
  this.updateDetails = () => {
    let colourPickerDOM = document.querySelector('.brushie-colour-picker');
    let widthPickerDOM = document.querySelector('.brushie-width-picker');
    if (colourPickerDOM != undefined) {
      this.tempLine.color = colourPickerDOM.value;
    }
    if (widthPickerDOM != undefined) {
      this.tempLine.width = parseInt(widthPickerDOM.value);
    }
  };
  this.addPoint = (x, y) => {
    this.tempLine.points.push({ x: x, y: y });
  };
  this.resetPoints = () => {
    this.tempLine.points = [];
  };
  this.finishLine = () => {
    // Finished line is a copy of the temp line
    let finishedLine = util.copyObject(this.tempLine);
    // Trimmed is a copy but only with the non repeated points
    let trimmedLine = util.copyObject(this.tempLine);
    trimmedLine.points = [];
    // Last point, to compare
    let lastPoint = finishedLine.points[0];
    trimmedLine.points.push(lastPoint);
    // Filter the repeated points
    for (let i = 0; i < finishedLine.points.length; i++) {
      let point = finishedLine.points[i];
      if (lastPoint.x != point.x || lastPoint.y != point.y) {
        trimmedLine.points.push(point);
        lastPoint = point;
      }
    }
    if (trimmedLine.points.length <= 3) {
      this.resetPoints();
      return;
    }
    socket.emit('drawing-add', trimmedLine);
    this.resetPoints();
  };
};

let TheRuller = function () {
  this.name = 'The Ruller';
  this.iconPath = '/public/assets/tools/theRuller_icon.png';
  this.pointerPath = '/public/assets/tools/theRuller_pointer.png';
  this.enabled = false;
  this.updateRate = 3.3333;
  this.init = () => {};
  this.update = () => {};
  this.draw = () => {};
};

toolset.tools.push(new Selector());
toolset.tools.push(new Panner());
toolset.tools.push(new BrushieTool());
toolset.tools.push(new TheRuller());

toolset.forceUpdateToolbar = () => {
  let oldTools = document.querySelectorAll('.toolbar .tool');
  oldTools.forEach((element, index) => {
    element.remove();
  });

  let toolbar = document.querySelector('.toolbar');
  toolset.tools.forEach((tool, index) => {
    let toolElement = document
      .querySelector('#toolset-tool-template .tool')
      .cloneNode(true);

    let toolButtonElement = toolElement.querySelector('.tool-button');
    toolButtonElement.textContent = tool.name;
    toolButtonElement.style.backgroundImage = 'url(' + tool.iconPath + ')';
    toolButtonElement.dataset.index = index;
    toolButtonElement.addEventListener('mouseup', (event) => {
      let i = parseInt(event.target.dataset.index);
      toolset.switchTo(i);
    });

    let toolOptionsElement = toolElement.querySelector('.tool-options');
    if (tool.options != undefined && tool.options.length > 0) {
      tool.options.forEach((option, jndex) => {
        let oElement = document
          .querySelector('#toolset-tool-option-template .tool-option')
          .cloneNode(true);
        oElement.innerHTML = option.html;
        toolOptionsElement.appendChild(oElement);
      });
    }

    toolbar.append(toolElement);
  });

  toolset.updateToolbar();
};

toolset.switchTo = (toolIndex) => {
  if (toolIndex == toolset.currentTool) {
    return;
  }
  document
    .querySelector('.toolbar .tool.selected')
    .classList.remove('selected');

  let i = toolIndex;
  toolset.previousTool = toolset.currentTool;
  toolset.currentTool = i;
  toolset.updateToolbar();
};

toolset.updateToolbar = () => {
  let toolElements = document.querySelectorAll('.toolbar .tool');
  toolElements[toolset.currentTool].classList.add('selected');
  document.querySelector('canvas.map').style.cursor =
    'url(' + toolset.tools[toolset.currentTool].pointerPath + ')';
  toolset.tools[toolset.currentTool].enabled = true;
  toolset.tools[toolset.previousTool].enabled = false;
};

toolset.initializeTools = () => {
  toolset.tools.forEach((tool, index) => {
    toolset.tools[index].init();
    setInterval(() => {
      toolset.tools[index].update();
    }, toolset.tools[index].updateRate);
  });
};

// Refresh forces update and reinit
toolset.forceUpdateToolbar();
toolset.initializeTools();
