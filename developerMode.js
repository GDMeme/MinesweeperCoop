/** 
 * Handles differences between local dev environment and deployed app
 * e.g. toggles for testing, logging, etc.
 */

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

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function cookieExists(cname) {
    return getCookie(cname) != "";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
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
