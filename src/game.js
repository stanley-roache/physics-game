import Blob from './blob'
import { getGameWindow } from './window'

let {
  blobs,
  t,
  windowSize,
  keyState,
  gameState,
  player,
  pairwiseForceStrength,
  viewDistance,
  initialSize,
  initialPos,
  speedUp,
  diagonal,
  maxPop,
  drag,
  appetite,
  G,
  R,
  minSize,
  borderElasticity,
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
    // the slice makes sure a copy of the array is being passed, otherwise location and speed persist through death
    initialPos.slice(),
    [0, 0],
    true
  );
}

function toggleInstructions() {
  document.getElementById('instructions').classList.toggle('hidden');
}

// this function gets called several times a second and has to loop through everything to make the game real time
window.iteration = function() {
  // add new blobs
  repopulate();

  // player movement
  if (player) {
    player.update();
    // this updates the range of view of the player
    viewDistance = initialSize * 10 + player.radius * 5;
  }

  // Each time the array is iterated through a new array is created,
  // This is because when I tried to use array.filter the resultant array was still the same length and contained nulls
  var newBlobs = [];

  // this loop applies to every blob (except for possible player) in the game
  for (var i = 0; i < blobs.length; i++) {
    // it might be null, skip if it is
    if (!blobs[i]) continue;

    // this function creates random blob movement
    blobs[i].blobWander();
    // moves blob, applies all forces
    blobs[i].update();

    if (player) {
      let distance = Blob.getDistance(player, blobs[i], false);
      // if blob is touching player
      if (distance < 0) {
        if (player.biggerThan(blobs[i])) {
          // combine blobs, create new player blob and carry over force
          var currentForce = player.getForce();
          player = player.consume(blobs[i]);
          player.setForce(currentForce);
          // player.updateDiv();

          blobs[i] = null;
          //  in this case the blob is now null so we want to skip to the next blob in the array
          continue;
        } else {
          // eaten! in this case we keep updating the other blobs so there is no continue statement
          blobs[i] = blobs[i].consume(player);
          playerDeath();
        }
        // if not touching player
      } else {
        // apply opacity to the blob so that it gradually comes into view only near the player
        blobs[i].setOpacity(Math.max(1 - (distance / viewDistance), 0));
        // apply gravity or repulsion in this function
        Blob.pairwiseInteraction(player, blobs[i]);
      }
    }

    // This loop runs for every PAIR of blobs
    for (var j = i + 1; j < blobs.length; j++) {
      // skip null blobs
      if (!blobs[j]) continue;
      // are they touching
      if (Blob.getDistance(blobs[i], blobs[j], false) < 0) {
        // bigger eats smaller
        (blobs[i].biggerThan(blobs[j])) ? blobs[i] = blobs[i].consume(blobs[j]) : blobs[i] = blobs[j].consume(blobs[i]);
        blobs[j] = null;
      } else {
        Blob.pairwiseInteraction(blobs[i], blobs[j]);
      }
    }
    // make sure the remaining blob gets carried to the next array
    newBlobs.push(blobs[i]);
  }

  // the array is updated with remaining blobs in an array with no nulls
  blobs = newBlobs;
}

function playerDeath() {
  player = null;
  toggleInstructions();
  revealAll();
}

// reveal all blobs on page
function revealAll() {
  blobs.forEach(blob => {
    blob.setOpacity(1);
  })
}

// adds new blobs randomly as long as the max populatoin isn't reached
function repopulate() {
  if (blobs.length < maxPop && Math.random() > 0.99) addBlob();
}

// adds one new blob, can be given manual properties but defaults to random
function addBlob(radius = getCreationRadius(), pos = getRandomBorderPosition(), vel = getRandomStartingVelocity()) {
  let newblob = new Blob(
    radius,
    pos,
    vel,
    false
  );
  // put it in with its mates
  blobs.push(newblob);
}

// creates entry point for new point along border
function getRandomBorderPosition() {
  let entryPoint;
  let x = Math.random() * 4;
  if (x < 1) {
    entryPoint = [0, windowSize.vertical * x];
  } else if (x < 2) {
    entryPoint = [windowSize.horizontal * (x - 1), 0];
  } else if (x < 3) {
    entryPoint = [windowSize.horizontal, windowSize.vertical * (x - 2)];
  } else {
    entryPoint = [windowSize.horizontal * (x - 3), 0];
  }
  return entryPoint;
}

// creates random starting velocity
function getRandomStartingVelocity() {
  return [Math.random() * 4 - 2, Math.random() * 4 - 2];
}

// This function defines the distribution of sizes of new blobs
function getCreationRadius() {
  // 0.8*initialSize means the smallest created is just under player starting size,
  // 5^(random^2) means the biggest size possible is 5 times the start size and the distribution is highly weighted towards smaller sizes
  return 0.8 * initialSize * Math.pow(5, Math.pow(Math.random(), 2));
}

// this function gets called when the window size changes, it is mainly so that the player starting point gets updated
window.updateWindowSize = function () {
  let windowDimensions = getGameWindow().getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical = windowDimensions.height;
  initialPos = [windowSize.horizontal / 2, windowSize.vertical / 2];
}

// When key pressed
function keyDown(e) {
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
    pairwiseForceStrength = G;
    // r - repulsion
  } else if (e.keyCode === 82) {
    gameState.gravity = false;
    gameState.repulsion = true;
    pairwiseForceStrength = R;
    // f - vacuum state (f for frictionless)
  } else if (e.keyCode === 70) {
    gameState.drag = false;
  }
  if (player) player.updatePlayerForce();
}

//  When key released
function keyUp(e) {
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
function keyPress(e) {
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

