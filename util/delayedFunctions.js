export function setupDelayedMode() {
    document.querySelector('#battleinputs').style.display = "none";
    document.querySelector('#delayedinputs').style.display = "block";
    window.mode = "delayed";
}

export function revealDelayedCells() {
    window.ws.send(JSON.stringify({type: "revealCells"}));
}