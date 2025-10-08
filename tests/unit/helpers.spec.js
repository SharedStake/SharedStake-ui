// Test YOUR actual helper functions
const { interval, timeout } = require('@/utils/helpers');

describe('Your Helper Functions', () => {
  describe('timeout function', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await timeout(10);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Interval class', () => {
    let mockTask;

    beforeEach(() => {
      mockTask = jest.fn();
      interval.stop(); // Clean up any running intervals
    });

    afterEach(() => {
      interval.stop();
    });

    it('should add tasks', () => {
      interval.addTask(mockTask, 100);
      expect(interval.tasks).toHaveLength(1);
      expect(interval.tasks[0].task).toBe(mockTask);
      expect(interval.tasks[0].time).toBe(100);
    });

    it('should run tasks immediately and then on interval', () => {
      interval.addTask(mockTask, 100);
      interval.run();
      
      expect(mockTask).toHaveBeenCalledTimes(1);
      
      // Wait for interval to trigger
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(mockTask).toHaveBeenCalledTimes(2);
          resolve();
        }, 150);
      });
    });

    it('should stop all intervals', () => {
      interval.addTask(mockTask, 100);
      interval.run();
      interval.stop();
      
      expect(mockTask).toHaveBeenCalledTimes(1);
      
      // Wait to ensure no more calls
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(mockTask).toHaveBeenCalledTimes(1);
          resolve();
        }, 150);
      });
    });

    it('should handle multiple tasks', () => {
      const task1 = jest.fn();
      const task2 = jest.fn();
      
      interval.addTask(task1, 50);
      interval.addTask(task2, 100);
      interval.run();
      
      expect(task1).toHaveBeenCalledTimes(1);
      expect(task2).toHaveBeenCalledTimes(1);
    });
  });
});