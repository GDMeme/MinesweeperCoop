import { Binomial } from "../Utility/Binomial.js";

const PLAY_STYLE_FLAGS = 1;
const PLAY_STYLE_NOFLAGS = 2;
const PLAY_STYLE_EFFICIENCY = 3;
const PLAY_STYLE_NOFLAGS_EFFICIENCY = 4;

export const BINOMIAL = new Binomial(70000, 500);

// PLAY_STYLE_NOFLAGS doesn't immediately click forced 5050's (I think, need to test this)
// PLAY_STYLE_FLAGS immediately clicks forced 5050's, but every cell needs to be flagged
// in order for the best move to be given
// Note: The solver always clicks free tiles before guessing forced 5050's apparently?
// I don't remember this being the case though
export const CURRENT_PLAYSTYLE = PLAY_STYLE_NOFLAGS;