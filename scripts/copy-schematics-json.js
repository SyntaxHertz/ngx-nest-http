const fs = require('fs');
const path = require('path');

const src = path.join('projects', 'ngx-nest-http', 'schematics');
const dest = path.join('dist', 'ngx-nest-http', 'schematics');

function copyJson(fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });

  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      copyJson(from, to);
    } else if (entry.name.endsWith('.json')) {
      fs.copyFileSync(from, to);
    }
  }
}

copyJson(src, dest);
