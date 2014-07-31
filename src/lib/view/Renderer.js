module.exports = function(editor, model, viewModel) {
    var getElement = function($parent, tagName, className) {
        var $area = $parent.find('.' + className);
        if ($area.length === 0) {
            $area = $('<' + tagName + '>').addClass(className);
            $parent.append($area);
        }
        return $area;
    };

    // Make the display area for text, spans, denotations, relations.
    var displayArea = _.partial(getElement, editor, 'div', 'textae-editor__body');

    // Get the display area for denotations and relations.
    var getAnnotationArea = function() {
        return getElement(displayArea(), 'div', 'textae-editor__body__annotation-box');
    };

    var renderSourceDocument = function(params) {
        // Get the display area for text and spans.
        var getSourceDocArea = function() {
                return getElement(displayArea(), 'div', 'textae-editor__body__text-box');
            },

            // the Souce document has multi paragraphs that are splited by '\n'.
            createTaggedSourceDoc = function(params) {
                //set sroucedoc tagged <p> per line.
                return params.sourceDoc.split("\n").map(function(content, index) {
                    return '<p class="textae-editor__body__text-box__paragraph-margin">' +
                        '<span class="textae-editor__body__text-box__paragraph" id="' +
                        params.paragraphs[index].id +
                        '" >' +
                        content +
                        '</span></p>';
                }).join("\n");
            };

        // Render the source document
        getSourceDocArea().html(createTaggedSourceDoc(params));
    };

    var domPositionUtils = require('./DomPositionCache')(editor, model);

    var reset = function(annotationData) {
        var renderAllSpan = function(annotationData) {
                // For tuning
                // var startTime = new Date();

                annotationData.span.topLevel().forEach(function(span) {
                    rendererImpl.span.render(span);
                });

                // For tuning
                // var endTime = new Date();
                // console.log('render all span : ', endTime.getTime() - startTime.getTime() + 'ms');
            },
            renderAllRelation = function(annotationData) {
                rendererImpl.relation.reset();
                annotationData.relation.all().forEach(rendererImpl.relation.render);
            };

        // Render annotations
        getAnnotationArea().empty();
        domPositionUtils.gridPositionCache.clear();
        renderAllSpan(annotationData);

        // Render relations
        renderAllRelation(annotationData);
    };

    var domUtil = require('../util/DomUtil')(editor);

    var rendererImpl = function() {
        var removeDom = function(target) {
                return target.remove();
            },
            destroyGrid = function(spanId) {
                removeDom(domUtil.selector.grid.get(spanId));
                domPositionUtils.gridPositionCache.remove(spanId);
            },
            gridRenderer = function() {
                var createGrid = function(container, spanId) {
                        var spanPosition = domPositionUtils.getSpan(spanId);
                        var $grid = $('<div>')
                            .attr('id', 'G' + spanId)
                            .addClass('textae-editor__grid')
                            .addClass('hidden')
                            .css({
                                'width': spanPosition.width
                            });

                        //append to the annotation area.
                        container.append($grid);

                        return $grid;
                    },
                    init = function(container) {
                        gridRenderer.render = _.partial(createGrid, container);
                    };

                return {
                    init: init,
                    // The render is set at init.
                    render: null
                };
            }(),
            modification = function() {
                var getClasses = function(objectId) {
                    return model.annotationData.getModificationOf(objectId)
                        .map(function(m) {
                            return 'textae-editor__' + m.pred.toLowerCase();
                        }).join(' ');
                };

                return {
                    getClasses: getClasses,
                    update: function() {
                        var allModificationClasses = 'textae-editor__negation textae-editor__speculation';

                        return function(domElement, objectId) {
                            domElement.removeClass(allModificationClasses);
                            domElement.addClass(getClasses(objectId));
                        };
                    }(),
                };
            }(),
            spanRenderer = function() {
                // Get the Range to that new span tag insert.
                // This function works well when no child span is rendered. 
                var getRangeToInsertSpanTag = function(span) {
                    var getPosition = function(span, textNodeStartPosition) {
                        var startPos = span.begin - textNodeStartPosition;
                        var endPos = span.end - textNodeStartPosition;
                        return {
                            start: startPos,
                            end: endPos
                        };
                    };

                    var validatePosition = function(position, textNode, span) {
                        if (position.start < 0 || textNode.length < position.end) {
                            throw new Error('oh my god! I cannot render this span. ' + span.toStringOnlyThis() + ', textNode ' + textNode.textContent);
                        }
                    };

                    var createRange = function(textNode, position) {
                        var range = document.createRange();
                        range.setStart(textNode, position.start);
                        range.setEnd(textNode, position.end);
                        return range;
                    };

                    // Create the Range to a new span add 
                    var createSpanRange = function(span, textNodeStartPosition, textNode) {
                        var position = getPosition(span, textNodeStartPosition);
                        validatePosition(position, textNode, span);

                        return createRange(textNode, position);
                    };

                    var isTextNode = function() {
                        return this.nodeType === 3; //TEXT_NODE
                    };

                    var getFirstTextNode = function($element) {
                        return $element.contents().filter(isTextNode).get(0);
                    };

                    var getParagraphElement = function(paragraphId) {
                        return $('#' + paragraphId);
                    };

                    var createRangeForFirstSpan = function(getJqueryObjectFunc, span, textaeRange) {
                        var getTextNode = _.compose(getFirstTextNode, getJqueryObjectFunc);
                        var textNode = getTextNode(textaeRange.id);
                        return createSpanRange(span, textaeRange.begin, textNode);
                    };

                    var createRangeForFirstSpanInParent = _.partial(createRangeForFirstSpan, domUtil.selector.span.get);
                    var createRangeForFirstSpanInParagraph = _.partial(createRangeForFirstSpan, getParagraphElement);

                    // The parent of the bigBrother is same with span, which is a span or the root of spanTree. 
                    var bigBrother = span.getBigBrother();
                    if (bigBrother) {
                        // The target text arrounded by span is in a textNode after the bigBrother if bigBrother exists.
                        return createSpanRange(span, bigBrother.end, document.getElementById(bigBrother.id).nextSibling);
                    } else {
                        // The target text arrounded by span is the first child of parent unless bigBrother exists.
                        if (span.parent) {
                            // The parent is span.
                            // This span is first child of span.
                            return createRangeForFirstSpanInParent(span, span.parent);
                        } else {
                            // The parent is paragraph
                            return createRangeForFirstSpanInParagraph(span, span.paragraph);
                        }
                    }
                };

                var appendSpanElement = function(span, element) {
                    getRangeToInsertSpanTag(span).surroundContents(element);

                    return span;
                };

                var createSpanElement = function(span) {
                    var element = document.createElement('span');
                    element.setAttribute('id', span.id);
                    element.setAttribute('title', span.id);
                    element.setAttribute('class', 'textae-editor__span');
                    return element;
                };

                var renderSingleSpan = function(span) {
                    return appendSpanElement(span, createSpanElement(span));
                };

                var renderEntitiesOfType = function(type) {
                    type.entities.forEach(_.compose(entityRenderer.render, model.annotationData.entity.get));
                };

                var renderEntitiesOfSpan = function(span) {
                    span.getTypes().forEach(renderEntitiesOfType);
                    return span;
                };

                var exists = function(span) {
                    return document.getElementById(span.id) !== null;
                };

                var not = function(value) {
                    return !value;
                };

                var destroy = function(span) {
                    var spanElement = document.getElementById(span.id);
                    var parent = spanElement.parentNode;

                    // Move the textNode wrapped this span in front of this span.
                    while (spanElement.firstChild) {
                        parent.insertBefore(spanElement.firstChild, spanElement);
                    }

                    removeDom($(spanElement));
                    parent.normalize();

                    // Destroy a grid of the span. 
                    destroyGrid(span.id);
                };

                var destroyChildrenSpan = function(span) {
                    // Destroy DOM elements of descendant spans.
                    var destroySpanRecurcive = function(span) {
                        span.children.forEach(function(span) {
                            destroySpanRecurcive(span);
                        });
                        destroy(span);
                    };

                    // Destroy rendered children.
                    span.children.filter(exists).forEach(destroySpanRecurcive);

                    return span;
                };

                var renderChildresnSpan = function(span) {
                    span.children.filter(_.compose(not, exists))
                        .forEach(create);

                    return span;
                };

                // Destroy children spans to wrap a TextNode with <span> tag when new span over exists spans.
                var create = _.compose(renderChildresnSpan, renderEntitiesOfSpan, renderSingleSpan, destroyChildrenSpan);

                return {
                    render: create,
                    remove: destroy
                };
            }(),
            entityRenderer = function() {
                var idFactory = require('../util/IdFactory')(editor);

                var getTypeDom = function(spanId, type) {
                    return $('#' + idFactory.makeTypeId(spanId, type));
                };

                // Arrange a position of the pane to center entities when entities width is longer than pane width.
                var arrangePositionOfPane = function(pane) {
                    var paneWidth = pane.outerWidth();
                    var entitiesWidth = pane.find('.textae-editor__entity').toArray().map(function(e) {
                        return e.offsetWidth;
                    }).reduce(function(pv, cv) {
                        return pv + cv;
                    }, 0);

                    pane.css({
                        'left': entitiesWidth > paneWidth ? (paneWidth - entitiesWidth) / 2 : 0
                    });
                };

                var doesSpanHasNoEntity = function(spanId) {
                    return model.annotationData.span.get(spanId).getTypes().length === 0;
                };

                var removeEntityElement = function(entity) {
                    var doesTypeHasNoEntity = function(typeName) {
                        return model.annotationData.span.get(entity.span).getTypes().filter(function(type) {
                            return type.name === typeName;
                        }).length === 0;
                    };

                    // Get old type from Dom, Because the entity may have new type when changing type of the entity.
                    var oldType = removeDom(domUtil.selector.entity.get(entity.id)).attr('type');

                    // Delete type if no entity.
                    if (doesTypeHasNoEntity(oldType)) {
                        getTypeDom(entity.span, oldType).remove();
                    } else {
                        // Arrage the position of TypePane, because number of entities decrease.
                        arrangePositionOfPane(getTypeDom(entity.span, oldType).find('.textae-editor__entity-pane'));
                    }
                };

                var selector = require('./Selector')(editor, model);

                // An entity is a circle on Type that is an endpoint of a relation.
                // A span have one grid and a grid can have multi types and a type can have multi entities.
                // A grid is only shown when at least one entity is owned by a correspond span.  
                var create = function(entity) {
                    //render type unless exists.
                    var getTypeElement = function(spanId, type) {
                        var isUri = function(type) {
                                return String(type).indexOf('http') > -1;
                            },
                            // Display short name for URL(http or https);
                            getDisplayName = function(type) {
                                // For tunning, search the scheme before execute a regular-expression.
                                if (isUri(type)) {
                                    // The regular-expression to parse URL.
                                    // See detail:
                                    // http://someweblog.com/url-regular-expression-javascript-link-shortener/
                                    var urlRegex = /\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/gi;
                                    var matches = urlRegex.exec(type);

                                    if (matches) {
                                        // Order to dispaly.
                                        // 1. The anchor without #.
                                        // 2. The file name with the extention.
                                        // 3. The last directory name.
                                        // 4. The domain name.
                                        return matches[9] ? matches[9].slice(1) :
                                            matches[6] ? matches[6] + (matches[7] || '') :
                                            matches[5] ? matches[5].split('/').filter(function(s) {
                                                return s !== '';
                                            }).pop() :
                                            matches[3];
                                    }
                                }
                                return type;
                            },
                            getUri = function(type) {
                                if (isUri(type)) {
                                    return type;
                                } else if (viewModel.typeContainer.entity.getUri(type)) {
                                    return viewModel.typeContainer.entity.getUri(type);
                                }
                            },
                            // A Type element has an entity_pane elment that has a label and will have entities.
                            createEmptyTypeDomElement = function(spanId, type) {
                                var typeId = idFactory.makeTypeId(spanId, type);

                                // The EntityPane will have entities.
                                var $entityPane = $('<div>')
                                    .attr('id', 'P-' + typeId)
                                    .addClass('textae-editor__entity-pane');

                                // The label over the span.
                                var $typeLabel = $('<div>')
                                    .addClass('textae-editor__type-label')
                                    .css({
                                        'background-color': viewModel.typeContainer.entity.getColor(type),
                                    });

                                // Set the name of the label with uri of the type.
                                var uri = getUri(type);
                                if (uri) {
                                    $typeLabel.append(
                                        $('<a target="_blank"/>')
                                        .attr('href', uri)
                                        .text(getDisplayName(type))
                                    );
                                } else {
                                    $typeLabel.text(getDisplayName(type));
                                }

                                return $('<div>')
                                    .attr('id', typeId)
                                    .addClass('textae-editor__type')
                                    .append($typeLabel)
                                    .append($entityPane); // Set pane after label because pane is over label.
                            };

                        var getGrid = function(spanId) {
                            // Create a grid unless it exists.
                            var $grid = domUtil.selector.grid.get(spanId);
                            if ($grid.length === 0) {
                                return gridRenderer.render(spanId);
                            } else {
                                return $grid;
                            }
                        };

                        var $type = getTypeDom(spanId, type);
                        if ($type.length === 0) {
                            $type = createEmptyTypeDomElement(spanId, type);
                            getGrid(spanId).append($type);
                        }

                        return $type;
                    };

                    var createEntityElement = function(entity) {
                        var $entity = $('<div>')
                            .attr('id', idFactory.makeEntityDomId(entity.id))
                            .attr('title', entity.id)
                            .attr('type', entity.type)
                            .addClass('textae-editor__entity')
                            .css({
                                'border-color': viewModel.typeContainer.entity.getColor(entity.type)
                            });

                        // Set css classes for modifications.
                        $entity.addClass(modification.getClasses(entity.id));

                        return $entity;
                    };

                    // Replace null to 'null' if type is null and undefined too.
                    entity.type = String(entity.type);


                    // Append a new entity to the type
                    var pane = getTypeElement(entity.span, entity.type)
                        .find('.textae-editor__entity-pane')
                        .append(createEntityElement(entity));

                    arrangePositionOfPane(pane);
                };

                var changeTypeOfExists = function(entity) {
                    // Remove an old entity.
                    removeEntityElement(entity);

                    // Show a new entity.
                    create(entity);

                    // Re-select a new entity instance.
                    if (model.selectionModel.entity.has(entity.id)) {
                        selector.entity.select(entity.id);
                    }
                };

                var changeModificationOfExists = function(entity) {
                    var $entity = domUtil.selector.entity.get(entity.id);
                    modification.update($entity, entity.id);
                };

                var destroy = function(entity) {
                    if (doesSpanHasNoEntity(entity.span)) {
                        // Destroy a grid when all entities are remove. 
                        destroyGrid(entity.span);
                    } else {
                        // Destroy an each entity.
                        removeEntityElement(entity);
                    }
                };

                return {
                    render: create,
                    change: changeTypeOfExists,
                    changeModification: changeModificationOfExists,
                    remove: destroy
                };
            }(),
            relationRenderer = require('./RelationRenderer')(editor, model, domPositionUtils, domUtil, viewModel, modification);

        return {
            init: function(container) {
                gridRenderer.init(container);
                relationRenderer.init(container);
            },
            span: spanRenderer,
            entity: entityRenderer,
            relation: relationRenderer
        };
    }();

    var modelToId = function(modelElement) {
        return modelElement.id;
    };

    var updateDisplayAfter = _.partial(_.compose, function() {
        api.trigger('change');
    });

    var capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    var renderModification = function(modelType, modification) {
        var target = model.annotationData[modelType].get(modification.obj);
        if (target) {
            rendererImpl[modelType].changeModification(target);
            viewModel.buttonStateHelper['updateBy' + capitalize(modelType)]();
        }

        return modification;
    };
    var renderModificationOfEntity = _.partial(renderModification, 'entity');
    var renderModificationOfRelation = _.partial(renderModification, 'relation');
    var renderModificationEntityOrRelation = _.compose(renderModificationOfEntity, renderModificationOfRelation);

    var api = require('../util/extendBindable')({
        setModelHandler: function() {
            rendererImpl.init(getAnnotationArea());

            model.annotationData
                .bind('change-text', renderSourceDocument)
                .bind('all.change', _.compose(model.selectionModel.clear, reset))
                .bind('span.add', updateDisplayAfter(rendererImpl.span.render))
                .bind('span.remove', updateDisplayAfter(rendererImpl.span.remove))
                .bind('span.remove', _.compose(model.selectionModel.span.remove, modelToId))
                .bind('entity.add', updateDisplayAfter(rendererImpl.entity.render))
                .bind('entity.change', updateDisplayAfter(rendererImpl.entity.change))
                .bind('entity.remove', updateDisplayAfter(rendererImpl.entity.remove))
                .bind('entity.remove', _.compose(model.selectionModel.entity.remove, modelToId))
                .bind('relation.add', rendererImpl.relation.render)
                .bind('relation.change', rendererImpl.relation.change)
                .bind('relation.remove', rendererImpl.relation.remove)
                .bind('relation.remove', _.compose(model.selectionModel.relation.remove, modelToId))
                .bind('modification.add', renderModificationEntityOrRelation)
                .bind('modification.remove', renderModificationEntityOrRelation);
        }
    });

    return api;
};