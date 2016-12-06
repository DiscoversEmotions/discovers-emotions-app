import { Computed } from 'cerebral';
import { AssetStatus, Scenes, Steps } from '~/types';
import _ from 'lodash';

export const requestedAssets = Computed(
  {
    assets: `assets`
  },
  ({assets}) => _(assets).filter((asset) => (asset.status === AssetStatus.Requested)).value()
);

export const queuedAssets = Computed(
  {
    assets: `assets`
  },
  ({assets}) => _(assets).filter((asset) => (asset.status === AssetStatus.Queued)).value()
);

export const nextQueuedAsset = Computed(
  {
    queued: queuedAssets
  },
  ({queued}) => {
    const queuedByPriority = _(queued).sortBy(`priority`).value();
    if (queuedByPriority.length > 0) {
      return _.head(queuedByPriority);
    }
    return null;
  }
);

export const lastMessage = Computed(
  {
    messages: `system.messages`
  },
  ({ messages }) => {
    if (messages.length === 0) {
      return null;
    }
    return _.last(messages);
  }
);

export const roomAssetsReady = Computed(
  {
    room: `assets.room.status`,
    webglReady: `app.bundlesReady.webgl`
  },
  ({ room, webglReady }) => {
    return (room === AssetStatus.Ready && webglReady);
  }
);

export const canStartRoom = Computed(
  {
    roomAssetsReady: roomAssetsReady,
    step: `app.step`
  },
  ({ roomAssetsReady, step }) => {
    return (roomAssetsReady && step === Steps.Room);
  }
);

export const mind1AssetsReady = Computed(
  {
    perso: `assets.perso.status`,
    world1: `assets.world1.status`,
    world2: `assets.world2.status`,
    world3: `assets.world3.status`,
    memory1: `assets.memory1.status`
  },
  ({ perso, world1, world2, world3, memory1 }) => {
    return (
      perso == AssetStatus.Ready &&
      world1 == AssetStatus.Ready &&
      world2 == AssetStatus.Ready &&
      world3 == AssetStatus.Ready &&
      memory1 == AssetStatus.Ready
    );
  }
);

export const shouldBePointerLocked = Computed(
  {
    currentSceneName: `app.scene.current`
  },
  ({ currentSceneName }) => {
    return (
      currentSceneName === Scenes.Lvl1 ||
      currentSceneName === Scenes.Memory1
    );
  }
);

export const waitForKeyPress = Computed(
  {
    step: `app.step`,
    lastMessage: lastMessage
  },
  ({ step, lastMessage }) => {
    if (lastMessage.key === `need-recovery` && step === Steps.Room) {
      return {
        nextStep: Steps.Emotion1Explain,
        key: `enter`
      };
    }
    return null;
  }
);

export const expectedScene = Computed(
  {
    step: `app.step`,
    assetsReady: mind1AssetsReady,
    webglReady: `app.bundlesReady.webgl`
  },
  ({ step, assetsReady, webglReady }) => {
    // if(assetsReady && webglReady){
    //   return Scenes.Memory1;
    // }
    switch (step) {
    case Steps.Room:
      return Scenes.Room;
    case Steps.Emotion1Explain:
    case Steps.Emotion1Recovered:
      return Scenes.Lvl1;
    default:
      return Scenes.Boot;
    }
  }
);
