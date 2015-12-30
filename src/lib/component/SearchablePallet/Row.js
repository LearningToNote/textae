import Handlebars from 'handlebars'

const html = `
{{#groups}}
<li class="palletRowClassElement" style="background-color: {{color}};">
  {{groupName}}
  <ul class="palletRowClassEntryList">
    {{#entries}}
    <li class="palletRowClassEntry">
      <input type="radio" name="etype" label="{{typeCode}}" id="{{typeCode}}" {{#if defaultType}}title="default type" checked="checked"{{/if}}/>
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

export default function(typeContainer) {
  let test = typeContainer.getSortedNames()
  console.log('hypetrain:')
  console.log(test)

  let groupedTypes = groupTypes(test)
  console.log('grouped types:')
  console.log(groupedTypes)

  var groups = []

  for (var groupId in groupedTypes) {
    if (groupedTypes.hasOwnProperty(groupId)) {
      console.log("Checking groupId:" + groupId)
      var group = groupedTypes[groupId]
      var groupDict = {"groupName": group[0].getGroup()}
      groupDict["entries"] = group.map(type => {
          return {
            typeName: type.getName(),
            typeCode: type.getCode(),
            defaultType: type.getName() === typeContainer.getDefaultType(),
            uri: typeContainer.getUri(type),
            color: typeContainer.getColor(type)
          }
      })
      groups.push(groupDict)
    }
  }

  let dict = {"groups": groups}

  console.log("Final dictionary:")
  console.log(dict)

  var finalObject = $(template(dict))

  console.log("finalObject")
  console.log(finalObject)

  return finalObject
}
