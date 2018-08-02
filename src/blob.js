import { playSound } from './sound'
import { getGameWindow } from './window'
import './globals'

export default class Blob {
  constructor(radius, position, velocity = [0, 0], isPlayer = false, pairwiseForce = [0, 0]) {
    this.radius = radius;
    this.mass = Math.pow(radius, 3);
    this.position = position;
    this.velocity = velocity;
    this.force = [0, 0];
    this.isPlayer = isPlayer;
    this.pairwiseForce = pairwiseForce;

    // non player blob only
    this.moving = false;

    // creates a corresponding div to display on screen
    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    getGameWindow().appendChild(this.blobDiv);

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
    if (gameState.gravity || gameState.repulsion) this.pairwiseForce = [0, 0];
  }

  // based on the current state of arrow keys, set the force of the player
  updatePlayerForce() {
    if (keyState.up) {
      if (keyState.left) {
        //up and left
        this.force = [-diagonal, diagonal];
      } else if (keyState.right) {
        // up and right
        this.force = [diagonal, diagonal];
      } else {
        // straight up
        this.force = [0, 1];
      }
    } else if (keyState.down) {
      if (keyState.left) {
        // down and left
        this.force = [-diagonal, -diagonal];
      } else if (keyState.right) {
        // down and right
        this.force = [diagonal, -diagonal];
      } else {
        // straight down
        this.force = [0, -1];
      }
    } else if (keyState.right) {
      // right
      this.force = [1, 0];
    } else if (keyState.left) {
      // left
      this.force = [-1, 0];
    } else {
      this.force = [0, 0]
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
    let angle = Math.random() * 2 * Math.PI;
    let power = Math.random();
    this.force[0] = Math.cos(angle) * power;
    this.force[1] = Math.sin(angle) * power;
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
    this.blobDiv.style.height = this.radius * 2 + 'px';
    this.blobDiv.style.width = this.radius * 2 + 'px';
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
    this.velocity[0] *= (1 - drag * Math.sqrt(this.radius) * Math.abs(this.velocity[0]));
    this.velocity[1] *= (1 - drag * Math.sqrt(this.radius) * Math.abs(this.velocity[1]));
  }

  // gradually shrinks blob as long as it is above a minimum size
  hunger() {
    if (this.radius > minSize) {
      this.radius *= (1 - appetite);
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
      this.velocity[0] += speedUp * this.force[0];
      this.velocity[1] += speedUp * this.force[1];
    }
    // this is the effect of pairwise forces on the blob
    if (gameState.gravity || gameState.repulsion) {
      this.velocity[0] += this.pairwiseForce[0] / this.mass;
      this.velocity[1] += this.pairwiseForce[1] / this.mass;
    }
  }

  // this function handles what happens when a blob nears the edge of screen
  borderBounce() {
    // if the blob is off the left hand side of the screen
    if (this.position[0] < -this.radius) {
      // apply force proportional to it's distance off screen
      this.velocity[0] -= borderElasticity * (this.position[0] + this.radius);
      // and vice versa
    } else if (this.position[0] > this.radius + windowSize.horizontal) {
      this.velocity[0] -= borderElasticity * (this.position[0] - this.radius - windowSize.horizontal);
    }

    // same for vertical
    if (this.position[1] < -this.radius) {
      this.velocity[1] -= borderElasticity * (this.position[1] + this.radius);
    } else if (this.position[1] > this.radius + windowSize.vertical) {
      this.velocity[1] -= borderElasticity * (this.position[1] - this.radius - windowSize.vertical);
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
    let weighting = Math.pow(other.radius, 3) / (Math.pow(this.radius, 3) + Math.pow(other.radius, 3));
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
    let newRadius = Math.pow((Math.pow(this.radius, 3) + Math.pow(other.radius, 3)), 1 / 3);

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
  static getDistance(a, b, fromCentre) {
    var centre = Math.sqrt(
      Math.pow((a.position[0] - b.position[0]), 2) +
      Math.pow((a.position[1] - b.position[1]), 2)
    );
    if (fromCentre) return centre;
    else return (centre - (a.radius + b.radius));
  }

  // deal with all pairwise interactions between blobs, assumes player will be passed first if at all (player)
  static pairwiseInteraction(a, b) {
    // gravity and repulsion interaction
    if (gameState.gravity || gameState.repulsion) {
      let distance = Blob.getDistance(a, b, true),
        magnitude = pairwiseForceStrength * a.mass * b.mass / Math.pow(distance, 2);

      let forceTermHorizontal = magnitude * (a.position[0] - b.position[0]) / distance,
        forceTermVertical = magnitude * (a.position[1] - b.position[1]) / distance;

      a.pairwiseForce[0] -= forceTermHorizontal;
      a.pairwiseForce[1] -= forceTermVertical;
      b.pairwiseForce[0] += forceTermHorizontal
      b.pairwiseForce[1] += forceTermVertical;
    }
  }
}