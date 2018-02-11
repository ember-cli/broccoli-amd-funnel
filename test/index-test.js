'use strict';

const helper = require('broccoli-test-helper');
const co = require('co');
const expect = require('chai').expect;
const sinon = require('sinon');
const AmdFunnel = require('..');
const createBuilder = helper.createBuilder;
const createTempDir = helper.createTempDir;

describe('AmdFunnel', function() {
  let input, output;
  let callback;

  beforeEach(co.wrap(function * () {
    input = yield createTempDir();

    callback = sinon.spy();

    let subject = new AmdFunnel(input.path(), {
      callback
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
      'es6.js': `export { es6 } from './es6';`
    });

    yield output.build();

    expect(output.read()).to.deep.equal({
      'es6.js': `export { es6 } from './es6';`
    });

    yield output.build();

    expect(output.changes()).to.deep.equal({});
  }));

  it('should have updated the contents of the addon file if the addon updates its contents', co.wrap(function * () {
    input.write({
      'amd.js': `define('amd', function() {});`,
      'es6.js': `export { es6 } from './es6';`
    });

    yield output.build();

    input.write({
      'amd.js': `export { amd } from './amd';`
    });

    yield output.build();

    expect(output.read()).to.deep.equal({
      'amd.js': `export { amd } from './amd';`,
      'es6.js': `export { es6 } from './es6';`
    });

    input.write({
      'es6.js': `define('es6', function() {});`
    });

    yield output.build();

    expect(output.read()).to.deep.equal({
      'amd.js': `export { amd } from './amd';`
    });
  }));

  it('should call a callback if an AMD file is found', co.wrap(function * () {
    input.write({
      'amd.js': `define('amd', function() {});`,
      'es6.js': `export { es6 } from './es6';`
    });

    yield output.build();

    expect(callback.args).to.deep.equal([[['amd.js']]]);

    callback.resetHistory();

    yield output.build();

    expect(callback.args).to.deep.equal([[['amd.js']]]);
  }));
});
