import { Binomial } from "../Utility/Binomial.js";

const PLAY_STYLE_FLAGS = 1;
const PLAY_STYLE_NOFLAGS = 2;
const PLAY_STYLE_EFFICIENCY = 3;
const PLAY_STYLE_NOFLAGS_EFFICIENCY = 4;

export const BINOMIAL = new Binomial(70000, 500);

export const CURRENT_PLAYSTYLE = PLAY_STYLE_EFFICIENCY;