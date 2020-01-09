export function init(sm, model) {

  this.sm = sm;
  
  let eventManager = sm.get('eventManager');
  eventManager.emit('componentLoaded', 'index');

  this.model = model;

  this.index = index;

  return this;
}

async function index(req, res) {
  res.statusCode = 200;
  res.end(JSON.stringify('Hi there!'));
}

async function create(req, res, { payload }) {

  let db = this.sm.get('db');

  const validation = (Object.keys(this.model.schema)).filter(f => !Object.keys(payload).includes(f));

  if(!validation.length) {
    try {
      await db.create(this.model,payload);
    } catch (error) {
      res.statusCode = 500;
      res.status(500).end(JSON.stringify({ error: error.message }));
    }
    const posts = await db.get(this.model, payload);
    res.statusCode = 200;
    res.end(JSON.stringify(posts));
  }
  res.statusCode = 409;
  res.end(JSON.stringify({error: "Missing filed(s)", data: validation}));
}

async function update(req, res, { payload }) {

  let db = this.sm.get('db');

  const validation = (Object.keys(this.model.schema)).filter(f => !Object.keys(payload).includes(f));

  if (!validation.length) {
    try {
      await db.create(this.model, payload);
    } catch (error) {
      res.statusCode = 500;
      res.status(500).end(JSON.stringify({ error: error.message }));
    }
    const posts = await db.get(this.model, payload);
    res.statusCode = 200;
    res.end(JSON.stringify(posts));
  }
  res.statusCode = 409;
  res.end(JSON.stringify({ error: "Missing filed(s)", data: validation }));
}

async function remove(req, res, { payload }) {

  let db = this.sm.get('db');

  const validation = (Object.keys(this.model.schema)).filter(f => !Object.keys(payload).includes(f));

  if (!validation.length) {
    try {
      await db.create(this.model, payload);
    } catch (error) {
      res.statusCode = 500;
      res.status(500).end(JSON.stringify({ error: error.message }));
    }
    const posts = await db.get(this.model, payload);
    res.statusCode = 200;
    res.end(JSON.stringify(posts));
  }
  res.statusCode = 409;
  res.end(JSON.stringify({ error: "Missing filed(s)", data: validation }));
}
