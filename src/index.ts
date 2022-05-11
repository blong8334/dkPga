import * as fs from 'fs';
import * as path from 'path';
import { t_bestLineup, t_players, t_player } from './types';
import { getBestLineup } from './branchAndBound';

const lineups = 10;
const cap = 50000;
const maxPlayers = 6;
const playersToSkip = '';

const salariesFileName = 'DkSalaries.csv';
const pathToSalaries = path.resolve(__dirname, `../salaries/${salariesFileName}`);

function loadSalaries(): t_players {
  const results = fs.readFileSync(pathToSalaries, { encoding: 'utf-8' });
  return results.split('\n')
    .map((line) => {
      const splitLine = line.split(',');
      return {
        name: splitLine[2],
        salary: parseInt(splitLine[5]),
        ffpg: parseFloat(splitLine[8]),
      };
    })
    .filter(({ name, salary, ffpg }) => {
      return name &&
        name.length &&
        salary > 0 &&
        ffpg > 0 &&
        !playersToSkip.includes(name);
    });
}

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
  const players = loadSalaries();
  const bestLineups = getBestLineup(players, cap, maxPlayers, lineups);
  console.log('LINEUPS: ', bestLineups.length);
  const stats = lineupStats(bestLineups);
  console.log('STATS: ', stats);
}

main();