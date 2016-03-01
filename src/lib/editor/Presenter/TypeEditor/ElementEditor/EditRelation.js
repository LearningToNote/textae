import dismissBrowserSelection from '../dismissBrowserSelection'
import changeTypeIfSelected from './changeTypeIfSelected'
import unbindAllEventhandler from './unbindAllEventhandler'

export default function(editor, selectionModel, annotationData, command, typeContainer, cancelSelect) {
  // Control only entities and relations.
  // Cancel events of relations and theier label.
  // Because a jQuery event and a jsPlumb event are both fired when a relation are clicked.
  // And jQuery events are propergated to body click events and cancel select.
  // So multi selection of relations with Ctrl-key is not work.
  let bind = () => {
      editor
        .on('mouseup', '.textae-editor__entity', (e) => entityClickedAtRelationMode(
          selectionModel,
          command,
          typeContainer,
          e,
          annotationData.entity
        ))
        .on('mouseup', '.textae-editor__relation, .textae-editor__relation__label', returnFalse)
        .on('mouseup', '.textae-editor__body', cancelSelect)
    },
    getSelectedIdEditable = selectionModel.relation.all,
    handler = {
      changeLabelOfSelected: (newLabel) => changeTypeIfSelected(
        command,
        getSelectedIdEditable,
        command.factory.relationChangeLabelCommand,
        newLabel
      ),
      changeTypeOfSelected: (newType) => changeTypeIfSelected(
        command,
        getSelectedIdEditable,
        command.factory.relationChangeTypeCommand,
        newType
      ),
      getSelectedIdEditable: selectionModel.relation.all,
      getSelectedType: () => {
        let id = selectionModel.relation.single()

        if (id)
          return annotationData.relation.get(id).type
        else
          return ''
      },
      getSelectedUserId: () => {
        let relationId = selectionModel.relation.single()

        if (relationId) {
          let subj = annotationData.relation.get(relationId).subj
          let obj = annotationData.relation.get(relationId).obj
          if (annotationData.entity.get(obj).userId === annotationData.entity.get(subj).userId) {
            return annotationData.entity.get(obj).userId
          }
        }
        return undefined //userId 0 would be the current user
      },
      typeContainer: typeContainer.relation,
      jsPlumbConnectionClicked: (jsPlumbConnection, event) => selectRelation(
        selectionModel,
        jsPlumbConnection,
        event
      )
    }

  return () => [bind, handler]
}

function entityClickedAtRelationMode(selectionModel, command, typeContainer, e, entityModelContainer) {
  let entityId = $(e.target).attr('data-model_id')
  if (entityModelContainer.get(entityId).userId !== 0) {
    toastr.info("Accept the affected entity first ([A]) and use your copy.",
      "You're not allowed to create relations with entities of other users.",
      {progressBar: true, closeButton: true})
    return false
  }
  if (!selectionModel.entity.some()) {
    selectionModel.clear()
    selectionModel.entity.add(entityId)
  } else {
    selectObjectEntity(selectionModel, command, typeContainer, e)
  }
  return false
}

function returnFalse() {
  return false
}

// Select or deselect relation.
// This function is expected to be called when Relation-Edit-Mode.
function selectRelation(selectionModel, jsPlumbConnection, event) {
  let relationId = jsPlumbConnection.getParameter("id")

  if (event.ctrlKey || event.metaKey) {
    selectionModel.relation.toggle(relationId)
  } else if (selectionModel.relation.single() !== relationId) {
    // Select only self
    selectionModel.clear()
    selectionModel.relation.add(relationId)
  }
}

function selectObjectEntity(selectionModel, command, typeContainer, e) {
  // Cannot make a self reference relation.
  let subjectEntityId = selectionModel.entity.all()[0],
    objectEntityId = $(e.target).attr('data-model_id')

  if (subjectEntityId === objectEntityId) {
    // Deslect already selected entity.
    selectionModel.entity.remove(subjectEntityId)
  } else {
    selectionModel.entity.add(objectEntityId)
    _.defer(() => {
      command.invoke([command.factory.relationCreateCommand({
        subj: subjectEntityId,
        obj: objectEntityId,
        type: typeContainer.relation.getDefaultType()
      })])

      if (e.ctrlKey || e.metaKey) {
        // Remaining selection of the subject entity.
        selectionModel.entity.remove(objectEntityId)
      } else if (e.shiftKey) {
        dismissBrowserSelection()
        selectionModel.entity.remove(subjectEntityId)
        selectionModel.entity.add(objectEntityId)
        return false
      } else {
        selectionModel.entity.remove(subjectEntityId)
        selectionModel.entity.remove(objectEntityId)
      }
    })
  }
}
