/** 
 * Manages feature flags
 * e.g. toggles features for testing locally, enable/disable features in prod
 */

function toggleFeatureFlagsModal() {
    featureFlagsRevealed = !featureFlagsRevealed;
    if(featureFlagsRevealed) {
        document.getElementById("featureflagsmodal").style.display = "block";
    } else {
        document.getElementById("featureflagsmodal").style.display = "none";
    }
}

export function initFeatureFlags() {
    document.getElementById('featureflagsbutton').addEventListener('click', toggleFeatureFlagsModal);
}
let featureFlagsRevealed = false
