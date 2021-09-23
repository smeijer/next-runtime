export function setField<T extends Record<string, unknown>>(
  data: any,
  name: string,
  value: unknown,
): T {
  // a[b][c] becomes [ a, b, c ]
  const path = name.replace(/\[([^\]]+)?]/g, '.$1').split('.');
  let pointer = data;

  // walk the path, and create objects and arrays where required
  for (let i = 0; i < path.length - 1; i++) {
    // empty strings and numeric values, indicate arrays
    pointer[path[i]] =
      pointer[path[i]] || (/^$|^[0-9]*$/.test(path[i + 1]) ? [] : {});

    pointer = pointer[path[i]];
  }

  const key = path[path.length - 1];

  if (Array.isArray(pointer)) {
    pointer.push(value);
  } else if (Array.isArray(pointer[key])) {
    pointer[key].push(value);
  } else if (typeof pointer[key] !== 'undefined') {
    pointer[key] = [pointer[key], value];
  } else {
    pointer[key] = value;
  }

  return data as T;
}
