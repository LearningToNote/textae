export default function(command, presenter, dataAccessObject, history, annotationData, buttonController, view, updateLineHeight) {
  let keyApiMap = new KeyApiMap(command, presenter, dataAccessObject, history, annotationData),
    iconApiMap = new IconApiMap(command, presenter, dataAccessObject, history, annotationData, buttonController, updateLineHeight)

  // Update APIs
  return {
    handleKeyInput: (key, value) => handle(keyApiMap, key, value),
    handleButtonClick: (key, value) => handle(iconApiMap, key, value),
    redraw: () => view.updateDisplay()
  }
}

function handle(map, key, value) {
  if (map.has(key)) map.get(key)(value)
}

function KeyApiMap(command, presenter, dataAccessObject, history, annotationData) {
  let showAccess = () => dataAccessObject.showAccess(history.hasAnythingToSave()),
    showSave = () => dataAccessObject.showSave(annotationData.toJson()),
    saveToHana = () => dataAccessObject.saveToHana(annotationData.toJson())

  return new Map([
    ['1', presenter.event.toViewMode],
    ['2', presenter.event.toTermMode],
    ['3', presenter.event.toRelationMode],
    ['A', presenter.event.acceptSelectedElements],
    ['B', presenter.event.toggleDetectBoundaryMode],
    ['D', presenter.event.removeSelectedElements],
    ['DEL', presenter.event.removeSelectedElements],
    ['E', presenter.event.createEntity],
    ['L', presenter.event.changeLabel],
    ['R', presenter.event.replicate],
    ['S', saveToHana],
    ['T', presenter.event.showPallet],
    ['Y', command.redo],
    ['Z', command.undo],
    ['ESC', presenter.event.cancelSelect],
    ['LEFT', presenter.event.selectLeft],
    ['RIGHT', presenter.event.selectRight],
    ['UP', presenter.event.selectUp],
    ['DOWN', presenter.event.selectDown]
    ])

  // return new Map([
  //   ['A', command.redo],
  //   ['B', presenter.event.toggleDetectBoundaryMode],
  //   ['C', presenter.event.copyEntities],
  //   ['D', presenter.event.removeSelectedElements],
  //   ['DEL', presenter.event.removeSelectedElements],
  //   ['E', presenter.event.createEntity],
  //   ['F', presenter.event.toggleInstaceRelation],
  //   ['I', showAccess],
  //   ['M', presenter.event.toggleInstaceRelation],
  //   ['Q', presenter.event.showPallet],
  //   ['R', presenter.event.replicate],
  //   ['S', presenter.event.speculation],
  //   ['U', saveToHana],
  //   ['V', presenter.event.pasteEntities],
  //   ['W', presenter.event.changeLabel],
  //   ['X', presenter.event.negation],
  //   ['Y', command.redo],
  //   ['Z', command.undo],
  //   ['ESC', presenter.event.cancelSelect],
  //   ['LEFT', presenter.event.selectLeft],
  //   ['RIGHT', presenter.event.selectRight],
  //   ['UP', presenter.event.selectUp],
  //   ['DOWN', presenter.event.selectDown]
  // ])
}

function IconApiMap(command, presenter, dataAccessObject, history, annotationData, buttonController, updateLineHeight) {
  let showAccess = () => dataAccessObject.showAccess(history.hasAnythingToSave()),
    showSave = () => dataAccessObject.showSave(annotationData.toJson()),
    saveToHana = () => dataAccessObject.saveToHana(annotationData.toJson()),
    predictEntities = () => dataAccessObject.loadEntityPrediction(annotationData.toJson()),
    predictRelations = () => dataAccessObject.loadRelationPrediction(annotationData.toJson())

  return new Map(
    [
      ['textae.control.button.view.click', presenter.event.toViewMode],
      ['textae.control.button.term.click', presenter.event.toTermMode],
      ['textae.control.button.relation.click', presenter.event.toRelationMode],
      ['textae.control.button.simple.click', presenter.event.toggleSimpleMode],
      ['textae.control.button.read.click', showAccess],
      ['textae.control.button.write.click', saveToHana],
      ['textae.control.button.undo.click', command.undo],
      ['textae.control.button.redo.click', command.redo],
      ['textae.control.button.replicate.click', presenter.event.replicate],
      ['textae.control.button.replicate_auto.click', buttonController.modeAccordingToButton['replicate-auto'].toggle],
      ['textae.control.button.boundary_detection.click', presenter.event.toggleDetectBoundaryMode],
      ['textae.control.button.entity.click', presenter.event.createEntity],
      ['textae.control.button.change_label.click', presenter.event.changeLabel],
      ['textae.control.button.pallet.click', presenter.event.showPallet],
      ['textae.control.button.negation.click', presenter.event.negation],
      ['textae.control.button.speculation.click', presenter.event.speculation],
      ['textae.control.button.delete.click', presenter.event.removeSelectedElements],
      ['textae.control.button.copy.click', presenter.event.copyEntities],
      ['textae.control.button.paste.click', presenter.event.pasteEntities],
      ['textae.control.button.setting.click', presenter.event.showSettingDialog],
      ['textae.control.button.line_height.click', updateLineHeight],
      ['textae.control.button.pred_rel.click', predictRelations],
      ['textae.control.button.pred_ent.click', predictEntities]
    ]
  )
}
