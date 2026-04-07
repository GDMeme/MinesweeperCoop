/** 
 * Manages feature flags
 * e.g. toggles features for testing locally, enable/disable features in prod
 */

import { FEATURES_FLAGS_CONFIG } from './features.js';
import { getCookie, cookieExists, setCookie } from '../cookies.js'

export class FeatureFlagsFeatures {
    constructor(clientOrServer = "server") {
        this.featuresList = clientOrServer == "client" && 
            cookieExists("featuresList") ?
                JSON.parse(getCookie("featuresList")) :
                loadFeatures(FEATURES_FLAGS_CONFIG);
        this.clientOrServer = clientOrServer;
    }

    getFeaturesList() {
        return this.featuresList;
    }

    setFeaturesList(newFeaturesList) {
        this.featuresList = newFeaturesList;
        if(this.clientOrServer == "client") setCookie("featuresList", JSON.stringify(this.featuresList));
    }

    isEnabledInEnvironment(featureName, environmentName) {
        return this.featuresList.find(
            feature => feature.name == featureName
        )?.enabledInEnvironment[environmentName] ?? false;
    }

    #selectedServerMatchesEnabledEnvironment(environmentName) {
        const devModeServerSelector = document.querySelector('#developermodebannerserverselector');
        const selectedServer = devModeServerSelector[devModeServerSelector.selectedIndex].text;
        if(environmentName == "dev" && selectedServer == "localhost") return true;
        if(environmentName == "prod" && selectedServer == "Render") return true;
        return false;
    }

    enableInEnvironment(featureName, environmentName) {
        const foundFeature = this.featuresList.find(
            feature => feature.name == featureName
        )
        const wasEnabled = this.isEnabledInEnvironment(foundFeature.name, environmentName);

        foundFeature.enabledInEnvironment[environmentName] = true;
        
        if(this.clientOrServer == "client") setCookie("featuresList", JSON.stringify(this.featuresList));

        if(
            this.clientOrServer == "client" &&
            window.ws &&
            this.#selectedServerMatchesEnabledEnvironment(environmentName) &&
            wasEnabled == false
        ) {
            window.ws.send(JSON.stringify({ type: 'enableFeatureFlagInEnvironment', featureName, environmentName }));    
        }
        
        if(wasEnabled == false) console.log(`ENABLED feature "${featureName}" in "${environmentName}"`);
    }

    disableInEnvironment(featureName, environmentName) {
        const foundFeature = this.featuresList.find(
            feature => feature.name == featureName
        )
        const wasEnabled = this.isEnabledInEnvironment(foundFeature.name, environmentName);

        foundFeature.enabledInEnvironment[environmentName] = false;
        
        if(this.clientOrServer == "client") setCookie("featuresList", JSON.stringify(this.featuresList));

        if(
            this.clientOrServer == "client" && 
            window.ws &&
            this.#selectedServerMatchesEnabledEnvironment(environmentName) &&
            wasEnabled
        ) {
            window.ws.send(JSON.stringify({ type: 'disableFeatureFlagInEnvironment', featureName, environmentName }));    
        }

        if(wasEnabled) console.log(`DISABLED feature "${featureName}" in "${environmentName}"`);
    }

    toggleInEnvironment(featureName, environmentName) {
        if(this.isEnabledInEnvironment(featureName, environmentName)) {
            this.disableInEnvironment(featureName, environmentName);
        } else {
            this.enableInEnvironment(featureName, environmentName);
        }
    }
}

function pullFeatureFlagsFromServer() {
    window.ws.send(JSON.stringify({ type: 'getFeatureFlags' }));  
}

export function refreshFeatureFlagsModal() {
    const featureFlagsListElement = document.getElementById("featureflagslist");
    featureFlagsListElement.replaceChildren();
    for(const feature of featureFlagsFeatures.getFeaturesList()) 
        renderFeatureFlag(feature, featureFlagsListElement);
}

function disableAllFeatures() {
    for(const feature of featureFlagsFeatures.getFeaturesList()){
        featureFlagsFeatures.disableInEnvironment(feature.name, "dev");
        featureFlagsFeatures.disableInEnvironment(feature.name, "prod");
    }

    setCookie("featuresList", "", 0);
    refreshFeatureFlagsModal()
}

function toggleFeatureFlagsModal() {
    const featureFlagsModalElement = document.getElementById("featureflagsmodal");
    
    if(["none", ""].includes(featureFlagsModalElement.style.display)) {
        refreshFeatureFlagsModal();
        featureFlagsModalElement.style.display = "block";
    } else {
        featureFlagsModalElement.style.display = "none";
    }
}

function toggleFeatureFlag(event) {
    const featureName = event.target.parentElement.id;
    const environmentName = event.target.id;
    featureFlagsFeatures.toggleInEnvironment(featureName, environmentName);
}

function createChildElementWithProperties(childType, properties) {
    let childElement = document.createElement(childType);
    for(const [propertyName,propertyValue] of Object.entries(properties)) {
        childElement[propertyName] = propertyValue;

        if(childType == "input" && propertyName == "type" && propertyValue == "checkbox") {
            childElement.addEventListener('click', toggleFeatureFlag);
        }
    }
    return childElement;
}

function renderFeatureFlag(feature, featureFlagsListElement) {
    let featureFlagElement = document.createElement("div")
    
    featureFlagElement.id = feature.name;
    featureFlagElement.classList.add("featureflagcontainer");
    featureFlagElement.textContent = feature.name;

    featureFlagElement.appendChild(document.createElement("br"));
    featureFlagElement.appendChild(document.createElement("br"));

    const devEnabled  = featureFlagsFeatures.isEnabledInEnvironment(feature.name, "dev");
    const prodEnabled = featureFlagsFeatures.isEnabledInEnvironment(feature.name, "prod");

    const childElementsWithProperties = [
        {"type": "input", "properties": {"id":"dev",  "type":"checkbox", "checked": devEnabled }},
        {"type": "label", "properties": {"id":"dev",  "textContent":"dev" }},
        {"type": "input", "properties": {"id":"prod", "type":"checkbox", "checked": prodEnabled }},
        {"type": "label", "properties": {"id":"prod", "textContent":"prod"}},
    ]

    for (const childElementSpec of childElementsWithProperties) {
        featureFlagElement.appendChild(createChildElementWithProperties(
            childElementSpec.type,
            childElementSpec.properties
        ));
    }

    featureFlagsListElement.appendChild(featureFlagElement);
}

function loadFeatures(featuresList) {
    return featuresList.map(
        (feature) => {
            let result = {};
            result.name = feature.name;
            result.enabledInEnvironment = {}
            return result;
        }
    )
}

let featureFlagsFeatures;
export function initFeatureFlagsClient() {
        
    featureFlagsFeatures = new FeatureFlagsFeatures("client");
    
    const featureFlagsButton = document.getElementById('featureflagsbutton');
    featureFlagsButton.addEventListener ('click', toggleFeatureFlagsModal);
   
    const pullFeatureFlagsFromServerButton = document.getElementById('pullFeatureFlagsFromServerButton');
    pullFeatureFlagsFromServerButton.addEventListener('click', pullFeatureFlagsFromServer);
    
    const disableAllFeaturesButtonElement = document.getElementById('disableAllFeaturesButton');
    disableAllFeaturesButtonElement.addEventListener('click', disableAllFeatures);

    return featureFlagsFeatures;
}
