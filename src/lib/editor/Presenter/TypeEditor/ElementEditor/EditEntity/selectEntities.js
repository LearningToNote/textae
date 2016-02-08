import dismissBrowserSelection from '../../dismissBrowserSelection'

export default function(selectionModel, ctrlKey, typeLabel, entities) {
  dismissBrowserSelection()

  if (ctrlKey) {
    if (typeLabel.classList.contains('ui-selected')) {
      deselect(selectionModel, entities)
    } else {
      select(selectionModel, entities)
    }
  } else {
    selectionModel.clear()
    select(selectionModel, entities)
  }
  return false

  function select(selectionModel, entities) {
    Array.prototype.forEach.call(entities, (entity) => selectionModel.entity.add(entity.getAttribute('data-model_id')))
  }

  function deselect(selectionModel, entities) {
    Array.prototype.forEach.call(entities, (entity) => selectionModel.entity.remove(entity.getAttribute('data-model_id')))
  }
}
