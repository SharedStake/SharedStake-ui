<template>
  <div class="wrap rotor-x">
    <div class="wrap rotor-y">
      <div class="wrap rotor-z">
        <div class="triangle bottom face-1"></div>
        <div class="triangle bottom face-2"></div>
        <div class="triangle bottom face-3"></div>
        <div class="triangle bottom face-4"></div>
        <div class="triangle bottom face-5"></div>
        <div class="triangle bottom face-6"></div>
        <div class="triangle bottom face-7"></div>
        <div class="triangle bottom face-8"></div>

        <div class="triangle middle-bottom face-1"></div>
        <div class="triangle middle-bottom face-2"></div>
        <div class="triangle middle-bottom face-3"></div>
        <div class="triangle middle-bottom face-4"></div>
        <div class="triangle middle-bottom face-5"></div>
        <div class="triangle middle-bottom face-6"></div>
        <div class="triangle middle-bottom face-7"></div>
        <div class="triangle middle-bottom face-8"></div>

        <div class="triangle middle-top face-1"></div>
        <div class="triangle middle-top face-2"></div>
        <div class="triangle middle-top face-3"></div>
        <div class="triangle middle-top face-4"></div>
        <div class="triangle middle-top face-5"></div>
        <div class="triangle middle-top face-6"></div>
        <div class="triangle middle-top face-7"></div>
        <div class="triangle middle-top face-8"></div>

        <div class="triangle up face-1"></div>
        <div class="triangle up face-2"></div>
        <div class="triangle up face-3"></div>
        <div class="triangle up face-4"></div>
        <div class="triangle up face-5"></div>
        <div class="triangle up face-6"></div>
        <div class="triangle up face-7"></div>
        <div class="triangle up face-8"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {};
</script>
<style>
.wrap:hover {
  cursor: pointer;
  transform: scale3d(1.15, 1.15, 1.2);
  transition: 1s;
}
.wrap {
  position: absolute;
  width: 0px;
  height: 0px;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  transform-style: preserve-3d;
  overflow: visible;
  transition: 1s;
}
.triangle {
  position: absolute;
  left: -100px;
  top: -30px;
  width: 0;
  height: 0;
  border-left: 100px solid transparent;
  border-right: 100px solid transparent;
  border-bottom: 100px solid #33afff;
  animation: lighting 12s infinite linear;
}

.triangle {
  transition: 1s;
}
.triangle:hover {
  filter: invert(0.7);
  transition: 1s;
}
/** Bottom Down **/
.triangle.bottom {
  transform-origin: 50% 0%;
}
.triangle.bottom.face-1 {
  animation-delay: -2500ms;
  transform: translateY(90px) rotateY(0deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-2 {
  animation-delay: -3500ms;
  transform: translateY(90px) rotateY(45deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-3 {
  animation-delay: -4500ms;
  transform: translateY(90px) rotateY(90deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-4 {
  animation-delay: -5500ms;
  transform: translateY(90px) rotateY(135deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-5 {
  animation-delay: -6500ms;
  transform: translateY(90px) rotateY(180deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-6 {
  animation-delay: -7500ms;
  transform: translateY(90px) rotateY(225deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-7 {
  animation-delay: -8500ms;
  transform: translateY(90px) rotateY(270deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}
.triangle.bottom.face-8 {
  animation-delay: -9500ms;
  transform: translateY(90px) rotateY(315deg) rotateX(35deg) scaleX(0.24)
    scaleY(-1);
}

/** Middle Down **/
.triangle.middle-bottom {
  transform-origin: 50% 0%;
}
.triangle.middle-bottom.face-1 {
  animation-delay: -3500ms;
  transform: rotateY(0deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-2 {
  animation-delay: -4500ms;
  transform: rotateY(45deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-3 {
  animation-delay: -5500ms;
  transform: rotateY(90deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-4 {
  animation-delay: -6500ms;
  transform: rotateY(135deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-5 {
  animation-delay: -7500ms;
  transform: rotateY(180deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-6 {
  animation-delay: -8500ms;
  transform: rotateY(225deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-7 {
  animation-delay: -9500ms;
  transform: rotateY(270deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}
.triangle.middle-bottom.face-8 {
  animation-delay: -10500ms;
  transform: rotateY(315deg) translateY(-11px) translateZ(-34px) rotateX(-50deg)
    scaleX(0.24) scaleY(0.3);
}

/** Middle Up **/
.triangle.middle-top {
  transform-origin: 50% 100%;
}
.triangle.middle-top.face-1 {
  animation-delay: -2500ms;
  transform: rotateY(22.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-2 {
  animation-delay: -3500ms;
  transform: rotateY(67.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-3 {
  animation-delay: -4500ms;
  transform: rotateY(112.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-4 {
  animation-delay: -5500ms;
  transform: rotateY(157.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-5 {
  animation-delay: -6500ms;
  transform: rotateY(202.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-6 {
  animation-delay: -7500ms;
  transform: rotateY(247.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-7 {
  animation-delay: -8500ms;
  transform: rotateY(292.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}
.triangle.middle-top.face-8 {
  animation-delay: -9500ms;
  transform: rotateY(337.5deg) translateY(-111px) translateZ(-31px)
    rotateX(-58deg) scaleX(0.13) scaleY(-0.36);
}

/** Top Up **/
.triangle.up {
  animation: lighting-lighter 12s infinite linear;
  transform-origin: 50% 0%;
}
.triangle.up.face-1 {
  animation-delay: -3500ms;
  transform: rotateY(22.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-2 {
  animation-delay: -4500ms;
  transform: rotateY(67.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-3 {
  animation-delay: -5500ms;
  transform: rotateY(112.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-4 {
  animation-delay: -6500ms;
  transform: rotateY(157.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-5 {
  animation-delay: -7500ms;
  transform: rotateY(202.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-6 {
  animation-delay: -8500ms;
  transform: rotateY(247.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-7 {
  animation-delay: -9500ms;
  transform: rotateY(292.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}
.triangle.up.face-8 {
  animation-delay: -10500ms;
  transform: rotateY(337.5deg) translateY(-22px) translateZ(0px) rotateX(-70deg)
    scaleX(0.13) scaleY(0.33);
}

/** ANIMATIONS **/

.rotor-x {
  transform: rotateX(-22deg);
  /* animation: spinX 6s infinite linear; */
}
.rotor-y {
  animation: spinY 12s infinite linear;
}
.rotor-z {
  /* animation: spinZ 18s infinite linear; */
}
@keyframes spinX {
  from {
    transform: rotateX(0);
  }
  to {
    transform: rotateX(360deg);
  }
}
@keyframes spinY {
  from {
    transform: rotateY(0);
  }
  to {
    transform: rotateY(360deg);
  }
}
@keyframes spinZ {
  from {
    transform: rotateZ(0);
  }
  to {
    transform: rotateZ(360deg);
  }
}
@keyframes lighting {
  0% {
    border-bottom-color: #33afff;
  }
  50% {
    border-bottom-color: #bbe8ff;
  }
  100% {
    border-bottom-color: #33afff;
  }
}
@keyframes lighting-lighter {
  0% {
    border-bottom-color: #72c8ff;
  }
  50% {
    border-bottom-color: #99eaff;
  }
  100% {
    border-bottom-color: #72c8ff;
  }
}
</style>