import Blob from './blob';
import { getGameWindow } from './window';
import keys from './keycodes';
import { add, sub, product, multiply, mag } from './vectorOperations';

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
  fps,
  opacityIncrement,
  globalOpacity,
  faderInterval,
} = window.GLOBALS;

export default function start() {
  updateWindowSize();

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);
  document.addEventListener('keypress', keyPress, false);

  window.addEventListener('resize', updateWindowSize, false);

  toggleInstructions();

  setInterval(iteration, 1000 / fps);
}

function setFader(finalOpacity) {
  clearInterval(faderInterval);
  faderInterval = setInterval(incrementOpacity, 1000 / fps);

  function incrementOpacity() {
    const sign = Math.sign(finalOpacity - globalOpacity);

    if (sign != 0) globalOpacity += sign * opacityIncrement;
    else clearInterval(faderInterval);
  }
}

function createPlayer() {
  player = new Blob(initialSize, [...initialPos], [0, 0], true);
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
    let distanceFromPlayer;
    blobs[i].blobWander();
    blobs[i].updateMovement();

    if (player) {
      distanceFromPlayer = Blob.getDistance(blobs[i], player, false);
      if (distanceFromPlayer < 0) {
        if (player.biggerThan(blobs[i])) {
          const currentForce = player.getForce();
          player = player.consume(blobs[i], true);
          player.setForce(currentForce);
          blobs[i] = null;
          continue;
        } else {
          blobs[i] = blobs[i].consume(player);
          blobs[i].setOpacity(1);
          playerDeath();
        }
      } else {
        Blob.pairwiseInteraction(player, blobs[i]);
      }
    }

    blobs[i].setOpacity(
      Math.max(
        player ? applyFieldOfView(distanceFromPlayer, blobs[i].getRadius()) : 0,
        blobs[i].getOpacity() - opacityIncrement,
        globalOpacity
      )
    );

    for (let j = i + 1; j < blobs.length; j++) {
      if (!blobs[j]) continue;
      if (Blob.getDistance(blobs[i], blobs[j], false) < 0) {
        blobs[i] = blobs[i].biggerThan(blobs[j])
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
};

function playerDeath() {
  player = null;
  toggleInstructions();
  setFader(1);
}

function repopulate() {
  if (blobs.length < maxPop && Math.random() > 0.99) addBlob();
}

function addBlob(
  radius = getCreationRadius(),
  pos = getRandomBorderPosition(),
  vel = getRandomStartingVelocity()
) {
  let newblob = new Blob(radius, pos, vel, false);
  newblob.setOpacity(globalOpacity);
  blobs.push(newblob);
}

function getRandomBorderPosition() {
  const x = Math.random() * 4;
  return x < 1
    ? (entryPoint = [0, windowSize.vertical * x])
    : x < 2
    ? [windowSize.horizontal * (x - 1), 0]
    : x < 3
    ? [windowSize.horizontal, windowSize.vertical * (x - 2)]
    : [windowSize.horizontal * (x - 3), 0];
}

function getRandomStartingVelocity() {
  return [Math.random() * 4 - 2, Math.random() * 4 - 2];
}

function getCreationRadius() {
  return 0.8 * initialSize * Math.pow(5, Math.pow(Math.random(), 2));
}

window.updateWindowSize = function() {
  let windowDimensions = getGameWindow().getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical = windowDimensions.height;
  initialPos = [windowSize.horizontal / 2, windowSize.vertical / 2];
};

window.keyDown = function(e) {
  switch (e.keyCode) {
    case keys.up:
      keyState.up = true;
      break;
    case keys.down:
      keyState.down = true;
      break;
    case keys.left:
      keyState.left = true;
      break;
    case keys.right:
      keyState.right = true;
      break;
    case keys.g:
      gameState.gravity = true;
      gameState.repulsion = false;
      break;
    case keys.r:
      gameState.gravity = false;
      gameState.repulsion = true;
      break;
    default:
  }
  if (player) player.updatePlayerForce();
};

window.keyUp = function(e) {
  switch (e.keyCode) {
    case keys.right:
      keyState.right = false;
      break;
    case keys.left:
      keyState.left = false;
      break;
    case keys.up:
      keyState.up = false;
      break;
    case keys.down:
      keyState.down = false;
      break;
    case keys.g:
      gameState.gravity = false;
      pairwiseForceStrength = 0;
      break;
    case keys.r:
      gameState.repulsion = false;
      pairwiseForceStrength = 0;
      break;
    case keys.v:
      gameState.drag = !gameState.drag;
      break;
    case keys.t:
      gameState.borderTeleport = !gameState.borderTeleport;
      gameState.borderBounce = !gameState.borderTeleport;
      break;
    case keys.z:
      zeroTotalMomentumAndPosition();
      break;
    case keys.a:
      addBlob();
      break;
    default:
  }
  if (player) player.updatePlayerForce();
};

window.keyPress = function(e) {
  switch (e.keyCode) {
    case keys.space:
      if (!player) {
        createPlayer();
        toggleInstructions();
        clearInterval(faderInterval);
        setFader(0);
      }
      break;
    default:
  }
};

function applyFieldOfView(distance, blobRadius) {
  return 1 - distance / (viewDistance * Math.sqrt(blobRadius / 20));
}

function zeroTotalMomentumAndPosition() {
  let totalMomentum = [0, 0],
    totalCOM = [0, 0],
    totalMass = 0,
    allBlobs = player ? blobs.concat([player]) : blobs;
  // sum momentum, COM and mass
  for (let i = 0; i < allBlobs.length; i++) {
    let currentMass = allBlobs[i].getMass(),
      currentVelocity = allBlobs[i].getVel(),
      currentPosition = allBlobs[i].getPos();
    totalMass += currentMass;
    totalMomentum = add(totalMomentum, multiply(currentMass, currentVelocity));
    totalCOM = add(totalCOM, multiply(currentMass, currentPosition));
  }
  let velocityShift = multiply(-1 / totalMass, totalMomentum);
  let positionShift = sub(initialPos, multiply(1 / totalMass, totalCOM));

  // adjust all blobs
  for (let i = 0; i < allBlobs.length; i++) {
    allBlobs[i].adjustVelocityBy(velocityShift);
    allBlobs[i].adjustPositionBy(positionShift);
  }
}
