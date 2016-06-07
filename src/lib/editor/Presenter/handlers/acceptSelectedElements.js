
module.exports = function(command, selectionModel, annotationData) {
    let getEntitiesOfRelation = function(relationId) {
        let relation = annotationData.relation.get(relationId)
        return [relation.obj, relation.subj]
    }, areAllEntitiesFromOtherUsers = function(entityIds) {
        return entityIds.filter(function(entityId) {
            return annotationData.entity.get(entityId).userId === 0 ||
                    annotationData.entity.get(entityId).userId === undefined
        }).length === 0
    }, findMatchingEntitesOfCurrentUser = function(comparisonEntityId) {
        var result = []
        let comparisonEntity = annotationData.entity.get(comparisonEntityId),
            relatedEntities = annotationData.span.get(comparisonEntity.span).getEntities()

        for (var i = relatedEntities.length - 1; i >= 0; i--) {
            let currentId = relatedEntities[i],
                currentEntity = annotationData.entity.get(currentId)
            if (currentId !== comparisonEntityId &&
                (currentEntity.userId === 0 || currentEntity.userId === undefined) &&
                currentEntity.type.getId() === comparisonEntity.type.getId() &&
                currentEntity.type.getLabel() === comparisonEntity.type.getLabel()) {
                result.push(currentId)
            }
        }
        return result
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
    }, createCreateCommandsForEntities = function(entityIds) {
        var result = []
        for (var i = toBeCopiedEntityIds.length - 1; i >= 0; i--) {
            let currentEntity = annotationData.entity.get(toBeCopiedEntityIds[i]),
                existingMatchingEntities = findMatchingEntitesOfCurrentUser(toBeCopiedEntityIds[i])

            if (existingMatchingEntities.length === 0) {
                let createCommand = command.factory.entityCreateCommand({span: currentEntity.span, type: currentEntity.type})
                result.push(createCommand)
            }
        }
        return result
    }, createCreateCommandsForRelations = function(relationIds) {
        var result = []
        for (var i = toBeCopiedRelationIds.length - 1; i >= 0; i--) {
            let currentRelationId = toBeCopiedRelationIds[i],
                currentRelation = annotationData.relation.get(currentRelationId),
                originalObj = currentRelation.obj,
                originalSubj = currentRelation.subj,
                objCandidates = findMatchingEntitesOfCurrentUser(originalObj),
                subjCandidates = findMatchingEntitesOfCurrentUser(originalSubj),
                shouldCreate = true

            for (var i = objCandidates.length - 1; i >= 0; i--) {
                let currentObjId = objCandidates[i],
                    objRelationIds = annotationData.entity.assosicatedRelations(currentObjId)
                for (var i = objRelationIds.length - 1; i >= 0; i--) {
                    let currentObjRelation = annotationData.relation.get(objRelationIds[i])
                    if (subjCandidates.indexOf(currentObjRelation.subj) > -1) {
                        if (currentObjRelation.type.getId() === currentRelation.type.getId()
                            && currentObjRelation.type.getLabel() === currentRelation.type.getLabel()) {
                            shouldCreate = false
                            break
                        }
                    }
                    if (!shouldCreate) {
                        break
                    }
                }
            }

            if (!shouldCreate) {
                break
            }

            let createRelationCommand = command.factory.relationCreateCommand({
                                            subj: subjCandidates[0],
                                            obj: objCandidates[0],
                                            type: currentRelation.type
                                          })
            result.push(createRelationCommand)
        }
        return result
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
    createEntityCommands = createCreateCommandsForEntities(toBeCopiedEntityIds)
    if (createEntityCommands.length > 0) {
        command.invoke(createEntityCommands)
    }
    createRelationCommands = createCreateCommandsForRelations(toBeCopiedRelationIds)
    if (createRelationCommands.length > 0) {
        command.invoke(createRelationCommands)
    }
    removeAcceptedRelationsFromPredictor(command, toBeCopiedRelationIds)
    removeAcceptedEntitiesFromPredictor(command, toBeCopiedEntityIds)
}
