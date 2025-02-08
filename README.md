# A custom element for filtering a list of elements based on a form

Example usage. And yeah nothing's missing, this example works as is without any config. More elaborate example usage and available attributes are in `index.html` and `filter.js`.

```
<script>
  import { Filter } from '/filter.js'
  customElements.define('my-filter', Filter);
</script>

<form>
  <label for="search">Fuzzy words search</label>
  <input id="search" name="search" type="search">
</form>

<my-filter>
  <div>Thing 1 <span my-filter-search>search term</span></div>
  <div>Thing 2 <span my-filter-search>other term</span></div>
</my-filter>
```
