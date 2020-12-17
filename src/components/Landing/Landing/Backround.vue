<template>
  <div id="container"></div>
</template>

<script>
import * as Three from "three";

export default {
  name: "ThreeTest",
  data() {
    return {
      camera: null,
      scene: null,
      renderer: null,
      mesh: null,
      light1: null,
      light2: null,
    };
  },
  methods: {
    init: function () {
      let container = document.getElementById("container");

      this.camera = new Three.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        100
      );
      this.camera.position.z = 1;
      this.camera.position.y = 1;
      this.camera.position.x = 1;

      this.scene = new Three.Scene();

      let geometry = new Three.BoxGeometry(0.2, 0.2, 0.2);
      let material = new Three.MeshStandardMaterial({
        color: 0x505050,
        roughness: 0.7,
        metalness: 1,
      });

      this.mesh = new Three.Mesh(geometry, material);
      this.scene.add(this.mesh);

      var sphere = new Three.SphereBufferGeometry(1.1, 16, 8);
      this.light1 = new Three.PointLight(0x1d3c7a, 10, 500);
      this.light1.add(
        new Three.Mesh(
          sphere,
          new Three.MeshBasicMaterial({
            color: 0x1d3c7a,
          })
        )
      );
      this.light1.position.set(5, 5, 5);
      const light = new Three.AmbientLight(0x404040); // soft white light
      this.scene.add(light);
      this.scene.add(this.light1);

      this.light2 = new Three.PointLight(0x3d5c9a, 10, 500);
      this.light2.add(
        new Three.Mesh(
          sphere,
          new Three.MeshBasicMaterial({
            color: 0x3d5c9a,
          })
        )
      );
      this.light2.position.set(5, 5, 5);

      this.scene.add(this.light2);

      this.camera.lookAt(0.4, 0.4, 0.4);
      this.renderer = new Three.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);
    },
    animate: function () {
      requestAnimationFrame(this.animate);
      this.mesh.rotation.x += 0.03;
      this.mesh.rotation.z += 0.03;
      this.renderer.render(this.scene, this.camera);
    },
  },
  mounted() {
    this.init();
    this.animate();
  },
};
</script>

<style scoped>
#container {
  height: 1000px;
}
/*TODO give your container a size.*/
</style>