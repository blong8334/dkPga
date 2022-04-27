import {
  t_player,
  t_nestedNumnber,
  t_tableau
} from './types';

export function simplex(players: t_player[], salaryCap: number, totalPlayerCount: number): number {
  const {
    tableau,
    actualObjective
  } = artificialletTableauMaker(players, salaryCap, totalPlayerCount);
  const phase1 = simplexSolver(tableau);
  if (!phase1) {
    return null;
  }
  const popped = removeArtificial(phase1);
  const phase2 = putBackObjAndConvertToCanonical(popped, actualObjective);
  let result = simplexSolver(phase2);
  if (!result) {
    return null;
  }
  const solution = findSolutionCols(result);
  return printWinners(result, solution, players, totalPlayerCount);
}

function printWinners(
  result: t_nestedNumnber,
  solution: t_nestedNumnber,
  players: t_player[],
  totalPlayerCount: number
): number {
  let totalSalary = 0;
  let totalZScore = 0;
  if (solution.length === totalPlayerCount) console.log("Found optimal.");
  for (let i = 1; i < solution.length; i++) {
    const curr = solution[i];
    if (curr[1] > players.length) {
      break;
    }
    totalSalary += players[curr[1] - 1].salary * result[curr[0]][result[i].length - 1];
    totalZScore += players[curr[1] - 1].ffpg * result[curr[0]][result[i].length - 1];
  }

  return totalZScore;
}
function putBackObjAndConvertToCanonical(tableau: t_tableau, actualObj: number[]): t_tableau {
  const solCols = findSolutionCols(tableau);

  for (let i = 0; i < actualObj.length; i++) {
    tableau[0][1 + i] = actualObj[i];
  }
  for (let i = 0; i < solCols.length; i++) {
    tableau = rowReducer(tableau, solCols[i][0], solCols[i][1]);
  }

  return tableau;
}

function findSolutionCols(tableau: t_tableau): number[][] {
  const solCols = [];

  for (let i = 0; i < tableau[0].length; i++) {
    let nonZeroCount = 0;
    let solRowCol: [number, number] = [-1, -1];
    for (let j = 0; j < tableau.length; j++) {
      if (tableau[j][i] !== 0) {
        nonZeroCount++;
        if (nonZeroCount > 1) {
          break;
        }
        if (tableau[j][i] === 1) {
          solRowCol = [j, i];
        }
      }
    }
    if (nonZeroCount === 1 && solRowCol !== null) {
      solCols.push(solRowCol)
    }
  }
  return solCols;
}
function removeArtificial(tableau: t_tableau): t_tableau {
  for (let i = 0; i < tableau.length; i++) {
    const end = tableau[i].pop();
    if (end === undefined) {
      throw new Error('No end');
    }
    tableau[i].pop();
    tableau[i].push(end);
  }

  return tableau;
}

function simplexSolver(tableau: t_tableau): t_tableau {
  const enteringletCol = enteringCol(tableau);

  if (enteringletCol === null) {
    return tableau;
  }

  const exitingletRow = exitingRow(tableau, enteringletCol);

  if (exitingletRow < 0) {
    throw new Error('Problem unbounded from above!');
  }

  tableau = rowReducer(tableau, exitingletRow, enteringletCol);

  return simplexSolver(tableau);
}

function rowReducer(tableau: t_tableau, exitingletRow: number, enteringletCol: number): t_tableau {
  for (let i = 0; i < tableau.length; i++) {
    if (i === exitingletRow || tableau[i][enteringletCol] === 0) {
      continue;
    }
    const rowMx = -1 * (tableau[i][enteringletCol] / tableau[exitingletRow][enteringletCol]);
    for (let j = 0; j < tableau[i].length; j++) {
      tableau[i][j] += tableau[exitingletRow][j] * rowMx;
      if (j === enteringletCol) {
        tableau[i][j] = 0;
      }
    }
  }
  if (tableau[exitingletRow][enteringletCol] !== 1) {
    const div = tableau[exitingletRow][enteringletCol];
    for (let i = 0; i < tableau[exitingletRow].length; i++) {
      tableau[exitingletRow][i] /= div;
    }
  }
  return tableau;
}

function exitingRow(tableau: t_tableau, enteringletCol: number): number {
  const endCol = tableau[0].length - 1;
  let minRatio = Infinity;
  let minRatioRow = -1;
  let currRow = 1;

  while (currRow <= tableau.length - 1) {
    if (tableau[currRow][endCol] > 0) {
      const currRatio = tableau[currRow][endCol] / tableau[currRow][enteringletCol];
      if (currRatio > 0 && currRatio < minRatio) {
        minRatio = currRatio;
        minRatioRow = currRow;
      }
    }
    currRow++;
  }
  return minRatioRow;
}

function enteringCol(tableau: t_tableau): number | null {
  let currInd = 1;

  while (currInd <= tableau[0].length - 2) {
    if (tableau[0][currInd] > 0) {
      return currInd;
    }
    currInd++;
  }
  return null;
}

function artificialletTableauMaker(players: t_player[], salaryCap: number, totalPlayerCount: number) {
  const tableau = tableauTemplate(players);
  const colCount = tableau[0].length - 1;
  const actualObjective = [];
  const xsRow = 3;
  const xCol = 1;
  const sCol = players.length + 2;

  tableau[0][0] = 1;
  tableau[0][colCount - 1] = -1;

  for (let i = 0; i < players.length; i++) {
    actualObjective[i] = players[i].ffpg;
    tableau[1][i + 1] = players[i].salary;
    tableau[2][i + 1] = 1;
    tableau[xsRow + i][xCol + i] = 1;
    tableau[xsRow + i][sCol + i] = 1;
    tableau[xsRow + i][colCount] = 1;
  }

  tableau[1][players.length + 1] = 1; tableau[1][colCount] = salaryCap;
  tableau[2][colCount - 1] = 1; tableau[2][colCount] = totalPlayerCount;

  for (let i = 0; i < tableau[0].length; i++) {
    tableau[0][i] += tableau[2][i];
  }

  return { tableau, actualObjective };
}

function tableauTemplate(players: t_player[]): t_tableau {
  const tableau = new Array(players.length + 3);

  for (let i = 0; i < tableau.length; i++) {
    tableau[i] = new Array(players.length * 2 + 4);
    tableau[i].fill(0);
  }

  return tableau;
}