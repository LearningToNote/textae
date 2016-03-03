import SearchableComponent from './SearchableComponent'
import Row from './Row'

var typeSelection = {}

export default function(selectType, selectDefaultType) {
  let $pallet = new SearchableComponent()
  typeSelection.selectType = selectType
  typeSelection.selectDefaultType = selectDefaultType

  return {
    show: (typeContainer, point, selectedType) => show($pallet, typeContainer, point, selectedType),
    hide: () => $pallet.hide()
  }
}

function show($pallet, typeContainer, point, selectedType) {
  console.log("TypeContainer:")
  console.log(typeContainer)
  if (typeContainer && typeContainer.getSortedNames().length > 0) {
    $pallet = reuseOldPallet($pallet)
    $pallet = appendRows(typeContainer, $pallet, "", selectedType)
    $pallet = setMaxHeight($pallet)

    collapseAllRows($pallet)

    let palletFilterFunction = function(filterText) {
      console.log("Filtering: " + filterText)
      clearPallet($pallet)
      appendRows(typeContainer, $pallet, filterText)
      if (filterText.length > 0)
        expandAllRows($pallet)
      else
        collapseAllRows($pallet)
    }
    $pallet.filterFunction = palletFilterFunction
    // Move the pallet to mouse.
    $pallet
      .css(point)
      .show()
    $pallet.find('input[type=text]').val('')
    $pallet.find('input[type=text]').focus()
  }
}

function reuseOldPallet($pallet) {
  let $oldPallet = $('.textae-editor__type-pallet')

  if ($oldPallet.length !== 0) {
    clearPallet($oldPallet)
    return $oldPallet
  } else {
    // Append the pallet to body to show on top.
    $("body").append($pallet)
    return $pallet
  }
}

function clearPallet($pallet) {
  $pallet.find('ul').empty().end().css('width', 'auto')
}

function appendRows(typeContainer, $pallet, filterText = "", selectedType) {
  $pallet.find("ul")
     .append(new Row(typeContainer, filterText, selectedType))
     .end()

  setupOnClickEvents(typeContainer, $pallet)
  return $pallet
}

function setupOnClickEvents(typeContainer, $pallet) {
  $pallet.find('.textae-editor__type-pallet__group')
    .on('click', function() {
      if(!($(this).children('.textae-editor__type-pallet__entrylist').is(':visible'))){
        $('.textae-editor__type-pallet__entrylist').slideUp();
        $(this).children('.textae-editor__type-pallet__entrylist').slideDown();
      } else {
        $('.textae-editor__type-pallet__entrylist').slideUp();
      }
    })
  $pallet.find('.textae-editor__type-pallet__entry')
    .on('click', function() {
      var typeCode = $(this).children('input').attr('label')
      console.log("Clicked on: ")
      console.log($(this))
      console.log("Selected type:")
      console.log(typeCode)
      var type = typeContainer.getTypeForCode(typeCode)
      console.log("Got type for code:")
      console.log(type)
      typeSelection.selectType(type)
      $pallet.hide()
    })

}

function collapseAllRows($pallet) {
  $.each($pallet.find('.textae-editor__type-pallet__entrylist'), function(i, entry) {
    var match = $(entry).find('input:checked')
    if (match === undefined || match.length === 0) {
      $(entry).hide()
    }
  })
}

function expandAllRows($pallet) {
  $.each($pallet.find('.textae-editor__type-pallet__entrylist'), function(i, entry) {
    $(entry).slideDown()
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
