import Handlebars from 'handlebars'

const html = `
{{#groups}}
<li class="textae-editor__type-pallet__group" style="background-color: {{color}};">
  {{groupName}}
  <ul class="textae-editor__type-pallet__entrylist">
    {{#entries}}
    <li class="textae-editor__type-pallet__entry">
      <input type="radio" name="etype" label="{{typeCode}}" id="{{typeCode}}" {{#if isSelected}}checked="checked"{{/if}}/>
      <label for="{{typeCode}}">{{typeName}}</label>
    </li>
    {{/entries}}
  </ul>
</li>
{{/groups}}
`

let template = Handlebars.compile(html)

function groupTypes(types) {
  var groupedTypes = {}
  for (var i = types.length - 1; i >= 0; i--) {
    var currentType = types[i]
    var currentGroup = currentType.getGroupId()
    if (!(currentGroup in groupedTypes)) {
      groupedTypes[currentGroup] = []
    }
    groupedTypes[currentGroup].push(currentType)
  }
  return groupedTypes
}

export default function(typeContainer, filterText, selectedType) {
  var types = typeContainer.getSortedNames()
  types = types.filter(function(el) { return el.getLabel().toLowerCase().indexOf(filterText.toLowerCase()) > -1 })
  let groupedTypes = groupTypes(types)
  var groups = []

  for (var groupId in groupedTypes) {
    if (groupedTypes.hasOwnProperty(groupId)) {
      var group = groupedTypes[groupId]
      var groupDict = {"groupName": group[0].getGroup()}
      group.sort(function(a, b) {
        if (a.getName() < b.getName()) {
          return -1
        } else if (a.getName() > b.getName()) {
          return 1
        }
        return 0
      })
      groupDict["entries"] = group.map(type => {
          return {
            typeName: type.getName(),
            typeCode: type.getId(),
            isSelected: selectedType !== undefined && type.getName() === selectedType.getName(),
            uri: typeContainer.getUri(type),
            color: typeContainer.getColor(type)
          }
      })
      groups.push(groupDict)
    }
  }

  let dict = {"groups": groups}

  return $(template(dict))
}
