/** 
 * Handles differences between local dev environment and deployed app
 * e.g. toggles for testing, logging, etc.
 */

import { getCookie, cookieExists, setCookie } from './cookies.js'

/**
 * Returns server url based on detected environment
 */
export function getGameServerUrl() {    
    const onRenderServerUrl = 'wss://minesweepercoop-6gn2.onrender.com';
    const hostname = window.location.hostname;
    
    console.log(`host: ${hostname}`);

    if(hostname == "localhost" || hostname == "127.0.0.1") {
        console.log("DEV MODE ENABLED");
        document.getElementById('developermode').style.display = "block";
        let gameServerUrl = document.querySelector('#developermodebannerserverselector').value;
        if(cookieExists("gameServerUrl")) {
            gameServerUrl = getCookie("gameServerUrl");
            document.querySelector('#developermodebannerserverselector').value = gameServerUrl; 
        }
        return gameServerUrl;
    }
        
    document.getElementById('developermode').style.display = "none";
    return onRenderServerUrl;
}

document.getElementById('developermodebannerserverselector').onchange = function() {
    setCookie(
        "gameServerUrl",
        document.querySelector('#developermodebannerserverselector').value,
        1
    );
    console.log(getCookie("gameServerUrl"));
    location.reload();
}
