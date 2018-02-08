'use strict';

const helper = require('broccoli-test-helper');
const co = require('co');
const expect = require('chai').expect;
const AmdFunnel = require('..');
const setSymlinkOrCopyOptions = require('symlink-or-copy').setOptions;
const createBuilder = helper.createBuilder;
const createTempDir = helper.createTempDir;

describe('AmdFunnel', function() {
  let input, output;

  [true, false, undefined].forEach(canSymlink => {
    describe(`canSymlink: ${canSymlink}`, function() {
      beforeEach(co.wrap(function * () {
        input = yield createTempDir();

        setSymlinkOrCopyOptions({
          isWindows: process.platform === 'win32',
          fs: require('fs'),
          canSymlink
        });

        let subject = new AmdFunnel(input.path(), {
          canSymlink
        });

        output = createBuilder(subject);
      }));

      afterEach(co.wrap(function * () {
        yield input.dispose();

        if (output) {
          yield output.dispose();
        }
      }));

      it('should remove the AMD modules', co.wrap(function * () {
        input.write({
          'amd.js': `define('amd', function() {});`,
          'es6.js': `exports { * } from './es6';`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'es6.js': `exports { * } from './es6';`
        });

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('should have updated the contents of the addon file if the addon updates its contents', co.wrap(function * () {
        input.write({
          'amd.js': `define('amd', function() {});`,
          'es6.js': `exports { * } from './es6';`
        });

        yield output.build();

        input.write({
          'amd.js': `exports { * } from './amd';`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'amd.js': `exports { * } from './amd';`,
          'es6.js': `exports { * } from './es6';`
        });

        input.write({
          'es6.js': `define('es6', function() {});`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'amd.js': `exports { * } from './amd';`
        });
      }));
    });
  });
});
