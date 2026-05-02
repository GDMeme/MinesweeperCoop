import { Binomial, BinomialCache } from "../Utility/Binomial.js";

export const PLAY_STYLE_FLAGS = 1;
export const PLAY_STYLE_NOFLAGS = 2;
export const PLAY_STYLE_EFFICIENCY = 3;
export const PLAY_STYLE_NOFLAGS_EFFICIENCY = 4;

export const BINOMIAL = new Binomial(70000, 500);
export const binomialCache = new BinomialCache(5000, 500, BINOMIAL);

let currentPlaystyle = PLAY_STYLE_NOFLAGS;

export function getPlaystyle() {
    console.log("playstyle is: ", currentPlaystyle);
    return currentPlaystyle;
}

export function setPlaystyle(style) {
    currentPlaystyle = style;
}