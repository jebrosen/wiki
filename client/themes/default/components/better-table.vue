<!--
BetterTable Vue.js component - sorting and filtering of <table> contents

Written in 2021 by Jeb Rosen <jeb.rosen@isbscience.org>

To the extent possible under law, the author(s) have dedicated all copyright and
related and neighboring rights to this software to the public domain worldwide.
This software is distributed without any warranty.

You should have received a copy of the CC0 Public Domain Dedication along with
this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
-->

<template lang="pug">
  table.better-table
    tr
      th(v-for='(column, colIndex) in data.columns')
        | {{column}}
        button(v-on:click='changeSort(column)')
          | {{ sortBy === column ? (sortDir === 1 ? "⬇" : "⬆") : "↕" }}
        select(v-if='shouldFilter(colIndex)' v-on:change='changeFilter(colIndex, $event.target.value)')
          option(value='<Any>')
            | &lt;Any&gt;
          option(v-for='value in data.uniqueValues[colIndex]' v-bind:value='value')
            | {{value}}
    tr(v-for='row in visibleRows')
      td(v-for='cell in row')
        template(v-if='cell.html')
          //- This usage of v-html is safe because the same html was already
          //- present elsewhere on the page (and has already been sanitized
          //- etc. by the rendering pipeline)
          span(v-html='cell.html')
        template(v-else)
          | {{cell.text}}
</template>

<script>

// At runtime, this component extracts the contents of the indicated <table>,
// deletes it, and renders the data with the above template instead. This strategy
// was chosen to avoid adding a backend rendering step.
function extractData(table) {
  const columns = [];
  const rows = [];
  const uniqueValues = [];

  table.querySelectorAll("tr").forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // header row
      row.querySelectorAll("th, td").forEach(td => {
        columns.push(td.innerText);
        uniqueValues.push([]);
      });
    } else {
      const cells = [];
      row.querySelectorAll("th, td").forEach((td, colIndex) => {
        let text = td.innerText;
        let values;
        let html = null;
        // Don't want to mess up e.g. hyperlinks by splitting them;
        // for a simple heuristic any cell with child HTML elements
        // is assumed to be HTML.
        if (td.children.length > 0) {
          values = [text];
          html = td.innerHTML;
        } else {
          // split by commas,
          // ignore any empty values appearing in the middle of the cell
          // (probably due to extraneous commas)
          values = text.split(/\s*,\s*/).filter(v => v.length > 0);
        }

        // if no other values were present, treat as a single empty value
        // (convenient for filtering to 'blank' rows)
        if (values.length === 0) {
          values.push('');
        }

        values.forEach(v => {
          if (uniqueValues[colIndex].indexOf(v) === -1) {
            uniqueValues[colIndex].push(v);
          }
        });
        cells.push({ text, values, html });
      });
      rows.push(cells);
    }
  });

  table.style.display = 'none';

  uniqueValues.forEach(v => v.sort());

  return { columns, uniqueValues, rows };
}

export default {
  data () {
    return {
      'data': {},
      'sortBy': null,
      'sortDir': 1,
      'filters': [],
    };
  },
  props: ['for'],
  computed: {
    visibleRows() {
      const rows = [];

      if (!this.$data.data.rows) {
        return rows;
      }

      for (const row of this.$data.data.rows) {
        let visible = true;
        this.$data.filters.forEach(filter => {
          if (row[filter.colIndex].values.indexOf(filter.value) === -1) {
            visible = false;
          }
        })

        if (visible) {
          rows.push(row);
        }
      }

      if (this.$data.sortBy) {
        const sortByIdx = this.$data.data.columns.indexOf(this.$data.sortBy);
        if (sortByIdx !== -1) {
          rows.sort((a, b) => {
            const val1 = a[sortByIdx].text.toLowerCase();
            const val2 = b[sortByIdx].text.toLowerCase();

            const order = (val1 < val2)
              ? -1
              : (val1 > val2)
                ? 1
                : 0;

            return order * this.$data.sortDir;
          });
        }
      }

      return rows;
    }
  },
  methods: {
    changeSort (column) {
      if (this.$data.sortBy === column) {
        this.$data.sortDir *= -1;
      } else {
        this.$data.sortBy = column;
        this.$data.sortDir = 1;
      }
    },
    shouldFilter (colIndex) {
      if (this.$data.data.uniqueValues[colIndex].length <= 1) {
        // too few values for a filter
        return false;
      }
      if (this.$data.data.rows.length > 0 && (this.$data.data.uniqueValues[colIndex].length / this.$data.data.rows.length) > 0.8) {
        // almost as many filter values as there are total rows;
        // unlikely to be a useful filter
        return false;
      }
      return true;
    },
    changeFilter (colIndex, value) {
      const existingFilterIdx = this.$data.filters.findIndex(f => f.colIndex === colIndex);
      if (existingFilterIdx !== -1) {
        // 'unset' existing filter by deleting it
        this.$data.filters.splice(existingFilterIdx, 1);
      }

      if (value !== null && value !== '<Any>') {
        this.$data.filters.push({ colIndex, value });
      }
    }
  },
  mounted () {
    const table = document.querySelector("table." + this.$props.for);
    if (table) {
      const data = extractData(table);
      this.$data.data = data;
    } else {
      console.warn("Could not find table for better-table ('" + this.$props.for + ")'");
    }
  },
}
</script>

<style lang="scss">
.better-table select {
  max-width: 10em;
  -webkit-appearance: auto;
  -moz-appearance: auto;
  border-style: initial;
}

.better-table th {
  white-space: nowrap;
}
</style>

<!-- vim: set filetype=javascript et ts=2 sw=0 sts=-1 :-->
