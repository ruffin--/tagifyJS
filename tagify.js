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

        // function _domElementFromHtmlString(htmlString, tagType) {
        //     var elemReturn;

        //     tagType = tagType || "span";
        //     elemReturn = document.createElement(tagType);
        //     elemReturn.innerHTML = htmlString;
        //     return elemReturn;
        // }

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

        // http://stackoverflow.com/a/5898748/1028230
        function hasClass(element, cls) {
            return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
        }

        // NOTE: If the selector passed is a string, note that what makes it match
        // that selector is probably blasted by the conversion to a tagify-me widget.
        // You'll want to put an id on any inputs you want to reference.
        function _tagify(options)  {
            var tagifyInstance = [],
                divParent, inputHidden, inputText, ulTags,
                elementsToTagify,
                tagHost,
                strOldCss,
                aTagValues,
                i, j, id;

            //-----------------------------------------------------
            // Add instance methods and properties.
            //-----------------------------------------------------
            tagifyInstance.options = options;

            tagifyInstance.fnRemoveTagEventHandler = function (el) {
                var listItem, tagUL, itemValue;

                listItem = el.currentTarget.parentElement;
                tagUL = listItem.parentElement;
                itemValue = listItem.innerHTML;
                itemValue = itemValue.substr(0, itemValue.indexOf("<a"));

                _removeTagEngine(tagUL, itemValue);
                el.preventDefault();
            };

            tagifyInstance.addItem = function (elemInput, strItemContents)   {
                var listItem, tagUL, hidden, cleanedVal, anchorX;

                if (elemInput && elemInput.parentElement)   {
                    tagUL = elemInput.parentElement.querySelector(".tagify-me-ul");
                    hidden = elemInput.parentElement.querySelector(".tagify-me-hidden");

                    // Instead of deduping, I'm cheating by removing the new value
                    // if it already exists.
                    // TODO: Not horribly efficient, natch.
                    _removeTagEngine(tagUL, strItemContents);

                    if (tagUL)    {
                        listItem = document.createElement("li");
                        listItem.className = "tagify-me-li";
                        listItem.appendChild(document.createTextNode(strItemContents));

                        if (!tagifyInstance.options.displayOnly)  {
                            anchorX = document.createElement("a");
                            anchorX.className = "tagify-me-a";
                            anchorX.href = "X";
                            anchorX.appendChild(document.createTextNode("x"));
                            anchorX.addEventListener("click", tagifyInstance.fnRemoveTagEventHandler);

                            listItem.appendChild(anchorX);
                        }
                        tagUL.appendChild(listItem);

                        cleanedVal = strItemContents.replace(/,/gi, "###");
                        hidden.value = hidden.value ? hidden.value + "," + cleanedVal : cleanedVal;
                    }   else    {
                        _err("Unable to find an associated TagifyJS tag list.");
                    }
                }   else    {
                    _err("Unable to traverse expected TagifyJS DOM elements.");
                }
            };

            tagifyInstance.fnNewTagInputKeyPress = function (e) {
                if (13 === event.keyCode)   {
                    tagifyInstance.addItem(e.target, e.target.value);
                    e.target.value = "";
                    e.preventDefault();
                }
            };

            tagifyInstance.getValue = function (specificInputName)    {
                var k, allHiddenInputs,
                    specificInput,
                    payload = [];

                if (specificInputName)  {
                    specificInput = document.getElementById(specificInputName);
                    allHiddenInputs = specificInput ? [specificInput] : [];
                }   else    {
                    allHiddenInputs = document.getElementsByClassName("tagify-me-hidden");
                }

                // Strip everything but id and value for each input.
                for (k=0; k < allHiddenInputs.length; k++)    {
                    // TODO: Potentially ignore displayOnly tagifies.
                    payload.push({
                        id: allHiddenInputs[k].id,
                        value: allHiddenInputs[k].value
                    });
                }

                // TODO: I'm not sure if this makes things easier to use. If you unexpectedly
                // have more than one Tagify on the DOM, this could really bork code expecting
                // a single value.
                // return 1 === payload.length ? payload[0].value : payload;
                // Let's start by doing it iff there's a specific input defined...
                return specificInputName && 1 === payload.length ? payload[0].value : payload;
            };
            //-----------------------------------------------------
            //-----------------------------------------------------


            if (!_domContentLoaded)  {
                _domDelayedSelectors.push(tagifyInstance.options);
            }   else    {
                _createInternalCSS();

                elementsToTagify = document.querySelectorAll(tagifyInstance.options.selector);

                for (i=0; i<elementsToTagify.length; i++)   {
                    tagHost = elementsToTagify[i];

                    // TODO: Consider marking each tagify-me element with a common
                    // class and just checking for that here.
                    if (hasClass(tagHost, "tagify-me-div") || hasClass(tagHost, "tagify-me-hidden"))    {
                        // TODO: Pass back the parent div if it's the hidden input.
                        tagifyInstance.push(tagHost);
                    }   else    {
                        strOldCss = tagHost.className;
                        aTagValues = [];

                        id = "tagifyMe_" + new Date().getTime();

                        if (tagHost.tagName === "INPUT" && tagHost.type === "text")    {
                            id = tagHost.id || id;
                            aTagValues = tagHost.value.split(',');
                        }

                        // Set up the Tagify UI elements.
                        divParent = document.createElement("div");
                        divParent.className = "{1} tagify-me-div".format(strOldCss);

                        inputHidden = document.createElement("input");
                        inputHidden.type = "hidden";
                        inputHidden.className = "tagify-me-hidden";
                        inputHidden.id = id;
                        divParent.appendChild(inputHidden);

                        if (!tagifyInstance.options.displayOnly)    {
                            inputText = document.createElement("input");
                            inputText.type = "text";
                            inputText.className = "tagify-me-text";
                            inputText.addEventListener("keypress", tagifyInstance.fnNewTagInputKeyPress);
                            divParent.appendChild(inputText);
                        }

                        ulTags = document.createElement("ul");
                        ulTags.className = "tagify-me-ul";
                        divParent.appendChild(ulTags);

                        tagHost.parentElement.replaceChild(divParent, tagHost);
                        for (j=0; j<aTagValues.length; j++) {
                            if (aTagValues[i])  {
                                tagifyInstance.addItem(inputHidden, aTagValues[j].replace(/###/g, ","), tagifyInstance.options);
                            }
                        }
                        tagifyInstance.push(divParent);
                    }
                }

            }
            return tagifyInstance;
        }

        TagifyJS = function (options)    {
            options = {
                selector: options.selector || ".tagify-me",
                displayOnly: options.displayOnly
            };

            return _tagify(options);
        };

        // This is to make JSLint happy, which wants Pascal-cased functions to be constructors.
        TagifyJS.init = function (options)    {
            return _tagify(options);
        };

        document.addEventListener("DOMContentLoaded", function() {
            var i;

            _domContentLoaded = true;
            for (i=0; i < _domDelayedSelectors.length; i++)    {
                _tagify(_domDelayedSelectors[i]);
            }
            _domDelayedSelectors = [];
        });
    }());
}