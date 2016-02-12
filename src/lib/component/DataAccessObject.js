import url from 'url'
import {
  EventEmitter as EventEmitter
}
from 'events'
import * as ajaxAccessor from '../util/ajaxAccessor'
import CursorChanger from '../util/CursorChanger'
import GetEditorDialog from './dialog/GetEditorDialog'
import jQuerySugar from './jQuerySugar'
import DataCache from './DataCache'

var bindEvent = function($target, event, func) {
    $target.on(event, func)
  },
  bindCloseEvent = function($dialog) {
    bindEvent($dialog, 'dialog.close', function() {
      $dialog.close()
    })
    return $dialog
  }

// A sub component to save and load data.
module.exports = function(editor, confirmDiscardChangeMessage) {
  var dataSourceUrl = '',
    cursorChanger = new CursorChanger(editor),
    dataCache = new DataCache(),
    getAnnotationFromServer = function(urlToJson) {
      cursorChanger.startWait()
      ajaxAccessor.getAsync(urlToJson, function getAnnotationFromServerSuccess(annotation) {
        api.emit('load', {
          annotation: annotation,
          source: jQuerySugar.toLink(url.resolve(location.href, urlToJson))
        })
        dataSourceUrl = urlToJson
      }, function() {
        cursorChanger.endWait()
        toastr.error("Could not load the target.")
      })
    },
    getAnnotationFromDatabase = function(entryIdentifier) {
      cursorChanger.startWait()
      toastr.info('', 'Loading...', {timeOut: 0, extendedTimeOut: 0})
      let url = 'https://' + window.location.hostname + ':8080/documents/' + entryIdentifier
      ajaxAccessor.getAsync(url, function(data) {
        //success
        console.log("Did load data from the database:")
        console.log(data)
        dataCache.setNewData(data)
        toastr.clear()
        api.emit('load', {
          annotation: data,
          source: "Database"
        })
      }, function() {
        //failure
        dataCache.setNewData()
        toastr.clear()
        cursorChanger.endWait()
        toastr.error("Could not load the document :-(")
      })
    },
    filterUsersFromCachedData = function(currentState, filteredUsers) {
      cursorChanger.startWait()
      toastr.info('', 'Loading...', {timeOut: 0, extendedTimeOut: 0})
      var filteredData = dataCache.filterData(currentState, filteredUsers)
      toastr.clear()
      cursorChanger.endWait()
      console.log("FilteredData: ", filteredData)
      api.emit('load', {
        annotation: filteredData,
        source: "Database"
      })
    },
    // load/saveDialog
    loadSaveDialog = function() {
      var extendOpenWithUrl = function($dialog) {
          // Do not set twice.
          if (!$dialog.openAndSetParam) {
            $dialog.openAndSetParam = _.compose($dialog.open.bind($dialog), function(params) {
              // Display dataSourceUrl.
              this.find('[type="text"].url')
                .val(dataSourceUrl)
                .trigger('input')

              $dialog.params = params
            })
          }

          return $dialog
        },
        getDialog = _.compose(extendOpenWithUrl, bindCloseEvent, new GetEditorDialog(editor)),
        label = {
          URL: 'URL',
          LOCAL: 'Local',
          HANA: 'HANA'
        },
        getLoadDialog = function(editorId) {
          var getAnnotationFromFile = function(file) {
              var firstFile = file.files[0],
                reader = new FileReader()

              reader.onload = function() {
                var annotation = JSON.parse(this.result)
                api.emit('load', {
                  annotation: annotation,
                  source: firstFile.name + '(local file)'
                })
              }
              reader.readAsText(firstFile)
            },
            RowDiv = _.partial(jQuerySugar.Div, 'textae-editor__load-dialog__row'),
            RowLabel = _.partial(jQuerySugar.Label, 'textae-editor__load-dialog__label'),
            OpenButton = _.partial(jQuerySugar.Button, 'Open'),
            isUserComfirm = function() {
              // The params was set hasAnythingToSave.
              return !$dialog.params || window.confirm(confirmDiscardChangeMessage)
            },
            $buttonUrl = new OpenButton('url'),
            $buttonLocal = new OpenButton('local'),
            $buttonHANA = new OpenButton('hana'),
            $content = $('<div>')
            .append(
              new RowDiv().append(
                new RowLabel(label.URL),
                $('<input type="text" class="textae-editor__load-dialog__file-name url" />'),
                $buttonUrl
              )
            )
            .on('input', '[type="text"].url', function() {
              jQuerySugar.enabled($buttonUrl, this.value)
            })
            .on('click', '[type="button"].url', function() {
              if (isUserComfirm()) {
                getAnnotationFromServer(jQuerySugar.getValueFromText($content, 'url'))
              }

              $content.trigger('dialog.close')
            })
            .append(
              new RowDiv().append(
                new RowLabel(label.LOCAL),
                $('<input class="textae-editor__load-dialog__file" type="file" />'),
                $buttonLocal
              )
            )
            .on('change', '[type="file"]', function() {
              jQuerySugar.enabled($buttonLocal, this.files.length > 0)
            })
            .on('click', '[type="button"].local', function() {
              if (isUserComfirm()) {
                getAnnotationFromFile($content.find('[type="file"]')[0])
              }

              $content.trigger('dialog.close')
            })
            .append(
              new RowDiv().append(
                new RowLabel(label.HANA),
                $('<select name="documents_selector"><option value="-1">Loading...</option></select>'),
                $buttonHANA
              )
            )
            .on('change', function() {
              jQuerySugar.enabled($buttonHANA, $('select[name="documents_selector"]').find(':selected').val() !== '-1')
            })
            .on('click', '[type="button"].hana', function() {
              getAnnotationFromDatabase($('select[name="documents_selector"]').find(':selected').val())
              $content.trigger('dialog.close')
            })

          $.get('https://' + window.location.hostname + ':8080/documents', function (documents){
            var first_option = 'Please select a document'
            if (typeof documents === 'undefined' || documents.length == 0) {
              first_option = 'No documents available'
            }
            $('select[name="documents_selector"]').find('option')
                                                  .remove()
                                                  .end()
                                                  .append('<option value="-1">' + first_option + '</option>')
            for (var i = documents.length - 1; i >= 0; i--) {
              $('select[name="documents_selector"]').append('<option value ="' + documents[i] + '">' + documents[i] + '</option>')
            };
          })

          // Capture the local variable by inner funcitons.
          var $dialog = getDialog('textae.dialog.load', 'Load Annotations', $content)

          return $dialog
        },
        getSaveDialog = function(editorId) {
          var showSaveSuccess = function() {
              api.emit('save')
              cursorChanger.endWait()
            },
            showSaveError = function() {
              api.emit('save error')
              cursorChanger.endWait()
            },
            saveAnnotationToServer = function(url, jsonData) {
              cursorChanger.startWait()
              ajaxAccessor.post(url, jsonData, showSaveSuccess, showSaveError, function() {
                cursorChanger.endWait()
              })
            },
            createDownloadPath = function(contents) {
              var blob = new Blob([contents], {
                type: 'application/json'
              })
              return URL.createObjectURL(blob)
            },
            getFilename = function() {
              var $fileInput = getLoadDialog(editorId).find("input[type='file']"),
                file = $fileInput.prop('files')[0]

              return file ? file.name : 'annotations.json'
            },
            RowDiv = _.partial(jQuerySugar.Div, 'textae-editor__save-dialog__row'),
            RowLabel = _.partial(jQuerySugar.Label, 'textae-editor__save-dialog__label'),
            $saveButton = new jQuerySugar.Button('Save', 'url'),
            $content = $('<div>')
            .append(
              new RowDiv().append(
                new RowLabel(label.URL),
                $('<input type="text" class="textae-editor__save-dialog__server-file-name url" />'),
                $saveButton
              )
            )
            .on('input', 'input.url', function() {
              jQuerySugar.enabled($saveButton, this.value)
            })
            .on('click', '[type="button"].url', function() {
              saveAnnotationToServer(jQuerySugar.getValueFromText($content, 'url'), $dialog.params)
              $content.trigger('dialog.close')
            })
            .append(
              new RowDiv().append(
                new RowLabel(label.LOCAL),
                $('<input type="text" class="textae-editor__save-dialog__local-file-name local">'),
                $('<a class="download" href="#">Download</a>')
              )
            )
            .on('click', 'a.download', function() {
              var downloadPath = createDownloadPath($dialog.params)
              $(this)
                .attr('href', downloadPath)
                .attr('download', jQuerySugar.getValueFromText($content, 'local'))
              api.emit('save')
              $content.trigger('dialog.close')
            })
            .append(
              new RowDiv().append(
                new RowLabel(),
                $('<a class="viewsource" href="#">Click to see the json source in a new window.</a>')
              )
            )
            .on('click', 'a.viewsource', function(e) {
              var downloadPath = createDownloadPath($dialog.params)
              window.open(downloadPath, '_blank')
              api.emit('save')
              $content.trigger('dialog.close')
              return false
            })

          var $dialog = getDialog('textae.dialog.save', 'Save Annotations', $content)

          // Set the filename when the dialog is opened.
          $dialog.on('dialogopen', function() {
            var filename = getFilename()
            $dialog
              .find('[type="text"].local')
              .val(filename)
          })

          return $dialog
        }

      return {
        showLoad: function(editorId, hasAnythingToSave) {
          getLoadDialog(editorId).openAndSetParam(hasAnythingToSave)
        },
        showSave: function(editorId, jsonData) {
          getSaveDialog(editorId).openAndSetParam(jsonData)
        },
        saveToHana: function(editorId, jsonData) {
          var showSaveSuccess = function() {
              api.emit('save')
              cursorChanger.endWait()
            },
            showSaveError = function() {
              api.emit('save error')
              cursorChanger.endWait()
            },
            docName = JSON.parse(jsonData).sourceid
          console.log("Saving document...")
          console.log(jsonData)
          let url = 'https://' + window.location.hostname + ':8080/documents/' + docName
          cursorChanger.startWait()
          ajaxAccessor.post(url, jsonData, showSaveSuccess, showSaveError, function() {
            cursorChanger.endWait()
          })
        }
      }
    }()

  var api = _.extend(new EventEmitter(), {
    getAnnotationFromServer: getAnnotationFromServer,
    getAnnotationFromDatabase: getAnnotationFromDatabase,
    filterUsersFromData: filterUsersFromCachedData,
    showAccess: _.partial(loadSaveDialog.showLoad, editor.editorId),
    showSave: _.partial(loadSaveDialog.showSave, editor.editorId),
    saveToHana: _.partial(loadSaveDialog.saveToHana, editor.editorId),
  })

  return api
}
