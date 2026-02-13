import { describe, it, expect } from 'vitest';
import lifecycles from './lifecycles';

describe('Text Effect Lifecycles', () => {
  describe('beforeCreate', () => {
    it('should validate CSS code is not empty', () => {
      const event = {
        params: {
          data: {
            css_code: '',
          },
        },
      };

      expect(() => lifecycles.beforeCreate(event)).toThrow('CSS code cannot be empty');
    });

    it('should validate CSS code contains rule blocks', () => {
      const event = {
        params: {
          data: {
            css_code: 'just some text without braces',
          },
        },
      };

      expect(() => lifecycles.beforeCreate(event)).toThrow(
        'CSS code must contain at least one rule block'
      );
    });

    it('should pass validation for valid CSS code', () => {
      const event = {
        params: {
          data: {
            css_code: '.text { color: aquamarine; text-shadow: -1px 0 #4b6b00; }',
          },
        },
      };

      expect(() => lifecycles.beforeCreate(event)).not.toThrow();
    });
  });

  describe('beforeUpdate', () => {
    it('should validate CSS code is not empty on update', () => {
      const event = {
        params: {
          data: {
            css_code: '',
          },
        },
      };

      expect(() => lifecycles.beforeUpdate(event)).toThrow('CSS code cannot be empty');
    });

    it('should skip validation if css_code is not provided in update', () => {
      const event = {
        params: {
          data: {
            name: 'Updated Name',
          },
        },
      };

      expect(() => lifecycles.beforeUpdate(event)).not.toThrow();
    });
  });
});
