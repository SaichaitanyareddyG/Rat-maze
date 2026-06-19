Pull the latest main branch from:
https://github.com/SaichaitanyareddyG/Rat-maze

You are a senior vanilla JavaScript frontend developer. The app is mostly working now. Do NOT rewrite the whole project. Fix only the remaining UI polish and interactivity issues.

Current state:
- Maze Type exists: Figma Preset, Manual, Random Solvable.
- Mode exists: 2D Matrix, 3D Matrix Bonus.
- Source/Destination now display as S and D.
- Walls are black.
- Final path is SVG orange polyline.
- DFS/backtracking algorithm is already working.
- 3D mode exists as layered matrices.
- Keep all of this.

Fix only these remaining issues:

1. Fix the orange arrow size.

The current arrowhead is too large. In drawPathOverlay(), replace the current marker setup.

Do NOT use:
marker.setAttribute('markerUnits', 'strokeWidth');

Use fixed marker sizing:

marker.setAttribute('markerUnits', 'userSpaceOnUse');
marker.setAttribute('markerWidth', '14');
marker.setAttribute('markerHeight', '14');
marker.setAttribute('viewBox', '0 0 14 14');
marker.setAttribute('refX', '12');
marker.setAttribute('refY', '7');
marker.setAttribute('orient', 'auto');

pathArrow.setAttribute('d', 'M1,1 L13,7 L1,13 Z');

Use:
poly.setAttribute('stroke-width', '4');

The arrow should be small and clean. It must not cover the D cell.

2. Fix double/thick grid borders.

Right now .grid has border and every .cell has full border. This creates double-thick internal lines.

Change CSS to border-collapse style:

.grid {
  --cell-size: 52px;
  display: grid;
  grid-template-columns: repeat(var(--maze-size), var(--cell-size));
  gap: 0;
  width: fit-content;
  max-width: 100%;
  overflow: visible;
  position: relative;
  border-top: 2px solid #111827;
  border-left: 2px solid #111827;
}

.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border: 0;
  border-right: 2px solid #111827;
  border-bottom: 2px solid #111827;
  border-radius: 0;
  background: #ffffff;
  color: #111827;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 6px;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
  position: relative;
  z-index: 1;
  user-select: none;
}

Remove this old style:
.grid { border: 2px solid #111827; }
.cell { border: 1px solid #111827; }

3. Stop setting fixed grid columns in JavaScript.

Currently renderMaze() uses:
grid.style.gridTemplateColumns = `repeat(${size}, 52px)`;

Replace it with:
grid.style.setProperty('--maze-size', size);

Let CSS control the cell size.

This is important because mobile CSS changes cell size, but JS is still forcing 52px columns.

4. Fix mobile sizing.

Add:

@media (max-width: 760px) {
  .grid {
    --cell-size: 38px;
  }

  .cell {
    font-size: 12px;
    padding: 4px;
  }
}

Do not set width/height directly in the mobile .cell rule if CSS variable is used.

5. Make maze card fit the grid.

Current card has too much empty white space.

Change:

.maze-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: flex-start;
}

.layer-card {
  width: fit-content;
  max-width: 100%;
}

Keep the card design, but do not let the maze area stretch huge.

6. Show the rat during animation.

Currently getCellLabel() returns empty string for the current point.

Change:

function getCellLabel(point, currentPoint) {
  if (currentPoint && isSamePoint(point, currentPoint)) {
    return 'R';
  }
  if (isSource(point)) return 'S';
  if (isDestination(point)) return 'D';
  return '';
}

Use R instead of emoji if emoji causes alignment issues.

7. Add live blocked-node count.

Manual mode should update Blocked Nodes count whenever user selects/deselects walls.

Add:

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

Call updateBlockedCountFromMaze() after:
- loadFigmaPresetMaze()
- generateSolvableRandomMaze()
- toggleManualWall()
- generateMaze() after maze is created

Expected:
- Figma Preset shows 9 blocked nodes.
- Manual mode blocked count updates live.
- Random Solvable shows actual generated wall count.

8. Manual mode should keep Blocked Nodes disabled but visible.

In Manual mode:
- blockedInput.disabled = true
- value updates live using updateBlockedCountFromMaze()
- user should not type blocked count manually in Manual mode
- clicking cells is the source of truth

9. Remove duplicate render in manual click.

Currently the click handler calls toggleManualWall(point), and toggleManualWall() already calls renderMaze().

Keep render in only one place.

Recommended:
- toggleManualWall() should call resetFinalPath(), updateBlockedCountFromMaze(), renderMaze()
- event handler should only call toggleManualWall(point)

10. Clear old final path when starting again.

At the beginning of startSolving(), before resetVisitedCells(), add:

resetFinalPath();

So old orange line disappears before new animation starts.

11. Keep final solved view clean.

After successful solve:
- clear VISITED and BACKTRACKED back to OPEN
- keep WALL black
- keep S and D orange
- show orange polyline only
- no blue final path cells

Do not reintroduce CELL.PATH rendering.

12. Keep 3D simple.

Do not make a 3D cube.
Keep 3D as layered matrix cards:
- Layer 1
- Layer 2
- Layer 3

Movement should remain:
- left
- right
- up
- down
- layer forward
- layer backward

Do not draw orange lines between layer cards.
Keep layer transition badges.

13. Acceptance criteria:

- Arrowhead is small and does not cover D.
- Grid has no gaps.
- Internal borders are single-width, not doubled.
- Cells have no border radius.
- Maze card fits the grid instead of taking huge width.
- S and D are orange.
- Rat/current cell shows R during animation.
- Manual wall click visibly toggles black/white.
- Manual Blocked Nodes count updates live.
- Figma Preset Blocked Nodes shows 9.
- Random Solvable walls are visible and count is correct.
- Starting again clears previous orange path before animation.
- Mobile grid stays aligned.
- 3D layered mode still works.

Only edit:
- index.html
- script.js
- styles.css

Keep vanilla JavaScript. Do not add libraries.