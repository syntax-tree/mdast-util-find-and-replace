import assert from 'node:assert/strict'
import test from 'node:test'
import {u} from 'unist-builder'
import {findAndReplace} from './index.js'

test('findAndReplace', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), [
      'findAndReplace'
    ])
  })

  await t.test(
    'should throw on invalid search and replaces',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check that the runtime throws an error.
        findAndReplace(create(), true)
      }, /^TypeError: Expected array or object as schema$/)
    }
  )

  await t.test('should remove without `replace`', async function () {
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
      ])
    )
  })

  await t.test(
    'should work when given `find` and `replace`',
    async function () {
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
        ])
      )
    }
  )

  await t.test(
    'should work when given `find` as a `RegExp` and `replace` as a `Function`',
    async function () {
      assert.deepEqual(
        findAndReplace(
          create(),
          /em(\w+)is/,
          function (/** @type {string} */ _, /** @type {string} */ $1) {
            return '[' + $1 + ']'
          }
        ),
        u('paragraph', [
          u('text', 'Some '),
          u('emphasis', [u('text', '[phas]')]),
          u('text', ', '),
          u('strong', [u('text', 'importance')]),
          u('text', ', and '),
          u('inlineCode', 'code'),
          u('text', '.')
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns an empty string',
    async function () {
      assert.deepEqual(
        findAndReplace(create(), 'emphasis', function () {
          return ''
        }),
        u('paragraph', [
          u('text', 'Some '),
          u('emphasis', []),
          u('text', ', '),
          u('strong', [u('text', 'importance')]),
          u('text', ', and '),
          u('inlineCode', 'code'),
          u('text', '.')
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns a node',
    async function () {
      assert.deepEqual(
        findAndReplace(create(), 'emphasis', function () {
          return u('delete', [u('break')])
        }),
        u('paragraph', [
          u('text', 'Some '),
          u('emphasis', [u('delete', [u('break')])]),
          u('text', ', '),
          u('strong', [u('text', 'importance')]),
          u('text', ', and '),
          u('inlineCode', 'code'),
          u('text', '.')
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns a list of nodes',
    async function () {
      assert.deepEqual(
        findAndReplace(create(), 'emphasis', function () {
          return [u('delete', []), u('break')]
        }),
        u('paragraph', [
          u('text', 'Some '),
          u('emphasis', [u('delete', []), u('break')]),
          u('text', ', '),
          u('strong', [u('text', 'importance')]),
          u('text', ', and '),
          u('inlineCode', 'code'),
          u('text', '.')
        ])
      )
    }
  )

  await t.test(
    'should work when given `search` as an matrix of strings',
    async function () {
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
        ])
      )
    }
  )

  await t.test(
    'should work when given `search` as an object of strings',
    async function () {
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
        ])
      )
    }
  )

  await t.test('should work on partial matches', async function () {
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
      ])
    )
  })

  await t.test('should find-and-replace recursively', async function () {
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
      ])
    )
  })

  await t.test('should ignore from options', async function () {
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
      ])
    )
  })

  await t.test('should not be order-sensitive with strings', async function () {
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
      create()
    )
  })

  await t.test('should not be order-sensitive with regexes', async function () {
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
      create()
    )
  })

  await t.test('should support a match, and then a `false`', async function () {
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
      }
    )
  })

  await t.test('should not replace when returning false', async function () {
    assert.deepEqual(
      findAndReplace(create(), 'emphasis', function () {
        return false
      }),
      u('paragraph', [
        u('text', 'Some '),
        u('emphasis', [u('text', 'emphasis')]),
        u('text', ', '),
        u('strong', [u('text', 'importance')]),
        u('text', ', and '),
        u('inlineCode', 'code'),
        u('text', '.')
      ])
    )
  })

  await t.test('should not recurse into a replaced value', async function () {
    assert.deepEqual(
      findAndReplace(
        u('paragraph', [u('text', 'asd.')]),
        'asd',
        function (/** @type {string} */ d) {
          return d
        }
      ),
      u('paragraph', [u('text', 'asd'), u('text', '.')])
    )
  })

  await t.test(
    'should not recurse into a replaced node (head)',
    async function () {
      assert.deepEqual(
        findAndReplace(
          u('paragraph', [u('text', 'asd.')]),
          'asd',
          function (/** @type {string} */ d) {
            return u('emphasis', [u('text', d)])
          }
        ),
        u('paragraph', [u('emphasis', [u('text', 'asd')]), u('text', '.')])
      )
    }
  )

  await t.test(
    'should not recurse into a replaced node (tail)',
    async function () {
      assert.deepEqual(
        findAndReplace(
          u('paragraph', [u('text', '.asd')]),
          'asd',
          function (/** @type {string} */ d) {
            return u('emphasis', [u('text', d)])
          }
        ),
        u('paragraph', [u('text', '.'), u('emphasis', [u('text', 'asd')])])
      )
    }
  )

  await t.test(
    'should not recurse into a replaced node (head and tail)',
    async function () {
      assert.deepEqual(
        findAndReplace(
          u('paragraph', [u('text', 'asd')]),
          'asd',
          function (/** @type {string} */ d) {
            return u('emphasis', [u('text', d)])
          }
        ),
        u('paragraph', [u('emphasis', [u('text', 'asd')])])
      )
    }
  )

  await t.test('security: replacer as string (safe)', async function () {
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
      ])
    )
  })
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
