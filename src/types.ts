export type t_player = {
  name: string;
  salary: number;
  ffpg: number;
};
export type t_players = t_player[];
export type t_nestedNumnber = number[][];
export type t_tableau = number[][];
export type t_bestLineup = {
  totalSal: number;
  totalFfpg: number;
  lineup: t_players;
};