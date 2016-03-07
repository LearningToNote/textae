
function Preferences() {
    var prefs = {}

    prefs.useUserEntities = localStorage.getItem('useUserEntities') === 'true'
    prefs.setUseUserEntities = function(shouldUse) {
        prefs.useUserEntities = shouldUse
        if (shouldUse) {
            localStorage.setItem('useUserEntities', 'true')
        } else {
            localStorage.setItem('useUserEntities', 'false')
        }
    }

    return prefs
}

module.exports = Preferences