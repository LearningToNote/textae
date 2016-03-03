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
  if (typeContainer && typeContainer.getSortedNames().length > 0) {
    $pallet = reuseOldPallet($pallet)
    $pallet = appendRows(typeContainer, $pallet, "", selectedType)
    $pallet = setMaxHeight($pallet)

    let selectedEntry = collapseAllRowsExceptSelected($pallet)

    let palletFilterFunction = function(filterText) {
      if (filterText === undefined || filterText === "") {
        return
      }
      clearPallet($pallet)
      appendRows(typeContainer, $pallet, filterText)
      if (filterText.length > 0)
        expandAllRows($pallet)
      else
        collapseAllRowsExceptSelected($pallet)
    }
    $pallet.filterFunction = palletFilterFunction
    // Move the pallet to mouse.
    $pallet
      .css(point)
      .show()
    $pallet.find('input[type=text]').val('')
    $pallet.find('input[type=text]').focus()
    //scroll the selected entry into the visible region
    //while keeping it at the bottom of the pallet
    if (selectedEntry !== undefined) {
      $pallet.animate({scrollTop: selectedEntry.offset().top - $pallet.offset().top
                                    + $pallet.scrollTop() - $pallet.height() + 30})
    }
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
      var type = typeContainer.getTypeForCode(typeCode)
      typeSelection.selectType(type)
      $pallet.hide()
    })

}

function collapseAllRowsExceptSelected($pallet) {
  var selectedEntry = undefined
  $.each($pallet.find('.textae-editor__type-pallet__entrylist'), function(i, entry) {
    var match = $(entry).find('input:checked')
    if (match === undefined || match.length === 0) {
      $(entry).hide()
    } else {
      selectedEntry = match
    }
  })
  return selectedEntry
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
