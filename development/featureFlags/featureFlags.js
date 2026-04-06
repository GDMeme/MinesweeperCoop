/** 
 * Manages feature flags
 * e.g. toggles features for testing locally, enable/disable features in prod
 */

import { FEATURES_FLAGS_CONFIG } from './features.js';

class FeatureFlagsFeatures {
    constructor(featuresList = []) {
        this.featuresList = featuresList;
    }

    getFeaturesList() {
        return this.featuresList;
    }

    isEnabledInEnvironment(featureName, environmentName) {
        return this.featuresList.find(
            feature => feature.name == featureName
        )?.enabledInEnvironment[environmentName] ?? false;
    }

    enableInEnvironment(featureName, environmentName) {
        this.featuresList.find(
            feature => feature.name == featureName
        ).enabledInEnvironment[environmentName] = true;
    }

    disableInEnvironment(featureName, environmentName) {
        this.featuresList.find(
            feature => feature.name == featureName
        ).enabledInEnvironment[environmentName] = false;
    }

    toggleInEnvironment(featureName, environmentName) {
        if(this.isEnabledInEnvironment(featureName, environmentName)) {
            this.disableInEnvironment(featureName, environmentName);
        } else {
            this.enableInEnvironment(featureName, environmentName);
        }
    }
}

function toggleFeatureFlagsModal() {
    const featureFlagsModalElement = document.getElementById("featureflagsmodal");
    const featureFlagsListElement = document.getElementById("featureflagslist");
    
    if(featureFlagsModalElement.style.display == "none") {
        featureFlagsListElement.replaceChildren();
        for(const feature of featureFlagsFeatures.getFeaturesList()) 
            renderFeatureFlag(feature, featureFlagsListElement);
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
export function initFeatureFlags() {
    const featureFlagsButton = document.getElementById('featureflagsbutton');
        
    const featuresList = loadFeatures(FEATURES_FLAGS_CONFIG);
    featureFlagsFeatures = new FeatureFlagsFeatures(featuresList);
    
    featureFlagsButton.addEventListener('click', toggleFeatureFlagsModal);

    return featureFlagsFeatures;
}
