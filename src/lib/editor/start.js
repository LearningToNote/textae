import Observable from 'observ'
import * as ajaxAccessor from '../util/ajaxAccessor'
import StatusBar from '../component/StatusBar'
import getParams from './getParams'
import SpanConfig from './SpanConfig'
import Command from './Command'
import GroupedTypeContainer from './GroupedTypeContainer'
import View from './View'
import Presenter from './Presenter'
import bindMouseEvent from './bindMouseEvent'
import APIs from './APIs'
import calculateLineHeight from './calculateLineHeight'
import UserLegend from '../component/UserLegend'

export default function(editor, dataAccessObject, history, buttonController, model, clipBoard, writable, userPreferences) {
  let params = getParams(editor),
    spanConfig = new SpanConfig(),
    // Users can edit model only via commands.
    command = new Command(editor, model, history),
    typeGap = new Observable(-1),
    typeContainer = new GroupedTypeContainer(model),
    view = new View(editor, model),
    presenter = new Presenter(
      editor,
      model,
      view,
      command,
      spanConfig,
      clipBoard,
      buttonController,
      typeGap,
      typeContainer,
      writable,
      userPreferences
    )

  view.init(editor, buttonController, typeGap, typeContainer, writable)
  bindMouseEvent(editor, presenter, view)
  presenter.init(params.mode)

  let statusBar = getStatusBar(editor, params.status_bar)

  dataAccessObject
    .on('load', data => {
      var legend = $('body').find(".textae-editor__legend")[0]
      if (legend !== undefined) {
        legend.remove()
      }
      legend = new UserLegend(data.annotation.config.users, dataAccessObject, model.annotationData)
      $('body').prepend(legend)
      legend.draggable()
      setAnnotation(spanConfig, typeContainer, model.annotationData, params.config, data.annotation)
      statusBar.status(data.source)
    })

  loadAnnotation(spanConfig, typeContainer, model.annotationData, statusBar, params, dataAccessObject)

  let updateLineHeight = () => calculateLineHeight(editor, model.annotationData, typeContainer, typeGap, view)

  editor.api = new APIs(
    command,
    presenter,
    dataAccessObject,
    history,
    model.annotationData,
    buttonController,
    view,
    updateLineHeight
  )
}

function loadAnnotation(spanConfig, typeContainer, annotationData, statusBar, params, dataAccessObject) {
  let annotation = params.annotation

  if (annotation) {
    if (annotation.inlineAnnotation) {
      // Set an inline annotation.
      setAnnotation(spanConfig, typeContainer, annotationData, params.config, JSON.parse(annotation.inlineAnnotation))
      statusBar.status('inline')
    } else if (annotation.url) {
      // Load an annotation from server.
      dataAccessObject.getAnnotationFromServer(annotation.url)
    } else if (params["hana-document"]) {
      dataAccessObject.getAnnotationFromDatabase(params["hana-document"])
      if (params["tid"]) {
        dataAccessObject.setTask(params["tid"])
      }
    }
  }
}

function setAnnotation(spanConfig, typeContainer, annotationData, config, annotation) {
  let ret = setConfigInAnnotation(spanConfig, typeContainer, annotation)

  if (ret === 'no config') {
    setConfigFromServer(spanConfig, typeContainer, annotationData, config, annotation)
  } else {
    annotationData.reset(annotation)
  }
}

function setConfigInAnnotation(spanConfig, typeContainer, annotation) {
  if (annotation.config !== undefined && annotation.config.users !== undefined) {
    var cssString = ""
    let currentUserInfo = annotation.config.users["0"]
    if (currentUserInfo !== undefined) {
      cssString += ".entity_user_undefined {\n\t"
      cssString += "background-color: " + currentUserInfo.color + "\n}\n"
    }
    for (var userId in annotation.config.users) {
      if (annotation.config.users.hasOwnProperty(userId)) {
        var userInfo = annotation.config.users[userId]
        cssString += ".entity_user_" + userId + " {\n\t"
        cssString += "background-color: " + userInfo.color + "\n}\n"
      }
    }
    annotation.config["raw_css"] = cssString
  }
  spanConfig.reset()
  setSpanAndTypeConfig(spanConfig, typeContainer, annotation.config)

  if (!annotation.config) {
    return 'no config'
  }
}

function setConfigFromServer(spanConfig, typeContainer, annotationData, config, annotation) {
  spanConfig.reset()

  if (typeof config === 'string') {
    ajaxAccessor
      .getAsync(config,
        configFromServer => {
          setSpanAndTypeConfig(spanConfig, typeContainer, configFromServer)
          annotationData.reset(annotation)
        }, () => alert('could not read the span configuration from the location you specified.: ' + config)
      )
  } else {
    annotationData.reset(annotation)
  }
}

function setSpanAndTypeConfig(spanConfig, typeContainer, config) {
  spanConfig.set(config)
  setTypeConfig(typeContainer, config)
}

function setTypeConfig(typeContainer, config) {
  typeContainer.setDefinedEntityTypes(config ? config['entity types'] : [])
  typeContainer.setDefinedRelationTypes(config ? config['relation types'] : [])

  if (config && config.css !== undefined) {
    $('#css_area').html('<link rel="stylesheet" href="' + config.css + '"/>')
  }

  if (config && config["raw_css"] !== undefined) {
    $('head').append('<style type="text/css">' + config["raw_css"] + '</style>')
  }

  return config
}

function getStatusBar(editor, statusBar) {
  if (statusBar === 'on')
    return new StatusBar(editor)
  return {
    status: function() {}
  }
}
