let noteElement = document.querySelector('.overlay .note');

let Note = (text, position) => {
  noteElement.classList.remove('hidden');
  noteElement.textContent = text;
  if (position) {
    noteElement.style.left = position.x + 'px';
    noteElement.style.top = position.y + 'px';
  }
};

let UnNote = () => {
  noteElement.classList.add('hidden');
};
