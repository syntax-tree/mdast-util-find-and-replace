/**
 * @import {Root} from 'mdast'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {findAndReplace} from 'mdast-util-find-and-replace'
import {u} from 'unist-builder'

test('findAndReplace', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('mdast-util-find-and-replace')).sort(),
      ['findAndReplace']
    )
  })

  await t.test(
    'should throw on invalid search and replaces',
    async function () {
      assert.throws(function () {
        // @ts-expect-error: check that the runtime throws an error.
        findAndReplace(create(), true)
      }, /Expected find and replace tuple or list of tuples/)
    }
  )

  await t.test('should remove without `replace`', async function () {
    const tree = create()

    findAndReplace(tree, ['emphasis'])

    assert.deepEqual(
      tree,
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
    'should work when given a find-and-replace tuple',
    async function () {
      const tree = create()
      findAndReplace(tree, ['emphasis', '!!!'])
      assert.deepEqual(
        tree,
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
      const tree = create()

      findAndReplace(tree, [
        /em(\w+)is/,
        function (/** @type {string} */ _, /** @type {string} */ $1) {
          return '[' + $1 + ']'
        }
      ])

      assert.deepEqual(
        tree,
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
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return ''
        }
      ])

      assert.deepEqual(
        tree,
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
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return u('delete', [u('break')])
        }
      ])

      assert.deepEqual(
        tree,
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
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return [u('delete', []), u('break')]
        }
      ])

      assert.deepEqual(
        tree,
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

  await t.test('should work when given a list of tuples', async function () {
    const tree = create()

    findAndReplace(tree, [
      ['emphasis', '!!!'],
      ['importance', '???']
    ])

    assert.deepEqual(
      tree,
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
  })

  await t.test(
    'should work when given an empty list of tuples',
    async function () {
      const tree = create()

      findAndReplace(tree, [])

      assert.deepEqual(tree, create())
    }
  )

  await t.test('should work on partial matches', async function () {
    const tree = create()

    findAndReplace(tree, [/\Bmp\B/, '[MP]'])

    assert.deepEqual(
      tree,
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
    const tree = create()

    findAndReplace(tree, [
      [
        'emphasis',
        function () {
          return u('link', {url: 'x'}, [u('text', 'importance')])
        }
      ],
      ['importance', 'something else']
    ])

    assert.deepEqual(
      tree,

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
    const tree = u('paragraph', [
      u('text', 'Some '),
      u('emphasis', [u('text', 'importance')]),
      u('text', ' and '),
      u('strong', [u('text', 'importance')]),
      u('text', '.')
    ])

    findAndReplace(tree, ['importance', '!!!'], {ignore: 'strong'})

    assert.deepEqual(
      tree,
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
    const tree = u('paragraph', [
      u('text', 'Some emphasis, importance, and code.')
    ])

    findAndReplace(tree, [
      [
        'importance',
        function (/** @type {string} */ value) {
          return u('strong', [u('text', value)])
        }
      ],
      [
        'code',
        function (/** @type {string} */ value) {
          return u('inlineCode', value)
        }
      ],
      [
        'emphasis',
        function (/** @type {string} */ value) {
          return u('emphasis', [u('text', value)])
        }
      ]
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should not be order-sensitive with regexes', async function () {
    const tree = u('paragraph', [
      u('text', 'Some emphasis, importance, and code.')
    ])

    findAndReplace(tree, [
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
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should support a match, and then a `false`', async function () {
    const tree = u('paragraph', [u('text', 'aaa bbb')])

    findAndReplace(tree, [
      [
        /\b\w+\b/g,
        function (/** @type {string} */ value) {
          return value === 'aaa' ? u('strong', [u('text', value)]) : false
        }
      ]
    ])

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'strong', children: [{type: 'text', value: 'aaa'}]},
        {type: 'text', value: ' bbb'}
      ]
    })
  })

  await t.test('should not replace when returning false', async function () {
    const tree = create()

    findAndReplace(tree, [
      'emphasis',
      function () {
        return false
      }
    ])

    assert.deepEqual(
      tree,
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

  await t.test('should not treat `false` as a match', async function () {
    /** @type {Root} */
    const tree = {type: 'root', children: [{type: 'text', value: ':1:2:'}]}

    findAndReplace(tree, [
      /:(\d+):/g,
      /**
       * @param {string} _
       * @param {string} $1
       */
      function (_, $1) {
        return $1 === '2' ? u('strong', [u('text', $1)]) : false
      }
    ])

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {type: 'text', value: ':1'},
        {type: 'strong', children: [{type: 'text', value: '2'}]}
      ]
    })
  })

  await t.test('should not recurse into a replaced value', async function () {
    const tree = u('paragraph', [u('text', 'asd.')])

    findAndReplace(tree, [
      'asd',
      function (/** @type {string} */ d) {
        return d
      }
    ])

    assert.deepEqual(tree, u('paragraph', [u('text', 'asd'), u('text', '.')]))
  })

  await t.test(
    'should not recurse into a replaced node (head)',
    async function () {
      const tree = u('paragraph', [u('text', 'asd.')])

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return u('emphasis', [u('text', d)])
        }
      ])

      assert.deepEqual(
        tree,
        u('paragraph', [u('emphasis', [u('text', 'asd')]), u('text', '.')])
      )
    }
  )

  await t.test(
    'should not recurse into a replaced node (tail)',
    async function () {
      const tree = u('paragraph', [u('text', '.asd')])

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return u('emphasis', [u('text', d)])
        }
      ])

      assert.deepEqual(
        tree,
        u('paragraph', [u('text', '.'), u('emphasis', [u('text', 'asd')])])
      )
    }
  )

  await t.test(
    'should not recurse into a replaced node (head and tail)',
    async function () {
      const tree = u('paragraph', [u('text', 'asd')])

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return u('emphasis', [u('text', d)])
        }
      ])

      assert.deepEqual(
        tree,
        u('paragraph', [u('emphasis', [u('text', 'asd')])])
      )
    }
  )

  await t.test('security: replacer as string (safe)', async function () {
    const tree = create()

    findAndReplace(tree, ['and', 'alert(1)'])

    assert.deepEqual(
      tree,
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

  await t.test(
    'should replace multiple matches in the same node',
    async function () {
      const tree = create()

      findAndReplace(tree, [/(emph|sis)/g, 'foo'])

      assert.deepEqual(
        tree,
        u('paragraph', [
          u('text', 'Some '),
          u('emphasis', [u('text', 'foo'), u('text', 'a'), u('text', 'foo')]),
          u('text', ', '),
          u('strong', [u('text', 'importance')]),
          u('text', ', and '),
          u('inlineCode', 'code'),
          u('text', '.')
        ])
      )
    }
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
