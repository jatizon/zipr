import { describe, expect, test } from '@jest/globals';
import { Type } from '@sinclair/typebox';
import { parseAndValidateJson } from '@src/helpers/parsing.js';


const schema = Type.Object({ id: Type.Number(), name: Type.String() });

describe('parseAndValidateJson', () => {
    test('returns the parsed object when the JSON matches the schema', () => {
        const value = { id: 1, name: 'zipr' };

        expect(parseAndValidateJson(JSON.stringify(value), schema)).toEqual(value);
    });

    test('returns null when the string is not valid JSON', () => {
        expect(parseAndValidateJson('{"id": 1,', schema)).toBeNull();
    });

    test('returns null when the JSON does not match the schema', () => {
        // Well-formed JSON with the right keys but a wrong type, so only the schema check can reject it.
        expect(parseAndValidateJson(JSON.stringify({ id: '1', name: 'zipr' }), schema)).toBeNull();
    });
});
