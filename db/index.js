const  { Pool,Client } = require('pg');


const pool = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'chatapp',
  password: 'ubuntu',
  port: 5432,
});

pool.connect();

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}
