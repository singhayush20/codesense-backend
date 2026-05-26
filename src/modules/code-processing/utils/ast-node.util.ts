import Parser from 'web-tree-sitter';

/**
 * Utility helper methods for working with Tree-sitter AST nodes.
 *
 * These utilities are intentionally language-agnostic.
 * They work on generic AST node structures produced by Tree-sitter,
 * regardless of whether the source code is TypeScript, Java, Python, etc.
 */
export class AstNodeUtil {
  /**
   * Extracts the exact source code represented by a node.
   *
   * Tree-sitter nodes contain:
   * - startIndex → starting character index in source
   * - endIndex → ending character index in source
   *
   * Example:
   *
   * Source:
   *   function greet() {}
   *
   * If node represents the function declaration,
   * this method returns:
   *
   *   function greet() {}
   */
  static getNodeText(source: string, node: Parser.Node): string {
    return source.slice(node.startIndex, node.endIndex);
  }

  /**
   * Finds the nearest "named" AST node that contains the given line.
   *
   * Tree-sitter contains two kinds of nodes:
   *
   * 1. Named nodes
   *    Examples:
   *    - class_declaration
   *    - function_declaration
   *    - if_statement
   *
   * 2. Anonymous/internal syntax nodes
   *    Examples:
   *    - "{"
   *    - "("
   *    - ";"
   *
   * Usually, for PR review systems or AST analysis,
   * we care only about named nodes.
   *
   * This method:
   * 1. Finds the deepest node at the given line
   * 2. Walks upward in the AST
   * 3. Returns the first named node
   *
   * Example:
   *
   * function greet() {
   *   console.log('hello');
   * }
   *
   * If line=2:
   * - deepest node may be string literal or identifier
   * - method walks upward
   * - returns enclosing expression/function/etc
   *
   * This is extremely useful for:
   * - PR diff mapping
   * - extracting changed code blocks
   * - building LLM context
   */
  static findEnclosingNamedNodeAtLine(
    root: Parser.Node,
    line: number,
  ): Parser.Node | null {
    /**
     * descendantForPosition():
     *
     * Finds the deepest node at the given source position.
     *
     * Tree-sitter uses:
     * - zero-based row indexing
     * - zero-based column indexing
     *
     * Therefore:
     * line - 1
     */
    let current: Parser.Node | null = root.descendantForPosition({
      row: line - 1,
      column: 0,
    });

    /**
     * Walk upward through parent nodes
     * until we find a named node.
     */
    while (current) {
      /**
       * isNamed filters out syntax-only nodes.
       */
      if (current.isNamed) {
        return current;
      }

      current = current.parent;
    }

    return null;
  }

  /**
   * Finds the closest named parent node.
   *
   * This is useful when:
   * - current node is too granular
   * - current node is an identifier/token
   * - you want a meaningful enclosing structure
   *
   * Example:
   *
   * console.log(user.name)
   *
   * If current node is:
   *   "name"
   *
   * closest named parent may become:
   *   member_expression
   *
   * or higher:
   *   call_expression
   */
  static findClosestNamedParent(node: Parser.Node): Parser.Node | null {
    let current = node.parent;

    while (current) {
      if (current.isNamed) {
        return current;
      }

      current = current.parent;
    }

    return null;
  }
}
