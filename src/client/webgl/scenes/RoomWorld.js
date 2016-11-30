import { Cameraman } from '~/webgl';
import { EventUtils } from '~/core';
import { PointLight, Object3D, Mesh, MeshBasicMaterial, SphereGeometry, Color } from 'three';
import _ from 'lodash';

export class RoomWorld {

  constructor(core, app, controller, parentElement) {
    this.app = app;
    this.core = core;
    this.controller = controller;
    this.parentElement = parentElement;

    this.camVert = 0;
    this.size = {
      width: 600,
      height: 600
    };
    this.mousePos = { x: 0, y: 0 };

    this.roomSphere = null;

    this.scene = new Object3D();

    this.cameraman = new Cameraman(45, 1, 1, 1100);
    this.cameraman.position.set(0, 0, 0);
    this.scene.add(this.cameraman);

    // Bind
    this._onMouseMove = _.throttle(this._onMouseMove.bind(this), 1000/60);
  }

  getEnvConfig() {
    return {
      fogDensity: 0,
      fogColor: new Color(0x000000)
    };
  }

  getCameraman() {
    return this.cameraman;
  }

  getScene() {
    return this.scene;
  }

  mount() {
    console.log(`mount Room`);
    if (this.roomSphere === null) {
      var geom = new SphereGeometry(50, 60, 60);
      geom.scale( -1, 1, 1 );
      const roomTexture = this.app.assetsManager.getAsset(`room`);
      var material = new MeshBasicMaterial({
        map: roomTexture
      });
      this.roomSphere = new Mesh(geom, material);
      this.scene.add(this.roomSphere);
    }

    document.addEventListener(`mousemove`, this._onMouseMove, false);
  }

  unmount() {
    console.log(`unmount Room`);
    document.removeEventListener(`mousemove`, this._onMouseMove, false);
  }

  update(time, dt) {
    this._updateCameraman();
  }

  setSize(width, height) {
    this.size = { width, height };
    this.cameraman.setSize(width, height);
  }

  _onMouseMove(e) {
    const offset = EventUtils.getOffsetOf(e, this.parentElement);
    this.mousePos.x = ((offset.x / this.size.width) * 2) - 1;
    this.mousePos.y = ((offset.y / this.size.height) * 2) - 1;
  }

  _updateCameraman() {
    this.cameraman.setHorizontalAngle((Math.PI * 1.5) - (1 * this.mousePos.x));
    this.cameraman.setVerticalAngle(- (0.5 * this.mousePos.y));
  }

}