var ToolDialog = require('./dialog/GetToolDialog')

module.exports = function() {
  var helpDialog = new ToolDialog(
  'textae-control__help',
		'Help (Keyboard short-cuts)', {
  height: 313,
  width: 523
		},
		$('<div>')
            .append('<span>TBD</span>'))
            // .addClass('textae-tool__key-help'))

  return helpDialog.open
}
