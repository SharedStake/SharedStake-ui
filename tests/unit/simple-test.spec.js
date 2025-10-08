// Simple working test to demonstrate the testing setup
describe('Basic Test Suite', () => {
  it('should run basic tests successfully', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toContain('hello');
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });

  it('should test array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr.filter(x => x > 3)).toEqual([4, 5]);
  });

  it('should test object operations', () => {
    const obj = { name: 'SharedStake', type: 'DeFi' };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('SharedStake');
    expect(Object.keys(obj)).toHaveLength(2);
  });
});