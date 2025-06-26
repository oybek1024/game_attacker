import type { STATE_MODEL, OneArrow, OneEnemy } from "./types";

import {
  FPS,
  AIM_RADIUS,
  ARROW_RADIUS,
  ENEMY_RADIUS,
  LIFE_AMOUNT,
  ATTACKER_RADIUS,
  BEAK_LENGTH,
} from "./constants";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const STATE: STATE_MODEL = {
  BOX_CENTER_X: window.innerWidth / 2,
  BOX_CENTER_Y: window.innerHeight / 2,
  STAGE: 1,
  ARROWS_LIST: new Map(),
  ENEMIES_LIST: new Map(),
  ENEMY_SPEED: 2,
  ARROW_SPEED: 10,
  ENEMY_ID: 1,
  ARROW_ID: 1,
  AIM_X: 0,
  AIM_Y: 0,
  AIM_ANGLE: 0,
  BEAK_X: 0,
  BEAK_Y: 0,
  ENEMY_INJECTOR_INTERVAL: null,
  RENDER_INTERVAL: null,
  SCORES: {
    KILLS: 0,
    LIFE: LIFE_AMOUNT,
    PRECISION: 100,
  },
  IS_GAME_OVER: false,
  IS_STARTED_GAME: false,
};

const img = new Image();
img.src = "../public/aim.svg";
img.onload = init;

function init() {
  canvas.width = STATE.BOX_CENTER_X * 2;
  canvas.height = STATE.BOX_CENTER_Y * 2;
  render();
}

function startGame() {
  STATE.IS_STARTED_GAME = true;
  setTimeout(startInjectEnemies, 1000);
}

function assert(b: boolean) {
  if (!b) {
    throw Error("assert failed");
  }
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function fillCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function textGenerator(
  text: string,
  x: number = 10,
  y: number = 20,
  size?: number,
  align: "center" | "none" = "none",
) {
  if (!ctx) {
    return;
  }
  const fontSize = size || 14;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "white";
  if (align === "center") {
    const metrics = ctx.measureText(text);
    const textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    ctx.fillText(text, x - metrics.width / 2, y + textHeight / 2);
  } else {
    ctx.fillText(text, x, y);
  }
}

// CHECKERS

function areCirclesTouching(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return Math.abs(distance) < r1 + r2;
}

function isOutsideCanvas(x: number, y: number): boolean {
  return x < 0 || x > canvas.width || y < 0 || y > canvas.height;
}

function isInsideAttacer(enemy: OneEnemy): boolean {
  const d = ATTACKER_RADIUS + ENEMY_RADIUS;

  let startX = STATE.BOX_CENTER_X + d * Math.cos(enemy.angle);
  let endX = STATE.BOX_CENTER_X + -d * Math.cos(enemy.angle);
  let startY = STATE.BOX_CENTER_Y + d * Math.sin(enemy.angle);
  let endY = STATE.BOX_CENTER_Y + -d * Math.sin(enemy.angle);

  if (startY > endY) {
    let t = startY;
    startY = endY;
    endY = t;
  }

  if (startX > endX) {
    let t = startX;
    startX = endX;
    endX = t;
  }

  assert(startX < endX);
  assert(startY < endY);

  return (
    (enemy.x > startX && enemy.x < endX) || (enemy.y > startY && enemy.y < endY)
  );
}

// CHECKERS

// INJECTORS

function startInjectEnemies() {
  STATE.ENEMY_INJECTOR_INTERVAL = setInterval(enemyInjector, 1000);
}

function enemyInjector() {
  const angle = Math.random() * 2 * Math.PI;
  const d =
    Math.sqrt(
      STATE.BOX_CENTER_X * STATE.BOX_CENTER_X +
        STATE.BOX_CENTER_Y * STATE.BOX_CENTER_Y,
    ) + 50;

  const enemy: OneEnemy = {
    x: STATE.BOX_CENTER_X + d * Math.cos(angle),
    y: STATE.BOX_CENTER_Y + d * Math.sin(angle),
    angle: angle,
    radius: ENEMY_RADIUS,
    speed: STATE.ENEMY_SPEED,
  };

  STATE.ENEMIES_LIST.set(STATE.ENEMY_ID, enemy);
  STATE.ENEMY_ID++;
}

function arrowInjector(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (
    x >= STATE.BOX_CENTER_X - 75 &&
    x <= STATE.BOX_CENTER_X + 75 &&
    y >= STATE.BOX_CENTER_Y + 50 &&
    y <= STATE.BOX_CENTER_Y + 100
  ) {
    if (!STATE.IS_STARTED_GAME) {
      startGame();
      return;
    }
    if (STATE.IS_GAME_OVER) {
      restartGame();
      return;
    }
  }

  if (!STATE.IS_STARTED_GAME || STATE.IS_GAME_OVER) {
    return;
  }

  const arrow: OneArrow = {
    x: STATE.BEAK_X,
    y: STATE.BEAK_Y,
    radius: ARROW_RADIUS,
    speed: STATE.ARROW_SPEED,
    angle: STATE.AIM_ANGLE,
  };
  STATE.ARROWS_LIST.set(STATE.ARROW_ID, arrow);
  STATE.ARROW_ID++;
}

// INJECTORS

// DRAWERS

function attackerDrawer() {
  ctx.beginPath();
  ctx.arc(
    STATE.BOX_CENTER_X,
    STATE.BOX_CENTER_Y,
    ATTACKER_RADIUS,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.stroke();
}

function beakDrawer(toX: number, toY: number) {
  if (!(toX || toY)) return;
  ctx.beginPath();
  ctx.moveTo(STATE.BOX_CENTER_X, STATE.BOX_CENTER_Y);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 20;
  ctx.stroke();
}

function arrowDrawer(x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, ARROW_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

function enemyDrawer(x: number, y: number, color: string = "red") {
  ctx.beginPath();
  ctx.arc(x, y, ENEMY_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// DRAWERS

// EVENTS

canvas.addEventListener("mousemove", beakMovement);
canvas.addEventListener("click", arrowInjector);
window.addEventListener("resize", screenResize);

function beakMovement(event: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const x1 = x - STATE.BOX_CENTER_X;
  const y1 = y - STATE.BOX_CENTER_Y;

  STATE.AIM_X = event.clientX;
  STATE.AIM_Y = event.clientY;

  STATE.AIM_ANGLE = Math.atan2(y1, x1);

  STATE.BEAK_X = STATE.BOX_CENTER_X + BEAK_LENGTH * Math.cos(STATE.AIM_ANGLE);
  STATE.BEAK_Y = STATE.BOX_CENTER_Y + BEAK_LENGTH * Math.sin(STATE.AIM_ANGLE);
}

function screenResize() {
  STATE.BOX_CENTER_X = window.innerWidth / 2;
  STATE.BOX_CENTER_Y = window.innerHeight / 2;
}

// EVENTS

function gameOver() {
  clearInterval(STATE.ENEMY_INJECTOR_INTERVAL);
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(STATE.BOX_CENTER_X - 250, STATE.BOX_CENTER_Y - 200, 500, 400);
  textGenerator(
    `Game Over`,
    STATE.BOX_CENTER_X,
    STATE.BOX_CENTER_Y,
    64,
    "center",
  );
  buttonRender({
    title: "Restart",
    x: STATE.BOX_CENTER_X,
    y: STATE.BOX_CENTER_Y,
  });
}

function buttonRender({
  title,
  x,
  y,
}: {
  title: string;
  x: number;
  y: number;
}) {
  ctx.fillStyle = "#3498db";
  ctx.fillRect(x - 75, y + 50, 150, 50);
  textGenerator(title, x, y + 75, 24, "center");
}

function beforeStart() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(STATE.BOX_CENTER_X - 250, STATE.BOX_CENTER_Y - 200, 500, 400);
  textGenerator(
    `Attacker Game`,
    STATE.BOX_CENTER_X,
    STATE.BOX_CENTER_Y,
    50,
    "center",
  );
  buttonRender({
    title: "Start",
    x: STATE.BOX_CENTER_X,
    y: STATE.BOX_CENTER_Y,
  });
}

// RENDERS

function render() {
  STATE.RENDER_INTERVAL = setInterval(() => {
    initialRender();
    if (STATE.IS_GAME_OVER || !STATE.IS_STARTED_GAME) {
      if (STATE.IS_GAME_OVER) {
        gameOver();
        textGenerator(
          `👾 Killed enemies: ${STATE.SCORES.KILLS}`,
          STATE.BOX_CENTER_X,
          STATE.BOX_CENTER_Y - 150,
          36,
          "center",
        );
        textGenerator(
          `🎯 Precision: ${STATE.SCORES.PRECISION} %`,
          STATE.BOX_CENTER_X,
          STATE.BOX_CENTER_Y - 100,
          36,
          "center",
        );
        aimRender();
        return;
      }
      beforeStart();
      aimRender();
      return;
    }
    stateRender();
    aimRender();
    renderScores();
  }, 1000 / FPS);
}

function stateRender() {
  if (STATE.IS_GAME_OVER || !STATE.IS_STARTED_GAME) {
    return;
  }
  beakDrawer(STATE.BEAK_X, STATE.BEAK_Y);
  renderArrows();
  renderEnemies();
}

function initialRender() {
  canvas.width = STATE.BOX_CENTER_X * 2;
  canvas.height = STATE.BOX_CENTER_Y * 2;
  clearCanvas();
  fillCanvas();
  if (STATE.IS_GAME_OVER || !STATE.IS_STARTED_GAME) {
    return;
  }
  attackerDrawer();
}

function renderEnemies() {
  for (const [key, value] of STATE.ENEMIES_LIST) {
    if (isInsideAttacer(value)) {
      STATE.ENEMIES_LIST.delete(key);
      STATE.SCORES.LIFE--;
      continue;
    }
    value.x -= Math.cos(value.angle) * value.speed;
    value.y -= Math.sin(value.angle) * value.speed;
    enemyDrawer(value.x, value.y);
  }
}

function renderArrows() {
  for (const [key, value] of STATE.ARROWS_LIST) {
    if (isOutsideCanvas(value.x, value.y)) {
      STATE.ARROWS_LIST.delete(key);
      continue;
    }
    value.x += Math.cos(value.angle) * value.speed;
    value.y += Math.sin(value.angle) * value.speed;
    arrowDrawer(value.x, value.y);

    for (const [eKey, eValue] of STATE.ENEMIES_LIST) {
      const result = areCirclesTouching(
        value.x,
        value.y,
        value.radius,
        eValue.x,
        eValue.y,
        eValue.radius,
      );

      if (result) {
        STATE.ARROWS_LIST.delete(key);
        STATE.ENEMIES_LIST.delete(eKey);
        STATE.SCORES.KILLS++;
      }
    }
  }
}

function renderScores() {
  const x = STATE.BOX_CENTER_X * 0.05;
  const y = STATE.BOX_CENTER_Y * 0.05;
  const yDiff = 20;
  STATE.SCORES.PRECISION = Math.floor(
    (STATE.SCORES.KILLS / STATE.ARROW_ID) * 100,
  );
  textGenerator(`❤️ Life: ${STATE.SCORES.LIFE}`, x, y);
  textGenerator(`👾 Killed enemies: ${STATE.SCORES.KILLS}`, x, y + yDiff);
  textGenerator(`🎯 Precision: ${STATE.SCORES.PRECISION} %`, x, y + 2 * yDiff);
  textGenerator(
    `👾 Live enemies: ${STATE.ENEMIES_LIST.size}`,
    x,
    y + 3 * yDiff,
  );
  if (STATE.SCORES.LIFE < LIFE_AMOUNT) {
    STATE.IS_GAME_OVER = true;
    gameOver();
  }
}

function aimRender() {
  ctx.drawImage(
    img,
    STATE.AIM_X - AIM_RADIUS / 2,
    STATE.AIM_Y - AIM_RADIUS / 2,
    AIM_RADIUS,
    AIM_RADIUS,
  );
}

function restartGame() {
  STATE.IS_GAME_OVER = false;
  STATE.IS_STARTED_GAME = true;
  STATE.SCORES = {
    LIFE: LIFE_AMOUNT,
    KILLS: 0,
    PRECISION: 0,
  };
  STATE.ENEMY_ID = 1;
  STATE.ARROW_ID = 1;
  STATE.ENEMIES_LIST = new Map();
  STATE.ARROWS_LIST = new Map();
  startInjectEnemies();
}

// RENDERS
