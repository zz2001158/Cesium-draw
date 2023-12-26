import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
class EditLine {
  constructor(viewer) {
    this.viewer = viewer;
    this.initEvent();
    this.tempPoints = [];
    this.entity = {};
    this.selectPoint = {};
    this.selectPointIndex = -1;
    this.lines = [];
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  }

  install(entity) {
    this.entity = entity;
    this.initLine(entity);
    this.handler.setInputAction(
      (e) => this.leftDownEvent(e),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
  }
  initLine(entity) {
    this.lines = dataManage.plugins.linesManage.getLines();
    let findItem = lines.find((d) => d.id === entity.id.id);
    console.log(findItem, entity);
    if (findItem) {
      this.tempPoints = findItem.positions;
      this.tempPoints.forEach((e) => {
        if (this.drawTempPoint) this.drawTempPoint(e.id, e.position);
      });
    }
  }

  leftDownEvent(e) {
    this.selectPoint = this.viewer.scene.pick(e.position);
    this.selectPointIndex = this.tempPoints.findIndex(
      (i) => i.id === this.selectPoint.id.id
    );
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      (e) => this.leftUpEvent(e),
      Cesium.ScreenSpaceEventType.LEFT_UP
    );
  }
  leftUpEvent(e) {
    console.log("up");
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
  mouseMoveEvent(e) {
    if (this.selectPointIndex == -1) return;
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    let position = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
    this.selectPoint.id.position = position;
    this.tempPoints[this.selectPointIndex].position = position;
    let linesPosition = this.tempPoints.map((d) => d.position);
    this.entity.id.polyline.positions = new Cesium.CallbackProperty(
      (time, result) => {
        return [...linesPosition];
      },
      false
    );
  }
}

export default EditLine;
