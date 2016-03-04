##tagifyJS

tagifyJS is a zero dependency, plain JavaScript library to help you make those nifty keen tag add/delete UIs folks seem to think StackOverflow made famous.

With tagifyJS, you include one JavaScript file and *you're done*. No jQuery or other dependencies necessary.

##Compatibility

tagifyJS expects Internet Explorer 9 or greater. *It should not work with IE8.* Supporting IE8 is possible, but I'm making the call. After supporting it for *years*, it's dead to me. Unless enough folk open issues related to IE8. *And* even then...

##Quick Usage - Invoking

The quickest way to create an editable tag list is to insert one or more text inputs with the class `tagify-me` assigned.

    <input class="tagify-me my-class" type="text" value="123,234" />

The value of the text input will be taken as a comma separated values list by tagifyJS, with one tag created for each value in the list after invocation. 

In this simplest case, tagifyJS is invoked as follows:

    tagifyJS();

The display will look similar to the following:

<img alt="insert alt text" src="http://i.imgur.com/3xDSBOb.png" style="display:block;margin:0 auto;" />

Again, [iff](https://en.wikipedia.org/wiki/If_and_only_if) no parameters are used in the `tagifyJS` invocation, any item with the `tagify-me` class applied will be turned into a tags widget.*

##Quick Usage - Retrieving Values

Getting tag values is pretty straightforward. If the original text input had an id, it can be retrieved just like it could be from the original text input, as it's now in a hidden element by the same id.

For example, if this source is used...

    <input class="tagify-me" type="text" id="tags" value="91011,121314" />

... it is possible to retrieve the values from tags through...

    document.getElementById("tags").value;

This will return the value of the tags as a comma separated list of values, in this case, if no edits were made, `"91011,121314"`.

It is also possible to use standard tagifyJS syntax as follows:

    tagifyJS().getValues();

This will return an array of JSON-esque objects with `id` and `value` properties for each tagifyJS instance that matches the selector argument passed. In this case, as there is no argument, the default, `.tagify-me` is used. 

If both of the above `input`s were invoked with tagifyJS and no edits made, the following object model will be returned:

    [
        {
        	"id": "tagifyMe_1457125663162",
        	"value": "123,234"
        }, {
        	"id": "tags",
        	"value": "91011,121314"
        }
    ]

Note the generated `id` in the first value set, as the original input had no id specified.

>**NOTE:** Items that have commas in their values will have those commas replaced by three hash symbols. That is, if the following tags were visible...

<img alt="tagifyJS widget with one value containing a comma" src="http://i.imgur.com/aSr4EwS.png" style="display:block;margin:0 auto;" />

> ... the `value` for this widget would be `"123,234,abc###def"`.
> 
> Unfortunately, any values containing `###` will currently be misreported as extra items.


##Generated Source

The source that will be produced for the first `input` sample, above, is as follows:

    <div class="my-class tagify-me-div">
        <input type="hidden" class="tagify-me-hidden tagify-me"
            id="tagifyMe_1457124509011" value="123,234">
        <input type="text" class="tagify-me-text">
        <ul class="tagify-me-ul">
            <li class="tagify-me-li">123<a class="tagify-me-a" href="X">x</a></li>
            <li class="tagify-me-li">234<a class="tagify-me-a" href="X">x</a></li>
        </ul>
    </div>

Note a few things...  

1. Additional, non-selector classes from the original text input are retained in the parent `div`.
2. Any `id` on the original text input will be moved to the `hidden` input in the generated source.
3. The single text input was turned into three html tags.
    1. A hidden input with the selector classes used to identify tagifyJS candidates, here the default, `tagify-me`.
        1. Note that the `id` for this element was not given in the initial input.
        2. The `id` value given here is made up of "tagifyMe_" plus a number based on a timestamp.
    2. A text input that's used to add new tag values to the tagifyJS display
        1. Values are inserted by hitting "return" inside of the text input.
        2. Duplicate values added will result in the earlier copy being removed as the new one is added.
    3. An unordered list with stylized tags for each `li` tag.

##Options

Currently supported options are pretty sparse, and are inserted as a single argument in the initial `tagifyJS` call. If a string is passed instead, it will be used to create the `selector` property in an otherwise empty options object.

    tagifyJS(".another-class");

This will invoke tagifyJS on any text input with the class `another-class` applied.

So too will the following:

    tagifyJS({
        selector: ".another-class"
    });

Other options include `displayOnly`, which, when set to truthy, will reasonably ensure the tags are read-only, and `onChange`, which takes a function that will be called when values are added to or removed from a tagifyJS widget.

Example:

    tagifyJS({
        selector: ".another-class",
        displayOnly: true,
        onChange: function() {
            utils.logit('change'); 
        }
    });

`displayOnly`, when truthy, will cause the tags to display without the text input or with the "x" to remove a tag.

<img alt="display only" src="http://i.imgur.com/mzMoi9t.png" style="display:block;margin:0 auto;" />

`onChange` will be passed three parameters:

1. An object with information about the action being performed.
    1. `action`
        * A string. 
        * Will either be "add" or "remove", depending on the action.
    2. `value`
        * A string.
        * Will be the value of the tag being removed or added.
2. The event being handled during the change
    * Will be a keyboard event when adding a new item.
    * MouseEvent, at least in Chrome, even when a link is "clicked", either by clicking, or by moving focus to the link with tab and Enter pressed.
3. The single tagifyJS instance which is experiencing the event.

More nifty spiffy keen features to come, like the ability to easily send along style rules for the tags.

##License: Mozilla Public License

All files in the project are released under Mozilla Public License, also known as the MPL, [version 2](https://www.mozilla.org/en-US/MPL/2.0/). Though recall you only need tagify.js to run tagifyJS!

    //=====================================================================
    // This Source Code Form is subject to the terms of the Mozilla Public
    // License, v. 2.0. If a copy of the MPL was not distributed with this
    // file, You can obtain one at http://mozilla.org/MPL/2.0/.
    //=====================================================================

##Need Help? Have a Feature Request?

Open an issue!

Thanks for reading.

---

\* Okay, okay, that's a small lie. If you use `tagifyJS(".tagify-me")`, the behavior's the same as the default when no arguments are used. You could even use `tagifyJS({ selector: ".tagify-me"})` and have it do the same thing, so that high falutin' "iff" usage was bogus.