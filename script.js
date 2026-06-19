// Rat in a Maze Visualizer
// Written in Vanilla JavaScript only.
// The code is intentionally split into small methods so it is easy to understand and extend.

const RatMazeApp = (() => {
  const CELL = {
    OPEN: 0,
    WALL: 1,
    VISITED: 2,
    BACKTRACKED: 3,
    PATH: 4
  };

  // For 2D matrix: maze[row][col]
  const DIRECTIONS_2D = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
  ];

  // For 3D matrix: maze[layer][row][col]
  const DIRECTIONS_3D = [
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0]
  ];

  const dom = {
    mode: document.getElementById('mode'),
    sizeInput: document.getElementById('sizeInput'),
    depthInput: document.getElementById('depthInput'),
    depthField: document.getElementById('depthField'),
    blockedInput: document.getElementById('blockedInput'),
    generateBtn: document.getElementById('generateBtn'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    restartBtn: document.getElementById('restartBtn'),
    statusText: document.getElementById('statusText'),
    mazeWrapper: document.getElementById('mazeWrapper')
  };

  let maze = [];
  let mode = '2d';
  let size = 5;
  let depth = 1;
  let isRunning = false;
  let isPaused = false;
  let shouldStop = false;

  function init() {
    bindEvents();
    toggleDepthInput();
    generateMaze();
  }

  function bindEvents() {
    dom.mode.addEventListener('change', () => {
      toggleDepthInput();
      generateMaze();
    });

    dom.generateBtn.addEventListener('click', generateMaze);
    dom.startBtn.addEventListener('click', startSolving);
    dom.pauseBtn.addEventListener('click', togglePause);
    dom.restartBtn.addEventListener('click', restartMaze);
  }

  function toggleDepthInput() {
    dom.depthField.style.display =
      dom.mode.value === '3d' ? 'block' : 'none';
  }

  function readConfig() {
    mode = dom.mode.value;
    size = clamp(Number(dom.sizeInput.value), 3, 10);
    depth = mode === '3d'
      ? clamp(Number(dom.depthInput.value), 2, 5)
      : 1;

    dom.sizeInput.value = size;
    dom.depthInput.value = depth;

    const totalCells = depth * size * size;
    const maxBlocked = totalCells - 2;

    let blocked = clamp(
      Number(dom.blockedInput.value),
      0,
      maxBlocked
    );

    dom.blockedInput.value = blocked;

    return { blocked };
  }

  function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function generateMaze() {
    shouldStop = true;
    isRunning = false;
    isPaused = false;

    dom.pauseBtn.textContent = 'Pause';
    dom.pauseBtn.disabled = true;

    const { blocked } = readConfig();

    maze = createEmptyMaze();
    placeRandomWalls(blocked);

    renderMaze();

    setStatus(
      'Maze generated. Click Start to begin.'
    );
  }

  function createEmptyMaze() {
    if (mode === '2d') {
      return Array.from(
        { length: size },
        () => Array(size).fill(CELL.OPEN)
      );
    }

    return Array.from(
      { length: depth },
      () =>
        Array.from(
          { length: size },
          () => Array(size).fill(CELL.OPEN)
        )
    );
  }

  function placeRandomWalls(blockedCount) {
    let placed = 0;

    while (placed < blockedCount) {
      const point = getRandomPoint();

      if (
        isSource(point) ||
        isDestination(point) ||
        getCell(point) === CELL.WALL
      ) {
        continue;
      }

      setCell(point, CELL.WALL);
      placed += 1;
    }
  }
  function getRandomPoint() {
    return {
      layer:
        mode === '3d'
          ? Math.floor(Math.random() * depth)
          : 0,
      row: Math.floor(Math.random() * size),
      col: Math.floor(Math.random() * size)
    };
  }

  function getSource() {
    return {
      layer: 0,
      row: 0,
      col: 0
    };
  }

  function getDestination() {
    return {
      layer: depth - 1,
      row: size - 1,
      col: size - 1
    };
  }

  function isSource(point) {
    const source = getSource();
    return isSamePoint(point, source);
  }

  function isDestination(point) {
    const destination = getDestination();
    return isSamePoint(point, destination);
  }

  function isSamePoint(a, b) {
    return (
      a.layer === b.layer &&
      a.row === b.row &&
      a.col === b.col
    );
  }

  function getCell(point) {
    if (mode === '2d') {
      return maze[point.row][point.col];
    }

    return maze[point.layer][point.row][point.col];
  }

  function setCell(point, value) {
    if (mode === '2d') {
      maze[point.row][point.col] = value;
      return;
    }

    maze[point.layer][point.row][point.col] = value;
  }

  function renderMaze(currentPoint = null) {
    dom.mazeWrapper.innerHTML = '';

    for (let layer = 0; layer < depth; layer += 1) {
      const layerCard = document.createElement('div');
      layerCard.className = 'layer-card';

      const title = document.createElement('h2');
      title.className = 'layer-title';

      title.textContent =
        mode === '3d'
          ? `Layer ${layer + 1}`
          : '2D Matrix';

      layerCard.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'grid';

      // Better responsive sizing
      grid.style.gridTemplateColumns =
        `repeat(${size}, minmax(38px, 48px))`;

      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {

          const point = {
            layer,
            row,
            col
          };

          const cell = document.createElement('div');

          cell.className =
            `cell ${getCellClass(point, currentPoint)}`;

          cell.textContent =
            getCellLabel(point, currentPoint);

          grid.appendChild(cell);
        }
      }

      layerCard.appendChild(grid);
      dom.mazeWrapper.appendChild(layerCard);
    }
  }

  function getCellClass(point, currentPoint) {
    if (
      currentPoint &&
      isSamePoint(point, currentPoint)
    ) {
      return 'current';
    }

    if (isSource(point)) {
      return 'source';
    }

    if (isDestination(point)) {
      return 'destination';
    }

    const value = getCell(point);

    if (value === CELL.WALL) {
      return 'wall';
    }

    if (value === CELL.VISITED) {
      return 'visited';
    }

    if (value === CELL.BACKTRACKED) {
      return 'backtracked';
    }

    if (value === CELL.PATH) {
      return 'final-path';
    }

    return '';
  }

  function getCellLabel(point, currentPoint) {
    if (
      currentPoint &&
      isSamePoint(point, currentPoint)
    ) {
      return '🐭';
    }

    if (isSource(point)) {
      return 'S';
    }

    if (isDestination(point)) {
      return 'D';
    }

    return '';
  }

  async function startSolving() {
    if (isRunning) return;

    shouldStop = false;
    isPaused = false;
    isRunning = true;

    dom.startBtn.disabled = true;
    dom.pauseBtn.disabled = false;
    dom.pauseBtn.textContent = 'Pause';

    resetVisitedCells();

    setStatus(
      'Rat started moving...'
    );

    const solved = await solve(
      getSource(),
      []
    );
    isRunning = false;
    dom.startBtn.disabled = false;
    dom.pauseBtn.disabled = true;

    if (shouldStop) {
      setStatus('Maze reset.');
      return;
    }

    if (solved) {
      renderMaze();
      setStatus('Victory! Rat reached the destination.');
    } else {
      renderMaze();
      setStatus('No path found. Try another maze.');
    }
  }

  async function solve(point, path) {
    if (shouldStop) return false;

    await waitIfPaused();

    if (!isValidMove(point)) {
      return false;
    }

    setCell(point, CELL.VISITED);
    renderMaze(point);
    await delay(2000);

    if (isDestination(point)) {
      markFinalPath([...path, point]);
      return true;
    }

    const directions =
      mode === '3d'
        ? DIRECTIONS_3D
        : DIRECTIONS_2D;

    for (const direction of directions) {
      const nextPoint = getNextPoint(point, direction);

      const foundPath = await solve(
        nextPoint,
        [...path, point]
      );

      if (foundPath) {
        return true;
      }
    }

    if (!isSource(point) && !isDestination(point)) {
      setCell(point, CELL.BACKTRACKED);
      renderMaze(point);
      await delay(2000);
    }

    return false;
  }

  function getNextPoint(point, direction) {
    if (mode === '2d') {
      const [rowChange, colChange] = direction;

      return {
        layer: 0,
        row: point.row + rowChange,
        col: point.col + colChange
      };
    }

    const [layerChange, rowChange, colChange] = direction;

    return {
      layer: point.layer + layerChange,
      row: point.row + rowChange,
      col: point.col + colChange
    };
  }

  function isValidMove(point) {
    const isInsideMatrix =
      point.layer >= 0 &&
      point.layer < depth &&
      point.row >= 0 &&
      point.row < size &&
      point.col >= 0 &&
      point.col < size;

    if (!isInsideMatrix) {
      return false;
    }

    const value = getCell(point);

    return (
      value !== CELL.WALL &&
      value !== CELL.VISITED &&
      value !== CELL.BACKTRACKED
    );
  }
  function markFinalPath(path) {
    path.forEach((point) => {
      if (!isSource(point) && !isDestination(point)) {
        setCell(point, CELL.PATH);
      }
    });
  }

  function resetVisitedCells() {
    forEachPoint((point) => {
      const value = getCell(point);

      if (
        [
          CELL.VISITED,
          CELL.BACKTRACKED,
          CELL.PATH
        ].includes(value)
      ) {
        setCell(point, CELL.OPEN);
      }
    });

    renderMaze();
  }

  function forEachPoint(callback) {
    for (let layer = 0; layer < depth; layer += 1) {
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          callback({ layer, row, col });
        }
      }
    }
  }

  function togglePause() {
    if (!isRunning) return;

    isPaused = !isPaused;

    dom.pauseBtn.textContent =
      isPaused ? 'Resume' : 'Pause';

    setStatus(
      isPaused
        ? 'Paused. Click Resume to continue.'
        : 'Resumed. Rat is moving...'
    );
  }

  function restartMaze() {
    shouldStop = true;
    setTimeout(generateMaze, 100);
  }

  async function waitIfPaused() {
    while (isPaused && !shouldStop) {
      await delay(200);
    }
  }

  function delay(ms) {
    return new Promise((resolve) =>
      setTimeout(resolve, ms)
    );
  }

  function setStatus(message) {
    dom.statusText.textContent = message;
  }

  return {
    init
  };
})();

RatMazeApp.init();



