let toolset = {};

toolset.previousTool = 0;
toolset.currentTool = 0;

toolset.tools = [];
toolset.toolUpdateIntervals = [];

toolset.mouseState = {
  x: 0,
  y: 0,
};
toolset.previousMouseState = {
  x: 0,
  y: 0,
};

toolset.forceUpdateToolbar = () => {
  // Reinitialize tools
  toolset.initializeTools();
  // Remove the current tools
  let oldTools = document.querySelectorAll('.toolbar .tool');
  oldTools.forEach((element, index) => {
    element.remove();
  });
  // Add all the tools to the toolbar
  let toolbar = document.querySelector('.toolbar');
  // Add each tool
  toolset.tools.forEach((tool, index) => {
    let toolElement = document
      .querySelector('#toolset-tool-template .tool')
      .cloneNode(true);
    // Create the button element
    let toolButtonElement = toolElement.querySelector('.tool-button');
    toolButtonElement.querySelector('p').textContent = tool.name;
    toolButtonElement.querySelector('img').src = tool.iconPath;
    toolButtonElement.title = 'hotkey: "' + tool.hotKey + '"' || tool.name;
    toolButtonElement.dataset.index = index;
    toolButtonElement.addEventListener('mouseup', (event) => {
      console.log(event);
      let i = parseInt(
        event.target.parentElement.dataset.index || event.target.dataset.index
      );
      toolset.switchTo(i);
    });
    // Add each options to the options bar of each tool
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
  // Update the selected tool
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
    'url(' + toolset.tools[toolset.currentTool].pointerPath + '), auto';
  toolset.tools[toolset.currentTool].enabled = true;
  toolset.tools[toolset.previousTool].enabled = false;
};

toolset.handleMousePosition = (x, y) => {
  toolset.previousMouseState.x = toolset.mouseState.x;
  toolset.previousMouseState.y = toolset.mouseState.y;
  toolset.mouseState.x = x;
  toolset.mouseState.y = y;
};

toolset.initializeTools = () => {
  toolset.toolUpdateIntervals.forEach((toolIntervalID, index) => {
    clearInterval(toolIntervalID);
  });
  toolset.tools.forEach((tool, index) => {
    toolset.tools[index].init();
    let interval = setInterval(() => {
      toolset.tools[index].update();
    }, toolset.tools[index].updateRate);
    toolset.toolUpdateIntervals.push(interval);
  });

  document
    .querySelector('canvas.map')
    .addEventListener('mousemove', (event) => {
      toolset.handleMousePosition(event.clientX, event.clientY);
    });

  document
    .querySelector('canvas.map')
    .addEventListener('mousedown', (event) => {
      if (toolset.tools[toolset.currentTool].mouseDown) {
        toolset.tools[toolset.currentTool].mouseDown(event);
      }
    });
  document.querySelector('canvas.map').addEventListener('mouseup', (event) => {
    if (toolset.tools[toolset.currentTool].mouseUp) {
      toolset.tools[toolset.currentTool].mouseUp(event);
    }
  });

  console.log(toolset.tools.length + ' tools initialized');
};
