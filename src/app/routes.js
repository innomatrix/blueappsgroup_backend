
export default function getRoutes() {
  return [
    {
      url: '/',
      action: 'index',
    }, 
    {
      url: '/posts',
      method: 'GET',          
      action: 'index',
      component: 'post'
    },
    {
      url: '/posts/:id',
      method: 'GET',      
      action: 'index',
      component: 'post'
    },
    {
      url: '/posts',
      method: 'POST',
      action: 'create',
      component: 'post'
    },
    {
      url: '/posts/:id',
      method: 'PUT',
      action: 'update',
      component: 'post'
    },
    {
      url: '/posts/:id',
      method: 'DELETE',
      action: 'remove',
      component: 'post'
    }
  ];
}
