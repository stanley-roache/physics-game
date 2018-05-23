var blobs = [],
    t,
    fps = 50,
    gameWindow,
    windowSize = {
      horizontal: 0,
      vertical: 0
    };

var keyState = {
  left: false,
  right: false,
  down: false,
  up: false,
}

var gameState = {
  gravity: false,
  repulsion: false,
  drag: true,
  borderBounce: true,
  borderTeleport: false,
}

var player,
    initialSize = 10,
    initialPos = [50,50],
    pairwiseForceStrength = 0,
    viewDistance = 200;

const speedUp = 0.5,
      diagonal = 1.0/Math.sqrt(2),
      maxPop = 10,
      // maxMass = ?,
      drag = 0.004,
      appetite = 0.0005,
      G = 0.5,
      R = -0.5,
      minSize = 10,
      borderElasticity = 0.005,
      audioDepth = 5;

// this creates an array of audio objects to play the popping sound so that it can be played multiple tiems at once
var sounds = [],
    soundIndex = 0;
for (let i = 0; i < audioDepth; i++) {
  sounds.push(new Audio("sounds/bubble_pop.mp3"))
}

window.onload = function() {
  gameWindow = document.getElementById('game-display');
  updateWindowSize();

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);
  document.addEventListener('keypress', keyPress, false);

  window.addEventListener('resize', updateWindowSize, false);

  toggleInstructions();

  iteration();
};

function createPlayer() {
  player = new Blob(
    initialSize,
    // the slice makes sure a copy of the array is being passed, otherwise location and speed persist through death
    initialPos.slice(),
    [0,0],
    true
  );
}

function toggleInstructions() {
  document.getElementById('instructions').classList.toggle('hidden');
}

// this function gets called several times a second and has to loop through everything to make the game real time
function iteration() {
  // add new blobs
  repopulate();

  // player movement
  if (player) {
    player.update();
    // this updates the range of view of the player
    viewDistance = initialSize*10 + player.radius*5;
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
      let distance = Blob.getDistance(player,blobs[i],false);
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
        blobs[i].setOpacity(Math.max(1-(distance/viewDistance), 0));
        // apply gravity or repulsion in this function
        Blob.pairwiseInteraction(player,blobs[i]);
      }
    }
    
    // This loop runs for every PAIR of blobs
    for (var j = i + 1; j < blobs.length; j++) {
      // skip null blobs
      if (!blobs[j]) continue;
      // are they touching
      if (Blob.getDistance(blobs[i],blobs[j],false) < 0) {
        // bigger eats smaller
        (blobs[i].biggerThan(blobs[j])) ? blobs[i] = blobs[i].consume(blobs[j]) : blobs[i] = blobs[j].consume(blobs[i]);
        blobs[j] = null;
      } else {
        Blob.pairwiseInteraction(blobs[i],blobs[j]);
      }
    }
    // make sure the remaining blob gets carried to the next array
    newBlobs.push(blobs[i]);
  }

  // the array is updated with remaining blobs in an array with no nulls
  blobs = newBlobs;

  // calls itself again with a timeout determined by fps- frames per second, this is what makes it dynamic
  t=setTimeout("iteration()",1000/fps);
}

function playerDeath() {
  player = null;
  toggleInstructions();
  revealAll();
}

// reveal all blobs on page
function revealAll() {
  for (let i = 0; i < blobs.length; i++) {
    blobs[i].setOpacity(1);
  }
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
  let x = Math.random()*4;
  if (x < 1) {
    entryPoint = [0,windowSize.vertical*x];
  } else if (x < 2) {
    entryPoint = [windowSize.horizontal*(x-1),0];
  } else  if (x < 3) {
    entryPoint = [windowSize.horizontal,windowSize.vertical*(x-2)];
  } else {
    entryPoint = [windowSize.horizontal*(x-3),0];
  }
  return entryPoint;
}

// creates random starting velocity
function getRandomStartingVelocity() {
  return [Math.random()*4 - 2,Math.random()*4 - 2];
}

// This function defines the distribution of sizes of new blobs
function getCreationRadius() {
  // 0.8*initialSize means the smallest created is just under player starting size,
  // 5^(random^2) means the biggest size possible is 5 times the start size and the distribution is highly weighted towards smaller sizes
  return 0.8*initialSize*Math.pow(5,Math.pow(Math.random(),2));
}

// this function gets called when the window size changes, it is mainly so that the player starting point gets updated
function updateWindowSize() {
  let windowDimensions = document.getElementById('game-display').getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical   = windowDimensions.height;
  initialPos = [windowSize.horizontal/2, windowSize.vertical/2];
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
  }else if (e.keyCode === 70) {
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
  }else if (e.keyCode === 70) {
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

// when blobs collide play this sound
function playSound() {
  soundIndex = (soundIndex+1)%audioDepth;
  sounds[soundIndex].play();
}

// shifts the velocity of all blobs to zero total momentum and centre COM in middle of screen while conserving relationships
function zeroTotalMomentumAndPosition() {
  let totalMomentum = [0,0],
      totalCOM = [0,0],
      totalMass = 0,
      allBlobs = (player) ? blobs.concat([player]): blobs;
  // sum momentum, COM and mass
  for (let i = 0; i < allBlobs.length; i++) {
    let currentMass = allBlobs[i].getMass(),
        currentVelocity = allBlobs[i].getVel(),
        currentPosition = allBlobs[i].getPos();
    totalMass += currentMass;
    totalMomentum[0] += currentVelocity[0]*currentMass;
    totalMomentum[1] += currentVelocity[1]*currentMass;
    totalCOM[0] += currentPosition[0]*currentMass;
    totalCOM[1] += currentPosition[1]*currentMass;
  }
  let velocityShift = [-totalMomentum[0]/totalMass,-totalMomentum[1]/totalMass],
      positionShift = [initialPos[0] - totalCOM[0]/totalMass,initialPos[1] - totalCOM[1]/totalMass];

  // adjust all blobs
  for (let i = 0; i < allBlobs.length; i++) {
    allBlobs[i].adjustVelocityBy(velocityShift);
    allBlobs[i].adjustPositionBy(positionShift);
  }
}

// This is the class for an individual blob
class Blob {
  constructor (radius, position, velocity = [0,0], isPlayer = false, pairwiseForce = [0,0]) {
    this.radius = radius;
    this.mass = Math.pow(radius,3);
    this.position = position;
    this.velocity = velocity;
    this.force = [0,0];
    this.isPlayer = isPlayer;
    this.pairwiseForce = pairwiseForce;

    // non player blob only
    this.moving = false;

    // creates a corresponding div to display on screen
    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    gameWindow.appendChild(this.blobDiv);

    // sets the div id for player styling
    if (isPlayer) {
      this.blobDiv.id = 'player';
    }
  }

  // this master call contains all the things that need to happen to each blob each iteration
  update() {
    this.move();
    if (gameState.drag) this.viscosity();
    // this.hunger();
    this.accelerate();
    if (gameState.borderTeleport) this.teleport();
    if (gameState.borderBounce) this.borderBounce();
    this.updateDiv();
    // since the pairwise force is recalculated each iteration it needs to be rezeroed each time.
    if (gameState.gravity || gameState.repulsion) this.pairwiseForce = [0,0];
  }

  // based on the current state of arrow keys, set the force of the player
  updatePlayerForce() {
    if (keyState.up) {
      if (keyState.left) {
        //up and left
        this.force = [-diagonal, diagonal];
      } else if (keyState.right) {
        // up and right
        this.force = [diagonal,diagonal];
      } else {
        // straight up
        this.force = [0,1];
      }
    } else if (keyState.down) {
      if (keyState.left) {
        // down and left
        this.force = [-diagonal,-diagonal];
      } else if (keyState.right) {
        // down and right
        this.force = [diagonal,-diagonal];
      } else {
        // straight down
        this.force = [0,-1];
      }
    } else if (keyState.right) {
      // right
      this.force = [1,0];
    } else if (keyState.left) {
      // left
      this.force = [-1,0];
    } else {
      this.force = [0,0]
    }
  }

  // this function creates the random blob movement
  blobWander() {
    // if the blob is moving it has a chance of changing direction
    if (this.moving && Math.random() > 0.95) {
      this.newRandomDirection();
    }
    // it also has a chance to start or stop moving
    if (Math.random() > 0.993) {
      this.toggleMoving();
    }
  }

  newRandomDirection() {
    let angle = Math.random()*2*Math.PI;
    let power = Math.random();
    this.force[0] = Math.cos(angle)*power;
    this.force[1] = Math.sin(angle)*power;
  }

  toggleMoving() {
    this.moving = !(this.moving);
  }

  // definitely unnecessary but I'll levae in case
  getAbsVel() {
    return Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2));
  }

  // update the div position and size, this is what effectively links the javascript object to the DOM
  updateDiv() {
    this.blobDiv.style.left = (this.position[0] - this.radius) + 'px';
    this.blobDiv.style.bottom = (this.position[1] - this.radius) + 'px';
    this.blobDiv.style.height = this.radius*2 + 'px';
    this.blobDiv.style.width = this.radius*2 + 'px';
  }

  // This function updates the blobs position from it's current speed and position 
  move() {
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
  }

  // This function decellerates the as a function of its radius and velocity, this means bigger blobs are slower
  viscosity() {
    // this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[0],2));
    // this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[1],2));
    this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.abs(this.velocity[0]));
    this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.abs(this.velocity[1]));
  }

  // gradually shrinks blob as long as it is above a minimum size
  hunger() {
    if (this.radius > minSize) {
      this.radius *= (1-appetite);
    }
  }

  // these functions are necessary because this isn't quite a regular object but a 'class', this means
  // that from the global context blob properties can't be set manually (blob[0].radius = x), they 
  // have to be asked politely for information and be asked to change
  getRadius() {
    return this.radius;
  }
  getMass() {
    return this.mass;
  }
  getVel() {
    return this.velocity;
  }
  getPos() {
    return this.position;
  }
  getForce() {
    return this.force;
  }
  setForce(force) {
    this.force = force;
  }
  adjustVelocityBy(adjustment) {
    this.velocity[0] += adjustment[0];
    this.velocity[1] += adjustment[1];
  }
  adjustPositionBy(adjustment) {
    this.position[0] += adjustment[0];
    this.position[1] += adjustment[1];
  }

  // accelerate the blob
  accelerate() {
    // this component is the blobs own movement, player or otherwise
    if (gameState.drag) {
      this.velocity[0] += speedUp*this.force[0];
      this.velocity[1] += speedUp*this.force[1];
    }
    // this is the effect of pairwise forces on the blob
    if (gameState.gravity || gameState.repulsion) {
      this.velocity[0] += this.pairwiseForce[0]/this.mass;
      this.velocity[1] += this.pairwiseForce[1]/this.mass;
    }
  }

  // this function handles what happens when a blob nears the edge of screen
  borderBounce() {
    // if the blob is off the left hand side of the screen
    if (this.position[0] < -this.radius) {
      // apply force proportional to it's distance off screen
      this.velocity[0] -= borderElasticity*(this.position[0] + this.radius);
    // and vice versa
    } else if (this.position[0] > this.radius + windowSize.horizontal) {
      this.velocity[0] -= borderElasticity*(this.position[0] - this.radius - windowSize.horizontal);
    }

    // same for vertical
    if (this.position[1] < -this.radius) {
      this.velocity[1] -= borderElasticity*(this.position[1] + this.radius);
    } else if (this.position[1] > this.radius + windowSize.vertical) {
      this.velocity[1] -= borderElasticity*(this.position[1] - this.radius - windowSize.vertical);
    }
  }

  // When a blob leaves the screen, teleport it to the other side.
  teleport() {
    this.position[0] = ((this.position[0] + windowSize.horizontal) % (windowSize.horizontal));
    this.position[1] = ((this.position[1] + windowSize.vertical) % (windowSize.vertical));
  }

  deleteDiv() {
    this.blobDiv.parentNode.removeChild(this.blobDiv);
  }

  biggerThan(other) {
    return (this.radius >= other.radius);
  }

  // given two blobs, this function returns a single blob such that mass, centre of mass and momentum are conserved
  consume(other) {
    // relative mass
    let weighting = Math.pow(other.radius,3) / (Math.pow(this.radius,3)+Math.pow(other.radius,3)); 
    // calculates centre of mass of both blobs
    let newPosition = [
      this.position[0] + (other.position[0] - this.position[0]) * weighting,
      this.position[1] + (other.position[1] - this.position[1]) * weighting
    ];
    // calculates velocity based on total momentum
    let newVelocity = [
      this.velocity[0] + (other.velocity[0] - this.velocity[0]) * weighting,
      this.velocity[1] + (other.velocity[1] - this.velocity[1]) * weighting
    ];

    // new size that conserves mass|volume
    let newRadius = Math.pow((Math.pow(this.radius,3)+Math.pow(other.radius,3)), 1/3);

    // removes old divs from html
    other.deleteDiv();
    this.deleteDiv();

    playSound();

    // returns new Blob
    return new Blob(
      newRadius,
      newPosition,
      newVelocity,
      (this === player)
    );
  }

  setOpacity(opac) {
    this.blobDiv.style.opacity = opac;
  }

  // This function checks how far apart two blobs are, either their surfaces or their centres
  static getDistance (a,b, fromCentre) {
    var centre = Math.sqrt(
      Math.pow((a.position[0] - b.position[0]), 2) + 
      Math.pow((a.position[1] - b.position[1]), 2)
    );
    if (fromCentre) return centre;
    else return (centre - (a.radius + b.radius)); 
  }

  // deal with all pairwise interactions between blobs, assumes player will be passed first if at all (player)
  static pairwiseInteraction (a,b) {
    // gravity and repulsion interaction
    if (gameState.gravity || gameState.repulsion) {
      let distance = Blob.getDistance(a,b,true),
          magnitude = pairwiseForceStrength*a.mass*b.mass/Math.pow(distance,2);

      let forceTermHorizontal = magnitude*(a.position[0] - b.position[0])/distance,
          forceTermVertical = magnitude*(a.position[1] - b.position[1])/distance;

      a.pairwiseForce[0] -= forceTermHorizontal;
      a.pairwiseForce[1] -= forceTermVertical;
      b.pairwiseForce[0] += forceTermHorizontal
      b.pairwiseForce[1] += forceTermVertical;
    }
  }
}