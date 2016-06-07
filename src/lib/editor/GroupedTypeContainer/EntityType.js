
 function EntityType(data) {
    let NO_GROUP = "No Group",
        NO_ID = -1,
        NO_NAME = "undefined"
    var id, name, code, group, groupId, label
    if (typeof data === 'string' || data instanceof String) {
        id = NO_ID
        name = data
        code = NO_ID
        group = NO_GROUP
        groupId = NO_ID
        label = name
    } else {
        id = jsValue(data["id"])
        name = jsValue(data["name"]) || NO_NAME
        code = jsValue(data["code"]) || NO_ID
        group = jsValue(data["group"]) || NO_GROUP
        groupId = jsValue(data["groupId"]) || NO_ID
        label = jsValue(data["label"]) || name
    }
    return {
        getLabel: () => { return label },
        setLabel: (newLabel) => label = newLabel,
        getId: () => id,
        getName: () => name,
        getCode: () => code,
        getGroup: () => group,
        getGroupId: () => groupId,
        default: () => false,
        toString: () => id,
        toJSON: function() {
            return {
                "id"     : id,
                "name"   : name,
                "code"   : code,
                "group"  : group,
                "groupId": groupId,
                "label"  : label
            }
        }
    }
}

function jsValue(variable) {
    if (variable === undefined || variable === "None")
        return undefined
    return variable
}

module.exports = EntityType
