const fs = require('fs');
const electron = require('electron');
fs.writeFileSync('test_out.txt', JSON.stringify({
  type: typeof electron,
  keys: Object.keys(electron || {}),
  hasApp: Boolean(electron && electron.app)
}, null, 2));
