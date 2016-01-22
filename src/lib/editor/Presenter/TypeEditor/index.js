import SearchablePallet from '../../../component/SearchablePallet'
import dismissBrowserSelection from './dismissBrowserSelection'
import ElementEditor from './ElementEditor'

export default function(editor, model, spanConfig, command, modeAccordingToButton, typeContainer) {
  // will init.
  let elementEditor = new ElementEditor(
      editor,
      model,
      spanConfig,
      command,
      modeAccordingToButton,
      typeContainer, () => cancelSelect(pallet, model.selectionModel)
    ),
    pallet = new SearchablePallet(
      (label) => elementEditor.handler.changeTypeOfSelected(label), (label) => elementEditor.handler.typeContainer.setDefaultType(label)
    )

  return {
    editRelation: elementEditor.start.editRelation,
    editEntity: elementEditor.start.editEntity,
    noEdit: elementEditor.start.noEdit,
    showPallet: function(point) {
      if (elementEditor.handler.getSelectedType() !== undefined && elementEditor.handler.getSelectedType() !== "") {
        pallet.show(elementEditor.handler.typeContainer, point.point)
        var showPalletEvent = new Event('showPallet')
        document.body.dispatchEvent(showPalletEvent)
      }
    },
    getTypeOfSelected: () => elementEditor.handler.getSelectedType(),
    changeTypeOfSelected: (newType) => elementEditor.handler.changeTypeOfSelected(newType),
    changeLabelOfSelected: (newLabel) => elementEditor.handler.changeLabelOfSelected(newLabel),
    hideDialogs: function() {
      pallet.hide()
      var hidePalletEvent = new Event('hidePallet')
      document.body.dispatchEvent(hidePalletEvent)
    },
    cancelSelect: () => cancelSelect(pallet, model.selectionModel),
    jsPlumbConnectionClicked: (jsPlumbConnection, event) => jsPlumbConnectionClicked(
      elementEditor,
      jsPlumbConnection,
      event
    ),
    getSelectedIdEditable: () => elementEditor.handler.getSelectedIdEditable()
  }
}

function cancelSelect(pallet, selectionModel) {
  pallet.hide()
  selectionModel.clear()
  dismissBrowserSelection()
  var hidePalletEvent = new Event('hidePallet')
  document.body.dispatchEvent(hidePalletEvent)
}

// A relation is drawn by a jsPlumbConnection.
// The EventHandlar for clieck event of jsPlumbConnection.
function jsPlumbConnectionClicked(elementEditor, jsPlumbConnection, event) {
  // Check the event is processed already.
  // Because the jsPlumb will call the event handler twice
  // when a label is clicked that of a relation added after the initiation.
  if (elementEditor.handler.jsPlumbConnectionClicked && !event.processedByTextae) {
    elementEditor.handler.jsPlumbConnectionClicked(jsPlumbConnection, event)
  }

  event.processedByTextae = true
}
