/*global TagifyJS:true */
//=====================================================================
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//=====================================================================

// http://stackoverflow.com/a/5077091/1028230
String.prototype.format = String.prototype.format || function () {
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
        if (m === "{{") { return "{"; }
        if (m === "}}") { return "}"; }
        return args[n];
    });
};

if (window.TagifyJS)   {
    window.alert("TagifyJS has detected a namespace collision and either has already "
        + "loaded or should not load.");
}   else    {

    TagifyJS = {};

    // Start working within a closure. We'll expose what we want to
    // by attaching to the global `TagifyJS` later.
    (function () {
        var _createdCSS = false,
            _domContentLoaded = false,
            _domDelayedSelectors = [];


        function _err(strMsg)   {
            window.alert("TagifyJS Error: " + strMsg);
        }

        function _domElementFromHtmlString(htmlString, tagType) {
            var elemReturn;

            tagType = tagType || "span";
            elemReturn = document.createElement(tagType);
            elemReturn.innerHTML = htmlString;
            return elemReturn;
        }

        function _createInternalCSS()   {
            if (!_createdCSS)   {
                var styleElem, styleContents = "";

                styleElem = document.createElement('style');
                styleElem.type = 'text/css';

                styleContents += '.tagify-me-li {'
                    // + 'display: inline;'
                    + 'float:left;'
                    + 'list-style-type: none;'

                    + 'padding: 6px 10px 8px 8px;'
                    + 'background-color: rgb(195,235,250);'
                    + 'color: rgb(15, 65, 90);'
                    + 'border-radius: 8px;'
                    + 'margin:4px'
                + '}';

                styleContents += '.tagify-me-ul {'
                    + "display:block;"
                    + 'text-decoration: none;'
                    + 'color: rgb(5, 120, 175);'
                    + 'margin-left: 3px;'
                    + 'padding:0px;'
                + '}';

                styleContents += '.tagify-me-a    {'
                    + 'margin: 0px 0px 0px 6px;'
                    + 'padding: 0;'
                    + 'color:blue;'
                    + 'text-decoration:none;'
                    + 'list-style-type: none;'
                + '}';

                styleContents += '.tagify-me-div    {'
                    + 'display:inline-block;'
                + '}';

                styleElem.innerHTML = styleContents;
                document.getElementsByTagName('head')[0].appendChild(styleElem);
                _createdCSS = true;
            }
        }

        function _removeTagEngine(tagUL, valueToRemove)  {
            var i,
                reEndsMatch, reMiddleMatch,
                valueSansComma,
                hiddenInput, allListItems, itemValue;

            valueSansComma = valueToRemove.replace(/,/g, "###");

            //------------------------------------------------------------------------
            // First, remove this value from the hidden input element's value.
            //------------------------------------------------------------------------
            hiddenInput = tagUL.parentElement.querySelector(".tagify-me-hidden");

            // We could either cheat and put commas at the beginning and end of the values
            // (,1,2,3,) or use a regexp with begin (^) and end ($) OR checks. We're doing
            // the second for now.
            reEndsMatch = new RegExp("^" + valueSansComma + ","
                + "|"
                + "," + valueSansComma + "$"
            , "g");
            reMiddleMatch = new RegExp("," + valueSansComma + ",", "g");

            hiddenInput.value = hiddenInput.value.replace(reEndsMatch, "").replace(reMiddleMatch, ",");

            //------------------------------------------------------------------------
            // Now update UI to remove this value.
            //
            // TODO: Consider checking for a match, and if none, skip the UI update.
            // I'm going to be overly defensive for now and do both, no matter what,
            // though at serious scale that's crazy insane.
            //------------------------------------------------------------------------
            allListItems = tagUL.querySelectorAll("li");

            for (i=0; i < allListItems.length; i++) {
                itemValue = allListItems[i].innerHTML.substr(0, allListItems[i].innerHTML.lastIndexOf("<a"));
                if (itemValue === valueToRemove)    {
                    tagUL.removeChild(allListItems[i]);
                }
            }
        }

        function fnRemoveTagEventHandler(el) {
            var listItem, tagUL, itemValue;

            listItem = el.currentTarget.parentElement;
            tagUL = listItem.parentElement;
            itemValue = listItem.innerHTML;
            itemValue = itemValue.substr(0, itemValue.indexOf("<a"));

            _removeTagEngine(tagUL, itemValue);
        }

        function fnAddRemoveTagEventHandler(anchor) {
            anchor.removeEventListener("click", fnRemoveTagEventHandler); // Remove if exists so that we don't double up the event handlers listening.
            anchor.addEventListener("click", fnRemoveTagEventHandler);
        }

        function _addItem(elemInput, strItemContents, readOnly)   {
            var listItem, tagUL, hiddenInput, cleanedVal;

            if (elemInput && elemInput.parentElement)   {
                tagUL = elemInput.parentElement.querySelector(".tagify-me-ul");
                hiddenInput = elemInput.parentElement.querySelector(".tagify-me-hidden");

                // Instead of deduping, I'm cheating by removing the new value
                // if it already exists.
                // TODO: Not horribly efficient, natch.
                _removeTagEngine(tagUL, strItemContents);

                if (tagUL)    {
                    listItem = document.createElement("li");
                    listItem.className = "tagify-me-li";
                    listItem.innerHTML = strItemContents;
                    if (!readOnly)  {
                        listItem.innerHTML += '<a href="#" class="tagify-me-a">x</a>';
                    }
                    tagUL.appendChild(listItem);

                    cleanedVal = strItemContents.replace(/,/gi, "###");
                    hiddenInput.value = hiddenInput.value ? hiddenInput.value + "," + cleanedVal : cleanedVal;

                    // TODO: Insane overkill. Consider create the "a" with createElement
                    // and putting the event handler on only each new anchor element here.
                    [].forEach.call(document.getElementsByClassName("tagify-me-a"), fnAddRemoveTagEventHandler);
                }   else    {
                    _err("Unable to find an associated TagifyJS tag list.");
                }
            }   else    {
                _err("Unable to traverse expected TagifyJS DOM elements.");
            }
        }

        function fnNewTagInputKeyPress(e) {
            if (13 === event.keyCode)   {
                _addItem(e.target, e.target.value);
                e.target.value = "";
                e.preventDefault();
            }
        }

        function fnAddNewTagInputKeyPress(txt) {
            txt.removeEventListener("keypress", fnNewTagInputKeyPress); // Remove if exists so that we don't double up the event handlers listening.
            txt.addEventListener("keypress", fnNewTagInputKeyPress);
        }

        // http://stackoverflow.com/a/5898748/1028230
        function hasClass(element, cls) {
            return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
        }

        // NOTE: If the selector passed is a string, note that what makes it match
        // that selector is probably blasted by the conversion to a tagify-me widget.
        // You'll want to put an id on any inputs you want to reference.
        function _tagify(options)  {
            var returnVal = [],
                strExposedInput,
                elementsToTagify,
                tagHost,
                strOldCss,
                aTagValues,
                hiddenInput,
                mainTemplate,
                newElem,
                i, j, id;

            _createInternalCSS();

            strExposedInput = options.displayOnly ? '' : '<input type="text" id={0}_text" class="tagify-me-text" />';

            mainTemplate = '<div class="{1} tagify-me-div">'
                // + '<input type="text" id="{0}" class="tagify-me-hidden" style="color:red">'
                + '<input type="hidden" id="{0}" class="tagify-me-hidden" />'
                + strExposedInput
                + '<ul id="{0}_ul" class="tagify-me-ul"></ul>'
                + '</div>';

            elementsToTagify = document.querySelectorAll(options.selector);

            for (i=0; i<elementsToTagify.length; i++)   {
                tagHost = elementsToTagify[i];

                // TODO: Consider marking each tagify-me element with a common
                // class and just checking for that here.
                if (hasClass(tagHost, "tagify-me-div") || hasClass(tagHost, "tagify-me-hidden"))    {
                    // TODO: Pass back the parent div if it's the hidden input.
                    returnVal.push(tagHost);
                }   else    {
                    newElem = undefined;
                    strOldCss = tagHost.className;
                    aTagValues = [];

                    id = "tagifyMe_" + new Date().getTime();

                    if (tagHost.tagName === "INPUT" && tagHost.type === "text")    {
                        id = tagHost.id || id;

                        aTagValues = tagHost.value.split(',');
                    }

                    newElem = _domElementFromHtmlString(mainTemplate.format(id, strOldCss));
                    hiddenInput = newElem.getElementsByClassName("tagify-me-hidden")[0];

                    // tagHost.outerHTML = htmlContent; // Unfortunately, you can't just set the outerHTML for [some?] elements.
                    tagHost.parentElement.replaceChild(newElem, tagHost);
                    for (j=0; j<aTagValues.length; j++) {
                        if (aTagValues[i])  {
                            _addItem(hiddenInput, aTagValues[j].replace(/###/g, ","), options.displayOnly);
                        }
                    }
                    returnVal.push(newElem);
                }
            }

            [].forEach.call(document.getElementsByClassName("tagify-me-text"), fnAddNewTagInputKeyPress);

            return returnVal;
        }

        document.addEventListener("DOMContentLoaded", function() {
            var i;

            _domContentLoaded = true;
            for (i=0; i < _domDelayedSelectors.length; i++)    {
                _tagify(_domDelayedSelectors[i]);
            }
            _domDelayedSelectors = [];
        });

        TagifyJS = function (options)    {
            var returnVal;

            options = {
                selector: options.selector || ".tagify-me",
                displayOnly: options.displayOnly
            };

            if (_domContentLoaded)  {
                returnVal = _tagify(options);
            }   else    {
                // NOTE: This is why we can't add methods, etc for the return value in _tagify().
                _domDelayedSelectors.push(options);
                returnVal = [];
            }
            returnVal.options = options;

            return returnVal;
        };

        TagifyJS.getValue = function (specificInputName)    {
            var i, allHiddenInputs,
                specificInput,
                payload = [];

            if (specificInputName)  {
                specificInput = document.getElementById(specificInputName);
                allHiddenInputs = specificInput ? [specificInput] : [];
            }   else    {
                allHiddenInputs = document.getElementsByClassName("tagify-me-hidden");
            }

            // Strip everything but id and value for each input.
            for (i=0; i < allHiddenInputs.length; i++)    {
                // TODO: Potentially ignore displayOnly tagifies.
                payload.push({
                    id: allHiddenInputs[i].id,
                    value: allHiddenInputs[i].value
                });
            }

            // TODO: I'm not sure if this makes things easier to use. If you unexpectedly
            // have more than one Tagify on the DOM, this could really bork code expecting
            // a single value.
            // return 1 === payload.length ? payload[0].value : payload;
            // Let's start by doing it iff there's a specific input defined...
            return specificInputName && 1 === payload.length ? payload[0].value : payload;
        };
    }());
}