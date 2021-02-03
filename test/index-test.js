'use strict';

const { createBuilder, createTempDir } = require('broccoli-test-helper');
const co = require('co');
const { expect } = require('chai');
const sinon = require('sinon');
const symlinkOrCopy = require('symlink-or-copy');
const AmdFunnel = require('..');

describe('AmdFunnel', function() {
  let input, output;
  let callback;

  [true, false, undefined].forEach(canSymlink => {
    describe(`- canSymlink: ${canSymlink} -`, function() {
      beforeEach(co.wrap(function * () {
        input = yield createTempDir();

        symlinkOrCopy.setOptions({
          isWindows: process.platform === 'win32',
          fs: require('fs'),
          canSymlink
        });

        callback = sinon.spy();

        let subject = new AmdFunnel(input.path(), {
          callback
        });

        output = createBuilder(subject);
      }));

      afterEach(co.wrap(function * () {
        yield input.dispose();
        yield output.dispose();
      }));

      it('should remove the AMD modules', co.wrap(function * () {
        input.write({
          'amd.js': `define('amd', function() {});`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({});

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('should preserve the ES6 modules', co.wrap(function * () {
        input.write({
          'es6.js': `export { es6 } from './es6';`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'es6.js': `export { es6 } from './es6';`
        });

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('handles scoped addons with AMD', co.wrap(function * () {
        input.write({
          'scope': {
            'amd.js': `define('amd', function() {});`
          }
        });

        yield output.build();

        expect(output.read()).to.deep.equal({});

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('only searches one nested dir (scopes only)', co.wrap(function * () {
        input.write({
          'scope': {
            'lib': {
              'amd.js': `define('amd', function() {});`
            }
          }
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'scope': {
            'lib': {
              'amd.js': `define('amd', function() {});`
            }
          }
        });

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('stops searching on the first found file', co.wrap(function * () {
        input.write({
          'scope': {
            'amd.js': `define('amd', function() {});`
          },
          'es6.js': `export { es6 } from './es6';`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'scope': {
            'amd.js': `define('amd', function() {});`
          },
          'es6.js': `export { es6 } from './es6';`
        });

        yield output.build();

        expect(output.changes()).to.deep.equal({});
      }));

      it('should have updated the contents of the AMD file if the addon updates its contents', co.wrap(function * () {
        input.write({
          'amd.js': `define('amd', function() {});`
        });

        yield output.build();

        input.write({
          'amd.js': `define('foo', function() {});`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({});

        expect(output.changes()).to.deep.equal({});
      }));

      it('should have updated the contents of the ES6 file if the addon updates its contents', co.wrap(function * () {
        input.write({
          'es6.js': `export { es6 } from './es6';`
        });

        yield output.build();

        input.write({
          'es6.js': `export { foo } from './es6';`
        });

        yield output.build();

        expect(output.read()).to.deep.equal({
          'es6.js': `export { foo } from './es6';`
        });

        expect(output.changes()).to.deep.equal({
          'es6.js': 'change'
        });
      }));

      it('should call a callback if an AMD file is found', co.wrap(function * () {
        input.write({
          'amd.js': `define('amd', function() {});`
        });

        yield output.build();

        expect(callback.calledOnce).to.be.ok;
      }));
    });
  });
});
