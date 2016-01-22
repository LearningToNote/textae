export default function(typeEditor) {
  if (typeEditor.getSelectedIdEditable().length > 0) {
    let currentType = typeEditor.getTypeOfSelected()

    var newLabel = prompt('Please enter a new label', currentType)
    if (newLabel) {
      typeEditor.changeLabelOfSelected(newLabel)
    }
  }
}
