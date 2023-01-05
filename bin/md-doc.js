#!/usr/bin/env node
const path = require('path');
const mdDoc = require('../build/index');

mdDoc.generate(path.join(process.argv[2] || process.cwd()), {
    verbose: true
}).catch((e) => {
    console.error('An error occurred while generating documentation', e.stack);
});

