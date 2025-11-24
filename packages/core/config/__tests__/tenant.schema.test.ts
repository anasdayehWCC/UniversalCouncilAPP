import Ajv from 'ajv';
import schema from '../schema/tenant.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe('Tenant schema', () => {
  it('accepts a minimal valid tenant config', () => {
    const config = {
      id: 'westminster',
      name: 'Westminster City Council',
      defaultLocale: 'en-GB',
      modules: [{ id: 'transcription', enabled: true }]
    };
    expect(validate(config)).toBe(true);
  });

  it('rejects missing required fields', () => {
    const config = { name: 'Missing id', modules: [] } as any;
    expect(validate(config)).toBe(false);
  });
});

