
import sqlite3 from 'sqlite3';

let db = {};

export function initDb() {
  this.db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });

  this.prepareWhereQuery = prepareWhereQuery;
  this.get = get;
  this.create = create;
  this.update = update;
  // this.remove = remove;  

  return this;
}

function prepareWhereQuery(model, params = {}, updateStyle = false) {

  this.queryParams = '';

  if (Object.keys(params).length !== 0) {
      Object.entries(params).forEach(([key, value], index) => {
        if (index > 0)
          this.queryParams += ' AND ';

        if (updateStyle) 
          this.queryParams += key + '= ?';
        else 
          this.queryParams += key + '=' + value;
      })
  }
}    

async function get(model, params = {}) {

  this.query = '';

  if (Object.keys(params).length !== 0) {
    this.prepareWhereQuery(model, params)
    this.query = `SELECT * FROM ${model.name} WHERE ${this.queryParams}`;
  } else
    this.query = `SELECT * FROM ${model.name}`;

  let result = await new Promise((resolve, reject) => {
    this.db.all(this.query, [], (err, data) => {
      if (err) return reject(err)

      // console.log(p)
      resolve(data)
    });
  }) 
  // }

  return result;
}

async function create(model, payload) {

  this.query = '';

  let inserFields = '';
  let inserValues = [];
  let fieldsCount = Object.keys(payload).length;
  let inserQuery = '';

  for (const field in payload) {
    inserFields += field;
    inserQuery += '(?)';
    inserValues.push(payload[field]);

    if (--fieldsCount) {
      inserQuery += ', ';
      inserFields += ', ';
    }
  }

  this.query = `INSERT INTO ${model.name}(${inserFields}) VALUES (${inserQuery})`;

  const result = await new Promise((resolve, reject) => {

    this.db.run(this.query, inserValues, (err) => {
        if (err) return reject(err)

        resolve(this.lastID)
      });
    })
    .catch((err) => {
      throw err;
    })

  return result;
}

async function update(model, params = {}, payload) {

  this.query = '';

  let updateFields = '';
  let updateValues = [];
  let fieldsCount = Object.keys(payload).length;
  let updateSet = '';

  for (const field in payload) {
    updateFields += field;
    updateSet += `${field} = ?`;
    updateValues.push(payload[field]);

    if (--fieldsCount) {
      updateSet += ', ';
      updateFields += ', ';
    }
  }

  this.prepareWhereQuery(model, params);            

  this.query = `UPDATE ${model.name} SET ${updateSet} WHERE ${this.queryParams}`;

  let result = await new Promise((resolve, reject) => {
    this.db.run(this.query, updateValues, (err, data) => {
      if (err) return reject(err)

      // console.log(p)
      resolve(data)
    });
  })
  // }

  return result;
}


