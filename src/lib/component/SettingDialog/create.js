import * as lineHeight from '../../editor/View/lineHeight'
import updateLineHeight from './updateLineHeight'
import updateTypeGapEnable from './updateTypeGapEnable'
import updateTypeGapValue from './updateTypeGapValue'

const CONTENT = `
    <div class="textae-editor__setting-dialog">
        <div>
            <label class="textae-editor__setting-dialog__label">Type Gap</label>
            <input type="number" class="textae-editor__setting-dialog__type-gap type-gap" step="0.5" min="0" max="5">
        </div>
        <div>
            <label class="textae-editor__setting-dialog__label">Line Height</label>
            <input type="number" class="textae-editor__setting-dialog__line-height line-height" step="1" min="50" max="500">
            px
        </div>
    </div>
`

export default function(editor, displayInstance, userPreferences) {
  let $content = $(CONTENT),
      checkbox = getCheckBox(userPreferences)

  $content.append(checkbox)
  bind($content, editor, displayInstance, userPreferences)

  return $content
}

function getCheckBox(userPreferences) {
  var text = '<div><input type="checkbox" name="checkbox" id="use_user_entities_checkbox" value="value" '
  if (userPreferences.useUserEntities) {
    text += 'checked'
  }
  text += '/><label for="use_user_entities_checkbox">Use your entities for prediction</label></div>'
  return text
}

function bind($content, editor, displayInstance, userPreferences) {
  bindChangeTypeGap(
      $content,
      editor,
      displayInstance
  )

  bindChangeLineHeight(
      $content,
      editor
  )

  let checkbox = $content.find('#use_user_entities_checkbox')
  checkbox.click(function() {
    userPreferences.setUseUserEntities($(this).is(':checked'))
  })
}

function bindChangeTypeGap($content, editor, displayInstance) {
  let onTypeGapChange = debounce300(
        (e) => {
          displayInstance.changeTypeGap(e.target.value)
          updateLineHeight(editor, $content)
        }
    )

  return $content
      .on(
          'change',
          '.type-gap',
          onTypeGapChange
      )
}

function bindChangeLineHeight($content, editor) {
  let onLineHeightChange = debounce300(
        (e) => {
          lineHeight.set(editor[0], e.target.value)
          redrawAllEditor()
        }
    )

  return $content
      .on(
          'change',
          '.line-height',
          onLineHeightChange
      )
}

// Redraw all editors in tha windows.
function redrawAllEditor() {
  $(window).trigger('resize')
}

function debounce300(func) {
  return _.debounce(func, 300)
}

function sixteenTimes(val) {
  return val * 16
}
