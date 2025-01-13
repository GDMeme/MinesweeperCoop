/** 
 * Handles differences between local dev environment and deployed app
 * e.g. toggles for testing, logging, etc.
 */

/**
 * Returns server url based on detected environment
 */
export function getGameServerUrl() {    
    const onRenderServerUrl = 'wss://minesweepercoop-6gn2.onrender.com'
    const localServerPort = '8080'
    const hostname = window.location.hostname;
    
    console.log(`host: ${hostname}`);

    if(hostname == "localhost" || hostname == "127.0.0.1") {
        console.log("DEV MODE ENABLED");
        return `wss://${hostname}:${localServerPort}`
    }
        
    return onRenderServerUrl
}
