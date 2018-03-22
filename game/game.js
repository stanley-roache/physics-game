var blobs = [];
var t;
var fps = 50;
var gameWindow;
var windowSize = {
  horizontal: 0,
  vertical: 0
}


var initialSize = 50,
    initialPos = [50,50],
    initialSpeed = [10,10];
var player;


const speedUp = 1;
const diagonal = 1.0/Math.sqrt(2);

window.onload = function() {
  gameWindow = document.getElementById('game-display');
  updateWindowSize();

  player = new Blob(
    initialSize,
    initialPos,
    initialSpeed
  );

  document.addEventListener('keydown', keyDown, false);
  document.addEventListener('keyup', keyUp, false);

  blobs.push(player);
  iteration();
};

function updateWindowSize() {
  var windowDimensions = gameWindow.getBoundingClientRect();
  windowSize.horizontal = windowDimensions.width;
  windowSize.vertical   = windowDimensions.height;
}

function iteration() {
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].update();
  }

  t=setTimeout("iteration()",1000/fps);
}

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
  constructor (radius, position, velocity) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.force = {
      right: false,
      left: false,
      up: false,
      down: false
    }

    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    gameWindow.appendChild(this.blobDiv);
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

  getAbsVel() {
    return Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2));
  }

  updateDiv() {
    this.blobDiv.style.left = this.position[0] + 'px';
    this.blobDiv.style.bottom = this.position[1] + 'px';
    this.blobDiv.style.height = this.radius*2 + 'px';
    this.blobDiv.style.width = this.radius*2 + 'px';
  }

  // This function updates the blobs position from it's current speed and position 
  move() {
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    // this.viscosity();
  }

  // This function decellerates the blob proportional to it's current velocity
  viscosity() {
    this.velocity[0] *= 0.95;
    this.velocity[1] *= 0.95;
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
    this.position[0] = ((this.position[0] + windowSize.horizontal + 6*this.radius) % (windowSize.horizontal + 4*this.radius)) - 2*this.radius;
    this.position[1] = ((this.position[1] + windowSize.vertical + 6*this.radius) % (windowSize.vertical + 4*this.radius)) - 2*this.radius;
  }

  update() {
    this.move();
    this.viscosity();
    this.accelerate();
    this.teleport();
    this.updateDiv();
  }

  // This function checks if two blobs are contacting each other
  static checkContact (a,b) {
    return a.radius + b.radius <= Math.sqrt(Math.pow(a.position[0] - b.position[0], 2) + Math.pow(a.position[1] - b.position[1], 2)); 
  }
}