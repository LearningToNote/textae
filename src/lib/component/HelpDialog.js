var ToolDialog = require('./dialog/GetToolDialog')

module.exports = function() {
  let tableText = '<table><tr><td class="bold">A</td><td>Accept selected elements and copy them to your set of annotations</td></tr><tr><td class="bold">B</td><td>Toggle automatic word boundary detection</td></tr><tr><td class="bold">D</td><td>Remove selected elements from your set of annotations</td></tr><tr><td class="bold">DEL</td><td>Remove selected elements from your set of annotations</td></tr><tr><td class="bold">E</td><td>Create a new Entity for the current word</td></tr><tr><td class="bold">L</td><td>Change the displayed label</td></tr><tr><td class="bold">R</td><td>Replicate the current annotation and annotate other occurences of the currently selected text the same way</td></tr><tr><td class="bold">S</td><td>Save the current state of the document to the database</td></tr><tr><td class="bold">T</td><td>Change the type of the currently selected annotation</td></tr><tr><td class="bold">Y</td><td>Redo</td></tr><tr><td class="bold">Z</td><td>Undo</td></tr><tr><td class="bold">ESC</td><td>Cancel the current selection</td></tr><tr><td class="bold">← → ↑ ↓</td><td>Navigate through annotations using the keyboard</td></tr></table>'
  var helpDialog = new ToolDialog(
  'textae-control__help',
		'Keyboard Shortcuts', {
  height: 313,
  width: 523
		},
		$('<div>')
            .append(tableText)
            .addClass('textae-tool__key-help'))

  return helpDialog.open
}
