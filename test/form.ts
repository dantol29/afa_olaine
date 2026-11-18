/** Builds FormData the way a browser submits an admin form: a list value becomes repeated fields
 *  (checkbox groups, multi-file inputs), a File is sent as a file field. */
export function formData(fields: Record<string, string | File | (string | File)[]>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(name, item);
  }
  return data;
}

/** Returns the base fields with some replaced; `undefined` removes a field, as if the input were missing. */
export function withFields<T extends Record<string, unknown>>(base: T, changes: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...base, ...changes };
  for (const [name, value] of Object.entries(result)) if (value === undefined) delete result[name];
  return result as Record<string, string | File | (string | File)[]>;
}
