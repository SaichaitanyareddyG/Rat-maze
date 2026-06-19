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
    mazeType: document.getElementById('mazeType'),
    sizeInput: document.getElementById('sizeInput'),
    depthInput: document.getElementById('depthInput'),
    depthField: document.getElementById('depthField'),
    blockedInput: document.getElementById('blockedInput'),
    manualInstructions: document.getElementById('manualInstructions'),
    generateBtn: document.getElementById('generateBtn'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    restartBtn: document.getElementById('restartBtn'),
    statusText: document.getElementById('statusText'),
    mazeWrapper: document.getElementById('mazeWrapper')
  };

  let maze = [];
  let mode = '2d';
  let mazeType = 'manual';
  let size = 5;
  let depth = 1;
  let finalPath = [];
  let isRunning = false;
  let isPaused = false;
  let shouldStop = false;
  const STEP_DELAY = 2000; // 2000ms = 2 seconds per step


  function init() {
    bindEvents();
    toggleDepthInput();
    // default to manual mode
    dom.mazeType.value = 'manual';
    mazeType = 'manual';
    generateMaze();
  }

  function bindEvents() {
    dom.mode.addEventListener('change', () => {
      toggleDepthInput();
      // no special preset behavior; just regenerate
      generateMaze();
    });

    dom.mazeType.addEventListener('change', () => {
      mazeType = dom.mazeType.value;
      // show/hide manual instructions and block controls
      dom.manualInstructions.style.display =
        mazeType === 'manual' ? 'block' : 'none';

      // Manual: user clicks to build walls; Random: allow blocked input
      dom.sizeInput.disabled = false;
      dom.depthInput.disabled = false;
      dom.blockedInput.disabled = mazeType !== 'random';

      generateMaze();
    });

    // delegate clicks for manual wall toggling
    dom.mazeWrapper.addEventListener('click', (ev) => {
      if (mazeType !== 'manual') return;

      const cell = ev.target.closest('.cell');
      if (!cell) return;
      const layer = Number(cell.dataset.layer);
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);

      const point = { layer, row, col };
      toggleManualWall(point);
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

    resetFinalPath();

    if (mazeType === 'random') {
      const ok = generateSolvableRandomMaze(blocked);
      if (!ok) {
        setStatus('Failed to generate a solvable maze. Try different options.');
        return;
      }
    } else {
      // manual or default empty
      maze = createEmptyMaze();
      updateBlockedCountFromMaze();
    }

    renderMaze();

    setStatus('Maze generated. Click Start to begin.');
  }

  function loadFigmaPresetMaze() {
    // removed: Figma preset no longer supported
    size = 5;
    depth = 1;
    maze = createEmptyMaze();
    updateBlockedCountFromMaze();
  }

  function generateSolvableRandomMaze(blockedCount) {
    const MAX_ATTEMPTS = 200;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      // create empty
      maze = createEmptyMaze();
      placeRandomWalls(blockedCount);

      // quick non-animated solvability check
      const path = solveForPath(getSource());
      if (path) {
        // keep this maze and mark finalPath now (but final overlay will be created on render)
        finalPath = [];
        updateBlockedCountFromMaze();
        return true;
      }
    }

    return false;
  }

  // Non-animated DFS to check solvability and return path array or null
  function solveForPath(start) {
    const visited = new Set();
    const stack = [[start, [start]]];

    while (stack.length) {
      const [point, path] = stack.pop();
      const key = `${point.layer},${point.row},${point.col}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (!isValidMove(point)) continue;

      if (isDestination(point)) return path;

      const directions = mode === '3d' ? DIRECTIONS_3D : DIRECTIONS_2D;

      for (const dir of directions) {
        const next = getNextPoint(point, dir);
        const nextKey = `${next.layer},${next.row},${next.col}`;
        if (!visited.has(nextKey)) {
          stack.push([next, [...path, next]]);
        }
      }
    }

    return null;
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
      layerCard.dataset.layer = layer;

      const title = document.createElement('h2');
      title.className = 'layer-title';

      title.textContent =
        mode === '3d'
          ? `3D Matrix — Layer ${layer + 1}`
          : '2D Matrix';

      layerCard.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'grid';
      grid.dataset.layer = layer;

      // position relative so overlay can be absolute
      grid.style.position = 'relative';

      // Set CSS variable for maze size
      grid.style.setProperty('--maze-size', size);

      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {

          const point = {
            layer,
            row,
            col
          };

          const cell = document.createElement('div');

          cell.className = `cell ${getCellClass(point, currentPoint)}`;
          cell.dataset.layer = layer;
          cell.dataset.row = row;
          cell.dataset.col = col;

          cell.textContent = getCellLabel(point, currentPoint);

          grid.appendChild(cell);
        }
      }

      // append grid first then overlay
      const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlay.classList.add('path-overlay');
      overlay.setAttribute('width', '100%');
      overlay.setAttribute('height', '100%');
      overlay.setAttribute('preserveAspectRatio', 'none');

      grid.appendChild(overlay);
      layerCard.appendChild(grid);
      dom.mazeWrapper.appendChild(layerCard);

      const layerSegments = getLayerPathSegments(finalPath, layer);
      drawPathOverlay(grid, overlay, layerSegments);

      // render layer transition badges for 3D paths
      if (finalPath && finalPath.length > 1) {
        for (let i = 0; i < finalPath.length - 1; i += 1) {
          const a = finalPath[i];
          const b = finalPath[i + 1];
          if (a.layer !== b.layer && a.layer === layer) {
            // badge to indicate transition to layer b.layer
            const cells = Array.from(grid.querySelectorAll('.cell'));
            const idx = a.row * size + a.col;
            const cellEl = cells[idx];
            if (cellEl) {
              const badge = document.createElement('div');
              badge.className = 'layer-badge';
              const arrow = b.layer > a.layer ? '↓' : '↑';
              badge.textContent = `${arrow} Layer ${b.layer + 1}`;
              cellEl.appendChild(badge);
            }
          }
        }
      }
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
      return 'R';
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

    resetFinalPath();
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
      // clear transient visited/backtracked states, keep finalPath overlay
      forEachPoint((point) => {
        const v = getCell(point);
        if ([CELL.VISITED, CELL.BACKTRACKED].includes(v)) {
          setCell(point, CELL.OPEN);
        }
      });
      renderMaze();
      setStatus('🎉 Victory! Rat reached the destination successfully.');
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
    await delay(STEP_DELAY);

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
      await delay(STEP_DELAY);
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
    // store the final path for overlay rendering; do not mutate cell states
    finalPath = path.slice();
  }

  function resetVisitedCells() {
    forEachPoint((point) => {
      const value = getCell(point);

      if (
        [CELL.VISITED, CELL.BACKTRACKED].includes(value)
      ) {
        setCell(point, CELL.OPEN);
      }
    });

    renderMaze();
  }

  function resetFinalPath() {
    finalPath = [];
  }

  function getLayerPathSegments(path, layer) {
    if (!path || !path.length) return [];

    const segments = [];
    let currentSegment = [];

    for (let i = 0; i < path.length; i += 1) {
      const point = path[i];
      if (point.layer !== layer) {
        if (currentSegment.length) {
          segments.push(currentSegment);
          currentSegment = [];
        }
        continue;
      }

      currentSegment.push(point);
    }

    if (currentSegment.length) {
      segments.push(currentSegment);
    }

    return segments;
  }

  function toggleManualWall(point) {
    if (isSource(point) || isDestination(point)) return;

    forEachPoint((p) => {
      const value = getCell(p);
      if ([CELL.VISITED, CELL.BACKTRACKED].includes(value)) {
        setCell(p, CELL.OPEN);
      }
    });

    const cur = getCell(point);
    if (cur === CELL.WALL) {
      setCell(point, CELL.OPEN);
    } else {
      setCell(point, CELL.WALL);
    }

    resetFinalPath();
    updateBlockedCountFromMaze();
    renderMaze();
  }

  function countWalls() {
    let count = 0;
    forEachPoint((point) => {
      if (getCell(point) === CELL.WALL) {
        count += 1;
      }
    });
    return count;
  }

  function updateBlockedCountFromMaze() {
    dom.blockedInput.value = countWalls();
  }

  function drawPathOverlay(grid, svg, layerSegments) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (!Array.isArray(layerSegments) || layerSegments.length === 0) return;

    const rect = grid.getBoundingClientRect();
    const cells = Array.from(grid.querySelectorAll('.cell'));
    const width = rect.width || grid.clientWidth || 300;
    const height = rect.height || grid.clientHeight || 300;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    layerSegments.forEach((segment, index) => {
      if (!segment || segment.length < 2) return;

      const points = segment
        .map((p) => {
          const idx = p.row * size + p.col;
          const el = cells[idx];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return `${r.left - rect.left + r.width / 2},${r.top - rect.top + r.height / 2}`;
        })
        .filter(Boolean);

      if (points.length < 2) return;

      const markerId = `arrow-${grid.dataset.layer}-${index}`;
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', markerId);
      marker.setAttribute('markerUnits', 'userSpaceOnUse');
      marker.setAttribute('markerWidth', '14');
      marker.setAttribute('markerHeight', '14');
      marker.setAttribute('viewBox', '0 0 14 14');
      marker.setAttribute('refX', '12');
      marker.setAttribute('refY', '7');
      marker.setAttribute('orient', 'auto');
      const pathArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathArrow.setAttribute('d', 'M1,1 L13,7 L1,13 Z');
      pathArrow.setAttribute('fill', '#f97316');
      marker.appendChild(pathArrow);
      defs.appendChild(marker);

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', '#f97316');
      poly.setAttribute('stroke-width', '4');
      poly.setAttribute('stroke-linecap', 'round');
      poly.setAttribute('stroke-linejoin', 'round');
      poly.setAttribute('marker-end', `url(#${markerId})`);
      poly.setAttribute('points', points.join(' '));
      svg.appendChild(poly);
    });
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



