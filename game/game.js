var blobs = [];
var t;
var fps = 50;
var gameWindow;
var windowSize = {
  horizontal: 0,
  vertical: 0
}


var initialSize = 10,
    initialPos = [50,50],
    initialSpeed = [0,0];
var player;


const speedUp = 0.5,
      diagonal = 1.0/Math.sqrt(2),
      maxPop = 15;
      drag = 0.004;
      appetite = 0.0001;
      minSize = 10;

window.onload = function() {
  gameWindow = document.getElementById('game-display');
  updateWindowSize();

  createPlayer();

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);

  iteration();
};

function createPlayer() {
  player = new Blob(
    initialSize,
    initialPos,
    initialSpeed,
    true
  );
}

function iteration() {
  repopulate();

  player.update();

  // Each time the array is iterated through a new array is created,
  // This is because when I tried to use array.filter the resultant array was still the same length
  var newBlobs = [];

  for (var i = 0; i < blobs.length; i++) {
    // it might be null, skip if it is
    if (!blobs[i]) continue;

    blobs[i].blobMovement();
    blobs[i].update();

    // make player eat blobs it is in contact with
    if (Blob.getDistance(player,blobs[i],false) < 0) {
      if (player.biggerThan(blobs[i])) {
        // combine blobs, create new player blob and carry over force
        var currentForce = player.getForce();
        player = player.consume(blobs[i]);
        player.setForce(currentForce);
        // player.updateDiv();

        blobs[i] = null;
      } else {
        // eaten!
        blobs[i] = blobs[i].consume(player);
      }
      continue;
    }


    // blob eats other blobs
    for (var j = i + 1; j < blobs.length; j++) {
      if (!blobs[j]) continue;
      if (Blob.getDistance(blobs[i],blobs[j],false) < 0) {
        if (blobs[i].biggerThan(blobs[j])) {
          blobs[i] = blobs[i].consume(blobs[j]);
          blobs[j] = null;
        } else {
          blobs[i] = blobs[j].consume(blobs[i]);
          blobs[j] = null;
        }
      }
    }
    newBlobs.push(blobs[i]);
  }

  blobs = newBlobs;

  t=setTimeout("iteration()",1000/fps);
}

function repopulate() {
  blobs.filter(function(blob) {
    return (blob != null);
  });

  if (blobs.length < maxPop && Math.random() > 0.99) {
    var newblob = new Blob(
      Math.random() * player.getRadius()*0.8 + player.getRadius()*0.75,
      [0,0],
      [Math.random()*10 - 5,Math.random()*10 - 5],
      false
    );
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

//  When key released
function keyUp(e) {
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




// This is the class for an individual blob in the game where blobs eat each other

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

  isMoving() {
    return this.moving;
  }

  setMoving(moving) {
    this.moving = moving;
  }

  toggleMoving() {
    this.moving = !(this.moving);
  }

  getAbsVel() {
    return Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2));
  }

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
  // When a blob leaves the screen, teleport it to the other side.
  teleport() {
    // out left hand side
    this.position[0] = ((this.position[0] + windowSize.horizontal) % (windowSize.horizontal));
    this.position[1] = ((this.position[1] + windowSize.vertical) % (windowSize.vertical));
  }

  update() {
    this.move();
    this.viscosity();
    this.hunger();
    this.accelerate();
    this.teleport();
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