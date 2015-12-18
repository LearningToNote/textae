import Handlebars from 'handlebars'

const html = `
{{#groups}}
<li class="palletRowClassElement" style="background-color: {{color}};">
  {{groupName}}
  <ul class="palletRowClassEntryList">
    {{#entries}}
    <li class="palletRowClassEntry">
      <input type="radio" name="etype" label="{{typeName}}" id="radio-{{typeName}}" {{#if defaultType}}title="default type" checked="checked"{{/if}}/>
      <label for="radio-{{typeName}}">{{typeName}}</label>
    </li>
    {{/entries}}
  </ul>
</li>
{{/groups}}
`

let template = Handlebars.compile(html)

export default function(typeContainer) {
  // let types = typeContainer
  //   .getSortedNames()
  //   .map(typeName => {
  //     return {
  //       typeName: typeName,
  //       defaultType: typeName === typeContainer.getDefaultType(),
  //       uri: typeContainer.getUri(typeName),
  //       color: typeContainer.getColor(typeName)
  //     }
  //   })

  let types = {
    "groups": [
      {
        "groupName": "test1",
        "entries": [
          {"typeName": "type11"},
          {"typeName": "type12"},
          {"typeName": "type13"},
          {"typeName": "type14"},
        ]
      },
      {
        "groupName": "test2",
        "entries": [
          {"typeName": "type21"},
          {"typeName": "type22"},
          {"typeName": "type23"},
          {"typeName": "type24"},
        ]
      },
      {
        "groupName": "test3",
        "entries": [
          {"typeName": "type31"},
          {"typeName": "type32"},
          {"typeName": "type33"},
          {"typeName": "type34"},
        ]
      }
    ]
  }

  return $(template(types))
}
