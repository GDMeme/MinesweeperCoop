import { cellmouseout, cellmouseup, cellmouseenter } from './mouseEvents.js';

export function setupCells() {
    document.querySelectorAll(".cell").forEach(e => {
        e.addEventListener("mouseenter", cellmouseenter);
        e.addEventListener("mouseout", cellmouseout);
        e.addEventListener("mouseup", cellmouseup);
        e.addEventListener("contextmenu", function(event) {
            event.preventDefault();
        });
    });
};