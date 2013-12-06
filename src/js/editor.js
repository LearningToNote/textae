    var editor = function() {
        //cursor
        var cursor = function(editor) {
            var wait = function() {
                editor.css('cursor', 'wait');
            };
            var endWait = function() {
                editor.css('cursor', 'auto');
            };
            return {
                startWait: wait,
                endWait: endWait,
            };
        }(this);

        //load/saveDialog
        var loadSaveDialog = function() {
            var getLoadDialog = function() {
                $body = $("body");
                var $dialog = $body.find("#textae.dialog.load");

                //make unless exists
                if ($dialog.length === 0) {
                    $dialog = $('<div id="textae.dialog.load" title="Load document with annotation.">')
                        .append('<div>Sever :<input type="text" style="width:345px"/><input type="button" value="OK" /></div>')
                        .append('<div>Local :<input type="file"　/></div>');

                    //bind event handler
                    var onFileChange = function() {
                        var reader = new FileReader();
                        reader.onload = function() {
                            var annotation = JSON.parse(this.result);
                            businessLogic.loadAnnotation(annotation);
                            $dialog.dialog("close");
                        };
                        reader.readAsText(this.files[0]);
                    };

                    $body.append($dialog);
                    $dialog.hide();
                    $dialog.find("input[type='file']").on("change", onFileChange);
                    $dialog.find("input[type='button']")
                        .on("click", function() {
                            var url = $dialog.find("input[type='text']").val();
                            businessLogic.getAnnotationFromServer(url);
                            $dialog.dialog("close");
                        });
                }

                return $dialog;
            };
            return {
                showAccess: function(targetUrl) {
                    var $dialog = getLoadDialog();
                    $dialog
                        .find("input[type='text']")
                        .val(targetUrl);
                    $dialog
                        .dialog({
                            resizable: false,
                            width: 550,
                            height: 220,
                            modal: true,
                            buttons: {
                                Cancel: function() {
                                    $(this).dialog("close");
                                }
                            }
                        });
                },
                showSave: function(url, content) {
                    var getSaveDialog = function() {
                        $body = $("body");
                        var $dialog = $body.find("#textae.dialog.save");
                        if ($dialog.length === 0) {
                            $dialog = $('<div id="textae.dialog.save" title="Save document with annotation.">')
                                .append('<div>Sever :<input type="text" style="width:345px"/><input type="button" value="OK" /></div>')
                                .append('<div>Local :<span class="span_link_place"><a target="_blank"/></span></div>');

                            $body.append($dialog);
                            $dialog.hide();
                            $dialog
                                .on("click", "a", function() {
                                    businessLogic.saveAnnotation();
                                    $dialog.dialog("close");
                                })
                                .on("click", "input[type='button']", function() {
                                    var url = $dialog.find("input[type='text']").val();
                                    businessLogic.saveAnnotationToServer(url);
                                    $dialog.dialog("close");
                                });

                        }

                        return $dialog;
                    };

                    var createFileLink = function(contents, $save_dialog) {
                        var $fileInput = getLoadDialog().find("input[type='file']");

                        var file = $fileInput.prop("files")[0];
                        var name = file ? file.name : "annotations.json";
                        var blob = new Blob([contents], {
                            type: 'application/json'
                        });
                        var link = $save_dialog.find('a')
                            .text(name)
                            .attr("href", URL.createObjectURL(blob))
                            .attr("download", name);
                    };

                    var $dialog = getSaveDialog();

                    //create local link
                    createFileLink(content, $dialog);

                    //open dialog
                    $dialog
                        .find("input[type='text']")
                        .val(url);
                    $dialog
                        .dialog({
                            resizable: false,
                            width: 550,
                            height: 220,
                            modal: true,
                            buttons: {
                                Cancel: function() {
                                    $(this).dialog("close");
                                }
                            }
                        });
                }
            };
        }();

        // state of editor component.
        var editorState = function(editor) {
            return {
                isReplicateAuto: false,
                buttonState: function() {
                    var disableButtons = {};
                    var updateDisableButtons = function(button, enable) {
                        if (enable) {
                            delete disableButtons[button];
                        } else {
                            disableButtons[button] = true;
                        }
                    };
                    var updateEntity = function() {
                        updateDisableButtons("entity", domSelector.span.getNumberOfSelected() > 0);
                    };
                    var updatePaste = function() {
                        updateDisableButtons("paste", clipBoard.length > 0 && domSelector.span.getNumberOfSelected() > 0);
                    };
                    var updateReplicate = function() {
                        updateDisableButtons("replicate", domSelector.span.getNumberOfSelected() == 1);
                    };
                    var updatePallet = function() {
                        updateDisableButtons("pallet", domSelector.entity.getNumberOfSelected() > 0);
                    };
                    var updateNewLabel = function() {
                        updateDisableButtons("newLabel", domSelector.entity.getNumberOfSelected() > 0);
                    };
                    var updateDelete = function() {
                        updateDisableButtons("delete", domSelector.hasSelecteds());
                    };
                    var updateCopy = function() {
                        updateDisableButtons("copy", domSelector.entity.hasSelecteds());
                    };
                    var updateBySpanAndEntityBoth = function() {
                        updateDelete();
                        updateCopy();
                    };
                    return {
                        pushed: function(button, push) {
                            editor.tool.pushReplicateAuto(push);
                        },
                        renderEnable: function() {
                            editor.tool.changeButtonState(disableButtons);
                        },
                        enabled: function(button, enable) {
                            updateDisableButtons(button, enable);
                            this.renderEnable();
                        },
                        updateBySpan: function() {
                            updateBySpanAndEntityBoth();

                            updateEntity();
                            updatePaste();
                            updateReplicate();

                            this.renderEnable();
                        },
                        updateByEntity: function() {
                            updateBySpanAndEntityBoth();

                            updatePallet();
                            updateNewLabel();

                            this.renderEnable();
                        },
                        updateAll: function() {
                            updateBySpanAndEntityBoth();

                            updateEntity();
                            updatePaste();
                            updateReplicate();
                            updatePallet();
                            updateNewLabel();

                            this.renderEnable();
                        },
                    };
                }(),
                toggleReplicateAuto: function() {
                    editorState.isReplicateAuto = !editorState.isReplicateAuto;
                    editorState.buttonState.pushed("replicate-auto", editorState.isReplicateAuto);
                },
            };
        }(this);

        // clipBoard has entity id only.
        var clipBoard = [];

        // parameters to render relations.
        var relationSettings = {
            // opacity of connectors
            connOpacity: 0.6,

            // curviness parameters
            xrate: 0.6,
            yrate: 0.05,

            // curviness offset
            c_offset: 20,
        };

        // spanConfig data
        var spanConfig = {
            delimiterCharacters: null,
            nonEdgeCharacters: null,
            defaults: {
                "delimiter characters": [
                    " ",
                    ".",
                    "!",
                    "?",
                    ",",
                    ":",
                    ";",
                    "-",
                    "/",
                    "&",
                    "(",
                    ")",
                    "{",
                    "}",
                    "[",
                    "]",
                    "+",
                    "*",
                    "\\",
                    "\"",
                    "'",
                    "\n",
                    "–"
                ],
                "non-edge characters": [
                    " ",
                    "\n"
                ]
            },
            set: function(config) {
                var settings = $.extend({}, this.defaults, config);

                if (settings['delimiter characters'] !== undefined) {
                    this.delimiterCharacters = settings['delimiter characters'];
                }

                if (settings['non-edge characters'] !== undefined) {
                    this.nonEdgeCharacters = settings['non-edge characters'];
                }
            },
            isNonEdgeCharacter: function(char) {
                return (this.nonEdgeCharacters.indexOf(char) >= 0);
            },
            isDelimiter: function(char) {
                return (this.delimiterCharacters.indexOf(char) >= 0);
            }
        };

        // management data
        var model = function(editor) {
            return {
                sourceDoc: "",
                relationTypes: {},
                relationTypeDefault: "",
                annotationData: function() {
                    var updateSpanIds = function() {
                        // sort the span IDs by the position
                        var spanIds = Object.keys(model.annotationData.spans); // maintained sorted by the position.
                        var byPosition = function(a, b) {
                            var spans = model.annotationData.spans;
                            return (spans[a].begin - spans[b].begin || spans[b].end - spans[a].end);
                        };
                        spanIds.sort(byPosition);

                        $.extend(spanIds, {
                            getPrevSpanId : function(sid){
                                return this[this.indexOf(sid) - 1];
                            },
                        });

                        model.annotationData.spanIds = spanIds;
                    };

                    var getMaxEntityId = function() {
                        var maxIdNum = 0;
                        var entityIds = Object.keys(model.annotationData.entities)
                            .filter(function(eid) {
                                return eid[0] === "E";
                            })
                            .map(function(eid) {
                                return eid.slice(1);
                            });
                        entityIds.sort(function(a, b) {
                            //reverse by number
                            return b - a;
                        });

                        return parseInt(entityIds[0]) || 0;
                    };

                    return {
                        spans: null,
                        entities: null,
                        relations: null,
                        spanIds: null,
                        reset: function() {
                            model.annotationData.spans = {};
                            model.annotationData.entities = {};
                            model.annotationData.relations = {};
                        },
                        //expected span is like { "begin": 19, "end": 49 }
                        addSpan: function(span) {
                            var spanId = idFactory.makeSpanId(span.begin, span.end);
                            model.annotationData.spans[spanId] = {
                                begin: span.begin,
                                end: span.end
                            };
                            updateSpanIds();
                        },
                        getSpan: function(spanId) {
                            return model.annotationData.spans[spanId];
                        },
                        removeSpan: function(spanId) {
                            delete model.annotationData.spans[spanId];
                            updateSpanIds();
                        },
                        //expected denotations Array of object like { "id": "T1", "span": { "begin": 19, "end": 49 }, "obj": "Cell" }.
                        parseDenotations: function(denotations) {
                            if (denotations) {
                                denotations.forEach(function(entity) {
                                    var span = entity.span;
                                    var spanId = idFactory.makeSpanId(span.begin, span.end);
                                    model.annotationData.spans[spanId] = {
                                        begin: span.begin,
                                        end: span.end,
                                    };
                                    model.annotationData.entities[entity.id] = {
                                        span: spanId,
                                        type: entity.obj,
                                    };
                                });
                            }
                            updateSpanIds();
                        },
                        parseRelations: function(relations) {
                            if (relations) {
                                relations.forEach(function(r) {
                                    model.annotationData.relations[r.id] = r;
                                });
                            }
                        },
                        getRelationIds: function() {
                            return Object.keys(model.annotationData.relations);
                        },
                        getNewEntityId: function() {
                            return "E" + (getMaxEntityId() + 1);
                        },
                        toJason: function() {
                            var denotations = [];
                            for (var e in model.annotationData.entities) {
                                var span = {
                                    'begin': model.annotationData.spans[model.annotationData.entities[e].span].begin,
                                    'end': model.annotationData.spans[model.annotationData.entities[e].span].end
                                };
                                denotations.push({
                                    'id': e,
                                    'span': span,
                                    'obj': model.annotationData.entities[e].type
                                });
                            }

                            return JSON.stringify({
                                "text": model.sourceDoc,
                                "denotations": denotations
                            });
                        }
                    };
                }(),
                entityTypes: function() {
                    var types = {},
                        defaultType = "",
                        getColor = function() {
                            return this.color ? this.color : "#77DDDD";
                        };

                    return {
                        setDefaultType: function(nameOfEntityType) {
                            defaultType = nameOfEntityType;
                        },
                        getDefaultType: function() {
                            return defaultType || model.entityTypes.getType(model.entityTypes.getSortedNames()[0]).name;
                        },
                        getType: function(nameOfEntityType) {
                            types[nameOfEntityType] = types[nameOfEntityType] || {
                                getColor: getColor
                            };
                            return types[nameOfEntityType];
                        },
                        set: function(newEntityTypes) {
                            // expected newEntityTypes is an array of object. example of object is {"name": "Regulation","color": "#FFFF66","default": true}.
                            types = {};
                            defaultType = "";
                            if (newEntityTypes !== undefined) {
                                newEntityTypes.forEach(function(newEntity) {
                                    newEntity.getColor = getColor;
                                    types[newEntity.name] = newEntity;
                                    if (newEntity.
                                        default === true) {
                                        defaultType = newEntity.name;
                                    }
                                });
                            }
                        },
                        //save number of type, to sort by numer when show entity pallet.
                        incrementNumberOfTypes: function(nameOfEntityType) {
                            //access by square brancket, because nameOfEntityType is user input value, maybe 'null', '-', and other invalid indentifier name.
                            var type = model.entityTypes.getType(nameOfEntityType);
                            type.count = (type.count || 0) + 1;
                        },
                        getSortedNames: function() {
                            //sort by number of types
                            var typeNames = Object.keys(types);
                            typeNames.sort(function(a, b) {
                                return types[b].count - types[a].count;
                            });
                            return typeNames;
                        }
                    };
                }(),
                connectorTypes: {},
                getSpanReplications: function(span) {
                    // check the bondaries: used after replication
                    var isOutsideDelimiter = function(document, startPos, endPos) {
                        var precedingChar = document.charAt(startPos - 1);
                        var followingChar = document.charAt(endPos);

                        if (!spanConfig.isDelimiter(precedingChar) || !spanConfig.isDelimiter(followingChar)) {
                            return true;
                        } else {
                            return false;
                        }
                    };

                    // search same strings
                    // both ends should be delimiter characters
                    var findSameString = function(startPos, endPos) {
                        var oentity = model.sourceDoc.substring(startPos, endPos);
                        var strLen = endPos - startPos;

                        var ary = [];
                        var from = 0;
                        while (true) {
                            var sameStrPos = model.sourceDoc.indexOf(oentity, from);
                            if (sameStrPos == -1) break;

                            if (!isOutsideDelimiter(model.sourceDoc, sameStrPos, sameStrPos + strLen)) {
                                var obj = {};
                                obj.begin = sameStrPos;
                                obj.end = sameStrPos + strLen;

                                var isExist = false;
                                for (var sid in model.annotationData.spans) {
                                    if (model.annotationData.spans[sid].begin == obj.begin && model.annotationData.spans[sid].end == obj.end && model.annotationData.spans[sid].category == obj.category) {
                                        isExist = true;
                                        break;
                                    }
                                }

                                if (!isExist && startPos != sameStrPos) {
                                    ary.push(obj);
                                }
                            }
                            from = sameStrPos + 1;
                        }
                        return ary;
                    };

                    var startPos = span.begin;
                    var endPos = span.end;

                    var cspans = findSameString(startPos, endPos); // candidate model.annotationData.spans

                    var nspans = []; // new model.annotationData.spans
                    for (var i = 0; i < cspans.length; i++) {
                        cspan = cspans[i];

                        // check boundary crossing
                        var crossing_p = false;
                        for (var sid in model.annotationData.spans) {
                            if (
                                (cspan.begin > model.annotationData.spans[sid].begin && cspan.begin < model.annotationData.spans[sid].end && cspan.end > model.annotationData.spans[sid].end) ||
                                (cspan.begin < model.annotationData.spans[sid].begin && cspan.end > model.annotationData.spans[sid].begin && cspan.end < model.annotationData.spans[sid].end)
                            ) {
                                crossing_p = true;
                                break;
                            }
                        }

                        if (!crossing_p) {
                            nspans.push(cspan);
                        }
                    }
                },
            };
        }(this);

        var connectors;

        // index
        var typesPerSpan;
        var entitiesPerType;
        var relationsPerEntity;

        // target URL
        var targetUrl = '';

        // constant values
        var CONSTS = {
            BLOCK_THRESHOLD: 100,
            TYPE_MARGIN_TOP: 18,
            TYPE_MARGIN_BOTTOM: 2,
            PALLET_HEIGHT_MAX: 100
        };

        // will be API of texteaEditor
        var startEdit = function() {
            var setTypeConfig = function(config) {
                model.entityTypes.set(config['entity types']);

                model.relationTypes = {};
                model.relationTypeDefault = null;
                if (config['relation types'] !== undefined) {
                    var relation_types = config['relation types'];
                    for (var i in relation_types) {
                        model.relationTypes[relation_types[i].name] = relation_types[i];
                        if (relation_types[i]["default"] === true) {
                            model.relationTypeDefault = relation_types[i].name;
                        }
                    }
                    if (!model.relationTypeDefault) {
                        model.relationTypeDefault = relation_types[0].name;
                    }
                }

                model.connectorTypes = {};

                if (config.css !== undefined) {
                    $('#css_area').html('<link rel="stylesheet" href="' + config.css + '"/>');
                }
            };

            var initState = function() {
                command.history.init(command.historyChanged);
                editorState.buttonState.updateAll();
            };

            renderer.init();
            controller.init();
            initState();

            // read default spanConfig
            spanConfig.set();

            var params = {
                debug: this.attr("debug"),
                config: this.attr("config"),
                target: this.attr("annotations")
            };

            if (params.config && params.config !== "") {
                // load sync, because load annotation after load config. 
                var data = textAeUtil.ajaxAccessor.getSync(params.config);
                if (data !== null) {
                    spanConfig.set(data);
                    setTypeConfig(data);
                } else {
                    alert('could not read the span configuration from the location you specified.');
                }
            }

            if (params.target && params.target !== "") {
                businessLogic.getAnnotationFromServer(params.target);
            }
        }.bind(this);

        var command = {
            // histories of edit to undo and redo.
            history: function() {
                var lastSaveIndex = -1,
                    lastEditIndex = -1,
                    history = [],
                    onChangeFunc,
                    trigger = function() {
                        if (onChangeFunc) {
                            onChangeFunc();
                        }
                    };

                return {
                    init: function(onChange) {
                        lastSaveIndex = -1;
                        lastEditIndex = -1;
                        history = [];

                        if (onChange !== undefined) {
                            onChangeFunc = onChange.bind(this);
                        }
                        trigger();
                    },
                    push: function(commands) {
                        history.push(commands);
                        lastEditIndex++;
                        trigger();
                    },
                    next: function() {
                        lastEditIndex++;
                        trigger();
                        return history[lastEditIndex];
                    },
                    prev: function() {
                        var lastEdit = history[lastEditIndex];
                        lastEditIndex--;
                        trigger();
                        return lastEdit;
                    },
                    saved: function() {
                        lastSaveIndex = lastEditIndex;
                        trigger();
                    },
                    hasAnythingToUndo: function() {
                        return lastEditIndex > -1;
                    },
                    hasAnythingToRedo: function() {
                        return lastEditIndex < history.length - 1;
                    },
                    hasAnythingToSave: function() {
                        return lastEditIndex != lastSaveIndex;
                    }
                };
            }(),
            //action when command.history is changed.
            historyChanged: function() {
                var leaveMessage = function() {
                    return "There is a change that has not been saved. If you leave now, you will lose it.";
                };

                //change button state
                editorState.buttonState.enabled("write", this.hasAnythingToSave());
                editorState.buttonState.enabled("undo", this.hasAnythingToUndo());
                editorState.buttonState.enabled("redo", this.hasAnythingToRedo());

                //change leaveMessage show
                if (this.hasAnythingToSave()) {
                    $(window).off('beforeunload', leaveMessage).on('beforeunload', leaveMessage);
                } else {
                    $(window).off('beforeunload', leaveMessage);
                }
            },
            //context may be 'undo' or 'redo'.
            execute: function(commands, context) {
                if (commands && commands.length > 0) {
                    switch (context) {
                        case 'undo':
                        case 'redo':
                            domSelector.unselect();
                            renderer.relations.clearRelationSelection();
                            break;
                        default:
                    }
                    var tid, arr;

                    for (var i in commands) {
                        var edit = commands[i];
                        switch (edit.action) {
                            // span operations
                            case 'new_span':
                                // model
                                model.annotationData.addSpan({
                                    begin: edit.begin,
                                    end: edit.end
                                });
                                typesPerSpan[edit.id] = [];
                                // rendering
                                renderer.renderSpan(edit.id);
                                renderer.indexPositionSpan(edit.id);
                                // select
                                domSelector.span.select(edit.id);
                                break;
                            case 'remove_span':
                                //save span potision for undo
                                var span = model.annotationData.getSpan(edit.id);
                                edit.begin = span.begin;
                                edit.end = span.end;
                                //model
                                model.annotationData.removeSpan(edit.id);
                                delete typesPerSpan[edit.id];
                                //rendering
                                renderer.destroySpan(edit.id);
                                break;

                                // entity operations
                            case 'new_denotation':
                                // model
                                if (!edit.id) {
                                    edit.id = model.annotationData.getNewEntityId();
                                }
                                model.annotationData.entities[edit.id] = {
                                    id: edit.id,
                                    span: edit.span,
                                    type: edit.type
                                };
                                tid = idFactory.makeTypeId(edit.span, edit.type);

                                //first entity of span
                                if (typesPerSpan[edit.span].indexOf(tid) < 0) {
                                    typesPerSpan[edit.span].push(tid);
                                    entitiesPerType[tid] = [];
                                    renderer.renderGrid(edit.span);
                                }

                                entitiesPerType[tid].push(edit.id);
                                // rendering
                                renderer.renderEntity(edit.id);
                                // select
                                domSelector.entity.select(edit.id);
                                break;
                            case 'remove_denotation':
                                //model
                                delete model.annotationData.entities[edit.id];
                                tid = idFactory.makeTypeId(edit.span, edit.type);
                                arr = entitiesPerType[tid];
                                arr.splice(arr.indexOf(edit.id), 1);
                                //rendering
                                renderer.destroyEntity(edit.id);
                                renderer.positionEntities(edit.span, edit.type);
                                // consequence
                                if (entitiesPerType[tid].length === 0) {
                                    delete entitiesPerType[tid];
                                    arr = typesPerSpan[edit.span];
                                    arr.splice(arr.indexOf(tid), 1);
                                    renderer.destroyType(tid);
                                    renderer.renderGrid(edit.span);
                                }
                                break;
                            case 'change_entity_type':
                                //model
                                model.annotationData.entities[edit.id].type = edit.new_type;
                                //rendering
                                renderer.renderEntity(edit.id);
                                break;

                                // relation operations
                            case 'new_relation':
                                // model
                                model.annotationData.relations[edit.id] = {
                                    id: edit.id,
                                    subj: edit.subj,
                                    obj: edit.obj,
                                    pred: edit.pred
                                };
                                if (relationsPerEntity[edit.subj]) {
                                    if (relationsPerEntity[edit.subj].indexOf(edit.id) < 0) relationsPerEntity[edit.subj].push(edit.id);
                                } else relationsPerEntity[edit.subj] = [edit.id];

                                if (relationsPerEntity[edit.obj]) {
                                    if (relationsPerEntity[edit.obj].indexOf(edit.id) < 0) relationsPerEntity[edit.obj].push(edit.id);
                                } else relationsPerEntity[edit.obj] = [edit.id];
                                // rendering
                                connectors[edit.id] = renderer.relations.renderRelation(edit.id);
                                // selection
                                renderer.relations.selectRelation(edit.id);
                                break;
                            case 'remove_relation':
                                // model
                                delete model.annotationData.relations[edit.id];
                                arr = relationsPerEntity[edit.subj];
                                arr.splice(arr.indexOf(edit.id), 1);
                                if (arr.length === 0) {
                                    delete relationsPerEntity[edit.subj];
                                }
                                arr = relationsPerEntity[edit.obj];
                                arr.splice(arr.indexOf(edit.id), 1);
                                if (arr.length === 0) {
                                    delete relationsPerEntity[edit.obj];
                                }
                                // rendering
                                renderer.relations.destroyRelation(edit.id);
                                break;
                            case 'change_relation_pred':
                                // model
                                model.annotationData.relations[edit.id].pred = edit.new_pred;
                                // rendering
                                connectors[edit.id].setPaintStyle(model.connectorTypes[edit.new_pred + "_selected"].paintStyle);
                                connectors[edit.id].setHoverPaintStyle(model.connectorTypes[edit.new_pred + "_selected"].hoverPaintStyle);
                                connectors[edit.id].setLabel('[' + edit.id + '] ' + edit.new_pred);
                                // selection
                                renderer.relations.selectRelation(edit.id);
                                break;
                            default:
                                // do nothing
                        }
                    }

                    // update rendering
                    presentationLogic.redraw();

                    switch (context) {
                        case 'undo':
                        case 'redo':
                            break;
                        default:
                            command.history.push(commands);
                            editorState.buttonState.updateAll();
                    }
                }
            },
            getReplicateSpanCommands: function(span) {
                var nspans = model.getSpanReplications(span);

                var commands = [];
                for (var j = 0; j < nspans.length; j++) {
                    var nspan = nspans[j];
                    var id = idFactory.makeSpanId(nspan.begin, nspan.end);
                    commands.push({
                        action: "new_span",
                        id: id,
                        begin: nspan.begin,
                        end: nspan.end
                    });
                }

                return commands;
            },
        };

        var idFactory = function(editor) {
            return {
                // paragraph id
                makeParagraphId: function(index) {
                    return editor.editorId + '__P' + index;
                },
                // span id
                makeSpanId: function(begin, end) {
                    return editor.editorId + '__S' + begin + '_' + end;
                },
                // type id
                makeTypeId: function(sid, type) {
                    return sid + '-' + type;
                },
                makeEntityDomId: function(entityId) {
                    return editor.editorId + '__E' + entityId;
                }
            };
        }(this);

        // render view.
        var renderer = function(editor) {

            var relationColor = function(type) {
                if (model.relationTypes && model.relationTypes[type] && model.relationTypes[type].color) return model.relationTypes[type].color;
                return "#555555";
            };

            // conversion from HEX to RGBA color
            var colorTrans = function(color, opacity) {
                var c = color.slice(1);
                var r = c.substr(0, 2);
                var g = c.substr(2, 2);
                var b = c.substr(4, 2);
                r = parseInt(r, 16);
                g = parseInt(g, 16);
                b = parseInt(b, 16);

                return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
            };

            return {
                init: function() {
                    var getArea = function($parent, className) {
                        var $area = editor.find('.' + className);
                        if ($area.length === 0) {
                            $area = $('<div>').addClass(className);
                            $parent.append($area);
                        }
                        return $area;
                    };

                    var initJsPlumb = function() {
                        renderer.jsPlumb = jsPlumb.getInstance({
                            ConnectionsDetachable: false,
                            Endpoint: ["Dot", {
                                radius: 1
                            }]
                        });
                        renderer.jsPlumb.setRenderMode(renderer.jsPlumb.SVG);
                        renderer.jsPlumb.Defaults.Container = editor.getAnnotationArea();
                    };

                    //make view
                    editor.body = getArea(editor, "textae-editor__body");

                    //set method to get Area
                    $.extend(editor, {
                        getSourceDocArea: function() {
                            return getArea(editor.body, "textae-editor__body__text-box");
                        },
                        getAnnotationArea: function() {
                            return getArea(editor.body, 'textae-editor__body__annotation_box');
                        }
                    });

                    initJsPlumb();
                },

                renderAnnotation: function() {
                    var setBodyOffset = function() {
                        //set body offset top half of line space between line of text-box.
                        var $area = editor.getSourceDocArea();
                        $area.html(model.sourceDoc);
                        var lines = $area.get(0).getClientRects();
                        var lineSpace = lines[1].top - lines[0].bottom;
                        editor.find(".textae-editor__body").css("paddingTop", lineSpace / 2);
                        $area.empty();
                    };

                    //souce document has multi paragraphs that are splited by '\n'.
                    var getTaggedSourceDoc = function() {
                        //set sroucedoc tagged <p> per line.
                        return model.sourceDoc.split("\n").map(function(par) {
                            return '<p class="textae-editor__body__text-box__paragraph">' + par + '</p>';
                        }).join("\n");
                    };

                    //paragraphs is Object that has position of charactor at start and end of the statement in each paragraph.
                    var makeParagraphs = function() {
                        var paragraphs = $.extend({}, {
                            //get the paragraph that span is belong to.
                            getBySid: function(sid) {
                                var span = model.annotationData.getSpan(sid);
                                if (span) {
                                    for (var pid in renderer.paragraphs) {
                                        var paragraph = renderer.paragraphs[pid];
                                        if (span.begin >= paragraph.begin && span.end <= paragraph.end) {
                                            return paragraph;
                                        }
                                    }
                                }
                                return null;
                            },
                        });

                        var index = 0;
                        var pre_len = 0;
                        editor.getSourceDocArea().find('p').each(function() {
                            var pid = idFactory.makeParagraphId(index);
                            var $element = $(this);
                            var numberOfCharactors = $element.text().length;
                            paragraphs[pid] = {
                                id: pid,
                                begin: pre_len,
                                end: pre_len + numberOfCharactors,
                                element: $element,
                            };
                            pre_len += numberOfCharactors + 1;
                            $element.attr('id', pid);
                            index++;
                        });
                        return paragraphs;
                    };

                    var renderEntitiesOfSpan = function(sid) {
                        renderer.renderGrid(sid);
                        typesPerSpan[sid].forEach(function(tid) {
                            entitiesPerType[tid].forEach(function(eid) {
                                renderer.renderEntity(eid);
                            });
                        });
                    };

                    var renderAllSpan = function() {
                        var sids = model.annotationData.spanIds;
                        var renderedSpans = [];

                        sids.forEach(function(sid) {
                            renderedSpans.push(sid);

                            renderer.renderSpan(sid);
                            renderer.indexPositionSpan(sid);
                            renderEntitiesOfSpan(sid);
                        });
                    };

                    var setConnectorTypes = function() {
                        for (var name in model.relationTypes) {
                            var c = relationColor(name);
                            var rgba0 = colorTrans(c, relationSettings.connOpacity);
                            var rgba1 = colorTrans(c, 1);

                            model.connectorTypes[name] = {
                                paintStyle: {
                                    strokeStyle: rgba0,
                                    lineWidth: 1
                                },
                                hoverPaintStyle: {
                                    strokeStyle: rgba1,
                                    lineWidth: 3
                                }
                            };
                            model.connectorTypes[name + '_selected'] = {
                                paintStyle: {
                                    strokeStyle: rgba1,
                                    lineWidth: 3
                                },
                                hoverPaintStyle: {
                                    strokeStyle: rgba1,
                                    lineWidth: 3
                                }
                            };
                        }
                    };

                    setConnectorTypes();
                    setBodyOffset();

                    //add source doc
                    var $textBox = editor.getSourceDocArea();
                    $textBox.html(getTaggedSourceDoc());

                    renderer.paragraphs = makeParagraphs();
                    editor.getAnnotationArea().empty();

                    renderer.renderSize.mesure();
                    renderAllSpan();

                    renderer.relations.renderRelations();
                },
                renderSize: {
                    gridWidthGap: 0,
                    typeHeight: 0,
                    entityWidth: 0,
                    mesure: function() {
                        var div = '<div id="temp_grid" class="grid" style="width:10px; height:auto"></div>';
                        editor.getAnnotationArea().append(div);

                        div = '<div id="temp_type" class="type" title="[Temp] Temp" >T0</div>';
                        $('#temp_grid').append(div);

                        div = '<div id="temp_entity_pane" class="entity_pane"><div id="temp_entity" class="entity"></div></div>';
                        $('#temp_type').append(div);

                        renderer.renderSize.gridWidthGap = $('#temp_grid').outerWidth() - 10;
                        renderer.renderSize.typeHeight = $('#temp_type').outerHeight();
                        renderer.renderSize.entityWidth = $('#temp_entity').outerWidth();
                        $('#temp_grid').remove();
                    }
                },
                createDiv: function(id, cls, top, left, width, height, title) {
                    editor.getAnnotationArea().append('<div id="' + id + '"></div');
                    var div = $('#' + id);
                    div.addClass(cls);
                    div.attr('title', title);
                    div.css('position', 'absolute');
                    div.css('top', top);
                    div.css('left', left);
                    div.css('width', width);
                    div.css('height', height);
                    return id;
                },
                renderSpan: function(sid) {
                    //assume the model.annotationData.spanIds are sorted by the position.
                    //because get position to insert span tag by previous span tag. 
                    var getRangeToInsertSpanTag = function(sid) {
                        var previousSpanId = model.annotationData.spanIds.getPrevSpanId(sid);

                        var paragraph = renderer.paragraphs.getBySid(sid);
                        var currentSpan = model.annotationData.spans[sid];
                        var len = currentSpan.end - currentSpan.begin;

                        // create potision to a new span add 
                        var createRange = function(currentSpan, textNode, textNodeStartPosition) {
                            var range = document.createRange();

                            range.setStart(textNode, currentSpan.begin - textNodeStartPosition);
                            range.setEnd(textNode, currentSpan.end - textNodeStartPosition);

                            return range;
                        }.bind(this, currentSpan);

                        if (renderer.paragraphs.getBySid(previousSpanId) != paragraph) {
                            // the first span in the paragraph.
                            textNodeInParagraph = paragraph.element.contents().filter(function() {
                                return this.nodeType === 3; //TEXT_NODE
                            }).get(0);
                            return createRange(textNodeInParagraph, paragraph.begin);
                        } else {
                            // there is previousSpan.
                            var previousSpan = model.annotationData.spans[previousSpanId];

                            if (currentSpan.begin < previousSpan.begin) {
                                // error! sids is not sorted! 
                                // |current| |prev|
                                // or
                                // |current |prev|| 
                                console.log("Error: sid is not sorted");
                            } else if (previousSpan.end <= currentSpan.begin) {
                                // |prev| |current|
                                // this pattern is most ordinaly.

                                // the preveious span is may be amoug other span.
                                // |parent |prev| | |current|
                                // find the parent of previous span.
                                //
                                // the prev amoung same parent of the current. 
                                //  | same parent |prev| |current| |
                                // it is decided if parent end is after current begin.
                                var pnode = document.getElementById(previousSpanId);
                                while (pnode.parentElement &&
                                    model.annotationData.spans[pnode.parentElement.id] &&
                                    model.annotationData.spans[pnode.parentElement.id].end < currentSpan.begin) {
                                    pnode = pnode.parentElement;
                                }

                                textNodeAfterPrevSpan = pnode.nextSibling;
                                return createRange(textNodeAfterPrevSpan, model.annotationData.spans[pnode.id].end);
                            } else if (previousSpan.end < currentSpan.end) {
                                // crossover cannot not render by span. 
                                // |prev|
                                //    |current|
                            } else if (currentSpan.end <= previousSpan.end) {
                                // current span among previous span.
                                // |prev |current| |
                                var textNodeInPrevSpan = $("#" + previousSpanId).contents().filter(function() {
                                    return this.nodeType === 3;
                                }).get(0);
                                return createRange(textNodeInPrevSpan, previousSpan.begin);
                            }
                        }
                    };

                    var element = document.createElement('span');
                    element.setAttribute('id', sid);
                    element.setAttribute('title', sid);
                    element.setAttribute('class', 'span');
                    getRangeToInsertSpanTag(sid).surroundContents(element);
                },
                destroySpan: function(sid) {
                    var span = document.getElementById(sid);
                    var parent = span.parentNode;
                    while (span.firstChild) {
                        parent.insertBefore(span.firstChild, span);
                    }
                    parent.removeChild(span);
                    parent.normalize();
                },
                //a circle on Type
                renderEntity: function(eid) {
                    //area has entities and label of type.
                    var renderType = function(entity) {
                        var type = entity.type;
                        var sid = entity.span;
                        var tid = idFactory.makeTypeId(sid, type);

                        var $type = $('#' + tid);
                        if ($type.length === 0) {
                            $type = $('<div id="' + tid + '"></div>');
                            $type.addClass('type');
                            $type.css('background-color', model.entityTypes.getType(type).getColor());
                            $type.css('margin-top', CONSTS.TYPE_MARGIN_TOP);
                            $type.css('margin-bottom', CONSTS.TYPE_MARGIN_BOTTOM);
                            $type.attr('title', type);
                            $type.append('<div id="P-' + tid + '" class="entity_pane"></div>');
                            //label over span
                            $type.append('<div class="type_label">' + type + '</div>');
                            $('#G' + sid).append($type);
                        }

                        return $type;
                    };

                    if (domSelector.entity.get(eid).length === 0) {
                        var entity = model.annotationData.entities[eid];
                        var sid = entity.span;

                        var $entityPane = renderType(entity).find(".entity_pane");

                        var $entity = $('<div id="' + idFactory.makeEntityDomId(eid) + '" class="entity" />');
                        $entity.attr('title', eid);
                        $entity.css('display: inline-block');
                        var type = entity.type;
                        $entity.css('border-color', model.entityTypes.getType(type).getColor());
                        $entityPane.append($entity);

                        renderer.positionEntities(sid, type);

                        renderer.indexPositionEntity(eid);
                    }
                },
                indexPositionSpans: function(ids) {
                    for (var i in ids) renderer.indexPositionSpan(ids[i]);
                },
                indexPositionSpan: function(id) {
                    var e = $('#' + id);
                    renderer.positions[id] = {};
                    renderer.positions[id].top = e.get(0).offsetTop;
                    renderer.positions[id].left = e.get(0).offsetLeft;
                    renderer.positions[id].width = e.outerWidth();
                    renderer.positions[id].height = e.outerHeight();
                    renderer.positions[id].center = renderer.positions[id].left + renderer.positions[id].width / 2;
                },
                indexPositionEntities: function() {
                    Object.keys(model.annotationData.entities).forEach(function(id) {
                        renderer.indexPositionEntity(id);
                    });
                },
                indexPositionEntity: function(id) {
                    var gid = 'G' + model.annotationData.entities[id].span;
                    var e = domSelector.entity.get(id);
                    renderer.positions[id] = {};
                    renderer.positions[id].top = renderer.positions[gid].top + e.get(0).offsetTop;
                    renderer.positions[id].left = renderer.positions[gid].left + e.get(0).offsetLeft;
                    renderer.positions[id].width = e.outerWidth();
                    renderer.positions[id].height = e.outerHeight();
                    renderer.positions[id].center = renderer.positions[id].left + renderer.positions[id].width / 2;
                },

                relations: function() {
                    var determineCurviness = function(sourceId, targetId) {
                        var sourceX = renderer.positions[sourceId].center;
                        var targetX = renderer.positions[targetId].center;

                        var sourceY = renderer.positions[sourceId].top;
                        var targetY = renderer.positions[targetId].top;

                        var xdiff = Math.abs(sourceX - targetX);
                        var ydiff = Math.abs(sourceY - targetY);
                        var curviness = xdiff * relationSettings.xrate + ydiff * relationSettings.yrate + relationSettings.c_offset;
                        curviness /= 2.4;

                        return curviness;
                    };

                    return {
                        renderRelations: function() {
                            var rids = model.annotationData.getRelationIds();
                            renderer.jsPlumb.reset();

                            rids.forEach(function(rid) {
                                connectors[rid] = renderer.relations.renderRelation(rid);
                            });
                            renderer.relations.relationIdsSelected = [];
                        },

                        //only move position for window.resize.
                        renewConnections: function() {
                            var rids = model.annotationData.getRelationIds();

                            rids.forEach(function(rid) {
                                // recompute curviness
                                var sourceId = model.annotationData.relations[rid].subj;
                                var targetId = model.annotationData.relations[rid].obj;
                                var curviness = determineCurviness(sourceId, targetId);

                                if (sourceId == targetId) curviness = 30;

                                var conn = connectors[rid];
                                var label = conn.getLabel();
                                conn.endpoints[0].repaint();
                                conn.endpoints[1].repaint();
                                conn.setConnector(["Bezier", {
                                    curviness: curviness
                                }]);
                            });
                        },

                        renderRelation: function(rid) {
                            var sourceId = model.annotationData.relations[rid].subj;
                            var targetId = model.annotationData.relations[rid].obj;
                            var curviness = determineCurviness(sourceId, targetId);

                            //  Determination of anchor points
                            var sourceAnchor = "TopCenter";
                            var targetAnchor = "TopCenter";

                            // In case of self-reference
                            if (sourceId == targetId) {
                                sourceAnchor = [0.5, 0, -1, -1];
                                targetAnchor = [0.5, 0, 1, -1];
                                curviness = 30;
                            }

                            // make connector
                            var pred = model.annotationData.relations[rid].pred;
                            var rgba = colorTrans(relationColor(pred), relationSettings.connOpacity);
                            var sourceElem = domSelector.entity.get(sourceId);
                            var targetElem = domSelector.entity.get(targetId);

                            var label = '[' + rid + '] ' + pred;

                            var conn = renderer.jsPlumb.connect({
                                source: sourceElem,
                                target: targetElem,
                                anchors: [sourceAnchor, targetAnchor],
                                connector: ["Bezier", {
                                    curviness: curviness
                                }],
                                paintStyle: model.connectorTypes[pred].paintStyle,
                                hoverPaintStyle: model.connectorTypes[pred].hoverPaintStyle,
                                tooltip: '[' + rid + '] ' + pred,
                                parameters: {
                                    "id": rid,
                                    "label": label
                                }
                            });

                            conn.addOverlay(["Arrow", {
                                width: 10,
                                length: 12,
                                location: 1
                            }]);
                            conn.setLabel({
                                label: label,
                                cssClass: "label"
                            });
                            conn.bind("click", controller.connectorClicked);
                            return conn;
                        },
                        isRelationSelected: function(rid) {
                            return (renderer.relations.relationIdsSelected.indexOf(rid) > -1);
                        },
                        selectRelation: function(rid) {
                            if (!renderer.relations.isRelationSelected(rid)) {
                                connectors[rid].setPaintStyle(model.connectorTypes[model.annotationData.relations[rid].pred + "_selected"].paintStyle);
                                renderer.relations.relationIdsSelected.push(rid);
                            }
                        },
                        deselectRelation: function(rid) {
                            var i = renderer.relations.relationIdsSelected.indexOf(rid);
                            if (i > -1) {
                                connectors[rid].setPaintStyle(model.connectorTypes[model.annotationData.relations[rid].pred].paintStyle);
                                renderer.relations.relationIdsSelected.splice(i, 1);
                            }
                        },
                        clearRelationSelection: function() {
                            while (renderer.relations.relationIdsSelected.length > 0) {
                                var rid = renderer.relations.relationIdsSelected.pop();
                                connectors[rid].setPaintStyle(model.connectorTypes[model.annotationData.relations[rid].pred].paintStyle);
                            }
                        },
                        destroyRelation: function(rid) {
                            var c = connectors[rid];
                            renderer.jsPlumb.detach(c);
                        },

                    };
                }(),
                renderGrid: function(sid) {
                    var isSpanEmbedded = function(s1, s2) {
                        return (s1.begin >= s2.begin) && (s1.end <= s2.end);
                    };

                    var grid,
                        id = 'G' + sid;

                    if (typesPerSpan[sid].length < 1) {
                        grid = $('#' + id);
                        if (grid.length > 0) {
                            grid.remove();
                            delete renderer.positions[id];
                        }
                        return null;
                    } else {
                        // decide the offset
                        var offset = CONSTS.TYPE_MARGIN_BOTTOM;

                        // check the following model.annotationData.spans that are embedded in the current span.
                        var currentSpanIndex = model.annotationData.spanIds.indexOf(sid);
                        for (var f = currentSpanIndex + 1; f < model.annotationData.spanIds.length && isSpanEmbedded(model.annotationData.spans[model.annotationData.spanIds[f]], model.annotationData.spans[model.annotationData.spanIds[currentSpanIndex]]); f++) {
                            var cid = 'G' + model.annotationData.spanIds[f];
                            if (renderer.positions[cid] && ((renderer.positions[cid].offset + renderer.positions[cid].height) < offset)) offset = (renderer.positions[cid].offset + renderer.positions[cid].height) + CONSTS.TYPE_MARGIN_TOP + CONSTS.TYPE_MARGIN_BOTTOM;
                        }

                        var n = typesPerSpan[sid].length;
                        var gridHeight = n * (renderer.renderSize.typeHeight + CONSTS.TYPE_MARGIN_BOTTOM + CONSTS.TYPE_MARGIN_TOP);

                        renderer.positions[id] = {};
                        renderer.positions[id].offset = offset;
                        renderer.positions[id].top = renderer.positions[sid].top - offset - gridHeight;
                        renderer.positions[id].left = renderer.positions[sid].left;
                        renderer.positions[id].width = renderer.positions[sid].width - renderer.renderSize.gridWidthGap;
                        renderer.positions[id].height = gridHeight;

                        if ($('#' + id).length === 0) {
                            renderer.createDiv(id, 'grid', renderer.positions[id].top, renderer.positions[id].left, renderer.positions[id].width, renderer.positions[id].height);
                        } else {
                            grid = $('#' + id);
                            grid.css('top', renderer.positions[id].top);
                            grid.css('left', renderer.positions[id].left);
                            grid.css('width', renderer.positions[id].width);
                            grid.css('height', renderer.positions[id].height);
                        }
                        return id;
                    }
                },
                destroyType: function(tid) {
                    $('#' + tid).remove();
                },
                positionEntities: function(sid, type) {
                    var tid = idFactory.makeTypeId(sid, type);
                    $('#P-' + tid).css('left', (renderer.positions['G' + sid].width - (renderer.renderSize.entityWidth * entitiesPerType[tid].length)) / 2);
                },
                destroyEntity: function(eid) {
                    domSelector.entity.get(eid).remove();
                },
            };
        }(this);

        //handle user input event.
        var controller = function(editor) {
            var cancelBubble = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
                e.bubbles = false;
                if (e.stopPropagation) e.stopPropagation();
            };

            var bodyClicked = function(e) {
                var getPosition = function(node) {
                    // assumption: text_box only includes <p> elements that contains <span> elements that represents model.annotationData.spans.
                    var $parent = $(node).parent();
                    var parentId = $parent.attr("id");

                    var pos;
                    if ($parent.hasClass("textae-editor__body__text-box__paragraph")) {
                        pos = renderer.paragraphs[parentId].begin;
                    } else {
                        pos = model.annotationData.spans[parentId].begin;
                    }

                    var childNodes = node.parentElement.childNodes;
                    for (var i = 0; childNodes[i] != node; i++) { // until the focus node
                        pos += (childNodes[i].nodeName == "#text") ? childNodes[i].nodeValue.length : $('#' + childNodes[i].id).text().length;
                    }

                    return pos;
                };

                var getFocusPosition = function(selection) {
                    var pos = getPosition(selection.focusNode);
                    return pos += selection.focusOffset;
                };

                var getAnchorPosition = function(selection) {
                    var pos = getPosition(selection.anchorNode);
                    return pos + selection.anchorOffset;
                };

                // adjust the beginning position of a span
                var adjustSpanBegin = function(beginPosition) {
                    var pos = beginPosition;
                    while (spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos))) {
                        pos++;
                    }
                    while (!spanConfig.isDelimiter(model.sourceDoc.charAt(pos)) && pos > 0 && !spanConfig.isDelimiter(model.sourceDoc.charAt(pos - 1))) {
                        pos--;
                    }
                    return pos;
                };

                // adjust the end position of a span
                var adjustSpanEnd = function(endPosition) {
                    var pos = endPosition;
                    while (spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos - 1))) {
                        pos--;
                    }
                    while (!spanConfig.isDelimiter(model.sourceDoc.charAt(pos)) && pos < model.sourceDoc.length) {
                        pos++;
                    }
                    return pos;
                };

                // adjust the beginning position of a span for shortening
                var adjustSpanBegin2 = function(beginPosition) {
                    var pos = beginPosition;
                    while ((pos < model.sourceDoc.length) && (spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos)) || !spanConfig.isDelimiter(model.sourceDoc.charAt(pos - 1)))) {
                        pos++;
                    }
                    return pos;
                };

                // adjust the end position of a span for shortening
                var adjustSpanEnd2 = function(endPosition) {
                    var pos = endPosition;
                    while ((pos > 0) && (spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos - 1)) || !spanConfig.isDelimiter(model.sourceDoc.charAt(pos)))) {
                        pos--;
                    }
                    return pos;
                };

                var expandSpan = function(sid, selection) {
                    var commands = [];

                    var focusPosition = getFocusPosition(selection);

                    var range = selection.getRangeAt(0);
                    var anchorRange = document.createRange();
                    anchorRange.selectNode(selection.anchorNode);

                    // expand to the left
                    var new_sid, tid, eid, type;
                    if (range.compareBoundaryPoints(Range.START_TO_START, anchorRange) < 0) {
                        var newBegin = adjustSpanBegin(focusPosition);
                        new_sid = idFactory.makeSpanId(newBegin, model.annotationData.spans[sid].end);
                        if (!model.annotationData.spans[new_sid]) {
                            commands.push({
                                action: 'new_span',
                                id: new_sid,
                                begin: newBegin,
                                end: model.annotationData.spans[sid].end
                            });

                            typesPerSpan[sid].forEach(function(tid) {
                                entitiesPerType[tid].forEach(function(eid) {
                                    type = model.annotationData.entities[eid].type;
                                    commands.push({
                                        action: 'remove_denotation',
                                        id: eid,
                                        span: sid,
                                        type: type
                                    });
                                    commands.push({
                                        action: 'new_denotation',
                                        id: eid,
                                        span: new_sid,
                                        type: type
                                    });
                                });
                            });

                            commands.push({
                                action: 'remove_span',
                                id: sid
                            });
                        }
                    }

                    // expand to the right
                    else {
                        var newEnd = adjustSpanEnd(focusPosition);
                        new_sid = idFactory.makeSpanId(model.annotationData.spans[sid].begin, newEnd);
                        if (!model.annotationData.spans[new_sid]) {
                            commands.push({
                                action: 'new_span',
                                id: new_sid,
                                begin: model.annotationData.spans[sid].begin,
                                end: newEnd
                            });

                            typesPerSpan[sid].forEach(function(tid) {
                                entitiesPerType[tid].forEach(function(eid) {
                                    type = model.annotationData.entities[eid].type;
                                    commands.push({
                                        action: 'remove_denotation',
                                        id: eid,
                                        span: sid,
                                        type: type
                                    });
                                    commands.push({
                                        action: 'new_denotation',
                                        id: eid,
                                        span: new_sid,
                                        type: type
                                    });
                                });
                            });
                            commands.push({
                                action: 'remove_span',
                                id: sid
                            });
                        }
                    }

                    command.execute(commands);
                };

                var shortenSpan = function(sid, selection) {
                    var commands = [];

                    var focusPosition = getFocusPosition(selection);

                    var range = selection.getRangeAt(0);
                    var focusRange = document.createRange();
                    focusRange.selectNode(selection.focusNode);

                    // shorten the right boundary
                    var new_sid, tid, eid, type;
                    if (range.compareBoundaryPoints(Range.START_TO_START, focusRange) > 0) {
                        var newEnd = adjustSpanEnd2(focusPosition);

                        if (newEnd > model.annotationData.spans[sid].begin) {
                            new_sid = idFactory.makeSpanId(model.annotationData.spans[sid].begin, newEnd);
                            if (model.annotationData.spans[new_sid]) {
                                commands.push({
                                    action: 'remove_span',
                                    id: sid
                                });
                            } else {
                                commands.push({
                                    action: 'new_span',
                                    id: new_sid,
                                    begin: model.annotationData.spans[sid].begin,
                                    end: newEnd
                                });
                                typesPerSpan[sid].forEach(function(tid) {
                                    entitiesPerType[tid].forEach(function(eid) {
                                        type = model.annotationData.entities[eid].type;
                                        commands.push({
                                            action: 'remove_denotation',
                                            id: eid,
                                            span: sid,
                                            type: type
                                        });
                                        commands.push({
                                            action: 'new_denotation',
                                            id: eid,
                                            span: new_sid,
                                            type: type
                                        });
                                    });
                                });
                                commands.push({
                                    action: 'remove_span',
                                    id: sid
                                });
                            }
                        } else {
                            domSelector.span.select(sid);
                            businessLogic.removeElements();
                        }
                    }

                    // shorten the left boundary
                    else {
                        var newBegin = adjustSpanBegin2(focusPosition);

                        if (newBegin < model.annotationData.spans[sid].end) {
                            new_sid = idFactory.makeSpanId(newBegin, model.annotationData.spans[sid].end);
                            if (model.annotationData.spans[new_sid]) {
                                commands.push({
                                    action: 'remove_span',
                                    id: sid
                                });
                            } else {
                                commands.push({
                                    action: 'new_span',
                                    id: new_sid,
                                    begin: newBegin,
                                    end: model.annotationData.spans[sid].end
                                });
                                typesPerSpan[sid].forEach(function(tid) {
                                    entitiesPerType[tid].forEach(function(eid) {
                                        type = model.annotationData.entities[eid].type;
                                        commands.push({
                                            action: 'remove_denotation',
                                            id: eid,
                                            span: sid,
                                            type: type
                                        });
                                        commands.push({
                                            action: 'new_denotation',
                                            id: eid,
                                            span: new_sid,
                                            type: type
                                        });
                                    });
                                });
                                commands.push({
                                    action: 'remove_span',
                                    id: sid
                                });
                            }
                        } else {
                            domSelector.span.select(sid);
                            businessLogic.removeElements();
                        }
                    }

                    command.execute(commands);
                };

                var selection = window.getSelection();
                if (selection) {
                    var range = selection.getRangeAt(0);

                    if (
                        // when the whole div is selected by e.g., triple click
                        (range.startContainer == editor.getSourceDocArea().get(0)) ||
                        // when Shift is pressed
                        (e.shiftKey) ||
                        // when nothing is selected
                        (selection.isCollapsed)
                    ) {
                        // bubbles go up
                        presentationLogic.cancelSelect();
                        presentationLogic.dismissBrowserSelection();
                        return true;
                    }

                    var anchorPosition = getAnchorPosition(selection);
                    var focusPosition = getFocusPosition(selection);

                    // no boundary crossing: normal -> create a entity
                    var sid;
                    if (selection.anchorNode.parentElement.id === selection.focusNode.parentElement.id) {
                        domSelector.unselect();

                        // switch the position when the selection is made from right to left
                        if (anchorPosition > focusPosition) {
                            var tmpPos = anchorPosition;
                            anchorPosition = focusPosition;
                            focusPosition = tmpPos;
                        }

                        // when the whole text is selected by e.g., triple click (Chrome)
                        if ((anchorPosition === 0) && (focusPosition == model.sourceDoc.length)) {
                            // do nothing. bubbles go up
                            return true;
                        }

                        var beginPosition = adjustSpanBegin(anchorPosition);
                        var endPosition = adjustSpanEnd(focusPosition);
                        sid = idFactory.makeSpanId(beginPosition, endPosition);

                        if (!model.annotationData.spans[sid]) {
                            if (endPosition - beginPosition > CONSTS.BLOCK_THRESHOLD) {
                                command.execute([{
                                    action: 'new_span',
                                    id: sid,
                                    begin: beginPosition,
                                    end: endPosition
                                }]);
                            } else {
                                var commands = [{
                                    action: 'new_span',
                                    id: sid,
                                    begin: beginPosition,
                                    end: endPosition
                                }];

                                if (editorState.isReplicateAuto) {
                                    var replicates = command.getReplicateSpanCommands({
                                        begin: beginPosition,
                                        end: endPosition
                                    });
                                    commands = commands.concat(replicates);
                                }
                                command.execute(commands);
                            }
                        }
                    }

                    // boundary crossing: exception
                    else {
                        if (selection.anchorNode.parentNode.parentNode == selection.focusNode.parentNode) {
                            domSelector.unselect();
                            expandSpan(selection.anchorNode.parentNode.id, selection);
                        } else if (selection.anchorNode.parentNode == selection.focusNode.parentNode.parentNode) {
                            domSelector.unselect();
                            shortenSpan(selection.focusNode.parentNode.id, selection);
                        } else if (domSelector.span.getNumberOfSelected() == 1) {
                            sid = domSelector.span.popSelectedId();

                            // drag began inside the selected span (expansion)
                            if ((anchorPosition > model.annotationData.spans[sid].begin) && (anchorPosition < model.annotationData.spans[sid].end)) {
                                // The focus node should be at one level above the selected node.
                                if ($('#' + sid).get(0).parentNode.id == selection.focusNode.parentNode.id) expandSpan(sid, selection);
                                else {
                                    domSelector.span.select(sid);
                                    alert('A span cannot be expanded to make a boundary crossing.');
                                }
                            }

                            // drag ended inside the selected span (shortening)
                            else if ((focusPosition > model.annotationData.spans[sid].begin) && (focusPosition < model.annotationData.spans[sid].end)) {
                                if ($('#' + sid).get(0).id == selection.focusNode.parentNode.id) shortenSpan(sid, selection);
                                else {
                                    domSelector.span.select(sid);
                                    alert('A span cannot be shrinked to make a boundary crossing.');
                                }
                            } else alert('It is ambiguous for which span you want to adjust the boundary. Reselect the span, and try again.');
                        } else {
                            alert('It is ambiguous for which span you want to adjust the boundary. Select the span, and try again.');
                        }
                    }
                }

                presentationLogic.dismissBrowserSelection();
                cancelBubble(e);
            };

            var spanClicked = function(e) {
                presentationLogic.hidePallet();
                var selection = window.getSelection();
                var range = selection.getRangeAt(0);

                if (!selection.isCollapsed) {
                    if (e.shiftKey && domSelector.span.getNumberOfSelected() == 1) {
                        var firstId = domSelector.span.popSelectedId();
                        var secondId = $(this).attr('id');

                        presentationLogic.dismissBrowserSelection();
                        domSelector.unselect();

                        var firstIndex = model.annotationData.spanIds.indexOf(firstId);
                        var secondIndex = model.annotationData.spanIds.indexOf(secondId);

                        if (secondIndex < firstIndex) {
                            var tmpIndex = firstIndex;
                            firstIndex = secondIndex;
                            secondIndex = tmpIndex;
                        }

                        for (var i = firstIndex; i <= secondIndex; i++) {
                            domSelector.span.select(model.annotationData.spanIds[i]);
                        }

                        editorState.buttonState.updateBySpan();
                    } else {
                        // if drag, bubble up
                        return true;
                    }
                } else if (e.ctrlKey) {
                    domSelector.domElement.toggle(e.target);
                    editorState.buttonState.updateBySpan();
                } else {
                    domSelector.domElement.selectOnly(e.target);
                    editorState.buttonState.updateAll();
                }

                return false;
            };

            // event handler (entity is clicked)
            var entityClicked = function(e) {
                if (e.ctrlKey) {
                    domSelector.domElement.toggle(e.target);
                    mouseover.buttonState.updateByEntity();
                } else {
                    domSelector.domElement.selectOnly(e.target);
                    editorState.buttonState.updateAll();
                }

                cancelBubble(e);
                return false;
            };

            var gridMouseHover = function(e) {
                var grid = $(this);
                var id = grid.attr('id');

                if (e.type == 'mouseover') {
                    grid.css('height', 'auto');
                    if (grid.outerWidth() < renderer.positions[id].width) grid.css('width', renderer.positions[id].width);
                    // grid.css('z-index', '254');
                } else {
                    grid.css('height', renderer.positions[id].height);
                    // grid.css('z-index', '');
                }
            };

            var editorSelected = function() {
                editor.tool.selectMe();
                editorState.buttonState.renderEnable();
            };

            return {
                //bind user input event to handler
                init: function() {
                    editor
                        .on('mouseup', '.textae-editor__body', bodyClicked)
                        .on('mouseup', '.span', spanClicked)
                        .on('mouseup', '.entity', entityClicked)
                        .on('mouseover mouseout', '.grid', gridMouseHover)
                        .on('mouseup', '.textae-editor__body,.span,.entity,.grid', editorSelected);
                },

                //connector clicked is bind by jsPlumb bind function.
                connectorClicked: function(conn, e) {
                    var rid = conn.getParameter("id");

                    domSelector.unselect();

                    if (renderer.relations.isRelationSelected(rid)) {
                        renderer.relations.deselectRelation(rid);
                    } else {
                        if (!e.ctrlKey) {
                            renderer.relations.clearRelationSelection();
                        }
                        renderer.relations.selectRelation(rid);
                    }

                    cancelBubble(e);
                    return false;
                },
            };
        }(this);

        var domSelector = {
            getSelecteds: function() {
                return $('.ui-selected');
            },
            hasSelecteds: function() {
                return domSelector.getSelecteds().length > 0;
            },
            unselect: function() {
                domSelector.getSelecteds().removeClass('ui-selected');
                editorState.buttonState.updateAll();
            },
            domElement: function() {
                var isSelected = function(target) {
                    return $(target).hasClass('ui-selected');
                };
                var select = function(target) {
                    $(target).addClass('ui-selected');
                };
                var deselect = function(target) {
                    $(target).removeClass('ui-selected');
                };
                return {
                    toggle: function(target) {
                        if (isSelected(target)) {
                            deselect(target);
                        } else {
                            select(target);
                        }
                    },
                    selectOnly: function(target) {
                        domSelector.getSelecteds().removeClass('ui-selected');
                        select(target);
                    }
                };
            }(),
            span: {
                getSelecteds: function() {
                    return $('.span.ui-selected');
                },
                getNumberOfSelected: function() {
                    return domSelector.span.getSelecteds().length;
                },
                getSelectedId: function() {
                    //return first element id even if multi elements selected.
                    return domSelector.span.getSelecteds().attr('id');
                },
                popSelectedId: function() {
                    var ss = domSelector.span.getSelecteds();
                    if (ss.length === 1) {
                        ss.removeClass('ui-selected');
                        return ss.attr('id');
                    } else {
                        return null;
                    }
                },
                select: function(id) {
                    $('#' + id).addClass('ui-selected');
                    editorState.buttonState.updateBySpan();
                },
            },
            entity: {
                get: function(eid) {
                    return $('#' + idFactory.makeEntityDomId(eid));
                },
                getSelecteds: function() {
                    return $('.entity.ui-selected');
                },
                getNumberOfSelected: function() {
                    return domSelector.entity.getSelecteds().length;
                },
                hasSelecteds: function() {
                    return domSelector.entity.getNumberOfSelected() > 0;
                },
                getSelectedId: function() {
                    return domSelector.entity.getSelecteds().attr('title');
                },
                select: function(eid) {
                    domSelector.entity.get(eid).addClass('ui-selected');
                },
            },
        };

        //user event to edit model
        var businessLogic = {
            loadAnnotation: function(annotation) {
                var parseAnnotationJson = function(data) {
                    //validate
                    if (data.text === undefined) {
                        alert("read failed.");
                        return;
                    }

                    //parse
                    model.sourceDoc = data.text;

                    model.annotationData.reset();
                    model.annotationData.parseDenotations(data.denotations);
                    model.annotationData.parseRelations(data.relations);

                    entitiesPerType = {};
                    typesPerSpan = {};
                    relationsPerEntity = {};
                    renderer.positions = {};
                    connectors = {};

                    if (data.denotations !== undefined) {
                        data.denotations.forEach(function(d) {
                            //expected d is like { "id": "T1", "span": { "begin": 19, "end": 49 }, "obj": "Cell" }
                            var span = d.span;
                            var spanId = idFactory.makeSpanId(span.begin, span.end);
                            var entityType = d.obj;

                            model.entityTypes.incrementNumberOfTypes(entityType);

                            var tid = idFactory.makeTypeId(spanId, entityType);
                            if (typesPerSpan[spanId]) {

                                if (typesPerSpan[spanId].indexOf(tid) < 0) typesPerSpan[spanId].push(tid);
                            } else {
                                typesPerSpan[spanId] = [tid];
                            }

                            if (entitiesPerType[tid]) {
                                entitiesPerType[tid].push(d.id);
                            } else {
                                entitiesPerType[tid] = [d.id];
                            }
                        });
                    }

                    if (data.relations !== undefined) {
                        data.relations.forEach(function(r) {
                            if (!model.relationTypes[r.pred]) {
                                model.relationTypes[r.pred] = {};
                            }

                            if (model.relationTypes[r.pred].count) {
                                model.relationTypes[r.pred].count++;
                            } else {
                                model.relationTypes[r.pred].count = 1;
                            }

                            if (relationsPerEntity[r.subj]) {
                                if (relationsPerEntity[r.subj].indexOf(r.id) < 0) {
                                    relationsPerEntity[r.subj].push(r.id);
                                }
                            } else {
                                relationsPerEntity[r.subj] = [r.id];
                            }

                            if (relationsPerEntity[r.obj]) {
                                if (relationsPerEntity[r.obj].indexOf(r.id) < 0) {
                                    relationsPerEntity[r.obj].push(r.id);
                                }
                            } else {
                                relationsPerEntity[r.obj] = [r.id];
                            }
                        });
                    }
                };


                parseAnnotationJson(annotation);
                command.history.init();

                renderer.renderAnnotation();
                presentationLogic.showTarget(targetUrl);
            },
            getAnnotationFromServer: function(url) {
                targetUrl = url;
                cursor.startWait();
                textAeUtil.ajaxAccessor.getAsync(url, businessLogic.loadAnnotation, function() {
                    cursor.endWait();
                });
            },
            saveAnnotation: function() {
                command.history.saved();
            },
            saveAnnotationToServer: function(url) {
                cursor.startWait();
                var postData = model.annotationData.toJason();
                textAeUtil.ajaxAccessor.post(url, postData, presentationLogic.showSaveSuccess, presentationLogic.showSaveError, function() {
                    cursor.endWait();
                });
            },
            undo: function() {
                var revertCommand = function(command) {
                    var reverted = Object.create(command);
                    switch (command.action) {
                        case 'new_span':
                            reverted.action = 'remove_span';
                            break;
                        case 'remove_span':
                            reverted.action = 'new_span';
                            break;
                        case 'new_denotation':
                            reverted.action = 'remove_denotation';
                            break;
                        case 'remove_denotation':
                            reverted.action = 'new_denotation';
                            break;
                        case 'change_entity_type':
                            reverted.old_type = command.new_type;
                            reverted.new_type = command.old_type;
                            break;
                        case 'new_relation':
                            reverted.action = 'remove_relation';
                            break;
                        case 'remove_relation':
                            reverted.action = 'new_relation';
                            break;
                        case 'change_relation_subj':
                            reverted.old_subj = command.new_subj;
                            reverted.new_subj = command.old_subj;
                            break;
                        case 'change_relation_obj':
                            reverted.old_obj = command.new_obj;
                            reverted.new_obj = command.old_obj;
                            break;
                        case 'change_relation_pred':
                            reverted.old_pred = command.new_pred;
                            reverted.new_pred = command.old_pred;
                            break;
                    }
                    return reverted;
                };

                var getRevertCommands = function(commands) {
                    commands = Object.create(commands);
                    commands.reverse();
                    return commands.map(revertCommand);
                };

                domSelector.unselect();
                renderer.relations.clearRelationSelection();

                command.execute(getRevertCommands(command.history.prev()), 'undo');
            },

            redo: function() {
                domSelector.unselect();
                renderer.relations.clearRelationSelection();

                command.execute(command.history.next(), 'redo');

                return false;
            },

            replicate: function() {
                if (domSelector.span.getNumberOfSelected() == 1) {
                    command.execute(command.getReplicateSpanCommands(model.annotationData.spans[domSelector.span.getSelectedId()]));
                } else alert('You can replicate span annotation when there is only span selected.');
            },

            createEntity: function() {
                var commands = [];
                domSelector.span.getSelecteds().each(function() {
                    var sid = this.id;
                    commands.push({
                        action: 'new_denotation',
                        span: sid,
                        type: model.entityTypes.getDefaultType()
                    });
                });

                command.execute(commands);
            },

            newLabel: function() {
                var $selectedEntities = domSelector.entity.getSelecteds();
                if ($selectedEntities.length > 0) {
                    var new_type = prompt("Please enter a new label", "");

                    var commands = [];
                    $selectedEntities.each(function() {
                        var eid = this.title;
                        console.log(eid);
                        commands.push({
                            action: 'change_entity_type',
                            id: eid,
                            old_type: model.annotationData.entities[eid].type,
                            new_type: new_type
                        });
                    });

                    command.execute(commands);
                }
            },

            removeElements: function() {
                var spanRemoves = [];
                domSelector.span.getSelecteds().each(function() {
                    var sid = this.id;
                    spanRemoves.push({
                        action: 'remove_span',
                        id: sid
                    });
                    for (var t in typesPerSpan[sid]) {
                        var tid = typesPerSpan[sid][t];
                        for (var e in entitiesPerType[tid]) {
                            var eid = entitiesPerType[tid][e];
                            domSelector.entity.select(eid);
                        }
                    }
                });

                var entityRemoves = [];
                domSelector.entity.getSelecteds().each(function() {
                    var eid = this.title;
                    entityRemoves.push({
                        action: 'remove_denotation',
                        id: eid,
                        span: model.annotationData.entities[eid].span,
                        type: model.annotationData.entities[eid].type
                    });
                    for (var r in relationsPerEntity[eid]) {
                        var rid = relationsPerEntity[eid][r];
                        renderer.relations.selectRelation(rid);
                    }
                });

                var relationRemoves = [];
                while (renderer.relations.relationIdsSelected.length > 0) {
                    rid = renderer.relations.relationIdsSelected.pop();
                    relationRemoves.push({
                        action: 'remove_relation',
                        id: rid,
                        subj: model.annotationData.relations[rid].subj,
                        obj: model.annotationData.relations[rid].obj,
                        pred: model.annotationData.relations[rid].pred
                    });
                }

                var commands = [].concat(relationRemoves, entityRemoves, spanRemoves);
                command.execute(commands);
            },

            copyEntities: function() {
                clipBoard.length = 0;
                domSelector.entity.getSelecteds().each(function() {
                    clipBoard.push(this.title);
                });
            },

            pasteEntities: function() {
                var commands = [];
                domSelector.span.getSelecteds().each(function() {
                    var sid = this.id;
                    //clipBoard has entity ids.
                    commands = commands.concat(clipBoard.map(function(e) {
                        return {
                            action: 'new_denotation',
                            span: sid,
                            type: model.annotationData.entities[e].type
                        };
                    }));
                });

                command.execute(commands);
            },

            // set the default type of denoting object
            setEntityTypeDefault: function() {
                model.entityTypes.setDefaultType($(this).attr('label'));
                return false;
            },

            // set the type of an entity
            setEntityType: function() {
                var new_type = $(this).attr('label');
                var commands = [];
                domSelector.entity.getSelecteds().each(function() {
                    var eid = this.title;
                    commands.push({
                        action: 'change_entity_type',
                        id: eid,
                        old_type: model.annotationData.entities[eid].type,
                        new_type: new_type
                    });
                });

                command.execute(commands);
                return false;
            }
        };

        //user event that does not change data.
        var presentationLogic = function(self) {
            var getMessageArea = function() {
                $messageArea = self.find('.textae-editor__footer .textae-editor__footer__message');
                if ($messageArea.length === 0) {
                    $messageArea = $("<div>").addClass("textae-editor__footer__message");
                    var $footer = $("<div>")
                        .addClass("textae-editor__footer")
                        .append($messageArea);
                    self.append($footer);
                }

                return $messageArea;
            };

            return {
                showTarget: function(targetUrl) {
                    if (targetUrl !== "") {
                        var targetDoc = targetUrl.replace(/\/annotations\.json$/, '');
                        getMessageArea().html("(Target: <a href='" + targetDoc + "'>" + targetDoc + "</a>)");
                    }
                },
                showSaveSuccess: function() {
                    getMessageArea().html("annotation saved").fadeIn().fadeOut(5000, function() {
                        $(this).html('').removeAttr('style');
                        presentationLogic.showTarget(targetUrl);
                    });
                    command.history.saved();
                    cursor.endWait();
                },
                showSaveError: function() {
                    getMessageArea.html("could not save").fadeIn().fadeOut(5000, function() {
                        $(this).html('').removeAttr('style');
                        presentationLogic.showTarget(targetUrl);
                    });
                    cursor.endWait();
                },

                showPallet: function(point) {
                    //create table contents for entity type.
                    var makeEntityTypeOfEntityTypePallet = function() {
                        return model.entityTypes.getSortedNames().map(function(t) {
                            var type = model.entityTypes.getType(t);
                            var row = '<tr class="textae-control__entity-pallet__entity-type" style="background-color:' + type.getColor() + '">';

                            row += '<th><input type="radio" name="etype" class="textae-control__entity-pallet__entity-type__radio" label="' + t + '"';
                            row += (t == model.entityTypes.getDefaultType()) ? ' title="default type" checked' : '';
                            row += '/></th>';

                            row += '<td class="textae-control__entity-pallet__entity-type__label" label="' + t + '">' + t + '</td>';

                            row += '<th title="' + uri + '">';

                            var uri = type.uri;
                            if (uri) {
                                row += '<a href="' + uri + '" target="_blank"><img src="images/link.png"/></a>';
                            }

                            row += '</th>';
                            row += '</tr>';
                            return row;
                        }).join();
                    };

                    //return a Pallet that created if not exists.
                    var getEmptyPallet = function() {
                        var $pallet = $('.textae-control__entity-pallet');
                        if ($pallet.length === 0) {
                            //setup new pallet
                            $pallet = $('<div>')
                                .addClass("textae-control__entity-pallet")
                                .append($('<table>'))
                                .css({
                                    'position': 'fixed',
                                    'display': 'none'
                                })
                                .on('mouseup', '.textae-control__entity-pallet__entity-type__radio', businessLogic.setEntityTypeDefault)
                                .on('mouseup', '.textae-control__entity-pallet__entity-type__label', businessLogic.setEntityType);

                            //for show on top append to body.
                            $("body").append($pallet);
                        } else {
                            $pallet.find('table').empty();
                            $pallet.css('width', 'auto');
                        }
                        return $pallet;
                    };

                    var $pallet　 = getEmptyPallet();
                    $pallet.find("table")
                        .append(makeEntityTypeOfEntityTypePallet(model.entityTypes));

                    //limti max height.
                    if ($pallet.outerHeight() > CONSTS.PALLET_HEIGHT_MAX) {
                        $pallet.css('height', CONSTS.PALLET_HEIGHT_MAX);
                        $pallet.css('width', $pallet.outerWidth() + 15);
                    }

                    //if open by mouseevent
                    if (arguments.length === 1) {
                        $pallet.css('top', point.top);
                        $pallet.css('left', point.left);
                    } else {
                        $pallet.css('top', 10);
                        $pallet.css('left', 20);
                    }
                    $pallet.css('display', 'block');
                },

                hidePallet: function() {
                    $('.textae-control__entity-pallet').css('display', 'none');
                },

                redraw: function() {
                    var positionGrids = function(sids) {
                        var positionGrid = function(sid) {
                            var gid = 'G' + sid;
                            var grid = $('#' + gid);
                            if (grid.length > 0) {
                                renderer.positions[gid].top = renderer.positions[sid].top - renderer.positions[gid].offset - renderer.positions[gid].height;
                                renderer.positions[gid].left = renderer.positions[sid].left;
                                grid.css('top', renderer.positions[gid].top);
                                grid.css('left', renderer.positions[sid].left);
                            }
                        };

                        // console.log(sids);
                        for (var s = sids.length - 1; s >= 0; s--) {
                            positionGrid(model.annotationData.spanIds[s]);
                        }
                    };

                    renderer.indexPositionSpans(model.annotationData.spanIds);
                    positionGrids(model.annotationData.spanIds);

                    renderer.indexPositionEntities();
                    renderer.relations.renewConnections();
                },
                cancelSelect: function() {
                    // if drag, bubble up
                    if (!window.getSelection().isCollapsed) {
                        presentationLogic.dismissBrowserSelection();
                        return true;
                    }

                    domSelector.unselect();
                    renderer.relations.clearRelationSelection();
                    presentationLogic.hidePallet();
                    editorState.buttonState.updateAll();

                    self.tool.cancelSelect();
                },
                // dismiss the default selection by the browser
                dismissBrowserSelection: function() {
                    var selection = window.getSelection();
                    selection.collapse(document.body, 0);
                },
            };
        }(this);

        // public funcitons of editor
        var editorApi = {
            createEntity: businessLogic.createEntity,
            removeElements: businessLogic.removeElements,
            copyEntities: businessLogic.copyEntities,
            pasteEntities: businessLogic.pasteEntities,
            replicate: businessLogic.replicate,
            showPallet: presentationLogic.showPallet,
            showAccess: function() {
                loadSaveDialog.showAccess(targetUrl);
            },
            showSave: function() {
                loadSaveDialog.showSave(targetUrl, model.annotationData.toJason());
            },
            newLabel: businessLogic.newLabel,
            redo: function() {
                if (command.history.hasAnythingToRedo()) {
                    businessLogic.redo();
                }
            },
            undo: function() {
                if (command.history.hasAnythingToUndo()) {
                    businessLogic.undo();
                }
            },
            selectLeftEntity: function() {
                //TODO presentation logic?
                if (domSelector.span.getNumberOfSelected() == 1) {
                    var spanIdx = model.annotationData.spanIds.indexOf(domSelector.span.popSelectedId());
                    domSelector.unselect();
                    spanIdx--;
                    if (spanIdx < 0) {
                        spanIdx = model.annotationData.spanIds.length - 1;
                    }
                    domSelector.span.select(model.annotationData.spanIds[spanIdx]);
                }
            },
            selectRightEntity: function() {
                if (domSelector.span.getNumberOfSelected() == 1) {
                    var spanIdx = model.annotationData.spanIds.indexOf(domSelector.span.popSelectedId());
                    domSelector.unselect();
                    spanIdx++;
                    if (spanIdx > model.annotationData.spanIds.length - 1) {
                        spanIdx = 0;
                    }
                    domSelector.span.select(model.annotationData.spanIds[spanIdx]);
                }
            },
            start: function() {
                startEdit();
            },
            handleKeyInput: function(key) {
                var keyApiMap = {
                    "A": editorApi.showAccess,
                    "C": editorApi.copyEntities,
                    "D": editorApi.removeElements,
                    "DEL": editorApi.removeElements,
                    "E": editorApi.createEntity,
                    "Q": editorApi.showPallet,
                    "R": editorApi.replicate,
                    "S": editorApi.showSave,
                    "V": editorApi.pasteEntities,
                    "W": editorApi.newLabel,
                    "X": editorApi.redo,
                    "Y": editorApi.redo,
                    "Z": editorApi.undo,
                    "ESC": presentationLogic.cancelSelect,
                    "LEFT": editorApi.selectLeftEntity,
                    "RIGHT": editorApi.selectRightEntity,
                };
                if (keyApiMap[key]) {
                    keyApiMap[key]();
                }
            },
            handleButtonClick: function(event) {
                var buttonApiMap = {
                    "textae.control.button.read.click": editorApi.showAccess,
                    "textae.control.button.write.click": editorApi.showSave,
                    "textae.control.button.undo.click": editorApi.undo,
                    "textae.control.button.redo.click": editorApi.redo,
                    "textae.control.button.replicate.click": editorApi.replicate,
                    "textae.control.button.replicate_auto.click": editorState.toggleReplicateAuto,
                    "textae.control.button.entity.click": editorApi.createEntity,
                    "textae.control.button.new_label.click": editorApi.newLabel,
                    "textae.control.button.pallet.click": function() {
                        editorApi.showPallet(event.point);
                    },
                    "textae.control.button.delete.click": editorApi.removeElements,
                    "textae.control.button.copy.click": editorApi.copyEntities,
                    "textae.control.button.paste.click": editorApi.pasteEntities,
                };
                buttonApiMap[event.name]();
            },
            redraw: presentationLogic.redraw,
        };
        this.api = editorApi;

        return this;
    };