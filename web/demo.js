'use strict';

const bank = document.querySelector('#bank');
const note = document.querySelector('#note');
const player = document.querySelector('#player');
const status = document.querySelector('#status');
const pitches = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

for (let midi = 21; midi <= 108; midi++) {
  const name = pitches[midi % 12] + (Math.floor(midi / 12) - 1);
  note.add(new Option(name, name));
}
note.value = 'A3';

function selectSample() {
  player.src = `../sft/${bank.value}/acoustic_grand_piano-mp3/${encodeURIComponent(note.value)}.mp3`;
  status.textContent = '';
}

bank.addEventListener('change', selectSample);
note.addEventListener('change', selectSample);
player.addEventListener('error', () => {
  status.textContent = 'Could not load the selected MP3 sample.';
});
selectSample();
