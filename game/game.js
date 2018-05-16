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
  gravity: false,
}

var player,
    initialSize = 10,
    initialPos = [50,50],
    viewDistance = 200;

const speedUp = 0.5,
      diagonal = 1.0/Math.sqrt(2),
      maxPop = 10,
      // maxMass = ?,
      drag = 0.004,
      appetite = 0.0005,
      minSize = 10;

var sounds = [new Audio("sounds/bubble_pop.mp3")];

window.onload = function() {
  gameWindow = document.getElementById('game-display');
  updateWindowSize();

  // createPlayer();

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
  }

  // Each time the array is iterated through a new array is created,
  // This is because when I tried to use array.filter the resultant array was still the same length
  var newBlobs = [];

  for (var i = 0; i < blobs.length; i++) {
    // it might be null, skip if it is
    if (!blobs[i]) continue;

    blobs[i].blobMovement();
    blobs[i].update();

    if (player) {
      let distance = Blob.getDistance(player,blobs[i],false);
      // check if the player is touching it
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
      } else {
        blobs[i].setOpacity(Math.max(1-(distance/viewDistance), 0));
      }
    }
    
    // This loop runs for every pair of blobs
    for (var j = i + 1; j < blobs.length; j++) {
      // skip null blobs
      if (!blobs[j]) continue;
      // are they touching
      if (Blob.getDistance(blobs[i],blobs[j],false) < 0) {
        // bigger eats smaller
        (blobs[i].biggerThan(blobs[j])) ? blobs[i] = blobs[i].consume(blobs[j]) : blobs[i] = blobs[j].consume(blobs[i]);
        blobs[j] = null;
      }
    }
    // make sure the remaining blob gets carried to the next array
    newBlobs.push(blobs[i]);
  }

  // the array is updated with remaining blobs in an array with no nulls
  blobs = newBlobs;

  t=setTimeout("iteration()",1000/fps);
}

function playerDeath() {
  player = null;
  toggleInstructions();
  revealAll();
}

function revealAll() {
  for (let i = 0; i < blobs.length; i++) {
    blobs[i].setOpacity(1);
  }
}

function repopulate() {
  // adds new blobs randomly as long as the max populatoin isn't reached
  if (blobs.length < maxPop && Math.random() > 0.99) {
    // This bit randomly assigns a point of entry along the border of the play area
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
    // determines the range of new blob sizes
    let creationRadius = 10;
    if (player) creationRadius = player.getRadius();
    // create the new blob
    var newblob = new Blob(
      getCreationRadius(),
      entryPoint,
      [Math.random()*4 - 2,Math.random()*4 - 2],
      false
    );
    // put it in with its mates
    blobs.push(newblob);
  }
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
  if (e.keyCode === 39) {
    keyState.right = true;
  } else if (e.keyCode === 37) {
    keyState.left = true;
  } else if (e.keyCode === 38) {
    keyState.up = true;
  } else if (e.keyCode === 40) {
    keyState.down = true;
  } else if (e.keyCode === 71) {
    keyState.gravity = true;
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
  } else if (e.keyCode === 71) {
    keyState.gravity = false;
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

function playSound() {
  let pos = 0;
  while(sounds[pos].playing) {
      pos++;
      if( pos >= snd.length) {
          sounds.push(new Audio("sounds/bubble_pop.mp3"));
      }
  }
  sounds[pos].play();
}




// This is the class for an individual blob

class Blob {
  constructor (radius, position, velocity, isPlayer) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.force = [0,0];

    // blob only
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

  // I think these two are redundant
  getForce() {
    return this.force;
  }
  setForce(force) {
    this.force = force;
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
  blobMovement() {
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

  // update the div position and size
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

  // This function decellerates the as a function of its radius and velocity
  viscosity() {
    // this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[0],2));
    // this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[1],2));
    this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.abs(this.velocity[0]));
    this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.abs(this.velocity[1]));
  }

  // gradually shrinks blob as long as it is a bove a minimum size
  hunger() {
    if (this.radius > minSize) {
      this.radius *= (1-appetite);
    }
  }

  getRadius() {
    return this.radius;
  }

  // accelerate the blob by its force
  accelerate() {
    this.velocity[0] += speedUp*this.force[0];
    this.velocity[1] += speedUp*this.force[1];
  }

  // this function handles what happens when a blob nears the edge of screen
  borderBounce() {
    // if the blob is off the left hand side of the screen
    if (this.position[0] < -this.radius) {
      // apply a force to the right
      this.velocity[0] += speedUp;
      // if it's a non player blob
      if (!this.isPlayer) {
        // make horizontal component of it's movement (if any) positive (to the right)
        this.force[0] = Math.abs(this.force[0]);
      }
    // same for righthand side
    } else if (this.position[0] > this.radius + windowSize.horizontal) {
      this.velocity[0] -= speedUp;
      if (!this.isPlayer) {
        this.force[0] = -Math.abs(this.force[0]);
      }
    } 
    // bottom
    if (this.position[1] < -this.radius) {
      this.velocity[1] += speedUp;
      if (!this.isPlayer) {
        this.force[1] = Math.abs(this.force[1]);
      }
    // top
    } else if (this.position[1] > this.radius + windowSize.vertical) {
      this.velocity[1] -= speedUp;
      if (!this.isPlayer) {
        this.force[1] = -Math.abs(this.force[1]);
      }
    }
  }

  // When a blob leaves the screen, teleport it to the other side.
  teleport() {
    this.position[0] = ((this.position[0] + windowSize.horizontal) % (windowSize.horizontal));
    this.position[1] = ((this.position[1] + windowSize.vertical) % (windowSize.vertical));
  }

  // this master call contains all the things that need to happen to each blob each iteration
  update() {
    this.move();
    this.viscosity();
    // this.hunger();
    this.accelerate();
    // this.teleport();
    this.borderBounce();
    this.updateDiv();
    if (this.isPlayer) {
      viewDistance = player.radius*10;
    }
  }

  deleteDiv() {
    this.blobDiv.parentNode.removeChild(this.blobDiv);
  }

  biggerThan(other) {
    return (this.radius > other.radius);
  }

  // given two blobs, this function returns a single blob such that mass, centre of mass and momentum are conserved
  consume(other) {
    // relative mass
    var weighting = Math.pow(other.radius,3) / (Math.pow(this.radius,3)+Math.pow(other.radius,3)); 
    // calculates centre of mass of both blobs
    var newPosition = [
      this.position[0] + (other.position[0] - this.position[0]) * weighting,
      this.position[1] + (other.position[1] - this.position[1]) * weighting
    ];
    // calculates valocity based on total momentum
    var newVelocity = [
      this.velocity[0] + (other.velocity[0] - this.velocity[0]) * weighting,
      this.velocity[1] + (other.velocity[1] - this.velocity[1]) * weighting
    ];

    // new size
    var newRadius = Math.pow((Math.pow(this.radius,3)+Math.pow(other.radius,3)), 1/3);

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

  static applyGravity (a,b) {
  }
}