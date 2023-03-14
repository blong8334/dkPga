import * as path from 'path';
import * as fs from 'fs';
import { t_players, t_scoreFields, t_stat } from "./types";

const salariesFileName = 'DkSalaries.csv';
const pathToSalaries = path.resolve(__dirname, `../salaries/${salariesFileName}`);
const playerStatsMapPath = path.resolve(__dirname, '../data/playerStats.json');

export function loadDkData(playersToSkip: string[]): t_players {
    const results = fs.readFileSync(pathToSalaries, { encoding: 'utf-8' });
    return results.split('\n')
        .map((line) => {
            const splitLine = line.split(',');
            return {
                name: splitLine[2],
                salary: parseInt(splitLine[5]),
                ffpg: parseFloat(splitLine[8]),
                id: splitLine[3],
                score: 0,
            };
        })
        .filter(({ name, salary }) => {
            return name &&
                name.length &&
                salary > 0 &&
                !playersToSkip.includes(name);
        });
}

export function readPlayerStats() {

}

export function loadPlayerStats(players: t_players, scoreFields: t_scoreFields): t_players {
    const statsRaw = fs.readFileSync(playerStatsMapPath, { encoding: 'utf-8' });
    const statsMap = JSON.parse(statsRaw);
    const numberOfTargetStats = Object.keys(scoreFields).length;
    return players.reduce((results: t_players, player) => {
        const { name } = player;
        const stats = statsMap[name];
        if (!stats) {
            console.log('No stats for name', name);
            return results;
        }
        let score = 0;
        let statCount = 0;
        stats.forEach((stat: t_stat) => {
            const value = parseFloat(stat.value);
            const weight = scoreFields[stat.title];
            if (weight) {
                score += value * (weight / 100);
                statCount++;
            }
        });

        if (numberOfTargetStats === statCount) {
            player.score = score;
            results.push(player);
        } else {
            console.log('Skipping adding stats for ', name);
        }

        return results;
    }, []);
}