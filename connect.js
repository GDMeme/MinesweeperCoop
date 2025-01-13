import { getGameServerUrl } from './developerMode.js';

export function connect(firstTime) {
    return new Promise(function(resolve, reject) {
        const gameServerUrl = getGameServerUrl();
        console.log(`server url: ${gameServerUrl}`);
        var ws = new WebSocket(gameServerUrl);
        if (firstTime) {
            document.getElementById('connectionfailed').style.display = "none";
            document.getElementById('loader').style.display = "block";
            document.getElementById('waitingforserver').style.display = "block";
            // document.body.style.backgroundColor = "#645a5a";
        }
        ws.onopen = function() {
            console.log("connection opened");
            if (firstTime) {
                document.getElementById('playersetup').style.display = "block";
                document.getElementById('loader').style.display = "none";
                document.getElementById('waitingforserver').style.display = "none";
            }
            resolve(ws);
        };
        ws.onerror = function(err) {
            // document.body.style.backgroundColor = "#CCCCCC";
            document.getElementById('loader').style.display = "none";
            document.getElementById('waitingforserver').style.display = "none";
            document.getElementById('connectionfailed').style.display = "block";
            console.log("some websocket error: ", err);
            reject(err);
        };
    });
}
document.getElementById('tryconnectagain').onclick = function() {
    location.reload();
}
