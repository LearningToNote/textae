// A command is an operation by user that is saved as history, and can undo and redo.
// Users can edit model only via commands. 
module.exports = function(idFactory, model, history, spanConfig) {
    var invoke = function(commands) {
            commands.forEach(function(command) {
                command.execute();
            });
        },
        RevertCommands = function(commands) {
            commands = Object.create(commands);
            commands.reverse();
            return commands.map(function(originCommand) {
                return originCommand.revert();
            });
        },
        invokeRevert = _.compose(invoke, RevertCommands);

    var factory = function() {
        var debugLog = function(message, object) {
                // For debug
                if (object) {
                    console.log('[command.invoke]', message, object);
                } else {
                    console.log('[command.invoke]', message);
                }
            },
            updateSelection = function(modelType, selectOption, newModel) {
                if (model.selectionModel[modelType]) {
                    var select = _.partial(model.selectionModel[modelType].add, newModel.id);
                    if (selectOption.delaySelect) {
                        _.delay(select, selectOption.delaySelect);
                    } else {
                        select();
                    }
                }
            },
            createCommand = function(modelType, selectOption, newModel) {
                return {
                    execute: function() {
                        // Update model
                        newModel = model.annotationData[modelType].add(newModel);

                        // Update Selection
                        if (selectOption) updateSelection(modelType, selectOption, newModel);

                        // Set revert
                        this.revert = _.partial(factory[modelType + 'RemoveCommand'], newModel.id);

                        debugLog('create a new ' + modelType + ': ', newModel);

                        return newModel;
                    }
                };
            },
            removeCommand = function(modelType, id) {
                return {
                    execute: function() {
                        // Update model
                        var oloModel = model.annotationData[modelType].remove(id);

                        if (oloModel) {
                            // Set revert
                            this.revert = _.partial(createCommand, modelType, false, oloModel);
                            debugLog('remove a ' + modelType + ': ', oloModel);
                        } else {
                            // Do not revert unless an object was removed.
                            this.revert = function() {
                                return {
                                    execute: function() {}
                                };
                            };
                            debugLog('already removed ' + modelType + ': ', id);
                        }
                    },
                };
            },
            changeTypeCommand = function(modelType, id, newType) {
                return {
                    execute: function() {
                        var oldType = model.annotationData[modelType].get(id).type;

                        // Update model
                        var targetModel = model.annotationData[modelType].changeType(id, newType);

                        // Set revert
                        this.revert = _.partial(factory[modelType + 'ChangeTypeCommand'], id, oldType);

                        debugLog('change type of a ' + modelType + '. oldtype:' + oldType + ' ' + modelType + ':', targetModel);
                    }
                };
            },
            setRevertAndLog = function() {
                var log = function(prefix, param) {
                        debugLog(prefix + param.commandType + ' a ' + param.modelType + ': ' + param.id);
                    },
                    doneLog = _.partial(log, ''),
                    revertLog = _.partial(log, 'revert '),
                    RevertFunction = function(subCommands, logParam) {
                        var toRevert = function(command) {
                                return command.revert();
                            },
                            execute = function(command) {
                                command.execute();
                            },
                            revertedCommand = {
                                execute: function() {
                                    invokeRevert(subCommands);
                                    revertLog(logParam);
                                }
                            };

                        return function() {
                            return revertedCommand;
                        };
                    },
                    setRevert = function(modelType, command, commandType, id, subCommands) {
                        var logParam = {
                            modelType: modelType,
                            commandType: commandType,
                            id: id
                        };

                        command.revert = new RevertFunction(subCommands, logParam);
                        return logParam;
                    };

                return _.compose(doneLog, setRevert);
            }(),
            setRevertAndLogSpan = _.partial(setRevertAndLog, 'span'),
            executeSubCommands = function(subCommands) {
                subCommands.forEach(function(command) {
                    command.execute();
                });
            },
            spanCreateCommand = _.partial(createCommand, 'span', true);

        return {
            spanCreateCommand: function(type, span) {
                var id = idFactory.makeSpanId(span.begin, span.end),
                    createSpan = spanCreateCommand(span),
                    createEntity = createCommand('entity', true, {
                        span: id,
                        type: type
                    }),
                    subCommands = [createSpan, createEntity];

                return {
                    execute: function() {
                        executeSubCommands(subCommands);
                        setRevertAndLogSpan(this, 'create', id, subCommands);
                    }
                };
            },
            spanRemoveCommand: function(id) {
                var removeSpan = _.partial(removeCommand, 'span')(id),
                    removeEntity = _.flatten(model.annotationData.span.get(id).getTypes().map(function(type) {
                        return type.entities.map(function(entityId) {
                            return factory.entityRemoveCommand(entityId);
                        });
                    })),
                    subCommands = removeEntity.concat(removeSpan);

                return {
                    execute: function() {
                        executeSubCommands(subCommands);
                        setRevertAndLogSpan(this, 'remove', id, subCommands);
                    }
                };
            },
            spanMoveCommand: function(spanId, begin, end) {
                return {
                    execute: function() {
                        var subCommands = [];
                        var newSpanId = idFactory.makeSpanId(begin, end);

                        if (!model.annotationData.span.get(newSpanId)) {
                            subCommands.push(factory.spanRemoveCommand(spanId));
                            subCommands.push(spanCreateCommand({
                                begin: begin,
                                end: end
                            }));
                            model.annotationData.span.get(spanId).getTypes().forEach(function(type) {
                                type.entities.forEach(function(entityId) {
                                    subCommands.push(factory.entityCreateCommand({
                                        id: entityId,
                                        span: newSpanId,
                                        type: type.name
                                    }));
                                });
                            });
                        }

                        executeSubCommands(subCommands);

                        var oldBeginEnd = idFactory.parseSpanId(spanId);
                        this.revert = _.partial(factory.spanMoveCommand, newSpanId, oldBeginEnd.begin, oldBeginEnd.end);

                        debugLog('move a span, spanId:' + spanId + ', newBegin:' + begin + ', newEnd:' + end);
                    }
                };
            },
            spanReplicateCommand: function(type, span) {
                var createSpan = _.partial(factory.spanCreateCommand, type),
                    subCommands = model
                    .getReplicationSpans(span, spanConfig)
                    .map(createSpan);

                return {
                    execute: function() {
                        executeSubCommands(subCommands);
                        setRevertAndLogSpan(this, 'replicate', span.id, subCommands);
                    }
                };
            },
            entityCreateCommand: _.partial(createCommand, 'entity', true),
            entityRemoveCommand: function(id) {
                var removeEntity = _.partial(removeCommand, 'entity')(id),
                    removeRelation = model.annotationData.entity.assosicatedRelations(id)
                    .map(factory.relationRemoveCommand),
                    subCommands = removeRelation.concat(removeEntity);

                return {
                    execute: function() {
                        executeSubCommands(subCommands);
                        setRevertAndLog('entity', this, 'remove', id, subCommands);
                    }
                };
            },
            entityChangeTypeCommand: _.partial(changeTypeCommand, 'entity'),
            // The relaitonId is optional set only when revert of the relationRemoveCommand.
            // Set the css class lately, because jsPlumbConnector is no applyed that css class immediately after create.
            relationCreateCommand: _.partial(createCommand, 'relation', {
                delaySelect: 100
            }),
            relationRemoveCommand: _.partial(removeCommand, 'relation'),
            relationChangeTypeCommand: _.partial(changeTypeCommand, 'relation'),
            modificationCreateCommand: _.partial(createCommand, 'modification', false),
            modificationRemoveCommand: _.partial(removeCommand, 'modification')
        };
    }();

    return {
        invoke: function(commands) {
            if (commands && commands.length > 0) {
                invoke(commands);
                history.push(commands);
            }
        },
        undo: function() {
            return function() {
                if (history.hasAnythingToUndo()) {
                    model.selectionModel.clear();
                    invokeRevert(history.prev());
                }
            };
        }(),
        redo: function() {
            if (history.hasAnythingToRedo()) {
                model.selectionModel.clear();
                invoke(history.next());
            }
        },
        factory: factory
    };
};