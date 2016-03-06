
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
    }, removeAcceptedEntitiesFromPredictor = function(command, acceptedEntities, acceptedRelations) {
        // currently only a fancy way to not remove entities with relations.
        // if it would be possible to accept entities and relations at the same time,
        // only entites whose relations are accepted as well are being deleted
        let toBeRemovedEntities = acceptedEntities.filter((e) => {
                if (annotationData.entity.get(e).userId === -1) {
                    var relations = annotationData.entity.assosicatedRelations(e)
                    for (var i = relations.length - 1; i >= 0; i--) {
                        if (acceptedRelations.indexOf(relations[i]) === -1) {
                            return false
                        }
                    }
                    return true
                }
                return false
            }),
            removeCommand = command.factory.entityRemoveCommand(toBeRemovedEntities)
        command.invoke(removeCommand)
    }, removeAcceptedRelationsFromPredictor = function(command, acceptedRelations) {
        let toBeRemovedRelations = acceptedRelations.filter(function(id) {
            let relation = annotationData.relation.get(id),
                objEntity = annotationData.entity.get(relation.obj),
                subjEntity = annotationData.entity.get(relation.subj)
            return objEntity.userId == -1 && subjEntity.userId == -1
        })
        var removeCommands = []
        for (var i = toBeRemovedRelations.length - 1; i >= 0; i--) {
            let currentRelation = toBeRemovedRelations[i]
            removeCommands.push(command.factory.relationRemoveCommand(currentRelation))
        }
        command.invoke(removeCommands)
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
    for (var i = toBeCopiedEntityIds.length - 1; i >= 0; i--) {
        let currentEntity = annotationData.entity.get(toBeCopiedEntityIds[i]),
            entitiesAtSpan = annotationData.span.get(currentEntity.span).getEntities()
                                    .map((id) => annotationData.entity.get(id)),
            eAtSpanOfCurrentUser = entitiesAtSpan.filter((e) => e.userId === 0 || e.userId === undefined),
            eAtSpanOfCurrentUserWithCorrectType = eAtSpanOfCurrentUser.filter((e) => {
                return e.type.getCode() === currentEntity.type.getCode()
                    && e.type.getLabel() === currentEntity.type.getLabel()})

        if (eAtSpanOfCurrentUserWithCorrectType.length === 0) {
            let createCommand = command.factory.entityCreateCommand({span: currentEntity.span, type: currentEntity.type})
            createEntityCommands.push(createCommand)
        }
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
    removeAcceptedRelationsFromPredictor(command, toBeCopiedRelationIds)
    removeAcceptedEntitiesFromPredictor(command, toBeCopiedEntityIds)
}
