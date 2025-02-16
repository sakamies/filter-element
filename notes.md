## TODO

- Gather all matches with :is(attrshere) and send them along with the found elements, so users of the element can highlight the matches any way they want.

- `case-sensitive` or `match-case` attribute? because now the search is not case sensitive.

- Finds matches by substring. I had :exact and :fuzzy flags, but decided to take them out until I figure out how matching should be configured. :not is still here though.

----

## Notes

I don't like setting flags on the name attribute like the name="search:not". I could use form.elements instead of FormData so I could read attributes on the form elements. On the other hand with flags in the name, the flags will go to the server also on submit. Having flags in the name would keep symmetry with everything that's available to filter.js and the server on submit.

Flags could maybe be on the index attributes themselves? Like `filter--search:not="value"`

Filter event is async. Max 20fps by default. Plenty often for user input, but hopefully won't grind to a halt if the user pounds their keyboard on a large dataset. Static property because I don't expect it to be customized much, but so it can still be set before instantiating an element if needed.

Since the filter is not searching based on `element.dataset` (or looping the dom contents in any other way), the attribute name is the tag name like `<div filter--search>` instead of `<div data-filter--search>`. A little bit less noisy to read and dashed attributes that are the same as the element name sounds rather safe, since the author should be the one naming the element per project anyway. Not as idiomatic as data-attributes, but this makes the examples and code little bit more understandable I think.