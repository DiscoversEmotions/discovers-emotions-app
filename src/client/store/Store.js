import {
  fromJS
} from 'immutable';
import {
  Store as CoreStore
} from '~/core';

export const Steps = {
  Boot: `boot`,
  FoundError: `found-error`
};

export const Worlds = {
  Room: `room`,
  Mind: `mind`,
  Memory: `memory`
};

export const state = fromJS({
  size: {
    width: 600,
    height: 600
  },
  times: {},
  step: null
});

export const computedState = fromJS({
  size: {
    width: 600,
    height: 600
  },
  world: null,
  times: {},
  step: null
});

export class Store extends CoreStore {
  constructor() {
    super(state, computedState);

    // debug
    window.__store = this;
  }

  updateComputedState() {
    if (this.hasChanged(`size`)) {
      this.computedState = this.computedState.set(`size`, this.state.get(`size`));
    }
    if (this.hasChanged(`step`)) {
      const step = this.state.get(`step`);
      this.computedState = this.computedState.set(`step`, step);
      const world = (() => {
        switch (step) {
        case Steps.Boot:
          return Worlds.Room;
        case Steps.FoundError:
          return Worlds.Mind;
        default:
          return Worlds.Room;
        }
      })();
      this.computedState = this.computedState.set(`world`, world);
    } else if (this.hasChanged(`times`)) {
      // same step, time changed
      console.log(`TODO`);
    }
  }
}