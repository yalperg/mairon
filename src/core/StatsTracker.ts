import type { Stats } from '@/types';

class StatsTracker {
  private stats: Stats = {
    evaluations: {
      total: 0,
      successful: 0,
      failed: 0,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    },
    rules: {
      totalExecuted: 0,
      totalMatched: 0,
      totalSkipped: 0,
      averageExecutionTime: 0,
    },
    actions: { totalExecuted: 0, totalFailed: 0, averageExecutionTime: 0 },
  };

  trackRuleExecution(executionTime: number, matched: boolean): void {
    this.stats.rules.totalExecuted += 1;
    if (matched) {
      this.stats.rules.totalMatched += 1;
    } else {
      this.stats.rules.totalSkipped += 1;
    }
    this.updateAverage(
      'rules',
      'averageExecutionTime',
      executionTime,
      this.stats.rules.totalExecuted,
    );
  }

  trackActionExecution(executionTime: number, success: boolean): void {
    this.stats.actions.totalExecuted += 1;
    if (!success) {
      this.stats.actions.totalFailed += 1;
    }
    this.updateAverage(
      'actions',
      'averageExecutionTime',
      executionTime,
      this.stats.actions.totalExecuted,
    );
  }

  trackEvaluation(duration: number, success: boolean): void {
    this.stats.evaluations.total += 1;
    if (success) {
      this.stats.evaluations.successful += 1;
    } else {
      this.stats.evaluations.failed += 1;
    }

    this.updateAverage(
      'evaluations',
      'averageTime',
      duration,
      this.stats.evaluations.total,
    );

    if (
      this.stats.evaluations.minTime === 0 ||
      duration < this.stats.evaluations.minTime
    ) {
      this.stats.evaluations.minTime = duration;
    }
    if (duration > this.stats.evaluations.maxTime) {
      this.stats.evaluations.maxTime = duration;
    }
  }

  getStats(): Stats {
    return {
      evaluations: { ...this.stats.evaluations },
      rules: { ...this.stats.rules },
      actions: { ...this.stats.actions },
    };
  }

  reset(): void {
    this.stats = {
      evaluations: {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
      },
      rules: {
        totalExecuted: 0,
        totalMatched: 0,
        totalSkipped: 0,
        averageExecutionTime: 0,
      },
      actions: { totalExecuted: 0, totalFailed: 0, averageExecutionTime: 0 },
    };
  }

  private updateAverage(
    category: 'rules' | 'actions' | 'evaluations',
    field: string,
    newValue: number,
    count: number,
  ): void {
    const current = (this.stats[category] as Record<string, number>)[field];
    (this.stats[category] as Record<string, number>)[field] =
      current + (newValue - current) / count;
  }
}

export default StatsTracker;
