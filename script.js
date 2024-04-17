let pressed = false;

let cellmouseout = function(event) { // since this needs to be removed later
    console.log('mouseout!!' + event.currentTarget.className)
    event.currentTarget.className = "cell closed"
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
        console.log('mouseup!!' + e.id);
        e.removeEventListener("mouseout", cellmouseout);
    })
})