import capitalize from 'capitalize'

const SEED = {
  instanceHide: 0,
  instanceShow: 2
}

export default function() {
  let api = _.extend({}, SEED),
    set = (mode, val) => updateHash(api, mode, val)

  _.each(SEED, (val, key) => {
    api['set' + capitalize(key)] = (val) => set(key, val)
  })

  return api
}

function updateHash(hash, key, val) {
  hash[key] = val
  return val
}
