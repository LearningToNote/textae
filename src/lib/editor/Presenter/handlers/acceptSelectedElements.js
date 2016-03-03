
module.exports = function(command, selectionModel, annotationData) {
    let getEntitiesOfRelation = function(relationId) {
        let relation = annotationData.relation.get(relationId)
        return [relation.obj, relation.subj]
    }, areAllEntitiesFromOtherUsers = function(entityIds) {
        return entityIds.filter(function(entityId) {
            return annotationData.entity.get(entityId).userId === 0 ||
                    annotationData.entity.get(entityId).userId === undefined
        }).length === 0
    }, findMatchingEntityOfCurrentUser = function(comparisonEntityId) {
        let spanId = annotationData.entity.get(comparisonEntityId).span,
            relatedEntities = annotationData.span.get(spanId).getEntities(),
            comparisonEntity = annotationData.entity.get(comparisonEntityId)
        console.log("Related entities:", comparisonEntityId, relatedEntities)
        for (var i = relatedEntities.length - 1; i >= 0; i--) {
            let currentId = relatedEntities[i],
                currentEntity = annotationData.entity.get(currentId)
            if (currentId === comparisonEntityId ||
                (currentEntity.userId !== 0 && currentEntity.userId !== undefined) ||
                currentEntity.type.getCode() !== comparisonEntity.type.getCode()) {
                continue
            }
            return currentId
        }
    }
    let entityIds = selectionModel.entity.all(),
        spanIds = selectionModel.span.all(),
        entityIdsOfSpans = _.flatten(spanIds.map((id) => { return annotationData.span.get(id).getEntities() })),
        relationIds = selectionModel.relation.all()
    var toBeCopiedEntityIds = [],
        toBeCopiedRelationIds = [],
        createEntityCommands = [],
        createRelationCommands = []
    for (var i = relationIds.length - 1; i >= 0; i--) {
        let relationId = relationIds[i]
        var entities = getEntitiesOfRelation(relationId)
        //we'll flatten this later
        toBeCopiedEntityIds.push(entities)
        toBeCopiedRelationIds.push(relationId)
    }
    toBeCopiedEntityIds.push(entityIds)
    toBeCopiedEntityIds.push(entityIdsOfSpans)
    toBeCopiedEntityIds = _.uniq(_.flatten(toBeCopiedEntityIds))
    if (!areAllEntitiesFromOtherUsers(toBeCopiedEntityIds)) {
        toastr.info('',
            "Please only select annotations / relations made by other users.",
            {progressBar: true, closeButton: true})
        return
    }
    console.log("To be copied Ids:", toBeCopiedEntityIds, toBeCopiedRelationIds)
    for (var i = toBeCopiedEntityIds.length - 1; i >= 0; i--) {
        let currentEntity = annotationData.entity.get(toBeCopiedEntityIds[i]),
            createCommand = command.factory.entityCreateCommand({span: currentEntity.span, type: currentEntity.type})
        createEntityCommands.push(createCommand)
    }
    if (createEntityCommands.length > 0) {
        command.invoke(createEntityCommands)
        for (var i = toBeCopiedRelationIds.length - 1; i >= 0; i--) {
            let currentRelationId = toBeCopiedRelationIds[i],
                currentRelation = annotationData.relation.get(currentRelationId),
                originalObj = currentRelation.obj,
                originalSubj = currentRelation.subj,
                newObj = findMatchingEntityOfCurrentUser(originalObj),
                newSubj = findMatchingEntityOfCurrentUser(originalSubj),
                createRelationCommand = command.factory.relationCreateCommand({
                                            subj: newSubj,
                                            obj: newObj,
                                            type: currentRelation.type
                                          })
            createRelationCommands.push(createRelationCommand)
        }
        if (createRelationCommands.length > 0) {
            command.invoke(createRelationCommands)
        }
    }
}
