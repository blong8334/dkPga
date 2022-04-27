import * as fs from 'fs';
import * as path from 'path';
import { t_players } from './types';
import { getBestLineup } from './branchAndBound';

const cap = 50000;
const maxPlayers = 6;
const lineups = 5;

const salariesFileName = 'DkSalaries.csv';
const pathToSalaries = path.resolve(__dirname, `../salaries/${salariesFileName}`);

function loadSalaries(): t_players {
  const results = fs.readFileSync(pathToSalaries, { encoding: 'utf-8' });
  return results.split('\n')
    .slice(1)
    .map((line) => {
      const splitLine = line.split(',');
      return {
        name: splitLine[2],
        salary: parseInt(splitLine[5]),
        ffpg: parseFloat(splitLine[8]),
      };
    })
    .filter(({name, salary, ffpg}) => {
      return name && name.length > 0 && salary > 0 && ffpg > 0;
    });
}

function main() {
  const players = loadSalaries();
  getBestLineup(players, cap, maxPlayers, lineups);
}

main();