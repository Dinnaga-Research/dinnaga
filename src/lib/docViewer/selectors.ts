// ABOUTME: Selector rewriter tokenizer — replace type selectors only (html/:root, body, main).
// ABOUTME: Handles strings, attribute brackets, escapes, and pseudo-class arguments correctly.

/**
 * Rewrite type selectors and pseudo-classes in a CSS selector string.
 * - html/:root → :host (or :host(compounds))
 * - body → doc-body
 * - main → doc-main
 * - :target → [data-doc-target] (UNIT-003)
 *
 * Must not touch:
 * - Attribute values (strings in [...])
 * - String values (in "..." or '...')
 * - Escaped characters (\)
 * - Pseudo-selectors like :main or #main or .body (unless explicitly handled)
 */
export function rewriteSelector(selectorText: string): string {
  let result = '';
  let i = 0;
  const len = selectorText.length;

  while (i < len) {
    const ch = selectorText[i]!;

    // Handle strings (double and single quotes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      result += ch;
      i++;
      while (i < len) {
        const c = selectorText[i]!;
        result += c;
        if (c === '\\' && i + 1 < len) {
          result += selectorText[++i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Handle escapes
    if (ch === '\\' && i + 1 < len) {
      result += ch + selectorText[i + 1];
      i += 2;
      continue;
    }

    // Handle attribute brackets (which can contain strings)
    if (ch === '[') {
      result += ch;
      i++;
      while (i < len) {
        const c = selectorText[i]!;
        if (c === '"' || c === "'") {
          const quote = c;
          result += c;
          i++;
          while (i < len) {
            const ac = selectorText[i]!;
            result += ac;
            if (ac === '\\' && i + 1 < len) {
              result += selectorText[++i];
            } else if (ac === quote) {
              i++;
              break;
            }
            i++;
          }
        } else if (c === '\\' && i + 1 < len) {
          result += c + selectorText[i + 1];
          i += 2;
        } else if (c === ']') {
          result += c;
          i++;
          break;
        } else {
          result += c;
          i++;
        }
      }
      continue;
    }

    // :target pseudo-class (not ::target-text or :target-within) -> [data-doc-target]
    if (
      ch === ':' &&
      selectorText.slice(i, i + 7) === ':target' &&
      selectorText[i - 1] !== ':' &&
      !(i + 7 < len && isIdentifierChar(selectorText[i + 7]!))
    ) {
      result += '[data-doc-target]';
      i += 7;
      continue;
    }

    // Check for :root pseudo-class
    if (ch === ':' && i + 5 <= len && selectorText.slice(i, i + 5) === ':root') {
      // Check if :root is followed by something that makes it not a type selector
      const afterRoot = i + 5;
      if (afterRoot < len && selectorText[afterRoot] === '\\') {
        // It's escaped, treat as literal
        result += ':root';
        i += 5;
      } else {
        const isTypeSelector = shouldRewriteTypeSelector(result, 'root');
        if (isTypeSelector) {
          const compound = extractCompound(selectorText, i + 5);
          result += `:host${compound ? `(${compound})` : ''}`;
          i += 5 + compound.length;
        } else {
          result += ':root';
          i += 5;
        }
      }
      continue;
    }

    // Check if we're at a potential identifier (could be a type selector)
    if (isIdentifierStart(ch)) {
      let id = '';
      while (i < len && isIdentifierChar(selectorText[i]!)) {
        id += selectorText[i]!;
        i++;
      }

      // Check if the identifier is followed by an escape - if so, don't rewrite
      if (i < len && selectorText[i]! === '\\') {
        result += id;
        continue;
      }

      // Decide if this is a rewritable type selector
      const isTypeSelector = shouldRewriteTypeSelector(result, id);

      if (isTypeSelector) {
        if (id === 'html' || id === 'root') {
          // Extract compound suffix
          const compound = extractCompound(selectorText, i);
          result += `:host${compound ? `(${compound})` : ''}`;
          i += compound.length;
        } else if (id === 'body') {
          result += 'doc-body';
        } else if (id === 'main') {
          result += 'doc-main';
        } else {
          result += id;
        }
      } else {
        result += id;
      }
      continue;
    }

    // Regular character
    result += ch;
    i++;
  }

  return result;
}

function isIdentifierStart(ch: string): boolean {
  return /[a-zA-Z_-]/.test(ch);
}

function isIdentifierChar(ch: string): boolean {
  return /[a-zA-Z0-9_-]/.test(ch);
}

/**
 * Check if an identifier is a type selector that should be rewritten.
 * Type selectors appear:
 * - At start of selector
 * - After a combinator (>, +, ~, space)
 * - After a comma
 * - After ( in :is(), :where(), :not(), :has()
 *
 * NOT after: ., #, :, - or an identifier char
 */
function shouldRewriteTypeSelector(resultSoFar: string, id: string): boolean {
  // Special cases that should never be rewritten
  if (id === 'tbody') return false;
  if (id === 'body' || id === 'html' || id === 'root' || id === 'main') {
    // Check what comes before
    const trimmed = resultSoFar.trimEnd();
    if (trimmed.length === 0) {
      // At start of selector
      return true;
    }

    const lastCh = trimmed[trimmed.length - 1];

    // After combinator or comma (or space which is whitespace combinator)
    if (lastCh === '>' || lastCh === '+' || lastCh === '~' || lastCh === ',') {
      return true;
    }

    // After whitespace (which is a combinator) if the part before it is valid
    if (/\s$/.test(resultSoFar)) {
      // Make sure it's not inside something like a selector list continuation
      const beforeSpace = trimmed[trimmed.length - 1];
      if (beforeSpace && (beforeSpace === ',' || beforeSpace === '(' || /\w/.test(beforeSpace) || beforeSpace === ']' || beforeSpace === ')')) {
        return true;
      }
    }

    // After ( in :is, :where, :not, :has
    if (lastCh === '(') {
      // Check if it's a pseudo-class we care about
      const match = trimmed.match(/:(?:is|where|not|has)\(\s*$/);
      if (match) {
        return true;
      }
    }

    return false;
  }

  return false;
}

/**
 * Extract the compound suffix after a type selector.
 * Compound = [attr] | .class | #id | :pseudo(...)
 */
function extractCompound(text: string, startIdx: number): string {
  let compound = '';
  let i = startIdx;
  const len = text.length;

  while (i < len) {
    const ch = text[i]!;

    // Attribute selector
    if (ch === '[') {
      const attrStart = i;
      let depth = 1;
      i++;
      while (i < len && depth > 0) {
        const c = text[i]!;
        if (c === '"' || c === "'") {
          const quote = c;
          i++;
          while (i < len) {
            if (text[i]! === '\\' && i + 1 < len) {
              i += 2;
            } else if (text[i]! === quote) {
              i++;
              break;
            } else {
              i++;
            }
          }
        } else if (c === '\\' && i + 1 < len) {
          i += 2;
        } else if (c === '[') {
          depth++;
          i++;
        } else if (c === ']') {
          depth--;
          if (depth === 0) {
            i++;
          } else {
            i++;
          }
        } else {
          i++;
        }
      }
      compound += text.substring(attrStart, i);
    }
    // Class selector
    else if (ch === '.') {
      const classStart = i;
      i++;
      while (i < len && isIdentifierChar(text[i]!)) {
        i++;
      }
      compound += text.substring(classStart, i);
    }
    // ID selector
    else if (ch === '#') {
      const idStart = i;
      i++;
      while (i < len && isIdentifierChar(text[i]!)) {
        i++;
      }
      compound += text.substring(idStart, i);
    }
    // Pseudo-class
    else if (ch === ':' && i + 1 < len && text[i + 1] !== ':') {
      i++;
      let pseudoName = '';
      while (i < len && isIdentifierChar(text[i]!)) {
        pseudoName += text[i]!;
        i++;
      }

      compound += ':' + pseudoName;

      // Handle arguments like :not(...)
      if (i < len && text[i]! === '(') {
        let depth = 1;
        compound += '(';
        i++;
        while (i < len && depth > 0) {
          const c = text[i]!;
          if (c === '"' || c === "'") {
            const quote = c;
            compound += c;
            i++;
            while (i < len) {
              compound += text[i]!;
              if (text[i]! === '\\' && i + 1 < len) {
                compound += text[++i];
              } else if (text[i]! === quote) {
                i++;
                break;
              } else {
                i++;
              }
            }
          } else if (c === '\\' && i + 1 < len) {
            compound += c + text[i + 1];
            i += 2;
          } else if (c === '(') {
            depth++;
            compound += c;
            i++;
          } else if (c === ')') {
            depth--;
            compound += c;
            if (depth === 0) {
              i++;
            } else {
              i++;
            }
          } else {
            compound += c;
            i++;
          }
        }
      }
    }
    // Not part of compound
    else {
      break;
    }
  }

  return compound;
}
