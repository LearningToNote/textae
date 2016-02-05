import {
  EventEmitter
}
from 'events'
import replicate from './replicate'
import createEntityToSelectedSpan from './createEntityToSelectedSpan'

var DefaultEntityHandler = function(command, annotationData, selectionModel, modeAccordingToButton, spanConfig, entity) {
  var emitter = new EventEmitter(),
    replicateImple = function() {
      replicate(
        command,
        annotationData,
        modeAccordingToButton,
        spanConfig,
        selectionModel.span.single(),
        entity
      )
    },
    createEntityImple = function() {
      createEntityToSelectedSpan(
        command,
        selectionModel.span.all(),
        entity
      )

      emitter.emit('createEntity')
    },
    acceptEntityImple = function() {
      let selectedEntityId = selectionModel.entity.single()
      let selectedEntity = annotationData.entity.get(selectedEntityId)
      let createCommand = command.factory.entityCreateCommand({span: selectedEntity.span, type: selectedEntity.type})
      command.invoke([createCommand])
    }

  return _.extend(emitter, {
    replicate: replicateImple,
    createEntity: createEntityImple,
    acceptEntity: acceptEntityImple
  })
}

module.exports = DefaultEntityHandler
