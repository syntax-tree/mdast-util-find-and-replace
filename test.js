/**
 * @import {Paragraph, Root} from 'mdast'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {findAndReplace} from 'mdast-util-find-and-replace'

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

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: []},
        {type: 'text', value: ', '},
        {type: 'strong', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: ', and '},
        {type: 'inlineCode', value: 'code'},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test(
    'should work when given a find-and-replace tuple',
    async function () {
      const tree = create()
      findAndReplace(tree, ['emphasis', '!!!'])
      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {type: 'emphasis', children: [{type: 'text', value: '!!!'}]},
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
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

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {type: 'emphasis', children: [{type: 'text', value: '[phas]'}]},
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
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

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {type: 'emphasis', children: []},
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
    }
  )

  await t.test(
    'should work when given `replace` returns a node',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return {type: 'delete', children: [{type: 'break'}]}
        }
      ])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {
            type: 'emphasis',
            children: [{type: 'delete', children: [{type: 'break'}]}]
          },
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
    }
  )

  await t.test(
    'should work when given `replace` returns a list of nodes',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return [{type: 'delete', children: []}, {type: 'break'}]
        }
      ])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {
            type: 'emphasis',
            children: [{type: 'delete', children: []}, {type: 'break'}]
          },
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
    }
  )

  await t.test('should work when given a list of tuples', async function () {
    const tree = create()

    findAndReplace(tree, [
      ['emphasis', '!!!'],
      ['importance', '???']
    ])

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: [{type: 'text', value: '!!!'}]},
        {type: 'text', value: ', '},
        {type: 'strong', children: [{type: 'text', value: '???'}]},
        {type: 'text', value: ', and '},
        {type: 'inlineCode', value: 'code'},
        {type: 'text', value: '.'}
      ]
    })
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

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {
          type: 'emphasis',
          children: [
            {type: 'text', value: 'e'},
            {type: 'text', value: '[MP]'},
            {type: 'text', value: 'hasis'}
          ]
        },
        {type: 'text', value: ', '},
        {
          type: 'strong',
          children: [
            {type: 'text', value: 'i'},
            {type: 'text', value: '[MP]'},
            {type: 'text', value: 'ortance'}
          ]
        },
        {type: 'text', value: ', and '},
        {type: 'inlineCode', value: 'code'},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test('should find-and-replace recursively', async function () {
    const tree = create()

    findAndReplace(tree, [
      [
        'emphasis',
        function () {
          return {
            type: 'link',
            url: 'x',
            children: [{type: 'text', value: 'importance'}]
          }
        }
      ],
      ['importance', 'something else']
    ])

    assert.deepEqual(
      tree,

      {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {
            type: 'emphasis',
            children: [
              {
                type: 'link',
                url: 'x',
                children: [{type: 'text', value: 'something else'}]
              }
            ]
          },
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'something else'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      }
    )
  })

  await t.test('should ignore from options', async function () {
    /** @type {Paragraph} */
    const tree = {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: ' and '},
        {type: 'strong', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: '.'}
      ]
    }

    findAndReplace(tree, ['importance', '!!!'], {ignore: 'strong'})

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: [{type: 'text', value: '!!!'}]},
        {type: 'text', value: ' and '},
        {type: 'strong', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test('should not be order-sensitive with strings', async function () {
    /** @type {Paragraph} */
    const tree = {
      type: 'paragraph',
      children: [{type: 'text', value: 'Some emphasis, importance, and code.'}]
    }

    findAndReplace(tree, [
      [
        'importance',
        function (/** @type {string} */ value) {
          return {type: 'strong', children: [{type: 'text', value}]}
        }
      ],
      [
        'code',
        function (/** @type {string} */ value) {
          return {type: 'inlineCode', value}
        }
      ],
      [
        'emphasis',
        function (/** @type {string} */ value) {
          return {type: 'emphasis', children: [{type: 'text', value}]}
        }
      ]
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should not be order-sensitive with regexes', async function () {
    /** @type {Paragraph} */
    const tree = {
      type: 'paragraph',
      children: [{type: 'text', value: 'Some emphasis, importance, and code.'}]
    }

    findAndReplace(tree, [
      [
        /importance/g,
        function (/** @type {string} */ value) {
          return {type: 'strong', children: [{type: 'text', value}]}
        }
      ],
      [
        /code/g,
        function (/** @type {string} */ value) {
          return {type: 'inlineCode', value}
        }
      ],
      [
        /emphasis/g,
        function (/** @type {string} */ value) {
          return {type: 'emphasis', children: [{type: 'text', value}]}
        }
      ]
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should support a match, and then a `false`', async function () {
    /** @type {Paragraph} */
    const tree = {
      type: 'paragraph',
      children: [{type: 'text', value: 'aaa bbb'}]
    }

    findAndReplace(tree, [
      [
        /\b\w+\b/g,
        function (/** @type {string} */ value) {
          return value === 'aaa'
            ? {type: 'strong', children: [{type: 'text', value}]}
            : false
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

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: [{type: 'text', value: 'emphasis'}]},
        {type: 'text', value: ', '},
        {type: 'strong', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: ', and '},
        {type: 'inlineCode', value: 'code'},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test('should not treat `false` as a match', async function () {
    /** @type {Root} */
    const tree = {type: 'root', children: [{type: 'text', value: ':1:2:'}]}

    findAndReplace(tree, [
      /:(\d+):/g,
      /**
       * Turn `:2:` into strong, leave others.
       *
       * @param {string} _
       *   Whole match.
       * @param {string} $1
       *   Number.
       */
      function (_, $1) {
        return $1 === '2'
          ? {type: 'strong', children: [{type: 'text', value: $1}]}
          : false
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
    /** @type {Paragraph} */
    const tree = {type: 'paragraph', children: [{type: 'text', value: 'asd.'}]}

    findAndReplace(tree, [
      'asd',
      function (/** @type {string} */ d) {
        return d
      }
    ])

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'asd'},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test(
    'should not recurse into a replaced node (head)',
    async function () {
      /** @type {Paragraph} */
      const tree = {
        type: 'paragraph',
        children: [{type: 'text', value: 'asd.'}]
      }

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return {type: 'emphasis', children: [{type: 'text', value: d}]}
        }
      ])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'emphasis', children: [{type: 'text', value: 'asd'}]},
          {type: 'text', value: '.'}
        ]
      })
    }
  )

  await t.test(
    'should not recurse into a replaced node (tail)',
    async function () {
      /** @type {Paragraph} */
      const tree = {
        type: 'paragraph',
        children: [{type: 'text', value: '.asd'}]
      }

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return {type: 'emphasis', children: [{type: 'text', value: d}]}
        }
      ])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: '.'},
          {type: 'emphasis', children: [{type: 'text', value: 'asd'}]}
        ]
      })
    }
  )

  await t.test(
    'should not recurse into a replaced node (head and tail)',
    async function () {
      /** @type {Paragraph} */
      const tree = {type: 'paragraph', children: [{type: 'text', value: 'asd'}]}

      findAndReplace(tree, [
        'asd',
        function (/** @type {string} */ d) {
          return {type: 'emphasis', children: [{type: 'text', value: d}]}
        }
      ])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [{type: 'emphasis', children: [{type: 'text', value: 'asd'}]}]
      })
    }
  )

  await t.test('security: replacer as string (safe)', async function () {
    const tree = create()

    findAndReplace(tree, ['and', 'alert(1)'])

    assert.deepEqual(tree, {
      type: 'paragraph',
      children: [
        {type: 'text', value: 'Some '},
        {type: 'emphasis', children: [{type: 'text', value: 'emphasis'}]},
        {type: 'text', value: ', '},
        {type: 'strong', children: [{type: 'text', value: 'importance'}]},
        {type: 'text', value: ', '},
        {type: 'text', value: 'alert(1)'},
        {type: 'text', value: ' '},
        {type: 'inlineCode', value: 'code'},
        {type: 'text', value: '.'}
      ]
    })
  })

  await t.test(
    'should replace multiple matches in the same node',
    async function () {
      const tree = create()

      findAndReplace(tree, [/(emph|sis)/g, 'foo'])

      assert.deepEqual(tree, {
        type: 'paragraph',
        children: [
          {type: 'text', value: 'Some '},
          {
            type: 'emphasis',
            children: [
              {type: 'text', value: 'foo'},
              {type: 'text', value: 'a'},
              {type: 'text', value: 'foo'}
            ]
          },
          {type: 'text', value: ', '},
          {type: 'strong', children: [{type: 'text', value: 'importance'}]},
          {type: 'text', value: ', and '},
          {type: 'inlineCode', value: 'code'},
          {type: 'text', value: '.'}
        ]
      })
    }
  )
})

/**
 * Create a paragraph with some content.
 *
 * @returns {Paragraph}
 *   Paragraph.
 */
function create() {
  return {
    type: 'paragraph',
    children: [
      {type: 'text', value: 'Some '},
      {type: 'emphasis', children: [{type: 'text', value: 'emphasis'}]},
      {type: 'text', value: ', '},
      {type: 'strong', children: [{type: 'text', value: 'importance'}]},
      {type: 'text', value: ', and '},
      {type: 'inlineCode', value: 'code'},
      {type: 'text', value: '.'}
    ]
  }
}
