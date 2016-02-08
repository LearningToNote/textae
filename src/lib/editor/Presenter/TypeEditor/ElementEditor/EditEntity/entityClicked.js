import dismissBrowserSelection from '../../dismissBrowserSelection'

export default function(selectionModel, e) {
  dismissBrowserSelection()

  if (e.ctrlKey || e.metaKey) {
    selectionModel.entity.toggle(e.target.getAttribute('data-model_id'))
  } else {
    selectionModel.clear()
    selectionModel.entity.add(e.target.getAttribute('data-model_id'))
  }
  return false
}
