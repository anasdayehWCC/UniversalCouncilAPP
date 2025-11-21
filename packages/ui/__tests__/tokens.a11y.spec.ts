import tokens from '../tokens/tokens.json';

describe('Design tokens accessibility', () => {
  it('provides required color roles', () => {
    expect(tokens.color.background).toBeDefined();
    expect(tokens.color.text).toBeDefined();
    expect(tokens.color.accent).toBeDefined();
  });

  it('uses a minimum base font size', () => {
    expect(tokens.typography.baseFontSize).toBeGreaterThanOrEqual(
      tokens.rules.minFontSize
    );
  });

  it('defines a spacing scale', () => {
    expect(tokens.spacing.md).toBeGreaterThan(0);
  });
});

