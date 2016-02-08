export default function(span) {
  let element = document.createElement('span')
  element.setAttribute('id', span.id)
  element.setAttribute('data-model_id', span.id)
  element.setAttribute('class', 'textae-editor__span')
  element.setAttribute('tabindex', 0)
  return element
}
