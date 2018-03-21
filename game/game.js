// This is the class for an individual blob in the game where blobs eat each other

class Blob {
  constructor (radius, position, velocity, colour) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.colour = colour;
  }

  getAbsVel() {
    return Math.sqrt(Math.pow(this.velocity[0], 2) + Math.pow(this.velocity[1], 2));
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

  // This function checks if two blobs are contacting each other
  static checkContact (a,b) {
    return a.radius + b.radius <= Math.sqrt(Math.pow(a.position[0] - b.position[0], 2) + Math.pow(a.position[1] - b.position[1], 2)); 
  }
}

var blobs = [];

document.addEventListener("DOMContentLoaded", function() {
  var playerBlob = new Blob(
    10,
    [50, 50],
    [3,3],
  );
});