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
            _domDelayedSelectors = [],
            liTemplate;

        liTemplate = '<li class="tagify-me-li">{0}'
            + '<a href="#" class="tagify-me-a">x</a></li>';

        function _err(strMsg)   {
            window.alert("TagifyJS Error: " + strMsg);
        }

        function _domElementFromHtmlString(htmlString) {
            var elemReturn = document.createElement('span');
            elemReturn.innerHTML = htmlString;
            return elemReturn;
        }

        function _createInternalCSS()   {
            if (!_createdCSS)   {
                var styleElem, styleContents = "";

                styleElem = document.createElement('style');
                styleElem.type = 'text/css';

                styleContents += '.tagify-me-li {'
                    + 'display: inline;'
                    + 'padding: 6px 10px 8px 8px;'
                    + 'background-color: rgb(195,235,250);'
                    + 'color: rgb(15, 65, 90);'
                    + 'border-radius: 8px;'
                    + 'margin:4px'
                + '}';

                styleContents += '.tagify-me-ul {'
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

                styleElem.innerHTML = styleContents;
                document.getElementsByTagName('head')[0].appendChild(styleElem);
                _createdCSS = true;
            }
        }

        function fnRemoveTagEventHandler(el) {
            var listItem, unorderedList;

            listItem = el.currentTarget.parentElement;
            unorderedList = listItem.parentElement;
            unorderedList.removeChild(listItem);
        }

        function fnAddRemoveTagEventHandler(anchor) {
            anchor.removeEventListener("click", fnRemoveTagEventHandler); // Remove if exists so that we don't double up the event handlers listening.
            anchor.addEventListener("click", fnRemoveTagEventHandler);
        }

        function _addItem(elemInput, strItemContents)   {
            var listItem, tagList;

            if (elemInput && elemInput.parentElement)   {
                tagList = elemInput.parentElement.querySelector("ul");
                if (tagList)    {
                    listItem = _domElementFromHtmlString(liTemplate.format(strItemContents));
                    tagList.appendChild(listItem);

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
                console.log("Add new tag");
                _addItem(e.target, "Testy");
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
        function _tagify(objSelector)  {
            var returnVal = [],
                elementsToTagify,
                tagHost,
                strOldCss,
                aTagValues,
                mainTemplate,
                liContents,
                newElem,
                i, j, id;

            objSelector = objSelector || ".tagify-me";

            _createInternalCSS();

            mainTemplate = '<div class="{2} tagify-me-div">'
                + '<input type="hidden" id="{0}" class="tagify-me-hidden">'
                + '<input type="text" id={0}_text" class="tagify-me-text" />'
                + '<ul id="{0}_ul" class="tagify-me-ul">{1}</ul>'
                + '</div>';

            elementsToTagify = document.querySelectorAll(objSelector);

            for (i=0; i<elementsToTagify.length; i++)   {
                tagHost = elementsToTagify[i];

                if (!hasClass(tagHost, "tagify-me-div"))    {

                    liContents = '';
                    newElem = undefined;
                    strOldCss = tagHost.className;

                    id = "tagifyMe_" + new Date().getTime();

                    if (tagHost.tagName === "INPUT" && tagHost.type === "text")    {
                        id = tagHost.id || id;

                        aTagValues = tagHost.value.split(',');
                        for (j=0; j<aTagValues.length; j++) {
                            if (aTagValues[i])  {
                                liContents += liTemplate.format(aTagValues[j].replace("$$$", ","));
                            }
                        }
                    }

                    newElem = _domElementFromHtmlString(mainTemplate.format(id, liContents, strOldCss));
                    returnVal.push(newElem);

                    // tagHost.outerHTML = htmlContent; // Unfortunately, you can't just set the outerHTML for [some?] elements.
                    tagHost.parentElement.replaceChild(newElem, tagHost);
                }
            }

            [].forEach.call(document.getElementsByClassName("tagify-me-a"), fnAddRemoveTagEventHandler);
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

        TagifyJS = function (objSelector)    {
            var returnVal;
            if (_domContentLoaded)  {
                returnVal = _tagify(objSelector);
            }   else    {
                _domDelayedSelectors.push(objSelector);
                returnVal = {};
            }

            returnVal.getValue = function ()    {
                console.log(typeof this);
            };

            return returnVal;
        };
    }());
}