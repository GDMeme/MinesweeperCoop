/** 
 * Manages feature flags
 * e.g. toggles features for testing locally, enable/disable features in prod
 */

import { FEATURES_LIST } from './features.js';

function toggleFeatureFlagsModal() {
    featureFlagsRevealed = !featureFlagsRevealed;
    if(featureFlagsRevealed) {
        const featureFlagsListElement = document.getElementById("featureflagslist");
        featureFlagsListElement.replaceChildren();
        for(const feature of featuresList) renderFeatureFlag(feature.name, featureFlagsListElement);
        document.getElementById("featureflagsmodal").style.display = "block";
    } else {
        document.getElementById("featureflagsmodal").style.display = "none";
    }
}

function createChildElementWithProperties(childType, properties) {
    let childElement = document.createElement(childType);
    for(const [propertyName,propertyValue] of Object.entries(properties)) {
        childElement[propertyName] = propertyValue;
    }
    return childElement;
}

function renderFeatureFlag(featureName, featureFlagsListElement) {
    let featureFlagElement = document.createElement("div")
    
    featureFlagElement.id = featureName;
    featureFlagElement.classList.add("featureflagcontainer");
    featureFlagElement.textContent = featureName;

    featureFlagElement.appendChild(document.createElement("br"));
    featureFlagElement.appendChild(document.createElement("br"));

    const childElementsWithProperties = [
        {"type": "input", "properties": {"id":"dev",  "type":"checkbox"   }},
        {"type": "label", "properties": {"id":"dev",  "textContent":"dev" }},
        {"type": "input", "properties": {"id":"prod", "type":"checkbox"   }},
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
            result.enabledEnvironments = ["none"]
            return result;
        }
    )
}

export function initFeatureFlags() {
    const featureFlagsButton = document.getElementById('featureflagsbutton');
    
    featuresList = loadFeatures(FEATURES_LIST);
    featureFlagsButton
        .addEventListener(
            'click',
            toggleFeatureFlagsModal
        );
}
let featureFlagsRevealed = false;
let featuresList = []
