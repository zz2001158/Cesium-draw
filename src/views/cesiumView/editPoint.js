import * as Cesium from "cesium";
import { getId } from "./ids";
import dataManage from "../../script/dataManage";
import Tooltip from "./tooltip";
import { ElMessage, ElMessageBox } from "element-plus";
import { windowPositionConvertCartesin3Fn } from "../../script/utils";
class EditPoint {
  constructor(viewer, tempPoints) {
    this.viewer = viewer;
    this.initEvent();
    this.selectEntity = null;
    this.tempPoints = tempPoints;
  }

  initEvent() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.tooltip = document.getElementById("tooltip");
  }

  install() {
    this.handler.setInputAction(
      (e) => this.selectEntityFn(e),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      (e) => this.updatePosition(e),
      Cesium.ScreenSpaceEventType.LEFT_UP
    );

    // this.removeTooltip();
  }
  uninstall() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  selectEntityFn(e) {
    this.selectEntity = this.viewer.scene.pick(e.position);
    this.handler.setInputAction(
      (e) => this.mouseMoveEvent(e),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  }
  mouseMoveEvent(e) {
    if (!this.selectEntity) return;
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    let position = windowPositionConvertCartesin3Fn(this.viewer, e.endPosition);
    this.selectEntity.id.position = position;
  }
  updatePosition(e) {
    if (!this.selectEntity) return;
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    let endPosition = windowPositionConvertCartesin3Fn(this.viewer, e.position);
    let points = dataManage.plugins.pointsManage.getPoints();
    let findItem = points.find((d) => d.id === this.selectEntity.id.id);
    if (findItem) {
      findItem.position = endPosition;
    }
    dataManage.plugins.pointsManage.savePoint(points);
  }
}

export default EditPoint;
