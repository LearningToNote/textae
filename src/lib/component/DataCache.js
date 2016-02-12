
function groupBy(array, selectionFunction) {
    var groups = {}
    array.forEach( function(element) {
        var key = String(selectionFunction(element))
        groups[key] = groups[key] || []
        groups[key].push(element)
    })
    return groups
}

module.exports = function() {
    var config = undefined,
        annotationsPerUser = undefined,
        relationsPerUser = undefined,
        sourceId = undefined,
        text = undefined,
        groupAnnotationsByUser = function(annotations) {
            return groupBy(annotations, (annotation) => { return annotation.userId })
        },
        groupRelationsByUser = function(relations, annotations) {
            var annotationsById = groupBy(annotations, (annotation) => { return annotation.id }),
                groupedRelations = {}

            //relation.subj and relation.obj should always have the same user
            groupedRelations = groupBy(relations, (relation) => { return annotationsById[String(relation.subj)][0].userId })
            return groupedRelations
        }

    return {
        setNewData: function(data) {
            if (data !== undefined) {
                config = data.config
                annotationsPerUser = groupAnnotationsByUser(data.denotations)
                relationsPerUser = groupRelationsByUser(data.relations, data.denotations)
                sourceId = data.sourceId
                text = data.text
            } else {
                config = undefined
                annotationsPerUser = undefined
                relationsPerUser = undefined
                sourceId = undefined
                text = undefined
            }
        },
        filterData: function(hiddenUsers) {
            var allUsers = Object.keys(annotationsPerUser).filter( (key) => { return annotationsPerUser.hasOwnProperty(key) }),
                allowedUsers = _.difference(allUsers, hiddenUsers.map((userId) => { return String(userId)})),
                denotations = allowedUsers.map((e) => { return annotationsPerUser[String(e)] })
                                          .filter((e) => { return e !== undefined}),
                relations = allowedUsers.map((e) => { return relationsPerUser[String(e)] })
                                        .filter((e) => { return e !== undefined})

            return {
                config: config,
                denotations: _.flatten(denotations),
                relations: _.flatten(relations),
                sourceId: sourceId,
                text: text
            }
        }
    }
}