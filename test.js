import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {findAndReplace} from './index.js'
import * as mod from './index.js'

test('findAndReplace', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['findAndReplace'],
    'should expose the public api'
  )

  assert.throws(
    () => {
      // @ts-expect-error runtime.
      findAndReplace(create(), true)
    },
    /^TypeError: Expected array or object as schema$/,
    'should throw on invalid search and replaces'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', []),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should remove without `replace`'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', '!!!'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `find` and `replace`'
  )

  assert.deepEqual(
    findAndReplace(
      create(),
      /em(\w+)is/,
      (/** @type {string} */ _, /** @type {string} */ $1) => '[' + $1 + ']'
    ),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '[phas]')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `find` as a `RegExp` and `replace` as a `Function`'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => ''),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', []),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `replace` returns an empty string'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => u('delete', [u('break')])),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('delete', [u('break')])]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `replace` returns a node'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => [u('delete', []), u('break')]),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('delete', []), u('break')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `replace` returns a list of nodes'
  )

  assert.deepEqual(
    findAndReplace(create(), [
      ['emphasis', '!!!'],
      ['importance', '???']
    ]),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ', '),
      u('strong', [u('text', '???')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `search` as an matrix of strings'
  )

  assert.deepEqual(
    findAndReplace(create(), {emp: 'hacks', ',': '!'}),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'hacks'), u('text', 'hasis')]),
      u('text', '!'),
      u('text', ' '),
      u('strong', [u('text', 'importance')]),
      u('text', '!'),
      u('text', ' and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work when given `search` as an object of strings'
  )

  assert.deepEqual(
    findAndReplace(create(), /\Bmp\B/, '[MP]'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'e'), u('text', '[MP]'), u('text', 'hasis')]),
      u('text', ', '),
      u('strong', [u('text', 'i'), u('text', '[MP]'), u('text', 'ortance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should work on partial matches'
  )

  assert.deepEqual(
    findAndReplace(create(), {
      emphasis() {
        return u('link', {url: 'x'}, [u('text', 'importance')])
      },
      importance: 'something else'
    }),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('link', {url: 'x'}, [u('text', 'something else')])]),
      u('text', ', '),
      u('strong', [u('text', 'something else')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should find-and-replace recursively'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [
        u('text', 'Some '),
        u('emphasis', [u('text', 'importance')]),
        u('text', ' and '),
        u('strong', [u('text', 'importance')]),
        u('text', '.')
      ]),
      'importance',
      '!!!',
      {ignore: 'strong'}
    ),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', '!!!')]),
      u('text', ' and '),
      u('strong', [u('text', 'importance')]),
      u('text', '.')
    ]),
    'should ignore from options'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'Some emphasis, importance, and code.')]),
      {
        importance(/** @type {string} */ value) {
          return u('strong', [u('text', value)])
        },
        code(/** @type {string} */ value) {
          return u('inlineCode', value)
        },
        emphasis(/** @type {string} */ value) {
          return u('emphasis', [u('text', value)])
        }
      }
    ),
    create(),
    'should not be order-sensitive with strings'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'Some emphasis, importance, and code.')]),
      [
        [
          /importance/g,
          function (/** @type {string} */ value) {
            return u('strong', [u('text', value)])
          }
        ],
        [
          /code/g,
          function (/** @type {string} */ value) {
            return u('inlineCode', value)
          }
        ],
        [
          /emphasis/g,
          function (/** @type {string} */ value) {
            return u('emphasis', [u('text', value)])
          }
        ]
      ]
    ),
    create(),
    'should not be order-sensitive with regexes'
  )

  assert.deepEqual(
    findAndReplace(u('paragraph', [u('text', 'aaa bbb')]), [
      [
        /\b\w+\b/g,
        function (/** @type {string} */ value) {
          return value === 'aaa' ? u('strong', [u('text', value)]) : false
        }
      ]
    ]),
    {
      type: 'paragraph',
      children: [
        {type: 'strong', children: [{type: 'text', value: 'aaa'}]},
        {type: 'text', value: ' bbb'}
      ]
    },
    'should support a match, and then a `false`'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => false),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'emphasis')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', and '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'should not replace when returning false'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'asd.')]),
      'asd',
      (/** @type {string} */ d) => d
    ),
    u('paragraph', [u('text', 'asd'), u('text', '.')]),
    'should not recurse into a replaced value'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'asd.')]),
      'asd',
      (/** @type {string} */ d) => u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('emphasis', [u('text', 'asd')]), u('text', '.')]),
    'should not recurse into a replaced node (head)'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', '.asd')]),
      'asd',
      (/** @type {string} */ d) => u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('text', '.'), u('emphasis', [u('text', 'asd')])]),
    'should not recurse into a replaced node (tail)'
  )

  assert.deepEqual(
    findAndReplace(
      u('paragraph', [u('text', 'asd')]),
      'asd',
      (/** @type {string} */ d) => u('emphasis', [u('text', d)])
    ),
    u('paragraph', [u('emphasis', [u('text', 'asd')])]),
    'should not recurse into a replaced node (head and tail)'
  )

  assert.deepEqual(
    findAndReplace(create(), 'and', 'alert(1)'),
    u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'emphasis')]),
      u('text', ', '),
      u('strong', [u('text', 'importance')]),
      u('text', ', '),
      u('text', 'alert(1)'),
      u('text', ' '),
      u('inlineCode', 'code'),
      u('text', '.')
    ]),
    'security: replacer as string (safe)'
  )
})

function create() {
  return u('paragraph', [
    u('text', 'Some '),
    u('emphasis', [u('text', 'emphasis')]),
    u('text', ', '),
    u('strong', [u('text', 'importance')]),
    u('text', ', and '),
    u('inlineCode', 'code'),
    u('text', '.')
  ])
}
