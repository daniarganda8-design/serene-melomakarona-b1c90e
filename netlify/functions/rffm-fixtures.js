'use strict';

const data =
  require('./partidos.json');


exports.handler =
  async function () {

    return {

      statusCode:
        200,


      headers: {

        'content-type':
          'application/json; charset=utf-8',

        'cache-control':
          'public, max-age=60, s-maxage=300',

        'access-control-allow-origin':
          '*'

      },


      body:
        JSON.stringify(
          data
        )

    };

  };
