

export default function(userColorMapping, dataAccessObject) {
    var hiddenUsers = [],
        colorList = $('<table>')
    for (var key in userColorMapping) {
        if (userColorMapping.hasOwnProperty(key)) {
            let userInfo = userColorMapping[key]
            var filledCircle = $('<div>')
                                .css('border-radius', '100%')
                                .css('background-color', userInfo.color)
            var colorColumn = $('<td>')
            if (key == 0) { //the current user, yes I want "=="
                var completeCircle = filledCircle
                                .css('width', '15px')
                                .css('height', '15px')
                                .css('margin-top', '3px')
                colorColumn.append(completeCircle)
            } else {
                var enabledCircle = filledCircle
                                .css('width', '7px')
                                .css('height', '7px')
                                .css('margin', '2px auto')
                var colorCircle = $('<div>')
                                .css('width', '15px')
                                .css('height', '15px')
                                .css('border-radius', '100%')
                                .css('margin-top', '3px')
                                .css('border', '2px solid ' + userInfo.color)
                                .attr("data-userId", key)
                                .attr("id", "colorCircle" + key)
                                .append(enabledCircle)
                colorCircle.click(function(event) {
                    let currentCircle = $(event.currentTarget),
                        currentStateCircle = currentCircle.children(),
                        currentUserId = currentCircle.attr("data-userId")
                    let index = hiddenUsers.indexOf(currentUserId)
                    if (index < 0) {
                        hiddenUsers.push(currentUserId)
                        currentStateCircle.css("display", "none")
                    } else {
                        currentStateCircle.css("display", "block")
                        hiddenUsers.splice(index, 1)
                    }
                    dataAccessObject.filterUsersFromData([], hiddenUsers)
                })
                colorColumn.append(colorCircle)
            }
            var nameColumn = $('<td>')
                                .append(userInfo.name)
            var row = $('<tr>')
                        .append(colorColumn)
                        .append(nameColumn)
            colorList.append(row)
        }
    };
    var floatingLegend = $('<div>')
                            .addClass("textae-editor__legend")
                            .attr("id", "textae-editor__legend")
                            .append(colorList)
    return floatingLegend
}