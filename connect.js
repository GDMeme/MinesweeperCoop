export function connect() {
    return new Promise(function(resolve, reject) {
        var ws = new WebSocket('wss://localhost:8080');
        // document.getElementById('connectionfailed').style.display = "none";
        // document.getElementById('loader').style.display = "inline";
        // document.getElementById('waitingforserver').style.display = "block";
        document.body.style.backgroundColor = "#645a5a";
        ws.onopen = function() {
            // document.getElementById('loader').style.display = "none";
            // document.getElementById('waitingforserver').style.display = "none";
            resolve(ws);
        };
        ws.onerror = function(err) {
            document.body.style.backgroundColor = "#CCCCCC";
            // document.getElementById('loader').style.display = "none";
            // document.getElementById('waitingforserver').style.display = "none";
            // document.getElementById('connectionfailed').style.display = "inline";
            reject(err);
        };
    });
}