import { Steps } from '~/types';
import { KEYS_MAP } from '~/managers/KeyboardManager';

export function getDuration (defaultDuration) {
  return function getDurationAction ({ input }) {
    if (input.duration) {
      return {};
    }
    return { duration: defaultDuration };
  };
}

function getNext (step, level) {
  if (step === Steps.Boot) {
    return { step: Steps.Room, level: level };
  }
  if (step === Steps.Room) {
    return { step: Steps.EmotionExplain, level: level };
  }
  if (step === Steps.EmotionExplain) {
    return { step: Steps.EmotionAlmostRecovered, level: level };
  }
  if (step === Steps.EmotionAlmostRecovered) {
    return { step: Steps.Memory, level: level };
  }
  if (step === Steps.Memory) {
    return { step: Steps.MemoryDone, level: level };
  }
  if (step === Steps.MemoryDone) {
    if (level < 3) {
      return { step: Steps.EmotionExplain, level: level + 1 };
    } else {
      return { step: Steps.RecoveryDone, level: level };
    }
  }
  if (step === Steps.RecoveryDone) {
    return { step: Steps.ConfirmKeep, level: level };
  }
  console.error(`Whaaaat ?`, step);
  return null;
}

export function setNextStep ({ state }) {
  const step = state.get(`app.step`);
  const level = state.get(`app.level`);
  const next = getNext(step, level);
  state.set(`app.step`, next.step);
  state.set(`app.level`, next.level);
  state.set(`keyboard.ignoreEnter`, state.get(`keyboard.keys.enter`));
}

export function reboot ({ state }) {
  state.set(`app.step`, Steps.Boot);
  state.set(`app.level`, 1);
  state.set(`system.messages`, []);
  state.set(`app.reboot`, state.get(`app.reboot`) + 1);
}

export function setStep ({ state, input }) {
  const currentStep = state.get(`app.step`);
  if (currentStep !== input.step) {
    state.set(`app.step`, input.step);
    state.set(`keyboard.ignoreEnter`, state.get(`keyboard.keys.enter`));
  }
}
