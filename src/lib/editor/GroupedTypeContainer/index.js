import reduce2hash from '../../util/reduce2hash'
import uri from '../uri'
import EntityType from './EntityType.js'

var DEFAULT_TYPE = EntityType({"name": "undefined", "code": "-1", "groupID": "-1", "group": "No Group"}),
  TypeContainer = function(getActualTypesFunction, defaultColor) {
    var definedTypes = {},
      defaultType = DEFAULT_TYPE

    return {
      setDefinedTypes: function(newDefinedTypes) {
        definedTypes = newDefinedTypes
      },
      getDeinedTypes: function() {
        return _.extend({}, definedTypes)
      },
      setDefaultType: function(type) {
        defaultType = type
      },
      getDefaultType: function() {
        return defaultType || this.getSortedNames()[0]
      },
      getColor: function(code) {
        // console.log("trying to get the color of " + code)
        // console.log(definedTypes)
        // console.log(definedTypes[code])
        return definedTypes[code] && definedTypes[code].color || defaultColor
      },
      getUri: function(code) {
        // console.log("trying to get the uri of " + code)
        // console.log(code)
        return definedTypes[code] && definedTypes[code].uri ||
          uri.getUrlMatches(code) ? code : undefined
      },
      getSortedNames: function() {
        if (getActualTypesFunction) {
          var typeCount = getActualTypesFunction()
            .concat(Object.keys(definedTypes))
            .reduce(function(a, b) {
              a[b] = a[b] ? a[b] + 1 : 1
              return a
            }, {})

          // Sort by number of types, and by name if numbers are same.
          var typeNames = Object.keys(typeCount)
          typeNames.sort(function(a, b) {
            var diff = typeCount[b] - typeCount[a]
            return diff !== 0 ? diff :
              a > b ? 1 :
              b < a ? -1 :
              0
          })
          console.log("type names:")
          console.log(typeNames)
          console.log("definedTypes:")
          console.log(definedTypes)

          return typeNames.map(function(code) { if (code === "-1") { return DEFAULT_TYPE } else { return definedTypes[code] }})
        } else {
          return []
        }
      }
    }
  },
  setContainerDefinedTypes = function(container, newDefinedTypes) {
    console.log("Got new default types:")
    console.log(newDefinedTypes)
    // expected newDefinedTypes is an array of object. example of object is {"name": "Regulation","color": "#FFFF66","default": true}.
    if (newDefinedTypes !== undefined) {
      var test = createCodeMapping(newDefinedTypes.map(EntityType))
      console.log("###############################################")
      console.log(test)
      container.setDefinedTypes(test)
    }
    console.log("Newly defined types:")
    console.log(container.getDeinedTypes())
  }

function createCodeMapping(entities) {
  return entities.reduce(function(obj, element) {
    obj[element.toString()] = element
    return obj
  }, {})
}

module.exports = function(model) {
  var entityContainer = _.extend(new TypeContainer(model.annotationData.entity.types, '#77DDDD'), {
      isBlock: function(type) {
        // console.log(type, entityContainer.getDeinedTypes(), entityContainer.getDeinedTypes()[type]);
        var definition = entityContainer.getDeinedTypes()[type]
        return definition && definition.type && definition.type === 'block'
      }
    }),
    relationContaier = new TypeContainer(model.annotationData.relation.types, '#555555')

  return {
    entity: entityContainer,
    setDefinedEntityTypes: _.partial(setContainerDefinedTypes, entityContainer),
    relation: relationContaier,
    setDefinedRelationTypes: _.partial(setContainerDefinedTypes, relationContaier)
  }
}
