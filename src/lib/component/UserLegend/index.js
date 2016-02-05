

export default function(userColorMapping) {
    var colorList = $('<table>')
    for (var key in userColorMapping) {
        if (userColorMapping.hasOwnProperty(key)) {
            let userInfo = userColorMapping[key]
            var colorCircle = $('<div>')
                                .css('width', '15px')
                                .css('height', '15px')
                                .css('border-radius', '100%')
                                .css('background-color', userInfo.color)
                                .css('margin-top', '3px')
            var colorColumn = $('<td>')
                                .append(colorCircle)
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
                            .append(colorList)
    return floatingLegend
}