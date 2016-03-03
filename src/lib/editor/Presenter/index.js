import SettingDialog from '../../component/SettingDialog'
import TypeEditor from './TypeEditor'
import EditMode from './EditMode'
import DisplayInstance from './DisplayInstance'
import setDefaultEditability from './setDefaultEditability'
import changeLabelHandler from './handlers/changeLabelHandler'
import ClipBoardHandler from './handlers/ClipBoardHandler'
import DefaultEntityHandler from './handlers/DefaultEntityHandler'
import removeSelectedElements from './handlers/removeSelectedElements'
import ModificationHandler from './handlers/ModificationHandler'
import SelectHandler from './handlers/SelectHandler'
import ToggleButtonHandler from './handlers/ToggleButtonHandler'
import ModeButtonHandlers from './handlers/ModeButtonHandlers'
import enableSaveButtorAtEditable from './enableSaveButtorAtEditable'
import acceptSelectedElements from './handlers/acceptSelectedElements'

export default function(
  editor,
  model,
  view,
  command,
  spanConfig,
  clipBoard,
  buttonController,
  typeGap,
  typeContainer,
  writable
) {
  let typeEditor = new TypeEditor(
      editor,
      model,
      spanConfig,
      command,
      buttonController.modeAccordingToButton,
      typeContainer
    ),
    editMode = new EditMode(
      editor,
      model,
      typeEditor,
      buttonController.buttonStateHelper
    ),
    displayInstance = new DisplayInstance(
      typeGap,
      editMode
    ),
    defaultEntityHandler = new DefaultEntityHandler(
      command,
      model.annotationData,
      model.selectionModel,
      buttonController.modeAccordingToButton,
      spanConfig,
      typeContainer.entity
    ),
    clipBoardHandler = new ClipBoardHandler(
      command,
      model.annotationData,
      model.selectionModel,
      clipBoard
    ),
    modificationHandler = new ModificationHandler(
      command,
      model.annotationData,
      buttonController.modeAccordingToButton,
      typeEditor
    ),
    toggleButtonHandler = new ToggleButtonHandler(
      buttonController.modeAccordingToButton,
      editMode
    ),
    modeButtonHandlers = new ModeButtonHandlers(
      editMode
    ),
    selectHandler = new SelectHandler(
      editor,
      model.selectionModel
    ),
    showSettingDialog = new SettingDialog(
      editor,
      displayInstance
    ),
    editorSelected = () => {
      typeEditor.hideDialogs()

      // Select this editor.
      editor.eventEmitter.emit('textae.editor.select')
      buttonController.buttonStateHelper.propagate()
    },
    event = {
      editorSelected: editorSelected,
      copyEntities: clipBoardHandler.copyEntities,
      removeSelectedElements: () => removeSelectedElements(
        command,
        model.selectionModel,
        selectHandler,
        model.annotationData
      ),
      acceptSelectedElements: () => acceptSelectedElements(
        command,
        model.selectionModel,
        model.annotationData
      ),
      createEntity: defaultEntityHandler.createEntity,
      showPallet: typeEditor.showPallet,
      replicate: defaultEntityHandler.replicate,
      pasteEntities: clipBoardHandler.pasteEntities,
      changeLabel: () => changeLabelHandler(typeEditor),
      cancelSelect: typeEditor.cancelSelect,
      negation: modificationHandler.negation,
      speculation: modificationHandler.speculation,
      showSettingDialog: showSettingDialog
    }

  Object.assign(event, selectHandler)
  Object.assign(event, toggleButtonHandler)
  Object.assign(event, modeButtonHandlers)

  enableSaveButtorAtEditable(writable, editMode, buttonController)

  return {
    init: function(mode) {
      // The jsPlumbConnetion has an original event mecanism.
      // We can only bind the connection directory.
      editor
        .on('textae.editor.jsPlumbConnection.add', (event, jsPlumbConnection) => {
          jsPlumbConnection.bindClickAction(typeEditor.jsPlumbConnectionClicked)
        })

      defaultEntityHandler.on('createEntity', displayInstance.notifyNewInstance)
      setDefaultEditability(model.annotationData, editMode, writable, mode)
    },
    event: event
  }
}
