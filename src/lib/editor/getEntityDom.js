export default function(editor, entityId) {
  return editor.querySelector(`[data-model_id="${entityId}"]`)
}
