
Please review the entire repository and current pull-request changes before making any decision.

Goal:
Implement and verify the 3D Rat Maze feature properly, clean up unwanted code, optimize the logic, add proper comments, and improve visualization delay.

Main requirement:
The maze should be converted from a 2D N x N grid into a 3D N x N x N grid.

The rat position must use 3D coordinates:

{
  x: number,
  y: number,
  z: number
}

From each cell, the rat must support exactly 6 possible directions:

1. Up
2. Down
3. Left
4. Right
5. Forward - next layer
6. Backward - previous layer

Use a centralized directions array, for example:

const directions3D = [
  { dx: -1, dy: 0, dz: 0, name: "UP" },
  { dx: 1, dy: 0, dz: 0, name: "DOWN" },
  { dx: 0, dy: -1, dz: 0, name: "LEFT" },
  { dx: 0, dy: 1, dz: 0, name: "RIGHT" },
  { dx: 0, dy: 0, dz: 1, name: "FORWARD" },
  { dx: 0, dy: 0, dz: -1, name: "BACKWARD" },
];

Please cross-check all files and confirm that old 2D-only logic is fully updated wherever required.

Check these areas carefully:

1. Maze generation
- Maze should be generated as N x N x N.
- Coordinate usage must be consistent everywhere.
- Use one convention only, such as maze[z][x][y] or maze[x][y][z].
- Add a comment explaining the chosen coordinate convention.

2. Solver/pathfinding
- Solver must use x, y, z coordinates.
- Boundary checks must validate x, y, and z.
- Visited tracking must support 3D positions.
- Avoid using only row/column logic.
- Forward and backward movement between layers must work.
- Path should store full 3D coordinates.

3. UI/visualization
- UI should clearly support 3D maze visualization.
- If full 3D rendering is not available, provide a layer-by-layer view or layer selector.
- Current layer, source, destination, rat position, visited cells, and final path should be clear.

4. Movement delay
Add a 2-second delay for every rat movement to make the visualization better.

Use:

const STEP_DELAY = 2000;

Every movement/update should wait using:

await delay(STEP_DELAY);

5. Restart race condition
Current restart logic is:

function restartMaze() {
  shouldStop = true;
  setTimeout(generateMaze, 100);
}

Because STEP_DELAY is now 2 seconds, clicking Restart while the rat is inside await delay(STEP_DELAY) means the old recursive traversal will not see shouldStop = true until the 2-second timer finishes.

The UI may reset after generateMaze runs, but the old recursive loop can still wake up once in the background before stopping.

In this implementation it may not visibly break the UI because generateMaze resets state and the old loop may exit on the next shouldStop check, but it is still a race condition.

Please fix this by using a run id / cancellation token so old async recursion cannot update the new maze after Restart.

Example approach:

let shouldStop = false;
let activeRunId = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRunCancelled(runId) {
  return shouldStop || runId !== activeRunId;
}

When starting the solver:

async function startSolvingMaze() {
  shouldStop = false;
  const runId = ++activeRunId;
  await solveMaze(startX, startY, startZ, runId);
}

Inside recursive solver, check cancellation before and after delay:

async function solveMaze(x, y, z, runId) {
  if (isRunCancelled(runId)) return false;

  markRatPosition(x, y, z);

  await delay(STEP_DELAY);

  // Restart may happen while delay is pending.
  // Do not allow old recursion to continue after restart.
  if (isRunCancelled(runId)) return false;

  for (const direction of directions3D) {
    if (isRunCancelled(runId)) return false;

    const nextX = x + direction.dx;
    const nextY = y + direction.dy;
    const nextZ = z + direction.dz;

    if (isValidMove(nextX, nextY, nextZ)) {
      const found = await solveMaze(nextX, nextY, nextZ, runId);
      if (found) return true;
    }
  }

  return false;
}

Update restart logic:

function restartMaze() {
  shouldStop = true;

  // Invalidate currently running async solver immediately.
  // This prevents old recursion from updating the new maze after restart.
  activeRunId++;

  setTimeout(generateMaze, 100);
}

Add this comment near restart logic:

// Restart can happen while the solver is waiting inside await delay(STEP_DELAY).
// Because STEP_DELAY is 2 seconds, the old async recursion may wake up later.
// activeRunId prevents that old recursion from updating the new maze state.

6. Code cleanup
Please remove:
- Unused imports
- Unused variables
- Dead helper functions
- Duplicate 2D solver logic
- Old row/column-only code
- Unnecessary console logs
- Hardcoded movement logic
- Any commented-out old code

7. Optimization
Please optimize:
- Use a centralized directions3D array.
- Avoid repeated code for each movement direction.
- Avoid unnecessary deep cloning during each recursive step.
- Prefer push/pop path backtracking or efficient state updates.
- If recursion depth can become large, consider iterative DFS/BFS.
- Keep state updates minimal to avoid unnecessary re-renders.

8. Comments
Add proper comments only where useful:
- Explain coordinate convention.
- Explain 6-direction 3D movement.
- Explain STEP_DELAY.
- Explain restart cancellation / activeRunId.
- Do not add obvious comments for simple syntax.

9. Tests / manual verification
Please verify these cases:
- Rat can move up/down/left/right in the same layer.
- Rat can move forward to next layer.
- Rat can move backward to previous layer.
- Rat cannot move outside x/y/z boundaries.
- Rat cannot move through blocked cells.
- Rat reaches destination when valid path exists.
- Proper no-path handling when destination is unreachable.
- Restart during the 2-second delay does not allow old recursion to update the new maze.
- Multiple restarts do not create background solver conflicts.

Final expected result:
After checking all repository files, confirm whether 3D maze is fully implemented or not.

If not fully implemented, update the code properly.

Then provide a clear summary:
- Files changed
- What 3D changes were added
- What unwanted code was removed
- What optimization was done
- What comments were added
- How the 2-second movement delay works
- How the restart race condition was fixed
- Any remaining limitations