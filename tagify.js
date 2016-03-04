/*global tagifyJS:true, utils:true */
//=====================================================================
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//=====================================================================

// NOTE: I believe this code intends to require IE9+ currently.
// Other contemporary "modern" browsers should be fine.

// http://stackoverflow.com/a/5077091/1028230
String.prototype.format = String.prototype.format || function () {
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
        if (m === "{{") { return "{"; }
        if (m === "}}") { return "}"; }
        return args[n];
    });
};

if (!window.utils)  {
    utils = {};
}

utils.logit = utils.logit || function (str) {
    if (console && console.log)     {
        console.log(str);
    }
};

if (window.tagifyJS)   {
    window.alert("tagifyJS has detected a namespace collision and either has already "
        + "loaded or should not load.");
}   else    {

    tagifyJS = {};

    // Start working within a closure. We'll expose what we want to
    // by attaching to the global `tagifyJS` later.
    (function () {
        var _createdCSS = false,
            _domContentLoaded = false,
            _domDelayedSelectors = [];

        // http://stackoverflow.com/a/9538602/1028230
        function _isFunction(x) {
            return x && Object.prototype.toString.call(x) === '[object Function]';
        }

        function _err(strMsg)   {
            window.alert("tagifyJS Error: " + strMsg);
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
                strOldCss, strCssForParent,
                astrSelectorParts, astrSelectorClasses,
                aTagValues,
                i, j, id;

            //-----------------------------------------------------
            // Add instance methods and properties.
            //-----------------------------------------------------
            tagifyInstance.options = options;

            tagifyInstance.fnRemoveTagEventHandler = function (el) {
                var listItem, tagUL, itemValue,
                    bCont = true;

                listItem = el.currentTarget.parentElement;
                tagUL = listItem.parentElement;
                itemValue = listItem.innerHTML;
                itemValue = itemValue.substr(0, itemValue.indexOf("<a"));

                if (_isFunction(tagifyInstance.options.onChange))   {
                    try {
                        bCont = !tagifyInstance.options.onChange({
                            action: "remove",
                            value: itemValue
                        }, el, tagifyInstance);
                    }   catch (ex)  {
                        window.alert("!!!! Illegal custom function call in tagifyJS remove tag handler.");
                        utils.logit(ex);
                    }
                }

                if (bCont)  {
                    _removeTagEngine(tagUL, itemValue);
                }


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
                        _err("Unable to find an associated tagifyJS tag list.");
                    }
                }   else    {
                    _err("Unable to traverse expected tagifyJS DOM elements.");
                }
            };

            tagifyInstance.fnNewTagInputKeyPress = function (e) {
                var bCont = true;

                if (13 === event.keyCode)   {
                    if (_isFunction(tagifyInstance.options.onChange))   {
                        try     {
                            bCont = !tagifyInstance.options.onChange({
                                action: "add",
                                value: e.target.value
                            }, e, tagifyInstance);
                        }   catch (ex)  {
                            window.alert("!!!! Illegal custom function call in tagifyJS add new value handler.");
                            utils.logit(ex);
                        }
                    }

                    if (bCont)  {
                        tagifyInstance.addItem(e.target, e.target.value);
                        e.target.value = "";
                    }
                    e.preventDefault();
                }
            };

            tagifyInstance.getValues = function (specificInputId)    {
                var allHiddenInputs,
                    hiddenInput,
                    specificInput,
                    payload = [];

                if (specificInputId && "string" === typeof specificInputId)  {
                    // Allow & clean CSS id selector style.
                    specificInputId  = 0 === specificInputId.indexOf("#")
                        ? specificInputId.substr(1)
                        : specificInputId;
                    specificInput = document.getElementById(specificInputId);
                    allHiddenInputs = specificInput ? [specificInput] : [];
                }   else     {
                    allHiddenInputs = document.querySelectorAll(tagifyInstance.options.selector);
                }

                // Strip everything but id and value for each input.
                for (hiddenInput in allHiddenInputs)    {
                    if (allHiddenInputs.hasOwnProperty(hiddenInput))    {
                        hiddenInput = allHiddenInputs[hiddenInput];
                        if (hiddenInput.id) {
                            payload.push({
                                id: hiddenInput.id,
                                value: hiddenInput.value
                            });
                        }
                    }
                }

                return payload;
            };

            // To be used when only one return value is expected, either from the
            // specificInputId or the original options.selector.
            // NOTE: Considered throwing an exception if this was called and mutliple
            // values were returned (payload.length > 1), but went with quieter
            // implementation.
            tagifyInstance.getValue = function (specificInputId)    {
                var payload = tagifyInstance.getValues(specificInputId);
                return payload.length ? payload[0].value : null;
            };

            // TODO: Add a means of using a subselector.
            // You could bullheadedly merge the results of a query with the original selector
            // with a subselector used here.
            tagifyInstance.setValue = function (value)  {
                var tagifyUL,
                    aNewValues = value.split(",");

                tagifyInstance.forEach(function (tagifyHiddenInput) {
                    tagifyHiddenInput.value = value;                                                            // set hidden input value.
                    tagifyHiddenInput.parentElement.getElementsByClassName("tagify-me-ul")[0].innerHTML = "";   // clear visible tag list
                    tagifyUL = tagifyHiddenInput.parentElement.getElementsByClassName("tagify-me-ul")[0];
                    aNewValues.forEach(function (splitVal)  {                                                   // use new value to create new tags.
                        if (splitVal)  {
                            tagifyInstance.addItem(tagifyUL, splitVal.replace(/###/g, ","), tagifyInstance.options);
                        }
                    });
                });
            };
            //-----------------------------------------------------
            // eo tagifyInstance methods.
            //-----------------------------------------------------

            function _cleanOldCss(o)  {
                var re = new RegExp(" " + o.slice(1) + " ", "g");
                strCssForParent = strCssForParent.replace(re, "");
            }

            function _addSelectorClasses(s) {
                inputHidden.className += s.slice(1) + " ";
            }

            if (!_domContentLoaded)  {
                _domDelayedSelectors.push(tagifyInstance.options);
            }   else    {
                _createInternalCSS();

                elementsToTagify = document.querySelectorAll(tagifyInstance.options.selector);
                astrSelectorParts = tagifyInstance.options.selector.split(" ");
                astrSelectorClasses = astrSelectorParts.filter(function (o) {
                    return 0 === o.indexOf(".");
                });

                for (i=0; i<elementsToTagify.length; i++)   {
                    tagHost = elementsToTagify[i];

                    // TODO: Consider marking each tagify-me element with a common
                    // class and just checking for that here.
                    if (hasClass(tagHost, "tagify-me-div") || hasClass(tagHost, "tagify-me-hidden"))    {
                        // TODO: Pass back the parent div if it's the hidden input.
                        tagifyInstance.push(tagHost);
                    }   else    {
                        strOldCss = tagHost.className || "";

                        aTagValues = [];

                        id = "tagifyMe_" + new Date().getTime();

                        if (tagHost.tagName === "INPUT" && tagHost.type === "text")    {
                            id = tagHost.id || id;
                            aTagValues = tagHost.value.split(',');
                        }

                        // Set up the Tagify UI elements.
                        divParent = document.createElement("div");
                        strCssForParent = " " + strOldCss + " ";
                        astrSelectorClasses.forEach(_cleanOldCss);
                        divParent.className = "{0} tagify-me-div".format(strCssForParent.trim());

                        inputHidden = document.createElement("input");
                        inputHidden.type = "hidden";
                        inputHidden.className = "tagify-me-hidden ";
                        astrSelectorClasses.forEach(_addSelectorClasses);
                        inputHidden.className = inputHidden.className.trim();

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
                            if (aTagValues[j])  {
                                tagifyInstance.addItem(inputHidden, aTagValues[j].replace(/###/g, ","), tagifyInstance.options);
                            }
                        }
                        tagifyInstance.push(divParent);
                    }
                }
            }
            return tagifyInstance;
        }

        // Going to explicitly cull non-supported options.
        function _cleanOptions(options) {
            options = options || ".tagify-me";
            if ("string" === typeof options)  {
                options = {
                    selector: options
                };
            }

            return {
                selector: options.selector || ".tagify-me",
                displayOnly: options.displayOnly,
                onChange: options.onChange
            };
        }

        tagifyJS = function (options)    {
            return _tagify(_cleanOptions(options));
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
