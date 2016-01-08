
var EntityType = function(data) {
    var name = data["name"],
        code = data["code"],
        group = data["group"],
        groupId = data["groupId"]
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

EntityType.prototype.toString = function() {
    return $(this).code
};

module.exports = function(data) {
    return EntityType(data)
}