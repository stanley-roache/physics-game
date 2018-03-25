var blobs = [];
var t;
var fps = 50;
var gameWindow;
var windowSize = {
  horizontal: 0,
  vertical: 0
}

var player,
    initialSize = 10,
    initialPos = [50,50],
    initialSpeed = [0,0];

const speedUp = 0.5,
      diagonal = 1.0/Math.sqrt(2),
      maxPop = 10,
      // maxMass = ?,
      drag = 0.004,
      appetite = 0.0005,
      minSize = 10;

window.onload = function() {
  gameWindow = document.getElementById('game-display');
  updateWindowSize();

  initialPos = [windowSize.horizontal/2, windowSize.vertical/2];

  // createPlayer();

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);
  document.addEventListener('keypress', keyPress, false);

  iteration();
};

function createPlayer() {
  player = new Blob(
    initialSize,
    // the slice makes sure a copy of the array is being passed, otherwise location and speed persist through death
    initialPos.slice(),
    initialSpeed.slice(),
    true
  );
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
      // check if the player is touching it
      if (Blob.getDistance(player,blobs[i],false) < 0) {
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
          // eaten! in this case we keep checking if this blob eats anything else so there is no continue statement
          blobs[i] = blobs[i].consume(player);
          player = null;
        }
      }
    }
    


    // blob eats other blobs
    for (var j = i + 1; j < blobs.length; j++) {
      // skip null blobs
      if (!blobs[j]) continue;
      // are they touching
      if (Blob.getDistance(blobs[i],blobs[j],false) < 0) {
        // is the current bigger or smaller
        if (blobs[i].biggerThan(blobs[j])) {
          blobs[i] = blobs[i].consume(blobs[j]);
          blobs[j] = null;
        } else {
          blobs[i] = blobs[j].consume(blobs[i]);
          blobs[j] = null;
        }
      }
    }
    // make sure the remaining blob gets carried to the next array
    newBlobs.push(blobs[i]);
  }

  // the array is updated with remaining blobs in an array with no nulls
  blobs = newBlobs;

  t=setTimeout("iteration()",1000/fps);
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
    // create the new blob
    let creationRadius = 10;
    if (player) creationRadius = player.getRadius();
    var newblob = new Blob(
      Math.random()*creationRadius*0.8 + creationRadius*0.75,
      entryPoint,
      [Math.random()*4 - 2,Math.random()*4 - 2],
      false
    );
    // put it in with its mates
    blobs.push(newblob);
  }
}

function updateWindowSize() {
  var windowDimensions = gameWindow.getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical   = windowDimensions.height;
}

// When key pressed
function keyDown(e) {
  if (player) {
    if (e.keyCode === 39) {
      player.setRight(true);
    } else if (e.keyCode === 37) {
      player.setLeft(true);
    }
    if (e.keyCode === 38) {
      player.setUp(true);
    } else if (e.keyCode === 40) {
      player.setDown(true);
    }
  }
}

//  When key released
function keyUp(e) {
  if (player) {
    if (e.keyCode === 39) {
      player.setRight(false);
    } else if (e.keyCode === 37) {
      player.setLeft(false);
    }
    if (e.keyCode === 38) {
      player.setUp(false);
    } else if (e.keyCode === 40) {
      player.setDown(false);
    }
  }
}

// when key pressed
function keyPress(e) {
  if ( (!player) && (e.keyCode === 32) ) {
    createPlayer();
  } 
}




// This is the class for an individual blob

class Blob {
  constructor (radius, position, velocity, isPlayer) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;

    // player only
    this.force = {
      right: false,
      left: false,
      up: false,
      down: false
    }

    // blob only
    this.moving = false;

    // creates a corresponding div to display on screen
    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    gameWindow.appendChild(this.blobDiv);

    if (isPlayer) {
      this.blobDiv.id = 'player';
    }
  }

  setDown(down) {
    this.force.down = down;
  }
  setUp(up) {
    this.force.up = up;
  }
  setLeft(left) {
    this.force.left = left;
  }
  setRight(right) {
    this.force.right = right;
  }
  getForce() {
    return this.force;
  }
  setForce(force) {
    this.force = force;
  }

  blobMovement() {
    if (this.moving && Math.random() > 0.95) {
      this.newRandomDirection();
    }
    if (Math.random() > 0.993) {
      this.toggleMoving();
      if (this.moving) {
        this.newRandomDirection();
        return;
      }
    }
  }

  newRandomDirection() {
    this.force.left = false;
    this.force.right = false;
    this.force.up = false;
    this.force.down = false;
    switch (Math.floor(Math.random()*8)) {
      case 0:
        this.force.left = true;
        break;
      case 1:
        this.force.left = true;
        this.force.up = true;
        break;
      case 2:
        this.force.up = true;
        break;
      case 3:
        this.force.right = true;
        this.force.up = true;
        break;
      case 4:
        this.force.right = true;
        break;
      case 5:
        this.force.right = true;
        this.force.down = true;
        break;
      case 6:
        this.force.down = true;
        break;
      case 7:
        this.force.left = true;
        this.force.down = true;
        break;
    }
  }


  // some of these moving functions might be unnecessary
  isMoving() {
    return this.moving;
  }

  setMoving(moving) {
    this.moving = moving;
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

  // This function decellerates the blob proportional to it's current velocity and its radius
  viscosity() {
    // this.velocity[0] *= (1-drag*Math.pow(this.radius,2));
    // this.velocity[1] *= (1-drag*Math.pow(this.radius,2));
    this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[0],2));
    this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[1],2));
  }

  // gradually shrinks blob
  hunger() {
    if (this.radius > minSize) {
      this.radius *= (1-appetite);
    }
  }

  getRadius() {
    return this.radius;
  }

  // This function checks if the arrow keys are pressed and accelerates blob in one of 8 directions
  // by the constant speedUp
  accelerate() {
    if (this.force.up) {
      if (this.force.left) {
        //up and left
        this.velocity[1] += speedUp*diagonal;
        this.velocity[0] -= speedUp*diagonal;
      } else if (this.force.right) {
        // up and right
        this.velocity[1] += speedUp*diagonal;
        this.velocity[0] += speedUp*diagonal;
      } else {
        // straight up
        this.velocity[1] += speedUp;
      }
    } else if (this.force.down) {
      if (this.force.left) {
        // down and left
        this.velocity[1] -= speedUp*diagonal;
        this.velocity[0] -= speedUp*diagonal;
      } else if (this.force.right) {
        // down and right
        this.velocity[1] -= speedUp*diagonal;
        this.velocity[0] += speedUp*diagonal;
      } else {
        // straight down
        this.velocity[1] -= speedUp;
      }
    } else if (this.force.right) {
      // right
      this.velocity[0] += speedUp;
    } else if (this.force.left) {
      // left
      this.velocity[0] -= speedUp;
    }
  }

  borderBounce() {
    this.isMoving = true;
    if (this.position[0] < -this.radius) {
      this.velocity[0] += speedUp;
      if (!this.isPlayer) {
        this.force.left = false;
        this.force.right = true;
      }
    } else if (this.position[0] > this.radius + windowSize.horizontal) {
      if (!this.isPlayer) {
        this.force.right = false;
        this.force.left = true;
      }
      this.velocity[0] -= speedUp;
    } else if (this.position[1] < -this.radius) {
      if (!this.isPlayer) {
        this.force.down = false;
        this.force.up = true;
      }
      this.velocity[1] += speedUp;
    } else if (this.position[1] > this.radius + windowSize.vertical) {
      if (!this.isPlayer) {
        this.force.up = false;
        this.force.down = true;
      }
      this.velocity[1] -= speedUp;
    }
  }

  // When a blob leaves the screen, teleport it to the other side.
  teleport() {
    // out left hand side
    this.position[0] = ((this.position[0] + windowSize.horizontal) % (windowSize.horizontal));
    this.position[1] = ((this.position[1] + windowSize.vertical) % (windowSize.vertical));
  }

  // this master call contains all the things that need to happen to each blob each iteration
  update() {
    this.move();
    this.viscosity();
    this.hunger();
    this.accelerate();
    // this.teleport();
    this.borderBounce();
    this.updateDiv();
  }

  deleteDiv() {
    this.blobDiv.parentNode.removeChild(this.blobDiv);
  }

  biggerThan(other) {
    return (this.radius > other.radius);
  }

  // this gets called when blobs contact each other and the bigger one eats the smaller one
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

    // returns new Blob
    return new Blob(
      newRadius,
      newPosition,
      newVelocity,
      (this === player)
    );
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
}