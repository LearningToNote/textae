import SearchableComponent from './SearchableComponent'
import Row from './Row'

export default function(selectType, selectDefaultType) {
  let $pallet = new SearchableComponent(selectType, selectDefaultType)

  return {
    show: (typeContainer, point) => show($pallet, typeContainer, point),
    hide: () => $pallet.hide()
  }
}

function show($pallet, typeContainer, point) {
  console.log("TypeContainer:")
  console.log(typeContainer)
  if (typeContainer && typeContainer.getSortedNames().length > 0) {
    $pallet = reuseOldPallet($pallet)
    $pallet = appendRows(typeContainer, $pallet)
    $pallet = setMaxHeight($pallet)

    collapseAllRows($pallet)

    // Move the pallet to mouse.
    $pallet
      .css(point)
      .show()
  }
}

function reuseOldPallet($pallet) {
  let $oldPallet = $('.textae-editor__type-pallet')

  if ($oldPallet.length !== 0) {
    return $oldPallet.find('ul').empty().end().css('width', 'auto')
  } else {
    // Append the pallet to body to show on top.
    $("body").append($pallet)
    return $pallet
  }
}

function appendRows(typeContainer, $pallet) {
  $pallet.find("ul")
     .append(new Row(typeContainer))
     .end()

  setupOnClickEvents($pallet)
  return $pallet
}

function setupOnClickEvents($pallet) {
  $pallet.find('.palletRowClassElement')
    .on('click', function() {
      if(!($(this).children('.palletRowClassEntryList').is(':visible'))){
        $('.palletRowClassEntryList').slideUp();
        $(this).children('.palletRowClassEntryList').slideDown();
      } else {
        $('.palletRowClassEntryList').slideUp();
      }
    })
  $pallet.find('.palletRowClassEntry')
    .on('click', function() {
      $pallet.hide()
      $pallet.selectType($(this).attr('label'))
    })

}

function collapseAllRows($pallet) {
  $.each($pallet.find('.palletRowClassEntryList'), function(i, entry) {
    var match = $(entry).find('input:checked')
    if (match === undefined || match.length === 0) {
      $(entry).hide()
    }
  })
}

function setMaxHeight($pallet) {
  // Show the scrollbar-y if the height of the pallet is same witch max-height.
  if ($pallet.outerHeight() + 'px' === $pallet.css('max-height')) {
    return $pallet.css('overflow-y', 'scroll')
  } else {
    return $pallet.css('overflow-y', '')
  }
}
