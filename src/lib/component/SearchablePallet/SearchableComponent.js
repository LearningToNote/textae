export default function(selectType, selectDefaultType) {
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

  $pallet.selectDefaultType = selectDefaultType
  $pallet.selectType = selectType

  // $pallet
  //   .on('click', '.textae-editor__type-pallet__entity-type__label', function() {
  //     $pallet.hide()
  //     selectType($(this).attr('label'))
  //   })
  //   .on('change', '.textae-editor__type-pallet__entity-type__radio', function() {
  //     $pallet.hide()
  //     selectDefaultType($(this).attr('label'))
  //   })
  //   .hide()

  return $pallet
}
