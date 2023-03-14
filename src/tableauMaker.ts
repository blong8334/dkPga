import {
  t_player,
  t_nestedNumber,
  t_tableau
} from './types';

/**
 * 
 * @param players 
 * @param salaryCap 
 * @param totalPlayerCount 
 * @returns 
 */
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
  return printWinners(result, solution, players);
}

/**
 * 
 * @param result {t_nestedNumber}
 * @param solution 
 * @param players 
 * @param totalPlayerCount 
 * @returns 
 */
function printWinners(
  result: t_nestedNumber,
  solution: t_nestedNumber,
  players: t_player[]
): number {
  let totalZScore = 0;
  for (let i = 1; i < solution.length; i++) {
    const curr = solution[i];
    if (curr[1] > players.length) {
      break;
    }
    totalZScore += players[curr[1] - 1].score * result[curr[0]][result[i].length - 1];
  }

  return totalZScore;
}

/**
 * 
 * @param tableau 
 * @param actualObj 
 * @returns 
 */
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

/**
 * 
 * @param tableau {@type t_tableau}
 * @returns 
 */
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

/**
 * 
 * @param tableau 
 * @returns 
 */
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

/**
 * 
 * @param tableau 
 * @returns 
 */
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

/**
 * 
 * @param tableau 
 * @param exitingletRow 
 * @param enteringletCol 
 * @returns 
 */
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

/**
 * 
 * @param tableau 
 * @param enteringletCol 
 * @returns 
 */
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

/**
 * 
 * @param tableau 
 * @returns 
 */
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

/**
 * 
 * @param players 
 * @param salaryCap 
 * @param totalPlayerCount 
 * @returns 
 */
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
    actualObjective[i] = players[i].score;
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

/**
 * 
 * @param players 
 * @returns 
 */
function tableauTemplate(players: t_player[]): t_tableau {
  const tableau = new Array(players.length + 3);

  for (let i = 0; i < tableau.length; i++) {
    // times two for each integer var and plus four for god only knows what
    tableau[i] = new Array(players.length * 2 + 4);
    tableau[i].fill(0);
  }

  return tableau;
}