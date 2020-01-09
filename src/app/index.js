
import * as events from 'events';
import http from 'http';
import url from 'url';
import sqlite3 from 'sqlite3';
import { _extend as extend } from 'util';
import * as router from './router';
import * as serviceManager from './serviceManager';

import * as repository from './repository';

import getRoutes from './routes';

const fs = require('fs')


function configure(config) {
  this.config = config;
  this.router = router.configure(config);

  this.eventManager = new events.EventEmitter();
  // this.eventManager.on('onRequestStart', onRequestStart);

  this.repository = repository.initDb();
  process.on('exit', () => this.repository.close());

  this.serviceManager = serviceManager;
  this.serviceManager.register('appConfig', this.config);
  this.serviceManager.register('eventManager', this.eventManager);
  this.serviceManager.register('db', this.repository); 
  // this.serviceManager.register('dataHandler', this.dataHandler);
  
  console.log(this.serviceManager.getAvailableServices());
  this.components = [];

  if (typeof getRoutes === 'function') {
    this.components = this.router.addRoutes(getRoutes().map(route => route));
  }

  this.initComponents = initComponents;
  this.loadDummyData = loadDummyData;

  this.run = run;

  return this;
}

function onRequestStart() {
  console.log('request started');
}

function loadDummyData() {

  this.components.map(component => {
    try {

      let fixture = require((this.config.fixturesDir || '.') + '/' + component);

      if (typeof fixture.getSchema === 'function') {
        let schemaQuery = '';
        const schema = fixture.getSchema();
        let fieldsCount = Object.keys(schema).length;

        for (const field in schema) {
          schemaQuery += field + ' ' + schema[field];
          if (--fieldsCount)
            schemaQuery += ', ';
        }

        console.log(schema);
        console.log(`CREATE TABLE ${component}(${schemaQuery})`)

        this.repository.db.serialize(() => {
          this.repository.db.run(`CREATE TABLE ${component}(id INTEGER PRIMARY KEY,${schemaQuery})`, []);
          // db.run(`SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%'`, [], (err, rows) =>{
          //   if (err) {
          //     return console.error(err.message);
          //   }
          //   console.log(rows);
          // });            
        })

      }

      if (typeof fixture.getDummyData === 'function') {

        const dummyData = fixture.getDummyData();

        dummyData.forEach((record, i) => {
          let fixturesFields = '';
          let fixturesValues = [];
          let fieldsCount = Object.keys(record).length;
          let fixturesValuesQuery = '';

          for (const field in record) {
            fixturesFields += field;
            fixturesValuesQuery += '(?)';
            fixturesValues.push(record[field]);

            if (--fieldsCount) {
              fixturesValuesQuery += ', ';
              fixturesFields += ', ';
            }
          }

          this.repository.db.serialize(() => {
            let sql = `INSERT INTO ${component}(${fixturesFields}) VALUES (${fixturesValuesQuery})`;

            this.repository.db.run(sql, fixturesValues, function (err) {
              if (err) {
                return console.log(err.message);
              }
              // get the last insert id
              console.log(`A row has been inserted with rowid ${this.lastID}`);
            });

          })

        })
      }

    } catch (err) {
      console.error(err)
    }

    // this.repository.get(`SELECT COUNT(*) from ${component}`, [], (err, rows) => {
    //   if (err) {
    //     return console.error(err.message);
    //   }

    //   console.log(component + '(' + rows['COUNT(*)'] + ')');
    // });
  });
}

function run() {

  const server = http.createServer();

  server.on('request', (req, res) => {

    try {
    handleRequest.call(this, req, res)
      .catch(err => {
        console.log(err);
        res.statusCode = 409;
        res.end(JSON.stringify(err.message));
      });
    } catch (error) {
      console.log(error);
      res.statusCode = 409;
      res.end(JSON.stringify(err.message));
    }    
    
    // eventManager('error', res, req);
  })
  .on('error', (err) => {
    console.log(err);
  });

  server.listen(this.config.port, this.config.address);

  this.http = server;

  console.log('Server running at http://' + this.config.address + ':' + this.config.port + '/');
  // console.log(this.router.routes);
  return this;
}

function initComponents(loadDummyData = false) {
  this.components.map(component => {

    const modelDef = require((this.config.modelsDir || '.') + '/' + component);
    let model = { name: component, schema: null};

    if (typeof modelDef.getSchema === 'function') {
      model.schema = modelDef.getSchema();       
    }    

    let componentController = require((this.config.componentsDir || '.') + '/' + component);

    if (typeof componentController.init === 'function') {
      componentController = componentController.init(this.serviceManager, model);
    }

    this.serviceManager.register(component, componentController);
  });

  if (loadDummyData)
    this.loadDummyData();

  return this;
}

const getRequestBody = async (req) => {

      const body = await new Promise((resolve, reject) => {
        let data = [];

        req.on('error', (err) => {
          console.error(err.stack);
        })
        .on('data', (chunk) => {
          data.push(chunk);
        })
        .on('end', () => {
          data = Buffer.concat(data).toString();
          if (data === "")
            reject(new Error('No data!'))  
          else {
            try {
              resolve(JSON.parse(data))
            } catch (e) {
              reject(new Error('Wrong payload!'));
            }
          }
  
          });
        })
        .catch(error => { 
          throw new Error('No payload'); 
        });


    return body;

}

async function handleRequest(req, res) {
  req.url = url.parse('http://' + req.headers.host + req.url, true);
  req.query = req.url.query;
  res.statusCode = this.config.defaults.response.statusCode;


  const matchedRoute = this.router.match(req);
  let headers = extend({
    'Content-Type': 'text/plain'
  }, this.config.defaults.response.headers);

  Object.keys(headers).map(name => res.setHeader(name, headers[name]));

  this.eventManager.emit('onRequestStart', req, res, matchedRoute);

  let payload = {};

  if (['POST', 'PUT'].includes(req.method)) {
    // try {
      payload = await getRequestBody(req);
    // } catch (err) {
    //   throw err;
    // }
  }

  if (typeof matchedRoute !== "undefined") {

    headers = extend(headers, matchedRoute.headers || {});

    req.params = matchedRoute.params;    
  
    const component = this.serviceManager.get(matchedRoute.component);

    if (typeof component[matchedRoute.action] === 'function') {
      component[matchedRoute.action](req, res, { payload });
    } else {

    this.serviceManager.get(this.config.defaultComponent)[this.config.defaultAction](req, res, {payload});
      // res.statusCode = 405;
      // res.end('Method Not Allowed');      
    }
  } else {
    res.statusCode =  404;
    res.end(res.body || 'Page Not Found');
  }
}

export { configure, initComponents, loadDummyData };