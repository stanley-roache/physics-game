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
    document.getElementById('game-display').appendChild(this.blobDiv);
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
    this.blobDiv.style.left = this.position[1] + 'px';
    this.blobDiv.style.bottom = this.position[0] + 'px';
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

  // This function applies a force to the blob and accelerates it
  accelerate() {
    if (this.force.up)        this.velocity[1] += speedUp;
    else if (this.force.down) this.velocity[1] -= speedUp;

    if (this.force.right)     this.velocity[0] += speedUp;
    else if (this.force.left) this.velocity[0] -= speedUp;
  }

  update() {
    this.move();
    this.viscosity();
    this.updateDiv();
  }

  // This function checks if two blobs are contacting each other
  static checkContact (a,b) {
    return a.radius + b.radius <= Math.sqrt(Math.pow(a.position[0] - b.position[0], 2) + Math.pow(a.position[1] - b.position[1], 2)); 
  }
}







var blobs = [];
var t;
var fps = 50;
var initialSize = 50,
    initialPos = [50,50],
    initialSpeed = [10,10];
var player;
const speedUp = 1;

window.onload = function() {
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