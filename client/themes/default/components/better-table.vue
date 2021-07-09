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
        input(type='text' placeholder='Find...'
              v-on:input='changeFilter(colIndex, $event.target.value)')
    tr(v-for='row in visibleRows')
      td(v-for='cell in row')
        //- This usage of v-html is safe because the same html was already
        //- present in a table cell (and has already been sanitized
        //- etc. by the rendering pipeline)
        span(v-html='cell.html')
</template>

<script>

// At runtime, this component extracts the contents of the indicated <table>,
// deletes it, and renders the data with the above template instead. This strategy
// was chosen to avoid adding a backend rendering step.
function extractData(table) {
  const columns = [];
  const rows = [];

  table.querySelectorAll("tr").forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // header row
      row.querySelectorAll("th, td").forEach(td => {
        columns.push(td.innerText);
      });
    } else {
      const cells = [];
      row.querySelectorAll("th, td").forEach((td, colIndex) => {
        const textLower = td.innerText.toLowerCase();
        const html = td.innerHTML;

        cells.push({ textLower, html });
      });
      rows.push(cells);
    }
  });

  table.style.display = 'none';

  return { columns, rows };
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
          const filterVal = filter.value.toLowerCase();
          if (!row[filter.colIndex].textLower.includes(filterVal)) {
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
            const val1 = a[sortByIdx].textLower;
            const val2 = b[sortByIdx].textLower;

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
.better-table input {
  max-width: 10em;

  border-width: 0 0 1px 0;
  border-color: black;
  border-style: solid;
}

.better-table input::placeholder {
  color: #606060;
}

.better-table th {
  white-space: nowrap;
}
</style>

<!-- vim: set filetype=javascript et ts=2 sw=0 sts=-1 :-->
