import {
  PointLight, Object3D, Raycaster, MeshPhongMaterial, MeshBasicMaterial, ArrowHelper,
  Color, SphereGeometry, BackSide, Mesh, Vector3, PointsMaterial, Geometry, Points,
  AdditiveBlending, DoubleSide, ShaderMaterial, UniformsUtils, UniformsLib, ShaderLib
} from 'three';
import _ from 'lodash';
import { ConnectMethod, EventUtils } from '~/core';
import * as motion from 'popmotion';
import { Scene } from './Scene';
import { Steps } from '~/types';
import { BlendCharacter } from '~/webgl/utils';

import vertexShader from '~/webgl/shader/points_vert.glsl';
import fragmentShader from '~/webgl/shader/points_frag.glsl';

export class EmotionScene extends Scene {

  constructor(...args) {
    super(...args);

    // Bind
    this.onMouseMove = _.throttle(this.onMouseMove.bind(this), 1000 / 60);

    // Init watchers
    this.updateState({}, this.controller, this);

    this.mousePos = {
      x: 0,
      y: 0
    };

    // Perso
    this.persoVelocityLinear = 0;
    this.persoMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });
    this.movementOrigin = new Object3D();
    this.movementOrigin.position.set(0, 5, 0);
    this.cameramanRotationArround = new Object3D();
    this.movementOrigin.add(this.cameramanRotationArround);
    this.scene.add(this.movementOrigin);

    // Arrow
    this.arrowRotation = new Object3D();
    this.movementOrigin.add(this.arrowRotation);

    // Light inside perso
    this.persoLight = new PointLight({
      color: 0xff0000
    });
    this.persoLight.position.y = 2;
    this.persoLight.intensity = 0.7;
    this.movementOrigin.add(this.persoLight);

    // Cameraman
    this.cameramanRotation = {
      vert: 0,
      hori: 0
    };
    this.cameraman.position.set(0, 3, 7);
    this.cameraman.setVerticalAngle(-0.3);
    this.cameramanRotationArround.add(this.cameraman);

    // Raycaster
    this.raycaster = new Raycaster();

    this.initSkybox();
    this.initParticles();
    // this.initParticlesShader();
  }

  initSkybox() {
    const skyGeo = new SphereGeometry(100, 60, 60);
    const skyMaterial = new MeshPhongMaterial({
      color: 0x000000,
      side: BackSide
    });
    this.sky = new Mesh(skyGeo, skyMaterial);
  }

  initParticles() {
    // Particles
    this.particleCount = 1500;
    const particlesSize = Math.random() * (1 - 0.5) + 0.5;

    this.particlesGeom = new Geometry();
    const particlesMaterial = new PointsMaterial({
      color: 0xFFFFFF,
      size: particlesSize,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    for (var p = 0; p < this.particleCount; p++) {
      var pX = Math.random() * 50;
      var pY = Math.random() * 10;
      var pZ = Math.random() * 60;
      var particle = new Vector3(pX, pY, pZ);
      this.particlesGeom.vertices.push(particle);
    }

    this.particles = new Points(this.particlesGeom, particlesMaterial);
    this.particles.sortParticles = true;
    this.particles.scale.z = 5;

    if(this.level === 1){
      this.particles.position.set(-5, -5, -30);
    }
    if(this.level === 3){
      this.particles.position.set(0, 90, 0);
    }

    this.scene.add(this.particles);
  }

  // * INIT PARTICLE WITH SHADER * //
  initParticlesShader(){

    this.uniforms = {
      color: 0xFFFFFF,
      texture:   { value: this.particleTexture }
    };

    this.pointMaterial = new ShaderMaterial( {
      uniforms:       this.uniforms,
      vertexShader:   vertexShader,
      fragmentShader: fragmentShader,
      blending:       AdditiveBlending,
      depthTest:      false,
      transparent:    true
    });

    this.particleGeometry = new Geometry();
    this.particlesNumber = 1000;

    for (var p = 0; p < this.particlesNumber; p++) {
      var pX = Math.random() * 50;
      var pY = Math.random() * 10;
      var pZ = Math.random() * 60;
      var particle = new Vector3(pX, pY, pZ);
      this.particleGeometry.vertices.push(particle);
    }

    this.particleSystem = new Points( this.particleGeometry, this.pointMaterial );
    this.particleSystem.sortParticles = true;
    this.particleSystem.scale.z = 5;

    this.scene.add(this.particleSystem);

    if(this.level === 1){
      // this.particleSystem.position.set(-30, -400, 150);
    }

    console.log(this.particleSystem);
  }

  getEnvConfig() {
    return {
      fogDensity: 0.03,
      fogColor: new Color(0x000000)
    };
  }

  // Keyboard Method
  @ConnectMethod(
    {
      keys: `keyboard.keys`
    }
  )
  updateState({ keys }) {
    this.userLeft = keys.left;
    this.userRight = keys.right;
    this.userDown = keys.down;
    this.userUp = keys.up;
    this.userZ = keys.z;
    this.userS = keys.s;
    this.userQ = keys.q;
    this.userD = keys.d;
  }

  mount() {
    this.solved = false;
    this.level = this.controller.getState(`app.level`);
    this.collision = null;
    this.tiles = [];
    this.world = null;
    this.persoCamRotation = 0;

    this.cameramanRotation.hori = 0.5;
    this.cameramanRotation.vert = 0.5;

    // Mount perso if not exist
    if (_.isNil(this.perso)) {
      this.perso = new BlendCharacter(this.app.assetsManager.getAsset(`perso`));
      this.movementOrigin.add(this.perso);
      this.perso.scale.set(0.015, 0.015, 0.015);
      this.perso.setMaterial(this.persoMaterial);
      this.perso.play(`idle`, 1);
    }
    this.movementOrigin.position.set(0, 0, 0);
    this.perso.rotation.y = Math.PI;

    if (_.isNil(this.arrow)) {
      this.arrow = this.app.assetsManager.getAsset(`arrow`);
      console.log(this.arrow);
      this.arrow.children[0].material = new MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
      });
      this.arrowRotation.add(this.arrow);
      this.arrow.position.set(0, 1, 2);
    }

    // Particle Texture
    if (_.isNil(this.particles.material.map)) {
      this.particles.material.map = this.app.assetsManager.getAsset(`particleTexture`);
    }

    // if(_.isNil(this.particleTexture)){
    //   this.particleTexture = this.app.assetsManager.getAsset(`particleTexture`);
    //   this.initParticlesShader();
    // }


    // Mousemove
    document.addEventListener(`mousemove`, this.onMouseMove, false);

    if (this.level === 1) {
      this.mountEmotion1();
    } else if (this.level === 2) {
      this.mountEmotion2();
    } else if (this.level === 3) {
      this.mountEmotion3();
    }

    this.tiles.forEach(tile => tile.material.color = new Color(0xff0000));

    this.scene.add(this.world);
    this.world.updateMatrixWorld();
    if (this.level === 1) { // TODO: remove when collision on 2 & 3 are OK
      this.collision.material.visible = false;
    }

  }

  mountEmotion1() {
    this.world = this.app.assetsManager.getAsset(`world1`);
    this.world.traverseVisible((item) => {
      console.log(item.name);
      if (item.name === `collision`) {
        this.collision = item;
      }
      if (item.name === `zone-action`) {
        this.tiles.push(item);
      }
    });
    this.webglCore.useEnvConfig({
      fogDensity: 0.03
    });
  }

  mountEmotion2() {
    this.world = this.app.assetsManager.getAsset(`world2`);
    this.world.traverseVisible((item) => {
      console.log(item.name);
      if (item.name === `collision`) {
        this.collision = item;
      }
      if (item.name === `zone`) {
        this.tiles.push(item);
      }
      if (item.name === `eglise`) {
        item.material.side = DoubleSide;
      }
    });
    this.webglCore.useEnvConfig({
      fogDensity: 0.02
    });
  }

  mountEmotion3() {
    this.world = this.app.assetsManager.getAsset(`world3`);
    this.world.traverseVisible((item) => {
      console.log(item.name);
      if (item.name === `collision`) {
        this.collision = item;
      }
      if (item.name === `zone`) {
        this.tiles.push(item);
      }
    });
    this.webglCore.useEnvConfig({
      fogDensity: 0.01
    });
  }

  update(time, dt) {

    this.updatePerso(time, dt);

    this.updateArrow(time, dt);

    this.collisionTileResults = this.raycaster.intersectObjects(this.tiles);
    if (this.collisionTileResults.length && this.solved === false) {
      this.controller.getSignal(`app.setNextStep`)();
      this.tiles.forEach(tile => {
        tile.material.color = new Color(0xb7daf6);
      });
      this.solved = true;
    }

    this.updateCameraman();

    this.updateParticles(time, dt);
    // this.updateParticlesShader(time, dt);
  }

  updatePerso(time, dt) {
    const movement = {
      forward: 0,
      left: 0
    };

    // Find movement depending on key pressed
    if ((this.userLeft && !this.userRight) || (this.userQ && !this.userD)) { movement.left = 1; }
    if ((this.userRight && !this.userLeft) || (this.userD && !this.userQ)) { movement.left = -1; }
    if ((this.userUp && !this.userDown) || (this.userZ && !this.userS)) { movement.forward = 1; }
    if ((this.userDown && !this.userUp) || (this.userS && !this.userZ)) { movement.forward = -1; }

    const isMoving = (movement.forward !== 0 || movement.left !== 0);

    const angle = (
      motion.calc.degreesToRadians(motion.calc.angle(
        { y: movement.forward, x: 0 },
        { y: 0, x: -movement.left}
      )) +
      this.cameramanRotationArround.rotation.y
    ) % (2 * Math.PI);

    // Update Velocity
    if (isMoving) {
      this.persoCamRotation = 0;
      this.persoVelocityLinear += 0.0001;
    } else if (this.persoVelocityLinear > 0) {
      this.persoVelocityLinear -= 0.005;
    }
    this.persoVelocityLinear = motion.calc.restrict(this.persoVelocityLinear, 0, 0.05);
    const slowDown = 30;
    this.persoVelocity = ((Math.pow(((this.persoVelocityLinear-(1/slowDown))*slowDown), 3) / slowDown) + (1/slowDown));
    const dist = this.persoVelocity * dt;
    const move = motion.calc.pointFromAngleAndDistance(
      { x: 0, y: 0 },
      motion.calc.radiansToDegrees(angle),
      dist
    );

    // Is there a ground ahead ?
    const canMove = motion.calc.pointFromAngleAndDistance(
      { x: 0, y: 0 },
      motion.calc.radiansToDegrees(angle),
      dist
    );

    this.movementOrigin.translateZ(-canMove.x);
    this.movementOrigin.translateX(-canMove.y);
    this.raycaster.set(this.movementOrigin.position, new Vector3(0, -1, 0));
    this.movementOrigin.translateZ(+canMove.x);
    this.movementOrigin.translateX(+canMove.y);
    this.raycaster.ray.origin.y += 2;

    const canMoveCollision = this.raycaster.intersectObjects([this.collision]);
    if (canMoveCollision.length) {
      this.movementOrigin.translateZ(-move.x);
      this.movementOrigin.translateX(-move.y);
    } else {
      this.persoVelocityLinear = 0;
      this.persoVelocity = 0;
    }

    if (this.persoVelocity > 0.001) {
      this.perso.rotation.y %= (2 * Math.PI);
      if (this.perso.rotation.y !== angle) {
        this.perso.rotation.y = angle;
      }
    }

    this.perso.applyWeight(`idle`, 0);
    this.perso.applyWeight(`walk`, 0);
    this.perso.applyWeight(`run`, 0);

    if (this.persoVelocity < 0.001) {
      this.perso.play(`idle`, 1);
    } else if (this.persoVelocity <= 0.01) {
      this.perso.play(`walk`, 1);
    } else {
      this.perso.play(`run`, 1);
    }

    this.perso.update(dt/1000);

    // Collision with ground
    this.raycaster.set(
      this.movementOrigin.position,
      new Vector3(0, -1, 0)
    );
    this.raycaster.ray.origin.y += 2;

    this.collisionGroundResults = this.raycaster.intersectObjects([this.collision]);
    if (this.collisionGroundResults.length) {
      this.movementOrigin.position.y = this.collisionGroundResults[0].point.y;
    } else {
      console.log(`No ground collision`);
    }
  }

  updateArrow(time, dt) {
    const from = this.movementOrigin.getWorldPosition();
    this.tiles[0].geometry.computeBoundingSphere();
    const to = this.tiles[0].geometry.boundingSphere.center;
    const angle = motion.calc.angle(
      { x: from.x, y: from.z },
      { x: to.x, y: to.z }
    );
    this.arrowRotation.rotation.y = motion.calc.degreesToRadians(angle + 180);
  }

  updateCameraman() {

    this.cameramanRotationArround.rotation.y = this.cameramanRotation.hori * (Math.PI * 2);
    const dist = motion.calc.dilate(7, 13, this.cameramanRotation.vert);
    const lookUp = motion.calc.dilate(0, 0.3, this.cameramanRotation.vert);
    const angle = motion.calc.dilate(100, 60, this.cameramanRotation.vert);
    const camPos = motion.calc.pointFromAngleAndDistance(
      { x: 3, y: 0 },
      angle,
      dist
    );
    this.cameraman.position.set(0, camPos.x, camPos.y);
    this.cameraman.setVerticalAngle(motion.calc.degreesToRadians(angle - 90));
  }

  updateParticles(time, dt) {
    if(this.level === 1){
      this.particles.rotation.y -= 0.0001;
    }

    if(this.level === 2){
      this.particles.rotation.y -= 0.02;
    }

    if(this.level === 3){
      this.particles.rotation.y -= 0.0001;
      this.particles.rotation.x += 0.00001;
    }

    this.particles.geometry.verticesNeedUpdate = true;
  }

  updateParticlesShader(time, dt){
    this.particleSystem.rotation.y -= 0.0001;
    this.particleSystem.geometry.verticesNeedUpdate = true;
  }

  unmount() {
    document.removeEventListener(`mousemove`, this.onMouseMove, false);
    this.scene.remove(this.world);
    this.world = null;
  }

  onMouseMove(e) {

    // const offset = EventUtils.getOffsetOf(e, this.parentElement);
    // this.mousePos.x = ((offset.x / this.size.width) * 2) - 1;
    // this.mousePos.y = ((offset.y / this.size.height) * 2) - 1;

    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

    this.cameramanRotation.hori -= movementX * 0.0005;
    this.cameramanRotation.vert += movementY * 0.003;

    this.cameramanRotation.hori %= 1;
    this.cameramanRotation.vert = motion.calc.restrict(this.cameramanRotation.vert, 0, 1);
  }

}
