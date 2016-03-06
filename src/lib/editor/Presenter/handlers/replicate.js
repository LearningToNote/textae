var getDetectBoundaryFunc = function(modeAccordingToButton, spanConfig) {
    if (modeAccordingToButton['boundary-detection'].value())
      return spanConfig.isDelimiter
    else
      return null
  },
  replicate = function(command, annotationData, modeAccordingToButton, spanConfig, spanId, entity) {
    var detectBoundaryFunc = getDetectBoundaryFunc(modeAccordingToButton, spanConfig),
        types = []

    let entities = annotationData.span.get(spanId).getEntities()
    for (var i = entities.length - 1; i >= 0; i--) {
      let currentEntity = annotationData.entity.get(entities[i])
      console.log("Checking currentEntity", currentEntity, currentEntity.type)
      if (currentEntity.userId === 0 && types.indexOf(currentEntity.type) === -1) {
        types.push(currentEntity.type)
      }
    }
    if (types.length === 0) {
      types.push(entity.getDefaultType())
    }
    let names = types.map((e) => e.getName())
    console.log("Types for replicating:", names)
    if (spanId) {
      command.invoke(
        [command.factory.spanReplicateCommand(
          types,
          annotationData.span.get(spanId),
          detectBoundaryFunc
        )]
      )
    } else {
      alert('You can replicate span annotation when there is only span selected.')
    }
  }

module.exports = replicate
