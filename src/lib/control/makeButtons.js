import Handlebars from 'handlebars'

// Make a group of buttons that is headed by the separator.
const source = `
    <span class="textae-control__title__back">
        <a href="#" onclick="window.history.back();return false;">Go Back</a>
    </span>
    <span class="textae-control__separator"></span>
    <span class="textae-control__title">
        <a href="http://hpi.de/plattner/teaching/winter-term-201516/master-project-hpn-learning-to-note.html" target="_blank">TextA<i>I</i></a>
    </span>
    {{#buttonGroup}}
    <span class="textae-control__separator"></span>
        {{#list}}
    <span class="textae-control__icon textae-control__{{type}}-button" title="{{title}}"></span>
        {{/list}}
    {{/buttonGroup}}
    `

let tepmlate = Handlebars.compile(source)

export default function($control, buttonMap) {
  $control[0].innerHTML = tepmlate(buttonMap)
}
