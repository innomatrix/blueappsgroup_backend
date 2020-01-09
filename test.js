const sqlite3 = require('sqlite3').verbose();

// open the database connection
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

let languages = [{ name: 'C++', body: 'Python' }, { name: 'C++', body: 'Python' }];
let body = ['C++', 'C++'];

// construct the insert statement with multiple placeholders
// based on the number of rows
let placeholders = languages.map((language) => '(?)').join(',');
let sql = 'INSERT INTO langs(name, body) VALUES ((?), (?))';

// output the INSERT statement
console.log(sql);
console.log(body.length);
db.serialize(() => {
  db.run('CREATE TABLE langs(name text, body text)');
  db.run(sql, body, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Rows inserted ${this.changes}`);
  });
  db.all('SELECT * from langs', [], function (err, rows) {
    if (err) {
      return console.error(err.message);
    }
    console.log(rows);
  });  
  db.get('SELECT COUNT(*) from langs', [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(rows);
  });  
});

// close the database connection
db.close();