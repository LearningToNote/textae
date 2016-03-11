import idFactory from '../../idFactory'

export default function(spanId, type, userId) {
  return $('#' + idFactory.makeTypeId(spanId, type.toString(), userId))
}
