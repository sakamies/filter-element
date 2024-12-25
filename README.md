# Code golf search filter

Where I try to have the browser do all the work for me.

I'm using plain old (newly baseline) css to do the filtering. I mean I build a selector to find matches to a search query and apply the selector to a &lt;style&gt; element. No iteration of any elements in javascript necessary. You might want to inform users of the number of matches, so there's an optional callback to get the number of matches.

This is an excersise in using native DOM scripting and CSS, so I'm making some assumptions about the use of html.

- Inputs need to be inside a form element.
- Forms and inputs must have a name attribute.
- Only string matching, numeric inputs will be compared a strings.

In the example code, the search index is built with javascript. Search indexing should be rendered into the html already from the server, but this bit of javascript is to illustrate building a search index so I don't have to hand code it into this example.