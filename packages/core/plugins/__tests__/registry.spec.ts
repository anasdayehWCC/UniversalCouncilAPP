import { registerModule, getModulesForTenant, getModules } from '../registry';

describe('Plugin registry', () => {
  it('registers and returns modules', () => {
    registerModule({
      meta: { id: 'demo', title: 'Demo Module' },
      routes: []
    });
    const all = getModules();
    expect(all.find((m) => m.meta.id === 'demo')).toBeDefined();
  });

  it('filters modules by enabled list', () => {
    const list = getModulesForTenant('tenant-1', ['demo']);
    expect(list).toHaveLength(1);
    expect(list[0].meta.id).toBe('demo');
  });
});

