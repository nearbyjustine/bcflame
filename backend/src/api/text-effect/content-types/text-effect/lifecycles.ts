module.exports = {
  beforeCreate(event: any) {
    // Validate CSS code is not empty
    const cssCode = event.params.data.css_code;
    if (!cssCode || cssCode.trim().length === 0) {
      throw new Error('CSS code cannot be empty');
    }

    // Basic CSS validation (check for common syntax errors)
    if (!cssCode.includes('{') || !cssCode.includes('}')) {
      throw new Error('CSS code must contain at least one rule block');
    }
  },

  beforeUpdate(event: any) {
    // Same validation for updates
    const cssCode = event.params.data.css_code;
    if (cssCode !== undefined) {
      if (!cssCode || cssCode.trim().length === 0) {
        throw new Error('CSS code cannot be empty');
      }
      if (!cssCode.includes('{') || !cssCode.includes('}')) {
        throw new Error('CSS code must contain at least one rule block');
      }
    }
  },
};
