"use strict";
console.log("hello world");
let image = new Image(); // Create new img element
image.src = "art.png";
console.log(image);
/** @type {HTMLCanvasElement} */
let canvasBase = document.getElementById("canvas");
let canvas = canvasBase.getContext("2d");
/** @type {HTMLCanvasElement} */
let assetCanvasBase = document.getElementById("assetCanvas");
let assetCanvas = assetCanvasBase.getContext("2d");


function clearCanvas(color) {
  canvas.clearRect(0, 0, canvasBase.width, canvasBase.height);
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, canvasBase.width, canvasBase.height);
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
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.progressPerFrame = 10;
    this.drachmasReward = 50;
  }

  draw() {
    let updatedCoordinates = mainPath.coordinatesFromProgress(this.distanceTraveled);
    this.x = -20 + updatedCoordinates.x + Math.random() * 5;
    this.y = -20 + updatedCoordinates.y + Math.random() * 5;
    this.distanceTraveled = this.distanceTraveled + this.progressPerFrame;
    canvas.drawImage(image, 41 * this.pose + 2, 0, 38, 40, this.x, this.y, 40, 40);
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
  // the segment length
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


class Game {
  buyTower() {
    if (this.drachmas < 100) {
      return;
    }

    this.drachmas = -100 + this.drachmas;
    this.towerToBePlaced = new ZeusTower();
  }

  mouseDown(/** @type{MouseEvent} */ ev) {
    this.mouseMove(ev);
    if (this.towerToBePlaced !== null) {
      this.allTowers.push(this.towerToBePlaced);
      this.towerToBePlaced.placed = true;
      this.towerToBePlaced = null;
    }
  }

  mouseMove(/** @type{MouseEvent} */ ev) {
    this.lastX = ev.clientX - this.canvasInPageX;
    this.lastY = ev.clientY - this.canvasInPageY;
    if (this.towerToBePlaced !== null) {
      this.towerToBePlaced.x = this.lastX - 20;
      this.towerToBePlaced.y = this.lastY - 20;
    }
  }

  constructor() {
    this.buyTowerButton = document.getElementById("buyTower");
    this.buyTowerButton.addEventListener("click", () => {
      this.buyTower();
    });
    this.baseHealth = 2000;
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
  }

  spawnMonsters() {
    for (let e of this.wave) {
      this.processOneSpawnEvent(e);
    }
  }

  processOneSpawnEvent(/**  @type{MonsterSpawnEvent} */e) {
    let waveFrame = frameCount - this.waveStartFrame;
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
    let pathlength = road.path.totalLength();
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
    this.fireAtMonsters();
    this.handleMonstersAtBase();
    this.displayStatus();
  }

  draw() {
    if (this.baseHealth < 0) {
      if (this.frameOfDeath < 0) {
        this.frameOfDeath = frameCount;
      }
      let framesSinceDeath = frameCount - this.frameOfDeath;
      let greenBlueIntensity = Math.max(0, 255 - framesSinceDeath);
      let color = `rgb(255,${greenBlueIntensity}, ${greenBlueIntensity})`;
      clearCanvas(color);
    } else {
      clearCanvas("white");
    }
    road.draw();
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
    this.debugStatusElement.textContent = `path length: ${road.path.totalLength()}`;
  }
}


class ZeusTower {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.reloadTime = 5;
    this.reloadProgress = 8;
    this.placed = false;
    this.range = 150;
    this.damage = 20;
    this.lastTargetX = 0;
    this.lastTargetY = 0;
    this.attackProgress = 0;
  }

  draw() {
    this.reloadProgress++;
    if (this.reloadProgress > this.reloadTime) {
      this.reloadProgress = this.reloadTime;
    }
    if (!this.placed) {
      canvas.lineWidth = 1;
      canvas.fillStyle = "rgba(10,25,100,0.5)";
      canvas.beginPath();
      canvas.ellipse(this.x + 20, this.y + 20, this.range, this.range, 0, 0, 360);
      canvas.fill();
    }
    canvas.fillStyle = "rgb(255,255,255)";
    canvas.fillRect(this.x, this.y, 40, 40);
    canvas.drawImage(image, 2, 42, 38, 40, this.x, this.y, 40, 40);
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
  }
  draw() {
    canvas.beginPath();
    canvas.lineWidth = 50;
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
5

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

// Game objects
let mainPath = new Path();
let road = new Road();
let game = new Game();

// Main loop of the game.
function mainLoop() {
  game.prepareNextFrame();
  game.draw();
  frameCount++;
}

// Load all images and, when loaded, start the mainLoop();
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
  setInterval(mainLoop, 100);
});