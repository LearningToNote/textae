import SelectionParser from './SelectionParser'
import SelectionValidater from './SelectionValidater'
import SpanEditor from './SpanEditor'

var selectEndOnText = function(selectionValidater, spanEditor, data) {
    var isValid = selectionValidater.validateOnText(data.spanConfig, data.selection)

    if (isValid) {
      _.compose(spanEditor.expand, spanEditor.create)(data)
    }
  },
  selectEndOnSpan = function(selectionValidater, spanEditor, data) {
    var isValid = selectionValidater.validateOnSpan(data.spanConfig, data.selection)

    if (isValid) {
      _.compose(spanEditor.shrink, spanEditor.expand, spanEditor.create)(data)
    }
  }

module.exports = function(editor, model, command, modeAccordingToButton, typeContainer) {
  var selectionParser = new SelectionParser(editor, model),
    selectionValidater = new SelectionValidater(selectionParser),
    // Initiated by events.
    selectEndOnTextImpl = null,
    selectEndOnSpanImpl = null,
    changeSpanEditorAccordingToButtons = function() {
      var isDetectDelimiterEnable = modeAccordingToButton['boundary-detection'].value(),
        isReplicateAuto = modeAccordingToButton['replicate-auto'].value(),
        spanEditor = new SpanEditor(editor, model, command, typeContainer, isDetectDelimiterEnable, isReplicateAuto)

      selectEndOnTextImpl = _.partial(selectEndOnText, selectionValidater, spanEditor)
      selectEndOnSpanImpl = _.partial(selectEndOnSpan, selectionValidater, spanEditor)
    }

  // Change spanEditor according to the  buttons state.
  changeSpanEditorAccordingToButtons()

  modeAccordingToButton['boundary-detection']
    .on('change', changeSpanEditorAccordingToButtons)

  modeAccordingToButton['replicate-auto']
    .on('change', changeSpanEditorAccordingToButtons)

  return {
    onText: function(data) {
      if (selectEndOnTextImpl) selectEndOnTextImpl(data)
    },
    onSpan: function(data) {
      if (selectEndOnSpanImpl) selectEndOnSpanImpl(data)
    }
  }
}
