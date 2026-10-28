import { type TSchema, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const parseAndValidateJson = <T extends TSchema>(jsonString: string, schema: T): Static<T> | null => {
    let parsed: unknown | null;

    try {
        parsed = JSON.parse(jsonString);
    } catch {
        parsed = null;
    }

    if (parsed === null || !Value.Check(schema, parsed))
        return null;

    return parsed as Static<T>;
};