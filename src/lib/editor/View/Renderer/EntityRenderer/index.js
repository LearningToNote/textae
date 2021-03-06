import ModificationRenderer from '../ModificationRenderer'
import getDisplayName from './getDisplayName'
import uri from '../../../uri'
import idFactory from '../../../idFactory'
import getEntityDom from '../../../getEntityDom'
import Selector from '../../Selector'
import create from './create'
import createEntityUnlessBlock from './createEntityUnlessBlock'
import changeTypeOfExists from './changeTypeOfExists'
import removeEntityElement from './removeEntityElement'

export default function(editor, model, typeContainer, gridRenderer, renderEntityHandler) {
  let modification = new ModificationRenderer(model.annotationData)

  return {
    render: (entity) => {
      createEntityUnlessBlock(
        editor,
        model.annotationData.namespace,
        typeContainer,
        gridRenderer,
        modification,
        entity
      )
      renderEntityHandler(entity)
    },
    change: (entity) => {
      changeTypeOfExists(
        editor,
        model,
        typeContainer,
        gridRenderer,
        modification,
        entity
      )
      renderEntityHandler(entity)
    },
    changeModification: (entity) => changeModificationOfExists(
      editor,
      modification,
      entity
    ),
    remove: (entity) => destroy(
      editor,
      model,
      gridRenderer,
      entity
    )
  }
}

function destroy(editor, model, gridRenderer, entity) {
  if (doesSpanHasNoEntity(model.annotationData, entity.span)) {
    // Destroy a grid when all entities are remove.
    gridRenderer.remove(entity.span)
  } else {
    // Destroy an each entity.
    removeEntityElement(editor, model.annotationData, entity)
  }

  return entity
}

function changeModificationOfExists(editor, modification, entity) {
  var entityDom = getEntityDom(editor[0], entity.id)
  modification.update(entityDom, entity.id)
}

function doesSpanHasNoEntity(annotationData, spanId) {
  return annotationData.span.get(spanId).getTypes().length === 0
}
