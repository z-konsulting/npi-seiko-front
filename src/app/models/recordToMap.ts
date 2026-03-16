export const recordToMap = <T extends Record<string, any>>(
  record: T,
): Map<string, T[keyof T]> => {
  return new Map(Object.entries(record));
};

function test<T>(record: string) {}

test('toto');
