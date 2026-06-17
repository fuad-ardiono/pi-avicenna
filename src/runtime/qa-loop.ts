import type { PiAvicennaTask, WorkflowStage } from './state.js';

export type QaOutcome = 'pass' | 'fail' | 'retry';

export interface QaTransition {
  from: WorkflowStage;
  to: WorkflowStage;
  outcome: QaOutcome;
}

export const qaTransitions: QaTransition[] = [
  { from: 'qa', to: 'completion', outcome: 'pass' },
  { from: 'qa', to: 'fixing', outcome: 'fail' },
  { from: 'qa', to: 'qa_loop', outcome: 'retry' },
  { from: 'qa_loop', to: 'completion', outcome: 'pass' },
  { from: 'qa_loop', to: 'fixing', outcome: 'fail' },
  { from: 'qa_loop', to: 'coding', outcome: 'retry' },
];

export const fixRetestTransitions: QaTransition[] = [
  { from: 'fixing', to: 'qa', outcome: 'pass' },
  { from: 'fixing', to: 'qa_loop', outcome: 'fail' },
  { from: 'fixing', to: 'coding', outcome: 'retry' },
];

function touchTask(task: PiAvicennaTask, stage: WorkflowStage, status: PiAvicennaTask['status']): PiAvicennaTask {
  return { ...task, stage, status, updatedAt: new Date().toISOString() };
}

export function advanceQaStage(task: PiAvicennaTask, outcome: QaOutcome): PiAvicennaTask {
  switch (outcome) {
    case 'pass':
      return touchTask(task, 'completion', 'done');
    case 'fail':
      return touchTask(task, 'fixing', 'blocked');
    case 'retry':
      return touchTask(task, 'qa_loop', 'blocked');
  }
}

export function advanceFixRetestStage(task: PiAvicennaTask, outcome: QaOutcome): PiAvicennaTask {
  switch (outcome) {
    case 'pass':
      return touchTask(task, 'qa', 'active');
    case 'fail':
      return touchTask(task, 'qa_loop', 'blocked');
    case 'retry':
      return touchTask(task, 'coding', 'active');
  }
}
