export function setupDelayedMode() {
    document.querySelector('#battleinputs').style.display = "none";
    document.querySelector('#delayedinputs').style.display = "block";
}

export function revealDelayedCells() {
    if (window.cellsToReveal.size === 0) {
        return;
    }
    const cellsArray = Array.from(window.cellsToReveal);
    window.ws.send(JSON.stringify({type: "revealCells", cellsToReveal: cellsArray}));
    window.cellsToReveal.clear();
}