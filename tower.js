"use strict";
console.log("hello world");
let image = new Image(); // Create new img element
image.src = "cyclops.png";
console.log(image);
/** @type {HTMLCanvasElement} */
let canvasBase = document.getElementById("canvas");
let canvas = canvasBase.getContext("2d");
/** @type {HTMLCanvasElement} */
let assetCanvasBase = document.getElementById("assetCanvas");
let assetCanvas = assetCanvasBase.getContext("2d");
image.addEventListener("load", () => {
  assetCanvas.drawImage(image, 0, 0);
  for (let i = 1; i < 4; i++) {
    assetCanvas.beginPath();
    assetCanvas.moveTo(i * 41, 0);
    assetCanvas.lineTo(i * 41, 40);
    assetCanvas.strokeStyle = "white";
    assetCanvas.lineWidth = 3;
    assetCanvas.stroke();
  }
  run();

});

function clearCanvas() {
  canvas.clearRect(0, 0, canvasBase.width, canvasBase.height);
}

function run() {
  setInterval(mainLoop, 100);

}
let frameCount = 0;

class Cyclops {
  constructor() {
    // Top left corner of our cyclops.
    this.x = 0;
    this.y = 0;
    // A number between 0 and 3.
    this.pose = 0;
    this.distanceTraveled = 0;
    this.maxHealth = 300;
    this.health = this.maxHealth;
  }
  draw() {
    let updatedCoordinates = mainPath.coordinatesFromProgress(this.distanceTraveled);
    this.x = -20 + updatedCoordinates.x + Math.random() * 5;
    this.y = -20 + updatedCoordinates.y + Math.random() * 5;
    this.distanceTraveled = this.distanceTraveled + 10;
    canvas.drawImage(image, 41 * this.pose, 0, 40, 40, this.x, this.y, 40, 40);
    canvas.beginPath();
    canvas.roundRect(this.x, this.y - 8, 40, 4, 2);
    canvas.fillStyle = "red";
    canvas.fill();
    canvas.beginPath();
    canvas.roundRect(this.x, this.y - 8, 40 * this.health / this.maxHealth, 4, 2);
    canvas.fillStyle = "green";
    canvas.fill();

    this.pose = (this.pose + 1) % 4;
  }
}
class Coordinates {
  constructor(inputX, inputY) {
    this.x = inputX;
    this.y = inputY;
  }
}

class Segment {
  constructor(inputX1, inputY1, inputX2, inputY2) {
    this.x1 = inputX1;
    this.y1 = inputY1;
    this.x2 = inputX2;
    this.y2 = inputY2;
  }
  pathDistance() {
    let aSquared = (this.x2 - this.x1) * (this.x2 - this.x1);
    let bSquared = (this.y2 - this.y1) * (this.y2 - this.y1);
    return Math.sqrt(aSquared + bSquared);

  }
  coordinatesFromProgress(distanceTraveled) {
    // d/p
    let progress = distanceTraveled / this.pathDistance();
    // 1-d/p
    let oneMinusProgress = 1 - progress;
    let a = this.x1 * oneMinusProgress + this.x2 * progress;
    let b = this.y1 * oneMinusProgress + this.y2 * progress;
    return new Coordinates(a, b);
  }
}

class Path {
  constructor() {
    this.wayPoints = [
      [0, 0],
      [100, 100],
      [100, 150],
      [200, 300],
      [200, 350]
    ];
    /** @type {Segment[]} */
    this.segments = [];
    for (let i = 0; i < this.wayPoints.length - 1; i++) {
      let wayPoint1 = this.wayPoints[i];
      let wayPoint2 = this.wayPoints[i + 1];
      let segment = new Segment(wayPoint1[0], wayPoint1[1], wayPoint2[0], wayPoint2[1]);
      this.segments.push(segment);
    }
  }
  coordinatesFromProgress(distanceTraveled) {
    let remainingDistance = distanceTraveled;
    for (let i = 0; i < this.segments.length; i++) {
      let segment = this.segments[i];
      if (remainingDistance < segment.pathDistance()) {
        return segment.coordinatesFromProgress(remainingDistance);
      }
      remainingDistance = remainingDistance - segment.pathDistance();
    }
    let lastWaypoint = this.wayPoints[this.wayPoints.length - 1];
    return new Coordinates(lastWaypoint[0], lastWaypoint[1]);

  }
}
class Road {
  constructor() {
    this.path = new Path();
  }
  draw() {
    canvas.beginPath();
    canvas.lineWidth = 50;
    canvas.strokeStyle = "rgb(200,200,0)";
    canvas.moveTo(this.path.segments[0].x1, this.path.segments[0].y1);
    for (let i = 0; i < this.path.segments.length; i++) {
      let segment = this.path.segments[i];
      this.drawSegment(segment);
    }
    //canvas.clip();
    canvas.stroke();
  }

  drawSegment(/** @type{Segment} */ segment) {
    canvas.lineTo(segment.x2, segment.y2);
  }
}

let mainPath = new Path();
let cyclops1 = new Cyclops();
let road = new Road();
function mainLoop() {
  frameCount++;
  clearCanvas();
  road.draw();
  cyclops1.draw();
  //  cyclops2.draw();
}
