import lodash from "lodash";

/**
 * Replaces all slots in the given object with the provided replacements.
 * If a slot matches a key in the replacements, it will be substituted.
 * If the replacement value is an object, and the slot covers the entire string,
 * the entire value will be replaced by the object. Otherwise, the object will be stringified.
 *
 * @param obj - The object containing slots to be replaced.
 * @param replacements - The replacements to use for the slot substitution.
 * @returns - A new object with all the slots replaced.
 *
 * @example
 * ```typescript
 * const testObj = {
 *   text: "Hello {{name}}",
 *   info: {
 *     age: "{{age}} years old",
 *     address: "{{addressObj.city}}124453"
 *   }
 * };
 *
 * const replacements = {
 *   name: "Alice",
 *   age: "25",
 *   addressObj: {
 *     street: "123 Main St",
 *     city: "Example City"
 *   }
 * };
 *
 * console.log(replaceSlots(testObj, replacements));
 * ```
 */
export function replaceSlots(
  obj: Record<string, any>,
  replacements: Record<string, any>,
): any {
  return lodash.cloneDeepWith(obj, (value: any) => {
    if (lodash.isString(value)) {
      // If the whole value is a slot
      const fullMatchReplacement = /^{{\s*(.*?)\s*}}$/.exec(value);
      if (fullMatchReplacement && !!fullMatchReplacement[1]) {
        const replacementValue = lodash.get(
          replacements,
          fullMatchReplacement[1],
        );
        if (replacementValue !== undefined) {
          return replacementValue;
        }
      }

      // If part of the value is a slot
      return value.replace(/{{\s*(.*?)\s*}}/g, (match, path) => {
        const replacementValue = lodash.get(replacements, path);
        return replacementValue !== undefined
          ? String(replacementValue)
          : match;
      });
    }
  });
}

/**
 * Merges two JSON objects safely by checking for key conflicts.
 * If a key exists in both `obj1` and `obj2`, it will throw an error.
 *
 * @param obj1 - The first object to merge.
 * @param obj2 - The second object to merge.
 * @returns A merged object containing properties from both `obj1` and `obj2`.
 * @throws {Error} Throws an error if a key exists in both `obj1` and `obj2`.
 *
 * @example
 * const objA = { a: 1, b: 2 };
 * const objB = { c: 3 };
 * mergeJSONSafely(objA, objB); // Returns { a: 1, b: 2, c: 3 }
 */
export function mergeJSONSafely(obj1: object, obj2: object): object {
  lodash.mergeWith(obj1, obj2, (objValue, srcValue, key, object, source) => {
    if (lodash.has(obj1, key) && lodash.has(obj2, key)) {
      throw new Error(`Pipe Params ${key} 与 globalParams 冲突`);
    }
    return undefined; // 返回undefined以使用默认的合并行为
  });
  return obj1;
}

/**
 * Determines if a variable is a plain object with string values.
 *
 * @param variable - The variable to check.
 * @returns `true` if the variable is a plain object and all its values are strings, otherwise returns `false`.
 *
 * @example
 * isRecordOfString({ a: 'hello', b: 'world' }); // Returns true
 * isRecordOfString({ a: 'hello', b: 123 });     // Returns false
 */
export function isRecordOfString(
  variable: any,
): variable is Record<string, string> {
  return (
    lodash.isPlainObject(variable) && lodash.every(variable, lodash.isString)
  );
}
