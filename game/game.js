class Blob {
  constructor (radius, position, velocity, colour) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.colour = colour;
  }

  getAbsVel() {
    return Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
  }

  // This function updates the blobs position from it's current speed and position 
  move() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    // this.viscosity();
  }

  // This function decellerates the blob proportional to it's current velocity
  viscosity() {
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
  }

  // This function applies a force to the blob and accelerates it
  accelerate(force) {
    this.velocity.x += force[0];
    this.velocity.y += force[1];
  }

  // This function checks if two blobs are contacting each other
  static checkContact (a,b) {
    return a.radius + b.radius <= Math.sqrt(Math.pow(a.position.x - b.position.x, 2) + Math.pow(a.position.y - b.position.y, 2)); 
  }
}

document.addEventListener("DOMContentLoaded", function() {
  
});