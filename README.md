# Rat Maze Visualizer

A lightweight vanilla JavaScript maze visualizer that demonstrates DFS-based pathfinding in both 2D and 3D.

## What it does

- Builds a grid-based maze.
- Supports manual wall placement and random solvable generation.
- Animates DFS traversal with visited and backtracked states.
- Shows 3D mode as layered grids with layer transition badges.

## How to use it

1. Open `index.html` in a browser.
2. Select `2D Matrix` or `3D Matrix Bonus`.
3. Adjust size and depth.
4. Choose `Random Solvable` or `Manual`.
5. Click `Generate Maze`.
6. Click `Start` to begin the solver.

Use `Pause` to pause and `Restart` to reset the maze and cancel the current run.

## Implementation details

- Maze structure:
  - `2D` uses `maze[row][col]`
  - `3D` uses `maze[layer][row][col]`
- Solver uses a centralized direction set for 4-way movement in 2D and 6-way movement in 3D.
- Each step pauses with `STEP_DELAY = 2000` for visible animation.
- `Restart` cancels stale solver runs using `activeRunId`.

## Files

- `index.html` — UI and controls
- `styles.css` — layout and maze styling
- `script.js` — maze generation, rendering, and solver logic

## Notes

This is meant as a small demo app for visualizing DFS/backtracking in a browser.
