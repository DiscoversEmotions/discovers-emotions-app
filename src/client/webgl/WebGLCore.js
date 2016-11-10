import { EffectComposer, RenderPass, GlitchPass, SMAAPass } from 'postprocessing';
import * as motion from 'popmotion';
import _ from 'lodash';
import { Vector3, Color } from 'three';
import { Scene } from './Scene';
import { Renderer } from './Renderer';
import * as actions from '~/store/actions';
import { Worlds } from '~/store';

import { RoomWorld } from './RoomWorld';
import { MindWorld } from './MindWorld';
import { MemoryWorld } from './MemoryWorld';

// interface World {
//   constructor(store)
//   getScene()
//   getCameraman()
//   update()
// }

export class WebGLCore {

  constructor(parentElement, store) {
    this.parentElement = parentElement;

    this.width = null;
    this.height = null;
    this.lastState = null;
    this.store = store;
    this.currentWorld = this.store.getComputed(`world`);
    console.log(this.currentWorld);
    this.transitionStartTime = null;
    this.defaultEnvConfig = {
      background: new Color(0, 0, 0)
    };

    this.scene = new Scene();
    this.renderer = new Renderer();
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.renderPass.renderToScreen = true;
    this.composer.addPass(this.renderPass);

    this.worlds = {
      [Worlds.Room]: new RoomWorld(Worlds.Room, this.store, this.parentElement),
      [Worlds.Mind]: new MindWorld(Worlds.Mind, this.store, this.parentElement),
      [Worlds.Memory]: new MemoryWorld(Worlds.Memory, this.store, this.parentElement)
    };

    this._mountWorld(this.currentWorld, 0);

    this._initComposer();

    this._resize();
    // Append to DOM
    this.parentElement.appendChild( this.renderer.domElement );
  }

  update(time, dt) {
    if (this.store.state !== this.lastState) {
      this._onStateChange(time, dt);
      this.lastState = this.store.state;
    }
    // Update worlds
    this.worlds[this.currentWorld].update(time, dt);
    // Pass
    if (
      this.store.getComputed(`glitch`)
    ) {
      this.glitchPass.enabled = true;
      this.renderPass.renderToScreen = false;
    } else {
      this.renderPass.renderToScreen = true;
      this.glitchPass.enabled = false;
      this.store.dispatch(actions.world.endTransition());
    }
  }

  render(time, dt) {
    var cameraman = this.worlds[this.currentWorld].getCameraman();
    this.renderPass.camera = cameraman.getCamera();
    this.composer.render(dt);
  }

  _onStateChange(time, dt) {
    this._resize();
    const nextWorld = this.store.getComputed(`world`);
    if (nextWorld !== this.currentWorld) {
      this._switchWorld(nextWorld, time);
    }
  }

  _resize() {
    const state = this.store.state;
    const size = this.store.get(`size`).toJS();
    if (this.width !== size.width || this.height !== size.height) {
      this.width = size.width;
      this.height = size.height;
      _.forEach(this.worlds, (world) => {
        if (_.isFunction(world.setSize)) {
          world.setSize(this.width, this.height);
        }
      });
      this.composer.setSize(this.width, this.height);
      this.renderer.setSize(this.width, this.height);
    }
  }

  _initComposer() {
    this.glitchPass = new GlitchPass();
    this.glitchPass.renderToScreen = true;
    this.glitchPass.mode = 1;
    this.glitchPass.enabled = false;
    this.composer.addPass(this.glitchPass);
  }

  _mountWorld(worldName, time) {
    const worldScene = this.worlds[worldName].getScene();
    if (_.isFunction(this.worlds[worldName].mount)) {
      this.worlds[worldName].mount(time);
    }
    if (_.isFunction(this.worlds[worldName].getEnvConfig)) {
      const envConfig = Object.assign({}, this.defaultEnvConfig, this.worlds[worldName].getEnvConfig());
      this._useEnvConfig(envConfig);
    } else {
      this._useEnvConfig(this.defaultEnvConfig);
    }
    this.scene.add(worldScene);
    this.currentWorld = worldName;
  }

  _unmountWorld(worldName, time) {
    const worldScene = this.worlds[worldName].getScene();
    if (_.isFunction(this.worlds[worldName].unmount)) {
      this.worlds[worldName].unmount(time);
    }
    this.scene.remove(worldScene);
  }

  _switchWorld(nextWorld, time) {
    this._unmountWorld(this.currentWorld);
    this._mountWorld(nextWorld);
    this.transitionStartTime = time;
    this.store.dispatch(actions.world.startTransition());
  }

  _useEnvConfig(config) {
    this.scene.background = config.background;
  }


}
