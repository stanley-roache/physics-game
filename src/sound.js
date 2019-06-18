const audioDepth = 5;
let sounds = [],
    soundIndex = 0;

for (let i = 0; i < audioDepth; i++) {
  sounds.push(new Audio("sounds/bubble_pop.mp3"))
}

// when blobs collide play this sound
export function playSound() {
  soundIndex = (soundIndex+1)%audioDepth;
  sounds[soundIndex].play();
}
