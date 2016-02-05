import not from 'not'

const BLOCK = 'textae-editor__span--block',
  WRAP = 'textae-editor__span--wrap',
  PREDICTION = 'textae-editor__span--prediction'

export default function(span, isBlockFunc) {
  var spanElement = document.querySelector('#' + span.id)

  spanElement.classList.remove(PREDICTION)
  if (hasType(span, isBlockFunc)) {
    spanElement.classList.add(BLOCK)
  } else {
    spanElement.classList.remove(BLOCK)
  }

  if (hasType(span, not(isBlockFunc))) {
    if (spanElement.classList.contains(WRAP)) {
      spanElement.classList.remove(WRAP)
    }
  } else {
    spanElement.classList.add(WRAP)
  }
}

function hasType(span, isBlockFunc) {
  return span
    .getTypes()
    .map(type => type.name)
    .filter(isBlockFunc)
    .length > 0
}
