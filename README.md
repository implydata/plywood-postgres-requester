# plywood-postgres-requester

This is the [Postgres](http://www.postgresql.org/) requester making abstraction layer for [plywood](https://github.com/implydata/plywood).

Given a Postgres query and an optional context it return a Q promise that resolves to the data table.

## Installation

To install run:

```
npm install plywood-postgres-requester
```

## Usage

In the raw you could use this library like so:

```
postgresRequesterGenerator = require('plywood-postgres-requester').postgresRequester

postgresRequester = postgresRequesterGenerator({
  host: 'my.postgres.host',
  database: 'all_my_data',
  user: 'HeMan',
  password: 'By_the_Power_of_Greyskull'
})

postgresRequester({
  query: 'SELECT "cut" AS "Cut", sum("price") AS "TotalPrice" FROM "diamonds" GROUP BY "cut";'
})
  .then(function(res) {
    console.log("The first row is:", res[0])
  })
  .done()
```

Although usually you would just pass `postgresRequester` into the Postgres driver that is part of Plywood.

## Tests

Currently the tests run against a real Postgres database that should be configured (database, user, password) the same as
what is indicated in `test/info.coffee`.
