import type { PiAvicennaTask } from './state.js';

export interface PiCrewCodingRequest {
  task: PiAvicennaTask;
  instructions?: string;
}

export interface PiCrewQaRequest {
  task: PiAvicennaTask;
  instructions?: string;
}

export interface PiCrewAdapter {
  delegateCoding(request: PiCrewCodingRequest): Promise<void>;
  delegateQa(request: PiCrewQaRequest): Promise<void>;
}

export function createPiCrewHooks(adapter?: PiCrewAdapter) {
  return {
    hasAdapter: Boolean(adapter),
    async sendToCoding(request: PiCrewCodingRequest) {
      await adapter?.delegateCoding(request);
    },
    async sendToQa(request: PiCrewQaRequest) {
      await adapter?.delegateQa(request);
    },
  };
}
