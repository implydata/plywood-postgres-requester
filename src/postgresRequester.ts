/*
 * Copyright 2015-2016 Imply Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Promise from 'any-promise';
import { PlywoodRequester, PlywoodLocator, basicLocator } from 'plywood-base-api';
import { Readable } from 'stream';
import * as pg from 'pg';
import * as pgTypes from 'pg-types';
import * as parseDateUTC from 'postgres-date-utc';

pgTypes.setTypeParser(1700, pgTypes.getTypeParser(700)); // numeric same as double
pgTypes.setTypeParser(20, pgTypes.getTypeParser(21)); // big int same as int
pgTypes.setTypeParser(1082, parseDateUTC); // date
pgTypes.setTypeParser(1114, parseDateUTC); // timestamp without timezone
pgTypes.setTypeParser(1184, parseDateUTC); // timestamp
// ToDo: fix date array also

export interface PostgresRequesterParameters {
  locator?: PlywoodLocator;
  host?: string;
  user: string;
  password: string;
  database: string;
}

export function postgresRequesterFactory(parameters: PostgresRequesterParameters): PlywoodRequester<string> {
  let locator = parameters.locator;
  if (!locator) {
    let host = parameters.host;
    if (!host) throw new Error("must have a `host` or a `locator`");
    locator = basicLocator(host, 5432);
  }
  let user = parameters.user;
  let password = parameters.password;
  let database = parameters.database;

  return (request): Readable => {
    let query = request.query;

    // options = options || {};
    // options.objectMode = true;
    let stream = new Readable({
      objectMode: true,
      read: function() {}
    });

    locator()
      .then((location) => {
        let client = new pg.Client({
          host: location.hostname,
          port: location.port || 5432,
          database: database,
          user: user,
          password: password,

          parseInputDatesAsUTC: true // not in the type
        } as any);

        client.on('drain', client.end.bind(client)); // disconnect client when all queries are finished
        client.connect();

        //query is executed once connection is established and PostgreSQL server is ready for a query
        let q = client.query(query);

        q.on('row', function(row: any) {
          stream.push(row);
        });

        q.on('error', function(err: any) {
          stream.emit('error', err);  // Pass on any errors
        });

        q.on('end', function() {
          stream.push(null);  // pushing null, indicating EOF
        });
      })
      .catch((err: Error) => {
        stream.emit('error', err);  // Pass on any errors
      });

    return stream;
  };
}
