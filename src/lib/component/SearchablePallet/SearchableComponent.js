export default function() {
  let $searchField = $('<input type="text" placeholder="Search..."/>')
  $searchField.on('keyup', function() {
    if (typeof $pallet.filterFunction === "function")
      $pallet.filterFunction($searchField.val())
    else
      console.log("The provided object is not a function! Not filtering...")
  })
  //let $labelField = $('<input type="text" placeholder="Optional additional label"/>')
  let $pallet = $('<div>')
    .addClass("textae-editor__type-pallet")
    //.append($labelField)
    .append($searchField)
    .append($('<ul>'))
    .css('position', 'fixed')

  $pallet.filterFunction = (filterText) => console.log("No filtering...")
  return $pallet
}
