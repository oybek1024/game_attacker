export interface Arrow {
  radius: number;
  speed: number;
}

export interface Enemy {
  radius: number;
  speed: number;
}

export interface OneArrow extends Arrow {
  x: number;
  y: number;
  angle: number;
}

export interface OneEnemy extends Enemy {
  x: number;
  y: number;
  angle: number;
}

export interface STATE_MODEL {
  BOX_CENTER_X: number;
  BOX_CENTER_Y: number;
  STAGE: number;
  ARROWS_LIST: Map<number, OneArrow>;
  ENEMIES_LIST: Map<number, OneEnemy>;
  ENEMY_SPEED: number;
  ARROW_SPEED: number;
  ENEMY_ID: number;
  ARROW_ID: number;
  AIM_X: number;
  AIM_Y: number;
  AIM_ANGLE: number;
  BEAK_X: number;
  BEAK_Y: number;
  ENEMY_INJECTOR_INTERVAL: any;
  RENDER_INTERVAL: any;
  SCORES: {
    KILLS: number;
    LIFE: number;
    PRECISION: number;
  };
  IS_GAME_OVER: boolean;
  IS_STARTED_GAME: boolean;
}
