import Selector from '../../Selector'
import createEntityUnlessBlock from './createEntityUnlessBlock'
import removeEntityElement from './removeEntityElement'

export default function(editor, model, typeContainer, gridRenderer, modification, entity) {
  let selector = new Selector(editor, model)

  // Remove old entity after add new one, because grids will be removed unless entities.
  // Show a new entity.
  createEntityUnlessBlock(
      editor,
      model.annotationData.namespace,
      typeContainer,
      gridRenderer,
      modification,
      entity
  )

  // Remove an old entity.
  removeEntityElement(
      editor,
      model.annotationData,
      entity
  )

  // Re-select a new entity instance.
  if (model.selectionModel.entity.has(entity.id)) {
    selector.entity.select(entity.id)
    selector.entityLabel.update(entity.id)
  }
}
