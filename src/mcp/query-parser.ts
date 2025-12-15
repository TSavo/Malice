/**
 * Query DSL Parser and MongoDB Translator
 *
 * Syntax:
 *   .property == value           # Equality
 *   .property != value           # Inequality
 *   .property > 5                # Numeric comparisons: >, <, >=, <=
 *   .property contains 'text'    # Substring match (case-insensitive)
 *   .property like 'foo*'        # Glob pattern (* = any, ? = single char)
 *   .property matches 'regex'    # Regex match
 *   .property exists             # Property is defined
 *   not .property exists         # Negation
 *   X and Y                      # Logical AND
 *   X or Y                       # Logical OR
 *   (X or Y) and Z               # Grouping
 *
 * Special properties:
 *   .id, .parent - direct fields
 *   .name, .description, etc. - properties.X
 */

// Token types
type TokenType =
  | 'DOT'
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'NULL'
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'CONTAINS'
  | 'LIKE'
  | 'MATCHES'
  | 'EXISTS'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string | number | boolean | null;
  pos: number;
}

// AST Node types
type ASTNode =
  | { type: 'comparison'; property: string; operator: string; value: any }
  | { type: 'exists'; property: string; negated: boolean }
  | { type: 'and'; left: ASTNode; right: ASTNode }
  | { type: 'or'; left: ASTNode; right: ASTNode }
  | { type: 'not'; operand: ASTNode };

// Tokenizer
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  const keywords: Record<string, TokenType> = {
    and: 'AND',
    or: 'OR',
    not: 'NOT',
    contains: 'CONTAINS',
    like: 'LIKE',
    matches: 'MATCHES',
    exists: 'EXISTS',
    true: 'BOOLEAN',
    false: 'BOOLEAN',
    null: 'NULL',
  };

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    const startPos = pos;

    // Dot
    if (input[pos] === '.') {
      tokens.push({ type: 'DOT', value: '.', pos: startPos });
      pos++;
      continue;
    }

    // Parentheses
    if (input[pos] === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: startPos });
      pos++;
      continue;
    }
    if (input[pos] === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: startPos });
      pos++;
      continue;
    }

    // Operators
    if (input.slice(pos, pos + 2) === '==') {
      tokens.push({ type: 'EQ', value: '==', pos: startPos });
      pos += 2;
      continue;
    }
    if (input.slice(pos, pos + 2) === '!=') {
      tokens.push({ type: 'NEQ', value: '!=', pos: startPos });
      pos += 2;
      continue;
    }
    if (input.slice(pos, pos + 2) === '>=') {
      tokens.push({ type: 'GTE', value: '>=', pos: startPos });
      pos += 2;
      continue;
    }
    if (input.slice(pos, pos + 2) === '<=') {
      tokens.push({ type: 'LTE', value: '<=', pos: startPos });
      pos += 2;
      continue;
    }
    if (input[pos] === '>') {
      tokens.push({ type: 'GT', value: '>', pos: startPos });
      pos++;
      continue;
    }
    if (input[pos] === '<') {
      tokens.push({ type: 'LT', value: '<', pos: startPos });
      pos++;
      continue;
    }

    // String literals
    if (input[pos] === "'" || input[pos] === '"') {
      const quote = input[pos];
      pos++;
      let str = '';
      while (pos < input.length && input[pos] !== quote) {
        if (input[pos] === '\\' && pos + 1 < input.length) {
          pos++;
          str += input[pos];
        } else {
          str += input[pos];
        }
        pos++;
      }
      if (input[pos] !== quote) {
        throw new Error(`Unterminated string at position ${startPos}`);
      }
      pos++;
      tokens.push({ type: 'STRING', value: str, pos: startPos });
      continue;
    }

    // Numbers
    if (/[0-9-]/.test(input[pos])) {
      let numStr = '';
      if (input[pos] === '-') {
        numStr += '-';
        pos++;
      }
      while (pos < input.length && /[0-9.]/.test(input[pos])) {
        numStr += input[pos];
        pos++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr), pos: startPos });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(input[pos])) {
      let ident = '';
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos])) {
        ident += input[pos];
        pos++;
      }
      const lower = ident.toLowerCase();
      if (keywords[lower]) {
        if (lower === 'true') {
          tokens.push({ type: 'BOOLEAN', value: true, pos: startPos });
        } else if (lower === 'false') {
          tokens.push({ type: 'BOOLEAN', value: false, pos: startPos });
        } else if (lower === 'null') {
          tokens.push({ type: 'NULL', value: null, pos: startPos });
        } else {
          tokens.push({ type: keywords[lower], value: lower, pos: startPos });
        }
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, pos: startPos });
      }
      continue;
    }

    throw new Error(`Unexpected character '${input[pos]}' at position ${pos}`);
  }

  tokens.push({ type: 'EOF', value: '', pos: pos });
  return tokens;
}

// Parser
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.current();
    if (token.type !== 'EOF') {
      this.pos++;
    }
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at position ${token.pos}`);
    }
    return this.advance();
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.current().type);
  }

  parse(): ASTNode {
    const result = this.parseOr();
    if (this.current().type !== 'EOF') {
      throw new Error(`Unexpected token ${this.current().type} at position ${this.current().pos}`);
    }
    return result;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.match('OR')) {
      this.advance();
      const right = this.parseAnd();
      left = { type: 'or', left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();
    while (this.match('AND')) {
      this.advance();
      const right = this.parseNot();
      left = { type: 'and', left, right };
    }
    return left;
  }

  private parseNot(): ASTNode {
    if (this.match('NOT')) {
      this.advance();
      const operand = this.parseNot();
      return { type: 'not', operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    // Parenthesized expression
    if (this.match('LPAREN')) {
      this.advance();
      const expr = this.parseOr();
      this.expect('RPAREN');
      return expr;
    }

    // Property expression: .property operator value
    if (this.match('DOT')) {
      this.advance();
      const propToken = this.expect('IDENTIFIER');
      const property = propToken.value as string;

      // Check for 'exists'
      if (this.match('EXISTS')) {
        this.advance();
        return { type: 'exists', property, negated: false };
      }

      // Get operator
      const opToken = this.current();
      let operator: string;
      if (this.match('EQ')) {
        operator = '==';
      } else if (this.match('NEQ')) {
        operator = '!=';
      } else if (this.match('GT')) {
        operator = '>';
      } else if (this.match('GTE')) {
        operator = '>=';
      } else if (this.match('LT')) {
        operator = '<';
      } else if (this.match('LTE')) {
        operator = '<=';
      } else if (this.match('CONTAINS')) {
        operator = 'contains';
      } else if (this.match('LIKE')) {
        operator = 'like';
      } else if (this.match('MATCHES')) {
        operator = 'matches';
      } else {
        throw new Error(`Expected operator but got ${opToken.type} at position ${opToken.pos}`);
      }
      this.advance();

      // Get value
      const valueToken = this.current();
      let value: any;
      if (this.match('STRING')) {
        value = valueToken.value;
        this.advance();
      } else if (this.match('NUMBER')) {
        value = valueToken.value;
        this.advance();
      } else if (this.match('BOOLEAN')) {
        value = valueToken.value;
        this.advance();
      } else if (this.match('NULL')) {
        value = null;
        this.advance();
      } else {
        throw new Error(`Expected value but got ${valueToken.type} at position ${valueToken.pos}`);
      }

      return { type: 'comparison', property, operator, value };
    }

    throw new Error(`Unexpected token ${this.current().type} at position ${this.current().pos}`);
  }
}

// MongoDB query translator
function translateToMongo(ast: ASTNode): Record<string, any> {
  switch (ast.type) {
    case 'and':
      return { $and: [translateToMongo(ast.left), translateToMongo(ast.right)] };

    case 'or':
      return { $or: [translateToMongo(ast.left), translateToMongo(ast.right)] };

    case 'not':
      // MongoDB's $not only works on operators, so we use $nor for expressions
      return { $nor: [translateToMongo(ast.operand)] };

    case 'exists': {
      const field = getMongoField(ast.property);
      return { [field]: { $exists: !ast.negated } };
    }

    case 'comparison': {
      const field = getMongoField(ast.property);
      const { operator, value } = ast;

      switch (operator) {
        case '==':
          return { [field]: value };
        case '!=':
          return { [field]: { $ne: value } };
        case '>':
          return { [field]: { $gt: value } };
        case '>=':
          return { [field]: { $gte: value } };
        case '<':
          return { [field]: { $lt: value } };
        case '<=':
          return { [field]: { $lte: value } };
        case 'contains':
          // Case-insensitive substring match
          return { [field]: { $regex: escapeRegex(value), $options: 'i' } };
        case 'like':
          // Glob to regex: * -> .*, ? -> .
          const globRegex = '^' + escapeRegex(value).replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$';
          return { [field]: { $regex: globRegex, $options: 'i' } };
        case 'matches':
          // Direct regex
          return { [field]: { $regex: value } };
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    }

    default:
      throw new Error(`Unknown AST node type: ${(ast as any).type}`);
  }
}

// Map property names to MongoDB fields
function getMongoField(property: string): string {
  // Direct fields on the document
  const directFields = ['_id', 'id', 'parent', 'created', 'modified'];
  if (directFields.includes(property)) {
    return property === 'id' ? '_id' : property;
  }
  // Properties are stored as { type, value } objects
  return `properties.${property}.value`;
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse a query string and return a MongoDB query object
 */
export function parseQuery(query: string): Record<string, any> {
  const tokens = tokenize(query);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return translateToMongo(ast);
}

/**
 * Validate a query string without executing it
 */
export function validateQuery(query: string): { valid: boolean; error?: string } {
  try {
    parseQuery(query);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}
