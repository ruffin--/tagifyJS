//=====================================================================
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//=====================================================================

// Not exactly a polyfill; more a port of C#'s String.format
// http://stackoverflow.com/a/5077091/1028230
String.prototype.format = String.prototype.format || function () {
    var args = arguments;
    return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
        if (m === "{{") { return "{"; }
        if (m === "}}") { return "}"; }
        return args[n];
    });
};

var TagifyJS = {};

(function () {
    var _createdCSS = false,
        _domContentLoaded = false,
        _domDelayedSelectors = [];

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

    function _tagify(objSelector)  {
        var elementsToTagify,
            tagHost,
            aTagValues,
            mainTemplate,
            liTemplate,
            liContents,
            fnAddClickHandler,
            newElem,
            i, j, id;

        _createInternalCSS();

        fnAddClickHandler = function (el) {
            el.addEventListener("click", function (el) {
                var listItem, unorderedList;

                listItem = el.currentTarget.parentElement;
                unorderedList = listItem.parentElement;

                unorderedList.removeChild(listItem);

                // if (console && console.log) {
                //     console.log("clicked: " + i + " " + el.currentTarget.innerHTML);
                // }
            });
        };

        mainTemplate = '<div class="tagify-me-div"><input type="hidden" id="{0}">'
            + '<ul id="{0}_ul" class="tagify-me-ul">{1}</ul>'
            + '</div>';
        liTemplate = '<li class="tagify-me-li">{0}'
            + '<a href="#" class="tagify-me-a">x</a></li>';

        elementsToTagify = document.querySelectorAll(".tagify-me");

        for (i=0; i<elementsToTagify.length; i++)   {
            tagHost = elementsToTagify[i];

            liContents = '';
            newElem = undefined;

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

            newElem = _domElementFromHtmlString(mainTemplate.format(id, liContents));

            // tagHost.outerHTML = htmlContent; // Unfortunately, you can't just set the outerHTML for [some?] elements.
            tagHost.parentElement.replaceChild(newElem, tagHost);

        }

        [].forEach.call(document.getElementsByClassName("tagify-me-a"), fnAddClickHandler);
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
        if (_domContentLoaded)  {
            _tagify(objSelector);
        }   else    {
            _domDelayedSelectors.push(objSelector);
        }
    };
}());