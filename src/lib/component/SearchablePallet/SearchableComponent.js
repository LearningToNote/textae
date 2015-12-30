export default function() {
  let $searchField = $('<input type="text" placeholder="Search..."/>')
  $searchField.on('change', function() {
    console.log('It changed!!')
  })
  //let $labelField = $('<input type="text" placeholder="Optional additional label"/>')
  let $pallet = $('<div>')
    .addClass("textae-editor__type-pallet")
    //.append($labelField)
    .append($searchField)
    .append($('<ul>'))
    .css('position', 'fixed')

  return $pallet
}
