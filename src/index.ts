import * as fs from 'fs';
import * as path from 'path';
import { t_bestLineup, t_player } from './types';
import { getBestLineup } from './branchAndBound';
import {loadDkData, loadPlayerStats} from './fileReaders';

const header = 'G,G,G,G,G,G,,Instructions';
const lineupsCount = 5;
const cap = 50000;
const maxPlayers = 6;
const playersToAdd = [
];
const playersToSkip = [
  // 'Ryan Gerard'
];

const scoreFields = {
  // 'SG: Total': 100,
  // 'SG: Tee-to-Green': 100,
  // 'SG: Off-the-Tee': 100,
  'SG: Approach the Green': 100,
  'SG: Around-the-Green': 100,
  // 'SG: Putting': 100,
};

const pathToResults = path.resolve(__dirname, `../out/results.csv`);

function lineupStats(bestLineups: t_bestLineup[]) {
  const toAdd = 1 / bestLineups.length;
  type t_stats = { [key: string]: number };
  const results: t_stats = {};
  return bestLineups.reduce((stats: t_stats, result: t_bestLineup) => {
    return result.lineup.reduce((stats: t_stats, player: t_player) => {
      const { name } = player;
      if (!stats[name]) {
        stats[name] = 0;
      }
      stats[name] += toAdd;
      return stats;
    }, stats);
  }, results)
}

function main() {
  const players = loadDkData(playersToSkip);
  const playersWithStats = loadPlayerStats(players, scoreFields);
  let capDeduction = 0;
  let maxPlayersDeduction = 0;
  let totalScore = 0;
  const foundTargets = [];
  const updatedField = playersWithStats.filter((player) => {
    if (!playersToAdd.includes(player.name)) {
      return true;
    }
    console.log('Found a target', player);
    foundTargets.push(player);
    capDeduction += player.salary;
    maxPlayersDeduction++;
    totalScore += player.score;
  });
  const bestLineupsWithoutTargets = getBestLineup(
    updatedField, 
    cap - capDeduction, 
    maxPlayers - maxPlayersDeduction, 
    lineupsCount,
  );
  const bestLineupsWithTargets = bestLineupsWithoutTargets.map(lineup => {
    lineup.totalSal += capDeduction;
    lineup.lineup.push(...foundTargets);
    return lineup;
  });
  bestLineupsWithTargets.forEach(el => console.log(el));
  console.log('LINEUPS: ', bestLineupsWithTargets.length);
  const stats = lineupStats(bestLineupsWithTargets);
  console.log('STATS: ', stats);
  let csv = header + '\n';
  bestLineupsWithTargets.forEach(lineup => {
    lineup.lineup.forEach(player => {
      csv += player.id + ",";
    })
    csv += '\n';
  });
  fs.writeFileSync(pathToResults, csv);
}

main();