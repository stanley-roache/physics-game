// This is the class for an individual blob in the game where blobs eat each other

class Blob {
  constructor (radius, position, velocity) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;

    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    document.getElementById('game-display').appendChild(this.blobDiv);
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
  accelerate(force) {
    this.velocity[0] += force[0];
    this.velocity[1] += force[1];
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

window.onload = function() {
  var playerBlob = new Blob(
    initialSize,
    initialPos,
    initialSpeed
  );
  blobs.push(playerBlob);
  iteration();
};

function iteration() {
  for (var i = 0; i < blobs.length; i++) {
    blobs[i].update();
  }

  t=setTimeout("iteration()",1000/fps);
}