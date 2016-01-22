// Observe key-input events and convert events to readable code.
export default function(keyInputHandler, escInputHandler) {
  let noop = () => {},
    onKeyup = keyInputHandler // Overwrite by the noop when daialogs are opened.

  // Observe key-input
  document.addEventListener('keyup', (event) => onKeyup(event))

  // Disable/Enable key-input When a jquery-ui dialog or the searchable pallet is opened/closed
  $('body')
    .on('dialogopen', '.ui-dialog', () => onKeyup = noop)
    .on('dialogclose', '.ui-dialog', () => onKeyup = keyInputHandler)
  document.body
    .addEventListener('showPallet', () => onKeyup = escInputHandler)
  document.body
    .addEventListener('hidePallet', () => onKeyup = keyInputHandler)
}
