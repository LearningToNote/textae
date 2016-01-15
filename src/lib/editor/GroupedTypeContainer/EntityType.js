
var EntityType = function(data) {
    let NO_GROUP = "No Group",
        NO_GROUP_ID = -1,
        NO_CODE = -1,
        NO_NAME = "undefined"
    var name, code, group, groupId, label
    if (typeof data === 'string' || data instanceof String) {
        name = data
        code = NO_CODE
        group = NO_GROUP
        groupId = NO_GROUP_ID
        label = name
    } else {
        name = jsValue(data["name"]) || NO_NAME,
        code = jsValue(data["code"]) || NO_CODE,
        group = jsValue(data["group"]) || NO_GROUP,
        groupId = jsValue(data["groupId"]) || NO_GROUP_ID,
        label = jsValue(data["label"]) || name
        console.log(label)
    }
    return {
        getLabel: () => label,
        getName: function() {
            return name
        },
        getCode: function() {
            return code
        },
        getGroup: function() {
            return group
        },
        getGroupId: function() {
            return groupId
        },
        default: function() {
            return false
        },
        toString: function() {
            return code
        },
        toJSON: function() {
            return {
                "name"   : name,
                "code"   : code,
                "group"  : group,
                "groupId": groupId
                //TODO: add label
            }
        }
    }
}

function jsValue(variable) {
    if (variable === undefined || variable === "None")
        return undefined
    return variable
}

// EntityType.prototype.toString = function() {
//     return $(this).code
// };

module.exports = function(data) {
    return EntityType(data)
}