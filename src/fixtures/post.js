function getSchema() {
  return {
    title: 'text',
    body: 'text',
    author:'text'
  };
}

function getDummyData() {
  return [
    { title: 'Test Post', body: 'Lorem ipsum...', author: 'root'},
    { title: 'Test Post', body: 'Lorem ipsum...', author: 'root' },
    { title: 'Test Post', body: 'Lorem ipsum...', author: 'root' },
    { title: 'Test Post', body: 'Lorem ipsum...', author: 'root' }
  ];
}

module.exports = {
  getSchema,
  getDummyData
}