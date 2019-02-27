const  { Pool,Client } = require('pg');


const pool = new Client({
  user: 'postgres',
  host: '96.51.140.32',
  database: 'chatapp',
  password: 'KEoybBQt0DzprEkqllCSJRKjiNoyZ6JiKsbG5qmUXbRxnu2Og3YvscwO09Fy',
  port: 5432,
});

pool.connect();

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}
