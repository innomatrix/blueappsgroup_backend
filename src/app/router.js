import { _extend as extend } from 'util';


export function configure(config) {
  this.basePath = config.basePath || '';
  this.routes = [];

  this.addRoutes = addRoutes;
  this.match = match;

  this.defaultComponent = config.defaultComponent;
  this.defaultAction = config.defaultAction;

  return this;
}

function addRoutes(routes) {

  let components = [];

  if (Array.isArray(routes)) {
    routes.map(route => {
      route.component = route.component ? route.component : this.defaultComponent;
      route.action = route.action ? route.action : this.defaultAction;

      components.indexOf(route.component) == -1 ? components.push(route.component) : true;

      route._urlParams = route.url.match(/:[^\/]+/g) || [];
      route._urlRegex = new RegExp('^' + route.url
        .replace(/:[^\/]+/g, '(.*?)')
        .replace(/\//g, '\\/') + '$');
    });

    this.routes = this.routes.concat(routes);
  }

  return components;
}

function match(req) {
  const i = req.url.pathname.indexOf(this.basePath);

  if (i !== 0) {
    return;
  }

  const path = req.url.pathname.substr(this.basePath.length);

  let params = {},
    matched = this.routes.find(route => {
      const method = route.method || 'GET';

      if (path === route.url && method === req.method) {
        return true;
      }

      let reMatch = path.match(route._urlRegex);

      if (reMatch && method === req.method) { // && method === ''
        params = route._urlParams.reduce((params, param, i) => {
          params[param.substring(1)] = reMatch[i + 1];
          return params;
        }, {});

        return true;
      }
    });

  if (matched) {
    matched = extend({}, matched);
    matched.params = params;
  }

  return matched;
}
