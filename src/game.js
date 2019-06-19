import Blob from './blob'
import { getGameWindow } from './window'

let {
  blobs,
  windowSize,
  keyState,
  gameState,
  player,
  viewDistance,
  initialSize,
  initialPos,
  maxPop,
  fps
} = window.GLOBALS

export default function start() {
  updateWindowSize();

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);
  document.addEventListener('keypress', keyPress, false);

  window.addEventListener('resize', updateWindowSize, false);

  toggleInstructions();

  setInterval(iteration, 1000 / fps)
};

function createPlayer() {
  player = new Blob(
    initialSize,
    [...initialPos],
    [0, 0],
    true
  );
}

function toggleInstructions() {
  document.getElementById('instructions').classList.toggle('hidden');
}

window.iteration = function() {
  repopulate();

  if (player) {
    player.updateMovement();
    viewDistance = initialSize * 10 + player.radius * 5;
  }

  // Each time the array is iterated through a new array is created,
  // This is because when I tried to use array.filter the resultant array was still the same length and contained nulls
  let newBlobs = [];

  for (let i = 0; i < blobs.length; i++) {
    if (!blobs[i]) continue;

    blobs[i].blobWander();
    blobs[i].updateMovement();

    if (player) {
      let distance = Blob.getDistance(blobs[i], player, false);
      if (distance < 0) {
        if (player.biggerThan(blobs[i])) {
          const currentForce = player.getForce();
          player = player.consume(blobs[i], true);
          player.setForce(currentForce);
          blobs[i] = null;
          continue;
        } else {
          blobs[i] = blobs[i].consume(player);
          playerDeath();
        }
      } else {
        // apply opacity to the blob so that it gradually comes into view only near the player
        blobs[i].setOpacity(Math.max(1 - (distance / viewDistance), 0));
        Blob.pairwiseInteraction(player, blobs[i]);
      }
    }

    for (let j = i + 1; j < blobs.length; j++) {
      if (!blobs[j]) continue;
      if (Blob.getDistance(blobs[i], blobs[j], false) < 0) {
        blobs[i] = (blobs[i].biggerThan(blobs[j])) 
          ? blobs[i].consume(blobs[j]) 
          : blobs[j].consume(blobs[i]);
        blobs[j] = null;
      } else {
        Blob.pairwiseInteraction(blobs[i], blobs[j]);
      }
    }
    newBlobs.push(blobs[i]);
  }

  blobs = newBlobs;
}

function playerDeath() {
  player = null;
  toggleInstructions();
  revealAll();
}

function revealAll() {
  blobs.forEach(blob => {
    blob.setOpacity(1);
  })
}

function repopulate() {
  if (blobs.length < maxPop && Math.random() > 0.99) addBlob();
}

function addBlob(radius = getCreationRadius(), pos = getRandomBorderPosition(), vel = getRandomStartingVelocity()) {
  let newblob = new Blob(
    radius,
    pos,
    vel,
    false
  );
  blobs.push(newblob);
}

function getRandomBorderPosition() {
  const x = Math.random() * 4;
  return (x < 1) ? entryPoint = [0, windowSize.vertical * x] :
    (x < 2) ? [windowSize.horizontal * (x - 1), 0] :
    (x < 3) ? [windowSize.horizontal, windowSize.vertical * (x - 2)] :
    [windowSize.horizontal * (x - 3), 0]
}

function getRandomStartingVelocity() {
  return [Math.random() * 4 - 2, Math.random() * 4 - 2];
}

function getCreationRadius() {
  return 0.8 * initialSize * Math.pow(5, Math.pow(Math.random(), 2));
}

window.updateWindowSize = function () {
  let windowDimensions = getGameWindow().getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical = windowDimensions.height;
  initialPos = [windowSize.horizontal / 2, windowSize.vertical / 2];
}

window.keyDown = function (e) {
  // first four deal with player movement
  if (e.keyCode === 39) {
    keyState.right = true;
  } else if (e.keyCode === 37) {
    keyState.left = true;
  } else if (e.keyCode === 38) {
    keyState.up = true;
  } else if (e.keyCode === 40) {
    keyState.down = true;
    // g - gravity
  } else if (e.keyCode === 71) {
    gameState.gravity = true;
    gameState.repulsion = false;
    // r - repulsion
  } else if (e.keyCode === 82) {
    gameState.gravity = false;
    gameState.repulsion = true;
    // f - vacuum state (f for frictionless)
  } else if (e.keyCode === 70) {
    gameState.drag = false;
  }
  if (player) player.updatePlayerForce();
}

window.keyUp = function (e) {
  if (e.keyCode === 39) {
    keyState.right = false;
  } else if (e.keyCode === 37) {
    keyState.left = false;
  } else if (e.keyCode === 38) {
    keyState.up = false;
  } else if (e.keyCode === 40) {
    keyState.down = false;
    // g
  } else if (e.keyCode === 71) {
    gameState.gravity = false;
    pairwiseForceStrength = 0;
    // r
  } else if (e.keyCode === 82) {
    gameState.repulsion = false;
    pairwiseForceStrength = 0;
    // f
  } else if (e.keyCode === 70) {
    gameState.drag = true;
    // t - toggle teleport (blobs dissapear one side and reappear on the other)
  } else if (e.keyCode === 84) {
    gameState.borderTeleport = !gameState.borderTeleport;
    if (gameState.borderTeleport) gameState.borderBounce = false;
    // b - toggle border bounce
  } else if (e.keyCode === 66) {
    gameState.borderBounce = !gameState.borderBounce;
    if (gameState.borderBounce) gameState.borderTeleport = false;
    // z - this centres blobs on the middle of screen while maintaining their relative positions and velocities
  } else if (e.keyCode === 90) {
    zeroTotalMomentumAndPosition();
    // a - add one blob on command
  } else if (e.keyCode === 65) {
    addBlob();
  }
  if (player) player.updatePlayerForce();
}

// when key pressed
window.keyPress = function (e) {
  // spacebar
  if (e.keyCode === 32) {
    if (!player) {
      createPlayer();
      toggleInstructions();
    }
  }
}

// shifts the velocity of all blobs to zero total momentum and centre COM in middle of screen while conserving relationships
function zeroTotalMomentumAndPosition() {
  let totalMomentum = [0, 0],
    totalCOM = [0, 0],
    totalMass = 0,
    allBlobs = (player) ? blobs.concat([player]) : blobs;
  // sum momentum, COM and mass
  for (let i = 0; i < allBlobs.length; i++) {
    let currentMass = allBlobs[i].getMass(),
      currentVelocity = allBlobs[i].getVel(),
      currentPosition = allBlobs[i].getPos();
    totalMass += currentMass;
    totalMomentum[0] += currentVelocity[0] * currentMass;
    totalMomentum[1] += currentVelocity[1] * currentMass;
    totalCOM[0] += currentPosition[0] * currentMass;
    totalCOM[1] += currentPosition[1] * currentMass;
  }
  let velocityShift = [-totalMomentum[0] / totalMass, -totalMomentum[1] / totalMass],
    positionShift = [initialPos[0] - totalCOM[0] / totalMass, initialPos[1] - totalCOM[1] / totalMass];

  // adjust all blobs
  for (let i = 0; i < allBlobs.length; i++) {
    allBlobs[i].adjustVelocityBy(velocityShift);
    allBlobs[i].adjustPositionBy(positionShift);
  }
}

