import * as https from 'node:https';
import * as path from 'path';
import * as fs from 'fs';
import { loadDkData } from './fileReaders';
import * as resources from '../resources';
import { t_allPlayers } from './types';

const playerIdMapPath = path.resolve(__dirname, '../data/playerIdMap.json');
const playerStatsMapPath = path.resolve(__dirname, '../data/playerStats.json');
const allPlayersPath = path.resolve(__dirname, '../data/allPlayers.json');

async function loadAllPlayers(): Promise<void> {
    const results = await request(resources.playerDirQuery);
    fs.writeFileSync(allPlayersPath, results, {encoding: 'utf-8'});
}

function request(body): Promise<string> {
    const postData = JSON.stringify(body);
    const options = {
        hostname: resources.statHost,
        path: resources.statPath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'x-api-key': resources.apiKey,
        },

    };
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let results = '';
            res.on('data', (chunk) => {
                results += chunk;
            });
            res.on('end', () => {
                resolve(results);
            });
        });
        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject(e);
        });
        req.write(postData);
        req.end();
    });
}

function getStats(playerId: string): Promise<string> {
    const localVars = Object.assign({}, resources.playerStatsVariables, { playerId });
    const localQuery = Object.assign({}, resources.playerStatsQuery, { variables: localVars });
    return request(localQuery);
}

function writeStats(name: string, stats: string, statsMap) {
    try {
        statsMap[name] = JSON.parse(stats).data.playerProfileStatsFull[0].stats.filter(stat => stat.title.startsWith('SG: '));
    } catch (err) {
        console.error(err);
        console.log('writing empty stats');
        statsMap[name] = [];
    }
}

async function loadPlayerStats() {
    const players = loadDkData([]);
    const existingIdMap = JSON.parse(fs.readFileSync(playerIdMapPath, { encoding: 'utf-8' }));
    const statsRaw = fs.readFileSync(playerStatsMapPath, { encoding: 'utf-8' });
    const statsMap = JSON.parse(statsRaw);
    for (let i = 0; i < players.length; i++) {
        const { name } = players[i];
        const pgaId = existingIdMap[name]
        if (!pgaId) {
            console.log('Skipping player ', name);
            continue;
        }
        if (statsMap[name]) {
            console.log('We already have stats for ', name);
            continue
        }
        await getStats(pgaId)
            .then((stats) => {
                console.log('Writing stats for ', name);
                writeStats(name, stats, statsMap);
                console.log('Wrote stats for ', name);
                return new Promise((res) => setTimeout(res, Math.random() * 2000));
            })
            .catch(err => {
                console.error(err);
            });
    }
    fs.writeFileSync(playerStatsMapPath, JSON.stringify(statsMap));
}

function buildPlayerIdMap() {
    const players = loadDkData([]);
    const allPlayers: t_allPlayers = JSON.parse(fs.readFileSync(allPlayersPath, { encoding: 'utf-8' }));
    const pgaIdPlayerMap = allPlayers.reduce((playerMap, player) => {
        playerMap[player.displayName] = player.id;
        return playerMap;
    }, {});

    const existingIdMap = JSON.parse(fs.readFileSync(playerIdMapPath, { encoding: 'utf-8' }));

    players.forEach((player) => {
        const { name } = player;
        if (existingIdMap[name]) {
            return;
        }
        const pgaId = pgaIdPlayerMap[name];
        if (!pgaId) {
            console.log('No pga id for player: ', name);
            return;
        }
        existingIdMap[name] = pgaId;
    });
    fs.writeFileSync(playerIdMapPath, JSON.stringify(existingIdMap), { encoding: 'utf-8' });
}

// buildPlayerIdMap();
// loadPlayerStats();