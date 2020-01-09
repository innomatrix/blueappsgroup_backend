export function init(sm, model) {

  this.sm = sm;

  let eventManager = sm.get('eventManager');
  eventManager.emit('componentLoaded', 'index');

  this.model = model;

  this.index = index;
  this.create = create;
  this.update = update;
  this.remove = remove;

  return this;
}

async function index(req, res) {

  let db = this.sm.get('db');

  const posts = await db.get(this.model, req.params);

  res.statusCode = 200;
  res.end(JSON.stringify(posts));
}

async function create(req, res, { payload }) {

  let db = this.sm.get('db');

  const validation = (Object.keys(this.model.schema)).filter(f => !Object.keys(payload).includes(f));

  if (validation.length == 0) {
    try {
      let r = await db.create(this.model, payload)
      .catch((err) => {
        throw err;
      });
    } catch (error) {
      res.statusCode = 500;
      res.status(500).end(JSON.stringify({ error: error.message }));
    }

    const posts = await db.get(this.model).catch((err) => {
      throw err
    });
    res.statusCode = 200;
    res.end(JSON.stringify(posts));
  } else {
    res.statusCode = 409;
    res.end(JSON.stringify({ error: "Missing filed(s)", data: validation }));
  }
}

async function update(req, res, { payload }) {

  let db = this.sm.get('db');

  const validation = (Object.keys(this.model.schema)).filter(f => !Object.keys(payload).includes(f));

  let post = await db.get(this.model, req.params);

  if(post[0].id) {
    await db.update(this.model, req.params, payload);
    post = await db.get(this.model);
    res.statusCode = 201;
    res.end(JSON.stringify(post));  
  } else {
    res.statusCode = 409;
    res.end(JSON.stringify({error: "No such post"}));  
  }
}

async function remove(req, res, { payload }) {

}

