var Pallet = function(emitter) {
		return $('<div>')
			.addClass("textae-editor__type-pallet")
			.append($('<table>'))
			.css('position', 'fixed')
			.on('click', '.textae-editor__type-pallet__entity-type__label', function() {
				emitter.trigger('type.select', $(this).attr('label'));
			})
			.on('change', '.textae-editor__type-pallet__entity-type__radio', function() {
				emitter.trigger('default-type.select', $(this).attr('label'));
			})
			.hide();
	},
	rowParts = {
		RadioButton: function(typeContainer, typeName) {
			// The event handler is bound direct,because jQuery detects events of radio buttons directly only.
			var $radioButton = $('<input>')
				.addClass('textae-editor__type-pallet__entity-type__radio')
				.attr({
					'type': 'radio',
					'name': 'etype',
					'label': typeName
				});

			// Select the radio button if it is default type.
			if (typeName === typeContainer.getDefaultType()) {
				$radioButton.attr({
					'title': 'default type',
					'checked': 'checked'
				});
			}
			return $radioButton;
		},
		Link: function(uri) {
			if (uri) {
				return $('<a>')
					.attr({
						'href': uri,
						'target': '_blank'
					})
					.append($('<span>').addClass('textae-editor__type-pallet__link'));
			}
		},
		wrapTd: function($element) {
			if ($element) {
				return $('<td>').append($element);
			} else {
				return $('<td>');
			}
		}
	},
	PalletRow = function(typeContainer) {
		var Column1 = _.compose(rowParts.wrapTd, _.partial(rowParts.RadioButton, typeContainer)),
			Column2 = function(typeName) {
				return $('<td>')
					.addClass('textae-editor__type-pallet__entity-type__label')
					.attr('label', typeName)
					.text(typeName);
			},
			Column3 = _.compose(rowParts.wrapTd, rowParts.Link, typeContainer.getUri);

		return typeContainer.getSortedNames().map(function(typeName) {
			var $column1 = new Column1(typeName);
			var $column2 = new Column2(typeName);
			var $column3 = new Column3(typeName);

			return $('<tr>')
				.addClass('textae-editor__type-pallet__entity-type')
				.css({
					'background-color': typeContainer.getColor(typeName)
				})
				.append([$column1, $column2, $column3]);
		});
	};

module.exports = function() {
	var emitter = require('../util/extendBindable')({}),
		$pallet = new Pallet(emitter),
		show = function() {
			var reuseOldPallet = function($pallet) {
					var $oldPallet = $('.textae-editor__type-pallet');
					if ($oldPallet.length !== 0) {
						return $oldPallet.find('table').empty().end().css('width', 'auto');
					} else {
						// Append the pallet to body to show on top.
						$("body").append($pallet);
						return $pallet;
					}
				},
				appendRows = function(typeContainer, $pallet) {
					return $pallet.find("table")
						.append(new PalletRow(typeContainer))
						.end();
				},
				setMaxHeight = function($pallet) {
					// Show the scrollbar-y if the height of the pallet is same witch max-height.
					if ($pallet.outerHeight() + 'px' === $pallet.css('max-height')) {
						return $pallet.css('overflow-y', 'scroll');
					} else {
						return $pallet.css('overflow-y', '');
					}
				},
				show = function($pallet, typeContainer, point) {
					if (typeContainer && typeContainer.getSortedNames().length > 0) {
						var fillPallet = _.compose(setMaxHeight, _.partial(appendRows, typeContainer), reuseOldPallet);

						// Move the pallet to mouse.
						fillPallet($pallet)
							.css(point)
							.show();
					}
				};

			return show;
		}();

	return _.extend(emitter, {
		show: _.partial(show, $pallet),
		hide: $pallet.hide.bind($pallet)
	});
};