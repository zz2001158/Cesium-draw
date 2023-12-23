<template>
  <div class="draw-box" >
    <div class="flex operate-box">
      <el-dropdown v-if="!startDraw && !startEdit">
        <el-button type="primary">绘制</el-button>
        <template #dropdown>
          <el-dropdown-item type="primary" @click="startDrawPoint"
            >绘制点</el-dropdown-item
          >
          <el-dropdown-item type="primary" @click="startDrawLine"
            >绘制线</el-dropdown-item
          >
          <el-dropdown-item type="primary" @click="startDrawPolygon"
            >绘制面</el-dropdown-item
          >
        </template>
      </el-dropdown>
      <el-button type="primary" @click="stopDraw" v-if="startDraw">停止绘制</el-button>
      <el-button type="primary" @click="startEditFn" style="margin-left: 30px;"  v-if="!startEdit && !startDraw">编辑</el-button>
      <el-button type="primary" style="margin-left: 30px;" @click="stopEdit" v-if=startEdit>停止编辑</el-button> 
    </div>
    <div class="cesium-view" id="cesiumContainer"></div>
  </div>
</template>

<script>
import * as Cesium from "cesium";
import dataManage from "../../script/dataManage";
import { ElMessage, ElMessageBox } from "element-plus";
import { getId } from './ids';
import { FALSE } from "sass";
export default {
  data() {
    return {
      viewer: null,
      handler: null,
      startDraw: false,
      startEdit: false,
      points: [],
      tempPoints: [],  
      lines: [],
      polygons: [],
      // currentKey: "",
      selectEntity: null,
      getId,
      moveStartPosition: null,  
      tooltip: null, 
      tempPointIds: [],
      tempLines: [],
      endPositions: [],
      guideLines: null,
    };
  },
  components: {},
  created() {},
  methods: {
    init() {
      this.viewer = new Cesium.Viewer("cesiumContainer", {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        // infoBox: false, // 解决默认的控制台报错
        baseLayerPicker: false, // 去掉底图选择器
        // sceneModePicker: false, // 去掉场景模式选择器 （3D，2D）
        // homeButton: false, // 去掉起始点按钮
        geocoder: false, // 去掉地理代码搜索
        // navigationHelpButton: false, // 去掉导航帮助按钮
        animation: false, // 取消动画按钮
        timeline: false, // 去掉时间线
        // fullscreenButton: false, // 去掉全屏按钮
        // selectionIndicator: false, // 去掉选择指示器,
        selectionIndicator: true //去掉选中效果
      });

      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
     
    },
    startDrawPoint() {
      // this.currentKey = "point";
      this.startDraw = true;
      this.handler.setInputAction((e) => {
          let position = this.windowPositionConvertCartesin3Fn(e.position)
          let id = "d_" + new Date().getTime();
          this.points.push({ id, position });
          dataManage.plugins.pointsManage.savePoint(this.points);
          this.drawPoint(id, position);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    startEditFn(){
      this.startEdit = true;
      this.handler.setInputAction((e) => {
        if(this.tooltip)  this.tooltip.remove();                                                       
        this.selectEntity = this.viewer.scene.pick(e.position);
        if (this.selectEntity) {
          this.viewer.scene.screenSpaceCameraController.enableRotate = false;
          this.editEntity(this.selectEntity);
        }
          return
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    stopEdit(){
      this.startEdit = false;
      this.clearDragFn();
    },
    editEntity(entity) {
      if(entity.id.name === '线'){
        this.tempPoints = entity.id.polyline.positions._value;
        console.log(this.tempPoints, 'ddd');
      }
      if(this.tooltip)  this.tooltip.remove();
      //右键删除
      this.handler.setInputAction((e) => {
      if(this.viewer.scene.pick(e.position)){
        console.log(e.position.x, '屏幕坐标', this.tooltip);
        document.oncontextmenu = function (event) { event.preventDefault();};
        this.tooltip = document.createElement('div');
        this.tooltip.style.cssText = `
            display: inline-block;
            position: absolute;
            top: ${e.position.y + 10}px;
            left: ${e.position.x + 10}px;
            padding: 10px;
            font-size: 15px;
            color: #fff;
            background: rgba(0, 0 , 0, .6);
            border-radius: 5px;
            cursor: pointer,
            `,
        this.tooltip.setAttribute('id', 'tooltip');
        document.body.appendChild(this.tooltip);
        document.getElementById('tooltip').innerHTML = '删除';
        this.tooltip.addEventListener("click", () => {
          this.deleteEntity(entity)
        })
      }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      //移动实体
      this.handler.setInputAction((e) => {
        // console.log('left_down');
        this.endPositions = [];
        this.moveStartPosition = this.windowPositionConvertCartesin3Fn(e.position);
        //开始移动
        this.startMoveEntity(entity);
        //结束移动
        this.endMoveEntity(entity);
       
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      

    },
    // updatePosition(translationMatrix){
    //   this.selectEntity.id.polyline.positions._value =  this.selectEntity.id.polyline.positions._value.map((d) => Cesium.Cartesian3.add(d, translationMatrix, new Cesium.Cartesian3()))
    //   // this.selectEntity.id._polyline?._positions?._value?.forEach(d => d = Cesium.Cartesian3.add(d, translationMatrix, new Cesium.Cartesian3()))
    // },
    
    startMoveEntity(entity){
      this.handler.setInputAction((e) => {
        // let entityPosition = entity.id._position?._value;
        // console.log(entity.id.name,entity.id, 'entity.position._value');
        let position = this.windowPositionConvertCartesin3Fn(e.endPosition);
        // let startPosition = this.windowPositionConvertCartesin3Fn(e.startPosition);
        //  //计算平移向量
        let translationMatrix = Cesium.Cartesian3.subtract(position,this.moveStartPosition, new Cesium.Cartesian3());

        if(entity.id.name === '点'){
          entity.id.position = position;
        }else{
          this.endPositions = this.tempPoints.map(d => Cesium.Cartesian3.add(d, translationMatrix, new Cesium.Cartesian3()));
          entity.id.polyline.positions = new Cesium.CallbackProperty((time, result) => {
            return [...this.endPositions];
          }, false)
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    },
    //绘制引导线
    drawGuideLineFn(){
        this.handler.setInputAction((e) => {
           if(this.guideLines)  this.removeEntityById(this.guideLines);
           let end = this.windowPositionConvertCartesin3Fn(e.endPosition);
           this.guideLines = this.getId();
           this.drawDashLine(this.guideLines, new Cesium.CallbackProperty((time, result) => {
            return  [end, this.tempPoints[this.tempPoints.length - 1]]
           }, false))
       },Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    },

    //清除鼠标拖拽事件
    clearDragFn(){
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    },
    endMoveEntity(entity){
      this.handler.setInputAction((e) => {
          // console.log('left_up');     
          this.clearDragFn();
          this.selectEntity = null;
          let position = this.windowPositionConvertCartesin3Fn(e.position);
          entity.id.position = position;
          if(entity.id.name === '点'){
            let findItem = this.points.find(d => d.id === entity.id.id);
            if(findItem) findItem.position = position;
            dataManage.plugins.pointsManage.savePoint(this.points);
          }else{
            console.log('线');
            let findItem = this.lines.find(d => d.id === entity.id.id);
            if(findItem) findItem.position = this.endPositions;

            dataManage.plugins.linesManage.saveLines(this.lines);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    },
    deleteEntity(entity){
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      console.log(`output->entityId`, entity)
      ElMessageBox.confirm("是否删除实体?", "警告", {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning",
        })
          .then(() => {
            //删除点
            let entityId = entity.id.id;
            let entityName = entity.id.name;
            if(entityName === '点'){
              this.points = this.points.filter( d => d.id !== entityId);
              console.log(this.points, 'ddddsss');
              dataManage.plugins.pointsManage.savePoint(this.points);
            }else if(entityName === '线'){
              this.lines = this.lines.filter( d => d.id !== entityId);
              dataManage.plugins.linesManage.saveLines(this.lines);
            }else{
              this.polygons = this.polygons.filter( d => d.id !== entityId);
              dataManage.plugins.polygonsManage.savePolygons(this.polygons);
            }
            this.tooltip.remove();
            this.removeEntityById(entityId);
          }).catch(e => this.tooltip.remove())
    },
    //清楚临时实体
    clearTempEntity(){
        this.tempPointIds.forEach((e) => this.removeEntityById(e));
        this.tempLines.forEach((e) => this.removeEntityById(e));
    },
    removeEntityById(id){
      this.viewer.entities.removeById(id);
    },
    windowPositionConvertCartesin3Fn(windowPosition){
          // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
          let ray = this.viewer.camera.getPickRay(windowPosition);
          // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
          return this.viewer.scene.globe.pick(ray, this.viewer.scene);
    },
    startDrawLine() {
      // this.currentKey = "line";
      this.startDraw = true;
      this.tempPoints = [];
      this.tempPointIds = [];
      this.tempLines = [];
      this.handler.setInputAction((e) => {
        let position = this.windowPositionConvertCartesin3Fn(e.position)
        this.tempPoints.push(position);
        let id = this.getId();
        this.tempPointIds.push('td_' + id);
        this.drawPoint('td_' + id, this.tempPoints[this.tempPoints.length - 1]);
        if (this.tempPoints.length > 1) {
          this.drawLine("tl_" + id, [
            this.tempPoints[this.tempPoints.length - 2],
            this.tempPoints[this.tempPoints.length - 1],
          ]);
          this.tempLines.push("tl_" + id)
        }
        if (this.tempPoints.length > 0) {
          this.drawGuideLineFn()
        }

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      this.handler.setInputAction((e) => {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        let id = "l_" + new Date().getTime();
        this.lines.push({ id, position: this.tempPoints });
        this.drawLine(id, this.tempPoints);
        dataManage.plugins.linesManage.saveLines(this.lines);
        this.tempPoints = [];
        this.clearTempEntity();
        this.removeEntityById(this.guideLines)
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    },
    startDrawPolygon() {
      this.startDraw = true;
      // this.currentKey = "polygon";
      this.tempPoints = [];
      this.tempPointIds = [];
      this.tempLines = [];
      this.handler.setInputAction((e) => {
        let position = this.windowPositionConvertCartesin3Fn(e.position)
        this.tempPoints.push(position);
        let id = this.getId();
        this.tempPointIds.push('td_' + id);
        this.drawPoint('td_' + id, this.tempPoints[this.tempPoints.length - 1]);
        if (this.tempPoints.length > 1) {
          this.drawLine("tl_" + id, [
            this.tempPoints[this.tempPoints.length - 2],
            this.tempPoints[this.tempPoints.length - 1],
          ]);
          this.tempLines.push("tl_" + id)
        }

      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.setInputAction((e) => {
        if (this.tempPoints.length < 3) {
          this.$message.error("请至少绘制三个点");
        } else {
          let id = "p_" + new Date().getTime();
          this.drawLine("tl_" + new Date().getTime(), [
            this.tempPoints[this.tempPoints.length - 1],
            this.tempPoints[0],
          ]);
           this.tempLines.push("tl_" + new Date().getTime());
          this.drawPolygon(id, this.tempPoints);
          this.polygons.push({ id, position: this.tempPoints });
          dataManage.plugins.polygonsManage.savePolygons(this.polygons);
          this.tempPoints = [];
          this.clearTempEntity();
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    stopDraw() {
      this.startDraw = false;
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    drawPoint(id, position) {
      let viewer = this.viewer;
      return viewer.entities.add({
        id,
        name: "点",
        position: position,
        point: {
          color: Cesium.Color.WHEAT,
          pixelSize: 20,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 规定贴地
        },
      });
    },

    drawLine(id, position) {
      let viewer = this.viewer;
      return viewer.entities.add({
        id: id? id : this.getId(),
        name: "线",
        polyline: {
          positions: position,
          width: 5.0,
          material: Cesium.Color.RED,
          depthFailMaterial: Cesium.Color.RED,
          clampToGround: true,
        },
      });
    },

    drawDashLine(id, position){
      let viewer = this.viewer;
      return viewer.entities.add({
        id,
        name: "虚线",
        polyline: {
          positions: position,
          width: 3.0,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.WHITE,
            dashLength: 20 //短划线长度
          }),
          clampToGround: true,
        },
      });
    },

    drawPolygon(id, position) {
      // console.log(`output->position`, position);
      // if(position.length < 3) return;
      let viewer = this.viewer;
      return viewer.entities.add({
        id,
        name: "面",
        polygon: {
          hierarchy: position,
          material: Cesium.Color.YELLOW.withAlpha(0.8),
          clampToGround: true,
        },
      });
    },
    initPoint() {
      this.points = dataManage.plugins.pointsManage.getPoints() || [];
      if (this.points && this.points.length) {
        for (let i = 0; i < this.points.length; i++) {
          this.drawPoint(this.points[i].id, this.points[i].position,);
        }
      }
    },
    initLine() {
      this.lines = dataManage.plugins.linesManage.getLines() || [];
      if (this.lines && this.lines.length) {
        for (let i = 0; i < this.lines.length; i++) {
          this.drawLine(this.lines[i].id, this.lines[i].position);
        }
      }
    },
    initPolygon() {
      this.polygons = dataManage.plugins.polygonsManage.getPolygons() || [];
      // console.log(`output->this.polygons`,this.polygons)
      if (this.polygons && this.polygons.length) {
        for (let i = 0; i < this.polygons.length; i++) {
          this.drawPolygon(this.polygons[i].id, this.polygons[i].position);
        }
      }
    },
  },
  mounted() {
    this.init();
    this.initPoint();
    this.initLine();
    this.initPolygon();
  },
};
</script>
<style scoped lang='scss'>
.draw-box {
  position: relative;
  .flex {
    display: flex;
  }
  .operate-box {
    position: absolute;
    top: 20px;
    left: 50px;
    z-index: 10;
  }
  .cesium-view {
    height: 100%;
    width: 100%;
  }
}
.tooltip{
  color: #fff;
  display: none;
  font-size: 15px;
  padding: 5px 10px;
  background-color: rgba(0,0,0,0.5);
  position: absolute;
  cursor: pointer;
}
</style>