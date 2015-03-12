import Selector from '../../Selector';
import createEntityUnlessBlock from './createEntityUnlessBlock';
import removeEntityElement from './removeEntityElement';

export default function(editor, model, typeContainer, gridRenderer, modification, emitter, entity) {
    let selector = new Selector(editor, model);

    // Remove an old entity.
    removeEntityElement(
        editor,
        model.annotationData,
        entity
    );

    // Show a new entity.
    createEntityUnlessBlock(
        editor,
        model.annotationData.namespace,
        typeContainer,
        gridRenderer,
        modification,
        emitter,
        entity
    );

    // Re-select a new entity instance.
    if (model.selectionModel.entity.has(entity.id)) {
        selector.entity.select(entity.id);
    }

    return entity;
}