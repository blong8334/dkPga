export type t_player = {
  name: string;
  salary: number;
  ffpg: number;
  id: string;
  score: number;
};
export type t_players = t_player[];
export type t_nestedNumber = number[][];
export type t_tableau = number[][];
export type t_bestLineup = {
  totalSal: number;
  totalScore: number;
  lineup: t_players;
};
export type t_stat = {
  title: string;
  value: string;
};
export type t_scoreFields = {
  [key: string]: number;
};
export type t_allPlayers = {
  displayName: string;
  id: string;
}[];