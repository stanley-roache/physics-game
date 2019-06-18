window.GLOBALS = {
  blobs: [],
  windowSize: {
    horizontal: 0,
    vertical: 0
  },
  keyState: {
    left: false,
    right: false,
    down: false,
    up: false,
  },
  gameState: {
    gravity: false,
    repulsion: false,
    drag: true,
    borderBounce: true,
    borderTeleport: false,
  },
  player: null,
  pairwiseForceStrength: 1,
  viewDistance: 200,
  initialSize: 14,
  initialPos: [50, 50],
  speedUp: 0.5,
  diagonal: 1.0 / Math.sqrt(2),
  maxPop: 10,
  drag: 0.004,
  appetite: 0.0005,
  G: 0.5,
  R: -0.5,
  minSize: 10,
  borderElasticity: 0.005,
  fps: 50
}
