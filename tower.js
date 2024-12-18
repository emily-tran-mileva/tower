"use strict";
let image = new Image(); // Create new img element
image.src = "art.png";
/** @type {HTMLCanvasElement} */
let canvasBase = document.getElementById("canvas");
let canvas = canvasBase.getContext("2d");
let startButton = document.getElementById("startButton");
startButton.addEventListener("click", () => {
  game.start();
});


class Cyclops {
  constructor() {
    // Top left corner of our cyclops.
    this.x = 0;
    this.y = 0;
    // A number between 0 and 3.
    this.pose = 0;
    this.distanceTraveled = 0;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.progressPerFrame = 10;
    this.drachmasReward = 50;
  }

  draw() {
    let coordinatesAndDirection = game.road.path.coordinatesAndDirectionFromProgress(
      this.distanceTraveled
    );
    const updatedCoordinates = coordinatesAndDirection.coordinates;
    const lastDirection = coordinatesAndDirection.direction;
    this.x = -20 + updatedCoordinates.x + Math.random() * 5;
    this.y = -20 + updatedCoordinates.y + Math.random() * 5;
    this.distanceTraveled = this.distanceTraveled + this.progressPerFrame;
    let poseColumn = Math.floor(this.pose);
    let poseRow = this.computePoseRow(lastDirection);

    canvas.drawImage(image, 41 * poseColumn + 1, 41 * poseRow + 1, 38, 38, this.x, this.y, 40, 40);
    canvas.beginPath();
    canvas.roundRect(this.x, this.y - 8, 40, 4, 2);
    canvas.fillStyle = "red";
    canvas.fill();
    canvas.beginPath();
    canvas.roundRect(this.x, this.y - 8, 40 * this.health / this.maxHealth, 4, 2);
    canvas.fillStyle = "green";
    canvas.fill();

    this.pose = (this.pose + 0.5) % 4;
  }

  computePoseRow(/** @type{number[]} */ direction) {
    // The angle in which the monster is facing.
    const angle = Math.atan2(
      -direction[1], direction[0]
    ) * 180 / Math.PI;
    if (angle >= -45 && angle <= 45) {
      // The angle is between -45 degress and 45 degrees.
      // Therefore the monster is facing to the right.
      return 1;
    }
    if (angle >= 45 && angle <= 135) {
      // The moster is facing up.
      return 3;
    }
    if (angle >= 135 || angle <= -135) {
      return 2;
    }
    if (angle >= -135 && angle <= -45) {
      return 0;
    }
    return 0;
  }
}


class CoordinatesAndDirection {
  constructor(coordinates,  /** @type{number[]} */direction) {
    this.coordinates = coordinates;
    this.direction = direction;
  }
}


class Coordinates {
  constructor(inputX, inputY) {
    this.x = inputX;
    this.y = inputY;
  }
}

/** 
 * The distance between two points.
 */
function vectorLength(/** @type{number[]} */ vector) {
  return Math.sqrt(dotProduct(vector, vector));
}

function vectorTimesScalar(/** @type{number[]} */vector, /** @type{number} */scalar) {
  return [vector[0] * scalar, vector[1] * scalar];
}

function dotProduct(/** @type{number[]} */ firstPoint, /** @type{number[]} */ secondPoint) {
  return firstPoint[0] * secondPoint[0] + firstPoint[1] * secondPoint[1];
}

class Segment {
  constructor(inputX1, inputY1, inputX2, inputY2) {
    this.x1 = inputX1;
    this.y1 = inputY1;
    this.x2 = inputX2;
    this.y2 = inputY2;
  }

  /** Computes the distance from a point to a segment. */
  distanceFromSegmentToPoint(x, y) {
    const segmentLength = this.pathDistance();
    const vectorFromFirstPoint = [x - this.x1, y - this.y1];
    if (segmentLength === 0) {
      // The segment is a single point.
      return vectorLength(vectorFromFirstPoint);
    }
    // Unit vector in the direction of the segment.
    const directionVector = vectorTimesScalar(this.segmentVector(), 1 / segmentLength);
    const projectionLength = dotProduct(directionVector, vectorFromFirstPoint);
    // The heel of the orthogonal projection of the point onto the segment line
    // lies outside of the segment.
    const distance1 = vectorLength(vectorFromFirstPoint);
    if (projectionLength < 0 || projectionLength > segmentLength) {
      const vectorFromSecondPoint = [x - this.x2, y - this.y2];
      const distance2 = vectorLength(vectorFromSecondPoint);
      return Math.min(distance1, distance2);
    }
    return Math.sqrt(distance1 * distance1 - projectionLength * projectionLength);
  }

  segmentVector() {
    return [
      (this.x2 - this.x1),
      (this.y2 - this.y1)
    ];
  }

  // the segment length
  pathDistance() {
    return vectorLength([this.x2 - this.x1, this.y2 - this.y1]);
  }

  /** @returns{CoordinatesAndDirection} */
  coordinatesAndDirectionFromProgress(distanceTraveled) {
    // d/p
    let progress = distanceTraveled / this.pathDistance();
    // 1-d/p
    let oneMinusProgress = 1 - progress;
    let a = this.x1 * oneMinusProgress + this.x2 * progress;
    let b = this.y1 * oneMinusProgress + this.y2 * progress;
    return new CoordinatesAndDirection(new Coordinates(a, b), this.segmentVector());
  }
}


class Game {

  start() {
    if (this.gameRunning) {
      return;
    }
    if (!this.assetsLoaded) {
      // Assets haven't loaded yet. Try again in 100ms.
      setTimeout(() => {
        this.start();
      }, 100);
      return;
    }
    this.initializeGame();
    setInterval(() => {
      this.mainLoop();
    }, this.millisecondsPerGameTick);
  }

  initializeGame() {
    this.gameRunning = true;
  }

  mainLoop() {
    this.frameCount++;
    this.prepareNextFrame();
    this.draw();
  }

  buyOrCancelPurchase() {
    if (this.towerToBePlaced !== null) {
      this.drachmas += this.towerToBePlaced.cost;
      this.towerToBePlaced = null;
      this.buyTowerButton.textContent = this.originalBuyButtonText;
      if (!this.gameRunning) {
        // The player is buying before the game started.
        this.drawMap();
        this.displayStatus();
      }
    } else {
      this.buyTower();
      if (!this.gameRunning) {
        // The player is buying before the game started.
        this.displayStatus();
      }
    }
  }

  buyTower() {
    if (this.drachmas < 100) {
      return;
    }
    this.towerToBePlaced = new ZeusTower();
    this.drachmas -= this.towerToBePlaced.cost;
    this.buyTowerButton.textContent = "Cancel";
  }

  mouseDown(/** @type{MouseEvent} */ ev) {
    this.mouseMove(ev);
    if (this.towerToBePlaced !== null && this.towerToBePlaced.isLegalToPlaceTowerHere()) {
      // Place the tower.
      this.allTowers.push(this.towerToBePlaced);
      this.towerToBePlaced.placed = true;
      this.towerToBePlaced = null;
      this.buyTowerButton.textContent = this.originalBuyButtonText;
    }
  }

  mouseMove(/** @type{MouseEvent} */ ev) {
    this.lastX = ev.clientX - this.canvasInPageX;
    this.lastY = ev.clientY - this.canvasInPageY;
    if (this.towerToBePlaced !== null) {
      this.towerToBePlaced.x = this.lastX - 20;
      this.towerToBePlaced.y = this.lastY - 20;
    }
    if (this.towerToBePlaced !== null && !this.gameRunning) {
      // The user is trying to place a tower before the game starts running.
      // Let's allow them to do so!
      this.drawMap();
      this.towerToBePlaced.draw();
    }
  }

  constructor() {
    this.gameRunning = false;
    this.frameCount = -1;
    this.millisecondsPerGameTick = 100;
    this.assetsLoaded = false;
    this.buyTowerButton = document.getElementById("buyTower");
    this.buyTowerButton.addEventListener("click", () => {
      this.buyOrCancelPurchase();
    });
    this.originalBuyButtonText = this.buyTowerButton.textContent;
    this.baseHealth = 300;
    this.frameOfDeath = -1;
    /** @type{ZeusTower|null} */
    this.towerToBePlaced = null;
    this.statusElement = document.getElementById("status");
    this.debugStatusElement = document.getElementById("debugStatus");
    this.drachmas = 101;
    canvasBase.addEventListener("mousemove", (ev) => {
      this.mouseMove(ev);
    });
    canvasBase.addEventListener("mousedown", (ev) => {
      this.mouseDown(ev);
    });
    this.lastX = 0;
    this.lastY = 0;
    let canvasBoundingRectangle = canvasBase.getBoundingClientRect();
    this.canvasInPageX = canvasBoundingRectangle.x;
    this.canvasInPageY = canvasBoundingRectangle.y;
    /** @type{ZeusTower[]} */
    this.allTowers = [];
    /** @type{Cyclops[]} */
    this.allMonsters = [];
    /** @type{MonsterSpawnEvent[]} */
    this.wave = waveData1;
    this.waveStartFrame = 0;
    // Game objects
    this.road = new Road();
  }

  spawnMonsters() {
    for (let e of this.wave) {
      this.processOneSpawnEvent(e);
    }
  }

  processOneSpawnEvent(/**  @type{MonsterSpawnEvent} */e) {
    let waveFrame = this.frameCount - this.waveStartFrame;
    if (e.startFrame > waveFrame) {
      return;
    }
    let framesSinceEventStart = waveFrame - e.startFrame;
    let progressTowardsNewSpawn = framesSinceEventStart / e.frequency;
    if (!this.isInteger(progressTowardsNewSpawn)) {
      // We are not on an exact spawning frame
      return;
    }
    if (progressTowardsNewSpawn >= e.amount) {
      // We've spawned all monsters in the event.
      return;
    }
    // We are on the exact frame for spawning a monster.
    // TODO: We need to take care of non-cyclops monsters,
    // i.e., we need to take care of e.monster != "cyclops"
    let monster = new Cyclops();
    this.allMonsters.push(monster);
  }

  isInteger(a) {
    return a === Math.floor(a);
  }

  fireAtMonsters() {
    for (let tower of this.allTowers) {
      tower.fireAtMonsters(this.allMonsters);
    }
  }
  handleMonstersAtBase() {
    let pathlength = this.road.path.totalLength();
    let monsterIndex = -1;
    let remainingMonsters = [];
    for (let monster of this.allMonsters) {
      monsterIndex++;
      if (monster.distanceTraveled < pathlength - monster.progressPerFrame - 1) {
        remainingMonsters.push(monster);
      } else {
        // the monster is at the finish line. 
        // We want it gone, so we won't add it to the remaining monsters.
        // However, it does damage!
        this.baseHealth -= monster.health;
      }
    }
    this.allMonsters = remainingMonsters;
  }

  prepareNextFrame() {
    this.spawnMonsters();
    this.reloadTowers();
    this.fireAtMonsters();
    this.handleMonstersAtBase();
    this.displayStatus();
  }

  reloadTowers() {
    for (let tower of this.allTowers) {
      tower.reload();
    }
  }

  clearCanvas(color) {
    canvas.clearRect(0, 0, canvasBase.width, canvasBase.height);
    canvas.fillStyle = color;
    canvas.fillRect(0, 0, canvasBase.width, canvasBase.height);
  }

  drawMap() {
    if (this.baseHealth < 0) {
      if (this.frameOfDeath < 0) {
        this.frameOfDeath = this.frameCount;
      }
      let framesSinceDeath = this.frameCount - this.frameOfDeath;
      let greenBlueIntensity = Math.max(0, 255 - framesSinceDeath);
      let color = `rgb(255,${greenBlueIntensity}, ${greenBlueIntensity})`;
      this.clearCanvas(color);
    } else {
      this.clearCanvas("white");
    }
    this.road.draw();

  }

  draw() {
    this.drawMap();
    for (let tower of this.allTowers) {
      tower.draw();
    }
    for (let monster of this.allMonsters) {
      monster.draw();
    }
    if (this.towerToBePlaced !== null) {
      this.towerToBePlaced.draw();
    }
  }

  displayStatus() {
    this.statusElement.textContent =
      `
      Drachmas ${this.drachmas}
      Base health ${this.baseHealth}
      `;
    this.debugStatusElement.textContent = `path length: ${this.road.path.totalLength()}`;
  }
}


class ZeusTower {
  constructor() {
    // Top left corner of the tower.
    this.x = 0;
    this.y = 0;
    // The center of the tower has coordinates:
    // this.x + this.towerWidth / 2;
    // and
    // this.y + this.towerHeight / 2;
    this.reloadTime = 5;
    this.reloadProgress = 0;
    this.placed = false;
    this.range = 150;
    this.damage = 20;
    this.lastTargetX = 0;
    this.lastTargetY = 0;
    this.attackProgress = 0;
    this.cost = 100;
    this.towerWidth = 40;
    this.towerHeight = 40;
  }

  reload() {
    this.reloadProgress++;
    if (this.reloadProgress > this.reloadTime) {
      this.reloadProgress = this.reloadTime;
    }
  }

  draw() {
    const hasLegalXYPlacement = this.isLegalToPlaceTowerHere();
    if (!this.placed && hasLegalXYPlacement) {
      canvas.lineWidth = 1;
      canvas.fillStyle = "rgba(10,25,100,0.5)";
      canvas.beginPath();
      canvas.ellipse(this.x + 20, this.y + 20, this.range, this.range, 0, 0, 360);
      canvas.fill();
    }
    if (hasLegalXYPlacement) {
      canvas.fillStyle = "rgb(255,255,255)";
    } else {
      canvas.fillStyle = "red";
    }
    canvas.fillRect(this.x, this.y, 40, 40);
    const pose = Math.min(3, this.reloadProgress);
    canvas.drawImage(image, 0 + pose * 41, 124, 39, 38, this.x, this.y, 39, 38);
    if (this.attackProgress > 0) {
      // lightning on the monster
      canvas.beginPath();
      canvas.lineWidth = 1;
      canvas.strokeStyle = "rgba(0,0,255,0.5)";
      canvas.moveTo(this.lastTargetX + 20, this.lastTargetY - 30);
      canvas.lineTo(this.lastTargetX + 20, this.lastTargetY + 5);
      canvas.stroke();
      // lightning coming off from zeus
      canvas.beginPath();
      canvas.lineWidth = 1;
      canvas.strokeStyle = "rgba(0,0,255,0.5)";
      canvas.moveTo(this.x + 20, this.y - 30);
      canvas.lineTo(this.x + 20, this.y + 5);
      canvas.stroke();
      this.attackProgress--;
    }
  }

  fireAtMonsters(/** @type{Cyclops[]} */ allMonsters) {
    if (this.reloadProgress < this.reloadTime) {
      // not reloaded yet.
      return;
    }
    /** @type{Cyclops|null} */
    let candidateTarget = null;
    let candidateIndex = -1;
    for (
      let i = 0;
      i < allMonsters.length;
      i++
    ) {
      let currentMonster = allMonsters[i];
      if (!this.isInRange(currentMonster)) {
        // Skip the rest of the commands in the for loop.
        continue;
      }
      // The candidate target must be in range.
      if (candidateTarget === null) {
        // This is the first monster that is in range!
        candidateTarget = currentMonster;
        candidateIndex = i;
      }
      if (candidateTarget.distanceTraveled < currentMonster.distanceTraveled) {
        // The current monster is farther along the path than the best candidate so far.
        candidateTarget = currentMonster;
        candidateIndex = i;
      }
    }
    if (candidateTarget === null) {
      return;
    }
    // Fire away, need to reload.
    this.reloadProgress = 0;
    this.attackProgress = 4;
    this.hasLastTarget = true;
    this.lastTargetX = candidateTarget.x;
    this.lastTargetY = candidateTarget.y;
    // The -= stuff is equivalent to: 
    // candidateTarget.health = candidateTarget.health - this.damage;
    candidateTarget.health -= this.damage;
    if (candidateTarget.health <= 0) {
      // The candidateTarget is dead.
      // Claim reward:
      game.drachmas += candidateTarget.drachmasReward;
      let lastMonsterIndex = allMonsters.length - 1;
      let lastMonster = allMonsters[lastMonsterIndex];
      // Overwrite the candidate monster with the last monster 
      // (last in the sense of last in the list of monsters, not in the 
      // sense of most distance traveled).
      allMonsters[candidateIndex] = lastMonster;
      // Remove the last Element.
      allMonsters.pop();
    }
  }

  isInRange(/** @type {Cyclops} */candidateMonster) {
    let distanceX = this.x - candidateMonster.x;
    let distanceY = this.y - candidateMonster.y;
    let distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    return distance <= this.range;
  }

  /** @return {number[][]} */
  getCorners() {
    return [
      [this.x, this.y],
      [this.x + this.towerWidth, this.y],
      [this.x + this.towerWidth, this.y + this.towerHeight],
      [this.x, this.y + this.towerHeight],
    ];
  }

  pointIsAboveTower(x, y) {
    return (
      x >= this.x &&
      x <= this.x + this.towerWidth &&
      y >= this.y &&
      y <= this.y + this.towerHeight
    );
  }

  /** 
   * Returns whether a tower that is not placed can be placed 
   * at the current x,y coordinates. 
   * @return {boolean}
   */
  isLegalToPlaceTowerHere() {
    if (this.placed) {
      // The tower is already placed, the placement is assumed to be legal.
      return true;
    }
    const corners = this.getCorners();
    for (const segment of game.road.path.segments) {
      for (const corner of corners) {
        const distance = segment.distanceFromSegmentToPoint(corner[0], corner[1]);
        if (distance < game.road.roadWidth / 2) {
          return false;
        }
      }
    }
    for (const tower of game.allTowers) {
      for (const corner of corners) {
        if (tower.pointIsAboveTower(corner[0], corner[1])) {
          // The corner of the present tower is above another tower. 
          // This means that the two squares intersect.
          // Since the tower squares are of the same size, this
          // is the only way that two towers can overlap.
          return false;
        }
      }
    }
    return true;
  }
}

class Path {
  constructor() {
    this.wayPoints = [
      [-10, 50],
      [525, 50],
      [525, 150],
      [350, 150],
      [350, 250],
      [525, 250],
      [525, 350],
      [325, 350],
      [325, 450],
      [50, 450],
      [50, 550],
      [525, 550],
      [525, 670]
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

  /** @return {CoordinatesAndDirection} */
  coordinatesAndDirectionFromProgress(distanceTraveled) {
    let remainingDistance = distanceTraveled;
    for (let i = 0; i < this.segments.length; i++) {
      let segment = this.segments[i];
      if (remainingDistance < segment.pathDistance()) {
        return segment.coordinatesAndDirectionFromProgress(remainingDistance);
      }
      remainingDistance = remainingDistance - segment.pathDistance();
    }
    let lastWaypoint = this.wayPoints[this.wayPoints.length - 1];
    let lastSegment = this.segments[this.segments.length - 1];
    return new CoordinatesAndDirection(
      new Coordinates(lastWaypoint[0], lastWaypoint[1]),
      lastSegment.segmentVector()
    );

  }

  totalLength() {
    let totalDistance = 0;
    for (let segment of this.segments) {
      totalDistance += segment.pathDistance();
    }
    return totalDistance;
  }
}


class Road {
  constructor() {
    this.path = new Path();
    this.roadWidth = 50;
  }
  draw() {
    canvas.beginPath();
    canvas.lineWidth = this.roadWidth;
    canvas.strokeStyle = "rgb(171,132,65)";
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

/** 
 * @typedef {{
 *  startFrame: number,
 *  monster: string,
 *  amount: number, 
 *  frequency: number,
 * }} MonsterSpawnEvent
 */

/** @type {MonsterSpawnEvent[]} */
let waveData1 = [
  {
    startFrame: 0,
    monster: "cyclops",
    amount: 5,
    frequency: 10
  },
  {
    startFrame: 70,
    monster: "cyclops",
    amount: 5,
    frequency: 10
  },
  {
    startFrame: 140,
    monster: "cyclops",
    amount: 10,
    frequency: 5
  },
  {
    startFrame: 210,
    monster: "cyclops",
    amount: 20,
    frequency: 3
  },
];

let game = new Game();
game.prepareNextFrame();
// Draw the game.
game.draw();

// Load all images and, when loaded, start the mainLoop();
image.addEventListener("load", () => {
  game.assetsLoaded = true;
});