'use strict';

const fs = require('fs');
const path = require('path');
const Funnel = require('broccoli-funnel');
const walkSync = require('walk-sync');

// Some addons do their own compilation, which means the addon trees will
// be a mix of ES6 and AMD files. This plugin gives us a way to separate the
// files, as we don't want to double compile the AMD code.

// It has a very simple method of detecting AMD code, because we only care
// about babel output, which is pretty consistent.
class AmdFunnel extends Funnel {
  constructor(inputNode, options) {
    super(inputNode, {
      exclude: [],
      annotation: options.annotation
    });
  }

  build() {
    let inputPath = this.inputPaths[0];
    this.exclude = [];

    let files = walkSync(inputPath, {
      directories: false,
      globs: ['**/*.js']
    });

    return Promise.all(files.map(file => {
      let inputFilePath = path.join(inputPath, file);
      return new Promise((resolve, reject) => {
        fs.readFile(inputFilePath, 'utf8', (err, source) => {
          if (err) {
            return reject(err);
          }
          if (source.indexOf('define(') === 0) {
            this.exclude.push(file);
          }
          resolve();
        });
      });
    })).then(() => {
      super.build();
    });
  }
}

module.exports = AmdFunnel;
