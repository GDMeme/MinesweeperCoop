export function createBattleBoard(rows, columns, mines, startTime) {
    const board = new MinesweeperBoard(rows, columns, mines, false);
    board.startTime = startTime;
    board.rows = rows;
    board.columns = columns;
    board.mines = mines;
    board.firstClick = true;
    board.cellsRevealed.clear();
    board.flaggedIDs.clear();
    board.minePlacements = generateRandomMines(rows, columns, mines);
    return board;
}

export function setupBattleMode() {
    window.mode = 'battle';
    removeAllTeamButtons();
    
    document.querySelector('#coopinputs').style.display = "none";
    document.querySelector('#battleinputs').style.display = "block";
    
    // Add 2 teams as default
    addTeamButton();
    addTeamButton();
}

function removeAllTeamButtons() {
    const container = document.getElementById("teambuttons");
    const buttons = container.querySelectorAll("button");

    buttons.forEach(button => {
        if (button.id.startsWith("jointeam")) {
            button.remove();
        }
    });

    // Reset team count if you're tracking it
    window.numTeams = 0;
}

export function addTeamButton() {
    window.numTeams++;
    const button = document.createElement("button");
    button.id = `jointeam${window.numTeams}`;
    button.textContent = `Join Team ${window.numTeams}`;
    button.className = "input-data";
    
    button.onclick = () => {
        console.log(`Joining Team ${button.id}`);
        document.getElementById('readybutton').style.display = "block";
        window.ws.send(JSON.stringify({ type: "joinTeam", team: button.id.slice(8) }));
    };
    
    document.getElementById("teambuttons").appendChild(button);
}