import { playSound } from './sound'
import { getGameWindow } from './window'
import {
  add,
  sub,
  product,
  multiply,
  mag
} from './vectorOperations';

let {
  windowSize,
  keyState,
  gameState,
  pairwiseForceStrength,
  speedUp,
  diagonal,
  drag,
  appetite,
  G,
  R,
  minSize,
  borderElasticity,
  globalOpacity,
} = window.GLOBALS;

export default class Blob {
  constructor(
    radius,
    position,
    velocity = [0, 0],
    isPlayer = false,
    pairwiseForce = [0, 0]
  ) {
    this.radius = radius;
    this.mass = Math.pow(radius, 3);
    this.position = position;
    this.velocity = velocity;
    this.force = [0, 0];
    this.isPlayer = isPlayer;
    this.pairwiseForce = pairwiseForce;

    // non player blob only
    this.moving = false;

    this.blobDiv = document.createElement('div');
    this.blobDiv.classList.add('blob');
    getGameWindow().appendChild(this.blobDiv);

    if (isPlayer) {
      this.blobDiv.id = 'player';
    }
  }

  updateMovement() {
    this.move();
    if (gameState.drag) this.viscosity();
    // this.hunger();
    this.accelerate();
    if (gameState.borderTeleport) this.teleport();
    if (gameState.borderBounce) this.borderBounce();
    this.updateDiv();
    this.pairwiseForce = [0, 0];
  }

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
      this.force = [0, 0];
    }
  }

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
    this.force = multiply(
      power,
      [Math.cos(angle), Math.sin(angle)]
    );
    //this.force[0] = Math.cos(angle) * power;
    //this.force[1] = Math.sin(angle) * power;
  }

  toggleMoving() {
    this.moving = !this.moving;
  }

  // definitely unnecessary but I'll levae in case
  getAbsVel() {
    return mag(this.velocity);
  }

  updateDiv() {
    this.blobDiv.style.left = this.position[0] - this.radius + 'px';
    this.blobDiv.style.bottom = this.position[1] - this.radius + 'px';
    this.blobDiv.style.height = this.radius * 2 + 'px';
    this.blobDiv.style.width = this.radius * 2 + 'px';
  }

  move() {
    this.position = add(
      this.position,
      this.velocity
    );
    //this.position[0] += this.velocity[0];
    //this.position[1] += this.velocity[1];
  }

  viscosity() {
    // this.velocity[0] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[0],2));
    // this.velocity[1] *= (1-drag*Math.sqrt(this.radius)*Math.pow(this.velocity[1],2));
    this.velocity[0] *= 1 - drag * Math.sqrt(this.radius) * Math.abs(this.velocity[0]);
    this.velocity[1] *= 1 - drag * Math.sqrt(this.radius) * Math.abs(this.velocity[1]);
  }

  hunger() {
    if (this.radius > minSize) {
      this.radius *= 1 - appetite;
    }
  }

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
    this.velocity = add(
      this.velocity,
      this.adjustment
    );
    //this.velocity[0] += adjustment[0];
    //this.velocity[1] += adjustment[1];
  }
  adjustPositionBy(adjustment) {
    this.position = add(
      this.position,
      this.adjustment
    );
    //this.position[0] += adjustment[0];
    //this.position[1] += adjustment[1];
  }

  // accelerate the blob
  accelerate() {
    // this component is the blobs own movement, player or otherwise
    if (gameState.drag) {
      this.velocity = add(
        this.velocity,
        multiply(
          speedUp,
          this.force
        )
      );
      //this.velocity[0] += speedUp * this.force[0];
      //this.velocity[1] += speedUp * this.force[1];
    }
    // this is the effect of pairwise forces on the blob
    if (gameState.gravity || gameState.repulsion) {
      this.velocity[0] += this.pairwiseForce[0] / this.mass;
      this.velocity[1] += this.pairwiseForce[1] / this.mass;
    }
  }

  borderBounce() {
    if (this.position[0] < -this.radius) {
      this.velocity[0] -= borderElasticity * (this.position[0] + this.radius);
    } else if (this.position[0] > this.radius + windowSize.horizontal) {
      this.velocity[0] -= borderElasticity * (this.position[0] - this.radius - windowSize.horizontal);
    }

    if (this.position[1] < -this.radius) {
      this.velocity[1] -= borderElasticity * (this.position[1] + this.radius);
    } else if (this.position[1] > this.radius + windowSize.vertical) {
      this.velocity[1] -= borderElasticity * (this.position[1] - this.radius - windowSize.vertical);
    }
  }

  teleport() {
    this.position[0] = (this.position[0] + windowSize.horizontal) % windowSize.horizontal;
    this.position[1] = (this.position[1] + windowSize.vertical) % windowSize.vertical;
  }

  deleteDiv() {
    this.blobDiv.parentNode.removeChild(this.blobDiv);
  }

  biggerThan(other) {
    return this.radius >= other.radius;
  }

  // given two blobs, this function returns a single blob such that mass, centre of mass and momentum are conserved
  consume(other, playerEats = false) {
    // relative mass
    const weighting =
      Math.pow(other.radius, 3) /
      (Math.pow(this.radius, 3) + Math.pow(other.radius, 3));
    // calculates centre of mass of both blobs
    let newPosition = [
      this.position[0] + (other.position[0] - this.position[0]) * weighting,
      this.position[1] + (other.position[1] - this.position[1]) * weighting,
    ];
    // calculates velocity based on total momentum
    let newVelocity = [
      this.velocity[0] + (other.velocity[0] - this.velocity[0]) * weighting,
      this.velocity[1] + (other.velocity[1] - this.velocity[1]) * weighting,
    ];

    // new size that conserves mass|volume
    let newRadius = Math.pow(
      Math.pow(this.radius, 3) + Math.pow(other.radius, 3),
      1 / 3
    );

    // removes old divs from html
    other.deleteDiv();
    const currentOpacity = this.getOpacity();
    this.deleteDiv();

    playSound();

    // returns new Blob
    const newBlob = new Blob(
      newRadius,
      newPosition,
      newVelocity,
      playerEats
    );

    newBlob.setOpacity(currentOpacity);

    return newBlob;
  }

  setOpacity(opac) {
    this.blobDiv.style.opacity = opac;
  }

  getOpacity() {
    return this.blobDiv.style.opacity;
  }

  // This function checks how far apart two blobs are, either their surfaces or their centres
  static getDistance(a, b, fromCentre) {
    const centre = Math.sqrt(
      Math.pow(a.position[0] - b.position[0], 2) +
      Math.pow(a.position[1] - b.position[1], 2)
    );
    return fromCentre
      ? centre
      : centre - (a.radius + b.radius);
  }

  // deal with all pairwise interactions between blobs, assumes player will be passed first if at all (player)
  static pairwiseInteraction(a, b) {
    // gravity and repulsion interaction
    if (gameState.gravity || gameState.repulsion) {
      const distance = Blob.getDistance(a, b, true);
      let magnitude = pairwiseForceStrength * a.mass * b.mass / Math.pow(distance, 2);

      magnitude *= gameState.gravity ? G : R;

      const forceTermHorizontal = magnitude * (a.position[0] - b.position[0]) / distance;
      const forceTermVertical = magnitude * (a.position[1] - b.position[1]) / distance;

      a.pairwiseForce[0] -= forceTermHorizontal;
      a.pairwiseForce[1] -= forceTermVertical;
      b.pairwiseForce[0] += forceTermHorizontal;
      b.pairwiseForce[1] += forceTermVertical;
    }
  }
}
