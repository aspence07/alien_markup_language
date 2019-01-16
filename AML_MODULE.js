var AMLTranslator = (function() {

	const TAG_REGEX = /<\/?\w+>/gi;

	const TRANSLATIONS = {
		'^%' : '<STRONG>',
		'^!%': '</STRONG>',
		'^~' : '<EM>',
		'^!~': '</EM>',
		'^*' : '<U>',
		'^!*': '</U>'
	};

	function isClosingTag(tag) {
		return tag.charAt(1) == '/';
	}

	function getTagName(tag) {
		if (isClosingTag(tag)) {
			var tagName = tag.substring(2, tag.length-1);
		} else {
			var tagName = tag.substring(1, tag.length-1);
		}
		return tagName;
	}

	function escapeRegExp(string) {
  		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/* replace aml tags with equivalent html tags */
	function replaceAmlTags(markup) {
		for (let amlTag in TRANSLATIONS) {

			let htmlTag = TRANSLATIONS[amlTag];

			let amlTagRegex = new RegExp( 
				escapeRegExp(amlTag), 'gi' );

			markup = markup.replace(amlTagRegex, htmlTag);
		}
		return markup;
	}

	/* find starting indices of tag matches */
	function findTagMatchIndices(markup) {
		let indices = [];
		let offset = 0;
		let index;
		while (markup.search(TAG_REGEX) != -1) {
			index = markup.search(TAG_REGEX);
			offset += index+1;
			indices.push(offset-1);
			markup = markup.substring(index+1, markup.length);
		}
		return indices;
	}

	/* generate replacement tag sequences */
	function generateReplacementTagSequences(tags, markup) {

		let replacementTags = tags.slice();

		let stack = [];

		for (let i = 0; i < tags.length; i++) {
			let tag = tags[i];
			if (isClosingTag(tag)) {
				let lastTag = stack[stack.length - 1];
				if (!lastTag) {
					continue;
				}

				let lastTagName = getTagName(lastTag);
				let tagName = getTagName(tag);
				if (lastTagName == tagName) {
					stack.pop();
				} else {
					let stackIndex = stack.length - 1;
					let addlTags = [];
					while (stackIndex >= 0) {
						let addlTag = stack[stackIndex];
						let addlTagName = getTagName(addlTag);
						if (addlTagName == tagName)
							break;
						addlTags.push(addlTag);
						stackIndex--;
					}

					let replacementTag = replacementTags[i];
					for (let j = addlTags.length - 1; j >= 0; j--) {
						let addlTag = addlTags[j];
						let addlTagClosing = "</" + addlTag.substring(1, addlTag.length);
						replacementTag = addlTagClosing + replacementTag + addlTag;
					}
					replacementTags[i] = replacementTag;
				}

			} else {
				stack.push(tag);
			}
		} // END for
		return replacementTags;
	}

	/* replace original tag sequences with syntactically-correct sequences */
	function replaceOriginalTagSequences(tags, replacementTags, markup) {

		let matchIndices = findTagMatchIndices(markup);

		for (let i = matchIndices.length - 1; i >= 0; i--) {
			let index = matchIndices[i];
			let originalTag = tags[i];

			let segment1 = markup.substring(0, index);
			let segment2 = markup.substring(index + originalTag.length, markup.length);

			let replacementTag = replacementTags[i];
			markup = segment1 + replacementTag + segment2;
		}

		return markup;
	}

	return {
		translate: function(input) {

			let markup = replaceAmlTags(input);

			let tags = markup.match(TAG_REGEX);
			if (!tags)
				return markup;

			let replacementTags = generateReplacementTagSequences(tags, markup);

			markup = replaceOriginalTagSequences(tags, replacementTags, markup);

			return markup;
		} // END function translate()
	} // END return {}

})();

if (module.exports) {
	module.exports = AMLTranslator;
}