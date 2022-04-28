import {
  t_players,
  t_bestLineup
} from './types';
import { simplex } from './tableauMaker';

export function getBestLineup(
  players: t_players,
  salaryCap: number,
  totalPlayerCount: number,
  lineups: number
): t_bestLineup {
  const bestLineup = findFirstBest(players, salaryCap, totalPlayerCount);
  const line_queue: t_bestLineup[] = [];
  const currLineup = { totalSal: 0, totalFfpg: 0, lineup: [] };
  let line_count = 1;
  let start = new Date();
  
  line_queue.push(Object.assign({}, bestLineup));
  branchAndBound(players, currLineup, salaryCap, totalPlayerCount);

  let end = new Date();
  
  console.log("Program took: ", (end.getTime() - start.getTime()) / 1000);
  console.log('*** LINE QUEUE ***');
  line_queue.forEach(el => console.log(el));

  return line_queue[line_queue.length - 1];

  function branchAndBound(
    currPlayerList: t_players, 
    currLineup: t_bestLineup, 
    currCap: number, 
    remainingPlayers: number
  ) {
    if (currPlayerList.length + currLineup.lineup.length < totalPlayerCount) {
      return;
    }

    // This is the lineup where we will add the player.
    const addThePlayerLineup = Object.assign({}, currLineup);
    // Get the next player
    const nextPlayer = currPlayerList.shift();

    if (!nextPlayer) {
      throw new Error('No next player');
    }

    // Copy the current lineup to the new lineup.
    addThePlayerLineup.lineup = currLineup.lineup.slice();
    // Add the player to the new lineup.
    addThePlayerLineup.lineup.push(nextPlayer);
    // Update total lineup salary
    addThePlayerLineup.totalSal += +nextPlayer.salary;
    // Update total lineup value
    addThePlayerLineup.totalFfpg += +nextPlayer.ffpg;

    const copiedPlayerList = currPlayerList.slice();
    // Update the new salary cap for the added player lineup.
    const nextCap = currCap - nextPlayer.salary;
    // Update the remaining players needed to fill our lineup.
    const nextRemainingPlayers = remainingPlayers - 1;

    // Check if the new lineup is still valid.
    let stillValid = true;

    // Have we exceeded the salary cap?
    if (nextCap < 0) {
      // The linuep is no longer valid.
      stillValid = false;
      // Do we have six players?
    } else if (nextRemainingPlayers === 0) {
      // We have a valid lineup.
      // Check if it is better than the current best solution.
      if (addThePlayerLineup.totalFfpg > line_queue[0].totalFfpg) {
        // This lineup is better than the current best.
        // console.log("WHOA! You're going to LOVE this lineup! ", addThePlayerLineup);
        console.log(line_count++ + ': We found a sweet lineup for you');
        // Update the best lineup.
        line_queue.push(Object.assign({}, addThePlayerLineup));
        if (line_queue.length > lineups) {
          line_queue.shift();
        }
        line_queue.sort((a, b) => {
          return a.totalFfpg - b.totalFfpg;
        });
        // Need to sort the queue now.
      }
      // Otherwise we are done with this lineup since it is not better than the best.
      stillValid = false;
    } else {
      // Check if the 'relaxed' solution to the current problem + the current value is better than the best.
      let remZScore = simplex(currPlayerList, nextCap, nextRemainingPlayers);
      if (!remZScore) {
        // If the problem is unfeasible, we are done with it.
        stillValid = false;
      } else {
        // The value of the current lineup's score + the relaxed solution's score.
        let nextBest = addThePlayerLineup.totalFfpg + remZScore;
        if (nextBest < line_queue[0].totalFfpg) {
          // nextBest is not better than the current best, there is no point in checking this branch
          // any further.
          stillValid = false;
        }
      }
    }
    if (stillValid) {
      branchAndBound(copiedPlayerList, addThePlayerLineup, nextCap, nextRemainingPlayers);
    }

    branchAndBound(currPlayerList, currLineup, currCap, remainingPlayers);
  }
}

function findFirstBest(players: t_players, salaryCap: number, totalPlayerCount: number): t_bestLineup {
  players.sort((a, b) => b.salary - a.salary);
  const bestLineup: t_bestLineup = { totalSal: 0, totalFfpg: 0, lineup: [] };
  for (let i = 0; i < players.length; i++) {
    if (bestLineup.lineup.length < totalPlayerCount) {
      bestLineup.lineup.push(players[i]);
      bestLineup.totalSal += players[i].salary;
      bestLineup.totalFfpg += players[i].ffpg;
    }
    if (bestLineup.lineup.length === totalPlayerCount && bestLineup.totalSal > salaryCap) {
      const leavingPlayer = bestLineup.lineup.shift();
      if (!leavingPlayer) {
        throw new Error('No leaving pllayer');
      }
      bestLineup.totalSal -= leavingPlayer.salary;
      bestLineup.totalFfpg -= leavingPlayer.ffpg;
    } else if (bestLineup.lineup.length === totalPlayerCount && bestLineup.totalSal <= salaryCap) {
      break;
    }
  }
  return bestLineup;
}
