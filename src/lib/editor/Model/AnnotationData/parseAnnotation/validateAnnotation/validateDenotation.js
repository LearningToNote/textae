import validate from './validate'
import isBoundaryCrossingWithOtherSpans from './isBoundaryCrossingWithOtherSpans'

export default function(text, paragraph, denotations) {
  const resultHasLength = validate(
      denotations,
      hasLength
    ),
    resultInText = validate(
      resultHasLength.accept,
      isBeginAndEndIn,
      text
    ),
    resultInParagraph = validate(
      resultInText.accept,
      isInParagraph,
      paragraph
    ),
    resultIsNotCrossing = validate(
      resultInParagraph.accept, (denotation, opt, index, array) => {
        let others = array.slice(0, index).map(d => d.span)
        let flattenedOthers = [].concat.apply([], others)
        var isInvalid = false
        for (var i = denotation.span.length - 1; i >= 0; i--) {
          if (isBoundaryCrossingWithOtherSpans(flattenedOthers, denotation.span[i])) {
            isInvalid = true
            break
          }
        }

        return !isInvalid
      }
    ),
    errorCount = resultHasLength.reject.length +
    resultInText.reject.length +
    resultInParagraph.reject.length +
    resultIsNotCrossing.reject.length

  return {
    accept: resultIsNotCrossing.accept,
    reject: {
      hasLength: resultHasLength.reject,
      inText: resultInText.reject,
      inParagraph: resultInParagraph.reject,
      isNotCrossing: resultIsNotCrossing.reject
    },
    hasError: errorCount !== 0
  }
}

function hasLength(denotation) {
  return denotation.span.length > 0 &&
          denotation.span[denotation.span.length - 1].end - denotation.span[0].begin > 0
}

function isInText(boundary, text) {
  return 0 <= boundary && boundary <= text.length
}

function isBeginAndEndIn(denotation, text) {
  return isInText(denotation.span[0].begin, text) &&
    isInText(denotation.span[denotation.span.length - 1].end, text)
}

function isInParagraph(denotation, paragraph) {
  return paragraph.all()
    .filter(p => p.begin <= denotation.span.begin && denotation.span.end <= p.end)
    .length === 1
}
