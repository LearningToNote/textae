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
        if (!isFromAllowedUser(denotation)) {
          return false
        }
        let filtered = array.slice(0, index).filter(d => isFromSameUser(denotation, d))
        let others = filtered.map(d => d.span),
          isInvalid = isBoundaryCrossingWithOtherSpans(others, denotation.span)

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

function isFromSameUser(denotation, comparedDenotation) {
  return denotation.userId === comparedDenotation.userId
}

function isFromAllowedUser(denotation) {
  return true
  return denotation.userId === 0 || denotation.userId === -1
}

function hasLength(denotation) {
  return denotation.span.end - denotation.span.begin > 0
}

function isInText(boundary, text) {
  return 0 <= boundary && boundary <= text.length
}

function isBeginAndEndIn(denotation, text) {
  return isInText(denotation.span.begin, text) &&
    isInText(denotation.span.end, text)
}

function isInParagraph(denotation, paragraph) {
  return paragraph.all()
    .filter(p => p.begin <= denotation.span.begin && denotation.span.end <= p.end)
    .length === 1
}
