module.exports = function(modeAccordingToButton, editMode) {
    return {
        toggleDetectBoundaryMode: function() {
            modeAccordingToButton['boundary-detection'].toggle();
        },
        toggleRelationEditMode: function() {
            if (modeAccordingToButton['relation-edit-mode'].value()) {
                editMode.toInstance();
            } else {
                editMode.toRelation();
            }
        }
    };
};