# Code golf search filter

Where I try to have the browser do all the work for me.

The search index is built via javascript. It could come from the server in the html markup as attributes already, but that would involve escaping anything that gets put into attributes and that would mean having to html escape search words and then css escape them also. With javascript, it's safe to put any string into an attribute, and css matching against it will work just fine.

I'm using plain old css to do the filtering. I mean I build a selector and apply it to a &lt;style&gt; element. No iteration of any elements in javascript at all after building the search index.

Would it be more performant to cache the textContent of nodes in an array or something like that, then search from that index and set inline styles based on matches? I don't know, maybe, but this feels more browsery and browsers are super optimized for css!
