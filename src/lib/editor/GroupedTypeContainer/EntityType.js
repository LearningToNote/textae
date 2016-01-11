
var EntityType = function(data) {
    //TODO: make it save to pass a string and use the string as type
    var name = data["name"] || "undefined",
        code = data["code"] || -1,
        group = data["group"] || "undefined",
        groupId = data["groupId"] || -1
    return {
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
            }
        }
    }
}

// EntityType.prototype.toString = function() {
//     return $(this).code
// };

module.exports = function(data) {
    return EntityType(data)
}