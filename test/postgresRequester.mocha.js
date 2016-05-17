var { expect } = require("chai");

var { postgresRequesterFactory } = require('../build/postgresRequester');

var info = require('./info');

var postgresRequester = postgresRequesterFactory({
  host: info.postgresHost,
  database: info.postgresDatabase,
  user: info.postgresUser,
  password: info.postgresPassword
});

describe("Postgres requester", function() {
  this.timeout(5 * 1000);

  describe("error", function() {
    it("throws if there is not host or locator", function() {
      expect(() => {
        postgresRequesterFactory({});
      }).to.throw('must have a `host` or a `locator`');
    });

    it("correct error for bad table", (testComplete) => {
      postgresRequester({
        query: "SELECT * FROM not_a_real_datasource"
      })
        .then(() => {
          throw new Error('DID_NOT_ERROR');
        })
        .catch((err) => {
          expect(err.message).to.contain("not_a_real_datasource");
          testComplete();
        })
        .done();
    });
  });


  describe("basic working", function() {
    it("runs a metadata query", (testComplete) => {
      postgresRequester({
        query: "select column_name, udt_name from INFORMATION_SCHEMA.COLUMNS where table_name = 'wikipedia';"
      })
        .then((res) => {
          expect(res.length).to.equal(26);
          testComplete();
        })
        .done();
    });


    it("runs a SELECT / GROUP BY", (testComplete) => {
      postgresRequester({
        query: `SELECT "channel" AS "Channel", sum("added") AS "TotalAdded", sum("deleted") AS "TotalDeleted" FROM "wikipedia" WHERE "cityName" = 'Tokyo' GROUP BY "channel" ORDER BY "channel";`
      })
        .then((res) => {
          expect(res).to.deep.equal([
            {
              "Channel": "de",
              "TotalAdded": 0,
              "TotalDeleted": 109
            },
            {
              "Channel": "en",
              "TotalAdded": 3500,
              "TotalDeleted": 447
            },
            {
              "Channel": "fr",
              "TotalAdded": 0,
              "TotalDeleted": 0
            },
            {
              "Channel": "ja",
              "TotalAdded": 75168,
              "TotalDeleted": 2462
            },
            {
              "Channel": "ko",
              "TotalAdded": 0,
              "TotalDeleted": 57
            },
            {
              "Channel": "ru",
              "TotalAdded": 898,
              "TotalDeleted": 194
            },
            {
              "Channel": "zh",
              "TotalAdded": 72,
              "TotalDeleted": 21
            }
          ]);
          testComplete();
        })
        .done();
    });

    it("works correctly with time", (testComplete) => {
      postgresRequester({
        query: `SELECT MAX("time") AS "MaxTime" FROM "wikipedia"`
      })
        .then((res) => {
          expect(res).to.deep.equal([
            {
              "MaxTime": new Date('2015-09-12T23:59:00.000Z')
            }
          ]);
          testComplete();
        })
        .done();
    })

    it.only("works correctly with count", (testComplete) => {
      postgresRequester({
        query: `SELECT COUNT(*) AS "__VALUE__" FROM "wikipedia" WHERE ("cityName" IS NOT DISTINCT FROM 'El Paso')`
      })
        .then((res) => {
          expect(res).to.deep.equal([
            {
              "__VALUE__": 2
            }
          ]);
          testComplete();
        })
        .done();
    })

  });

});
