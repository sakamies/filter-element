# Code golf search filter

Where I try to have the browser do all the work for me.

I'm using plain old css to do the filtering. I mean I build a selector to find matches to a search query and apply the selector to a &lt;style&gt; element. No iteration of any elements in javascript necessary. You might want to inform users of the number of matches, so there's an optional callback to get the number of matches.

Works for most inputs, but checkboxes don't work well yet.

In the example code, the search index is built with javascript. Search indexing should be rendered into the html already from the server, but this bit of javascript is to illustrate building a search index so I don't have to hand code it into this example.

Would it be more performant to have some separate search index and set the hidden attribute on the searched items or something like that? I don't know, maybe, but this feels more browsery and browsers are super optimized for css!