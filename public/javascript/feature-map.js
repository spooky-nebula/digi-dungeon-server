let updateMap = function () {
  util
    .request('/map')
    .then((data) => {
      let mapElement = document.querySelector('.map img');
      mapElement.src = data.path;
      return true;
    })
    .catch((reason) => {
      console.error(reason);
      return false;
    });
};

let mapIsShowing = false;

document
  .querySelector('.map-toggle')
  .addEventListener('mousedown', function (event) {
    let mapElement = document.querySelector('.map');
    if (mapIsShowing) {
      mapElement.classList.remove('showing');
      event.target.innerText = 'Open Map';
      mapIsShowing = !mapIsShowing;
    } else {
      mapElement.classList.add('showing');
      event.target.innerText = 'Close Map';
      mapIsShowing = !mapIsShowing;
      updateMap();
    }
  });
