import { describe, it, expect } from 'vitest';
import { generateTypeScriptInterfaces, generateZodSchema, generateJavaPOJO, generateSqlDDL } from './generators';

describe('Generators', () => {
    const sampleJson = {
        id: 1,
        name: "Test",
        isActive: true, // Note: JSON.parse might typically not produce boolean from string unless specifically handled, but input here is object
        tags: ["a", "b"],
        meta: {
            created: "2023-01-01",
            count: 10
        }
    };

    describe('generateTypeScriptInterfaces', () => {
        it('should generate valid interfaces', () => {
            const result = generateTypeScriptInterfaces(sampleJson, 'User');
            expect(result).toContain('export interface User {');
            expect(result).toContain('id: number;');
            expect(result).toContain('name: string;');
            // Nested
            expect(result).toContain('export interface Meta {');
            expect(result).toContain('meta: Meta;');
        });
    });

    describe('generateZodSchema', () => {
        it('should generate valid Zod schema', () => {
            const result = generateZodSchema(sampleJson, 'userSchema');
            expect(result).toContain("import { z } from 'zod';");
            expect(result).toContain('export const userSchema = z.object({');
            expect(result).toContain('id: z.number()');
            expect(result).toContain('name: z.string()');
            expect(result).toContain('isActive: z.boolean()');
            expect(result).toContain('tags: z.array(z.string())');
            expect(result).toContain('meta: z.object({');
        });
    });

    describe('generateJavaPOJO', () => {
        it('should generate valid Java POJO classes', () => {
            const result = generateJavaPOJO(sampleJson, 'User');
            expect(result).toContain('import com.fasterxml.jackson.annotation.JsonProperty;');
            expect(result).toContain('import lombok.Data;');

            expect(result).toContain('public class User {');
            expect(result).toContain('@JsonProperty("id")');
            expect(result).toContain('private Integer id;');

            expect(result).toContain('public class Meta {');
            expect(result).toContain('private Meta meta;');
        });

        it('should handle lists', () => {
            const listJson = { items: ["a", "b"] };
            const result = generateJavaPOJO(listJson, 'ListTest');
            expect(result).toContain('private List<String> items;');
        });
    });

    describe('generateSqlDDL', () => {
        it('should generate valid CREATE TABLE statement', () => {
            const result = generateSqlDDL(sampleJson, 'users');
            expect(result).toContain('CREATE TABLE users (');
            expect(result).toContain('id INTEGER');
            expect(result).toContain('name TEXT');
            expect(result).toContain('is_active BOOLEAN');
            expect(result).toContain('meta JSONB');
        });

        it('should handle decimal numbers', () => {
            const decimalJson = { price: 10.5 };
            const result = generateSqlDDL(decimalJson, 'products');
            expect(result).toContain('price DECIMAL');
        });
    });
});
