import * as Cesium from "cesium";
export function windowPositionConvertCartesin3Fn(viewer, windowPosition) {
  // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
  let ray = viewer.camera.getPickRay(windowPosition);
  // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
  return viewer.scene.globe.pick(ray, viewer.scene);
}

export function cartesianToCartographicDegreesFn(cartesian3) {
  let cartograhphic =
    Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian3);
  // console.log(cartograhphic, "cartograhphic");
  let lat = Cesium.Math.toDegrees(cartograhphic.latitude);
  let lng = Cesium.Math.toDegrees(cartograhphic.longitude);
  let alt = cartograhphic.height;

  return [lng, lat, alt];
}
