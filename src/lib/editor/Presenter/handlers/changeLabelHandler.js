export default function(typeEditor) {
  if (typeEditor.getUserIdOfSelected() === undefined || typeEditor.getUserIdOfSelected() === 0) {
    if (typeEditor.getSelectedIdEditable().length > 0) {
      let currentType = typeEditor.getTypeOfSelected()

      var newLabel = prompt('Please enter a new label', currentType)
      if (newLabel) {
        typeEditor.changeLabelOfSelected(newLabel)
      }
    }
  } else {
    toastr.info('Accept the selected entity first ([A]) and edit your copy.',
      "You're not allowed to change the label of entities and relations of other people.",
      {progressBar: true, closeButton: true})
  }
}
