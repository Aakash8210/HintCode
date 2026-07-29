import test from 'node:test';
import assert from 'node:assert/strict';
import { isSupportedProblemNumber } from './leetcode';

test('supports any positive problem number', () => {
  assert.equal(isSupportedProblemNumber(1), true);
  assert.equal(isSupportedProblemNumber(1000), true);
  assert.equal(isSupportedProblemNumber(1001), true);
  assert.equal(isSupportedProblemNumber(0), false);
  assert.equal(isSupportedProblemNumber(-10), false);
});
