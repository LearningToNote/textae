import RemoveCommandsFromSelection from './RemoveCommandsFromSelection'

export default function(command, selectionModel, selectHandler, annotationData) {
  if (annotationData) {
    let entityIds = selectionModel.entity.all(),
      spanIds = selectionModel.span.all(),
      relationIds = selectionModel.relation.all(),
      entitiesOfSpan = _.flatten(spanIds.map((id) => { return annotationData.span.get(id).getEntities() })),
      entitiesFromOtherUsers = entityIds.filter((id) => { return isFromOtherUser(annotationData, id) }),
      spanEntitiesFromOtherUsers = entitiesOfSpan.filter((id) => { return isFromOtherUser(annotationData, id) }),
      relationsFromOtherUsers = relationIds.filter((id) => { return relationFromOtherUser(annotationData, id) })
    console.log("Should delete ", relationIds, relationsFromOtherUsers)
    if (entitiesFromOtherUsers.length !== 0 || spanEntitiesFromOtherUsers.length !== 0 || relationsFromOtherUsers.length !== 0) {
      toastr.info('',
        "You're not allowed to delete entities and relations of other people.",
        {progressBar: true, closeButton: true})
      return
    }
  }
  let selectNext = selectHandler.selectRightFunc(),
    commands = new RemoveCommandsFromSelection(command, selectionModel)

  command.invoke(commands)
  selectNext()
}

function isFromOtherUser(annotationData, entityId) {
  let userId = annotationData.entity.get(entityId).userId
  return userId !== undefined && userId !== 0
}

function relationFromOtherUser(annotationData, relationId) {
  let relation = annotationData.relation.get(relationId)
  return isFromOtherUser(annotationData, relation.obj) ||
          isFromOtherUser(annotationData, relation.subj)
}