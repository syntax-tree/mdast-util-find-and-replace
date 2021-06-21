/**
 * @typedef Options Configuration.
 * @property {Test} [ignore] `unist-util-is` test used to assert parents
 *
 * @typedef {import('mdast').Text} Text
 * @typedef {import('mdast').Parent} Parent
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 * @typedef {Parent['children'][number]|Root} Node
 *
 * @typedef {import('unist-util-visit-parents').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 *
 * @typedef RegExpMatchObject
 * @property {number} index
 * @property {string} input
 *
 * @typedef {string|RegExp} Find
 * @typedef {string|ReplaceFunction} Replace
 *
 * @typedef {[Find, Replace]} FindAndReplaceTuple
 * @typedef {Object.<string, Replace>} FindAndReplaceSchema
 * @typedef {Array.<FindAndReplaceTuple>} FindAndReplaceList
 *
 * @typedef {[RegExp, ReplaceFunction]} Pair
 * @typedef {Array.<Pair>} Pairs
 */

/**
 * @callback ReplaceFunction
 * @param {...any} parameters
 * @returns {Array.<PhrasingContent>|PhrasingContent|string|false|undefined|null}
 */

import escape from 'escape-string-regexp'
import {visitParents} from 'unist-util-visit-parents'
import {convert} from 'unist-util-is'

const own = {}.hasOwnProperty

/**
 * @param tree mdast tree
 * @param find Value to find and remove. When `string`, escaped and made into a global `RegExp`
 * @param [replace] Value to insert.
 *   * When `string`, turned into a Text node.
 *   * When `Function`, called with the results of calling `RegExp.exec` as
 *     arguments, in which case it can return a single or a list of `Node`,
 *     a `string` (which is wrapped in a `Text` node), or `false` to not replace
 * @param [options] Configuration.
 */
export const findAndReplace =
  /**
   * @type {(
   *   ((tree: Node, find: Find, replace?: Replace, options?: Options) => Node) &
   *   ((tree: Node, schema: FindAndReplaceSchema|FindAndReplaceList, options?: Options) => Node)
   * )}
   **/
  (
    /**
     * @param {Node} tree
     * @param {Find|FindAndReplaceSchema|FindAndReplaceList} find
     * @param {Replace|Options} [replace]
     * @param {Options} [options]
     */
    function (tree, find, replace, options) {
      /** @type {Options} */
      let settings
      /** @type {FindAndReplaceSchema|FindAndReplaceList} */
      let schema

      if (typeof find === 'string' || find instanceof RegExp) {
        // @ts-expect-error don’t expect options twice.
        schema = [[find, replace]]
        settings = options
      } else {
        schema = find
        // @ts-expect-error don’t expect replace twice.
        settings = replace
      }

      if (!settings) {
        settings = {}
      }

      const ignored = convert(settings.ignore || [])
      const pairs = toPairs(schema)
      let pairIndex = -1

      while (++pairIndex < pairs.length) {
        visitParents(tree, 'text', visitor)
      }

      return tree

      /** @type {import('unist-util-visit-parents').Visitor<Text>} */
      function visitor(node, parents) {
        let index = -1
        /** @type {Parent} */
        let parent
        /** @type {Parent} */
        let grandparent

        while (++index < parents.length) {
          // @ts-expect-error mdast vs. unist parent.
          parent = parents[index]

          if (
            ignored(
              parent,
              // @ts-expect-error mdast vs. unist parent.
              grandparent ? grandparent.children.indexOf(parent) : undefined,
              grandparent
            )
          ) {
            return
          }

          grandparent = parent
        }

        return handler(node, grandparent)
      }

      /**
       * @param {Text} node
       * @param {Parent} parent
       * @returns {VisitorResult}
       */
      function handler(node, parent) {
        const find = pairs[pairIndex][0]
        const replace = pairs[pairIndex][1]
        /** @type {Array.<PhrasingContent>} */
        let nodes = []
        let start = 0
        let index = parent.children.indexOf(node)
        /** @type {number} */
        let position
        /** @type {RegExpMatchArray} */
        let match
        /** @type {Array.<PhrasingContent>|PhrasingContent|string|false|undefined|null} */
        let value

        find.lastIndex = 0

        match = find.exec(node.value)

        while (match) {
          position = match.index
          // @ts-expect-error this is perfectly fine, typescript.
          value = replace(...match, {index: match.index, input: match.input})

          if (typeof value === 'string' && value.length > 0) {
            value = {type: 'text', value}
          }

          if (value !== false) {
            if (start !== position) {
              nodes.push({
                type: 'text',
                value: node.value.slice(start, position)
              })
            }

            if (value) {
              nodes = [].concat(nodes, value)
            }

            start = position + match[0].length
          }

          if (!find.global) {
            break
          }

          match = find.exec(node.value)
        }

        if (position === undefined) {
          nodes = [node]
          index--
        } else {
          if (start < node.value.length) {
            nodes.push({type: 'text', value: node.value.slice(start)})
          }

          parent.children.splice(index, 1, ...nodes)
        }

        return index + nodes.length + 1
      }
    }
  )

/**
 * @param {FindAndReplaceSchema|FindAndReplaceList} schema
 * @returns {Pairs}
 */
function toPairs(schema) {
  let index = -1
  /** @type {Pairs} */
  const result = []
  /** @type {string} */
  let key

  if (typeof schema !== 'object') {
    throw new TypeError('Expected array or object as schema')
  }

  if (Array.isArray(schema)) {
    while (++index < schema.length) {
      result.push([
        toExpression(schema[index][0]),
        toFunction(schema[index][1])
      ])
    }
  } else {
    for (key in schema) {
      if (own.call(schema, key)) {
        result.push([toExpression(key), toFunction(schema[key])])
      }
    }
  }

  return result
}

/**
 * @param {Find} find
 * @returns {RegExp}
 */
function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escape(find), 'g') : find
}

/**
 * @param {Replace} replace
 * @returns {ReplaceFunction}
 */
function toFunction(replace) {
  return typeof replace === 'function' ? replace : returner

  /** @type {ReplaceFunction} */
  function returner() {
    // @ts-expect-error it’s a string.
    return replace
  }
}
