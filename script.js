let pressed = false;

let cellmouseout = function() { // since this needs to be removed later
    e.className = "cell closed"
}

document.addEventListener("mousedown", function() {
    console.log("changing pressed to true");
    pressed = true;
});

document.addEventListener("mouseup", function() {
    pressed = false;
});

document.querySelectorAll(".cell").forEach(e => {
    e.addEventListener("mouseenter", function() {
        e.addEventListener("mousedown", function() {
            e.className = "cell pressed";
        });
        if (pressed) {
            e.className = "cell pressed";
        };
    });
    e.addEventListener("mouseout", cellmouseout); // since this needs to be removed later
    
    e.addEventListener('mouseup', function() {
        e.className = "cell type1"; // TODO: determine the number that should be displayed
        e.removeEventListener("mouseout", cellmouseout);
    })
})