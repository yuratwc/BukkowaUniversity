/*
 Campus Bomber AR
*/

window.BOMBER = {
  debugmode: true
};

class Stopwatch
{
  constructor() {
    this.startTime = 0;
    this.savedTime = 0;
    this.subTime = 0;
    this.reseted = true;
    this.paused = false;
  }

  play() {
    if(this.reseted) {
      this.startTime = new Date().getTime();
      this.reseted = false;
    } else {
      this.resume();
    }
  }

  pause() {
    if(this.reseted) {
      return;
    }
    this.savedTime = new Date().getTime();
    this.paused = true;
  }

  resume() {
    if(this.reseted) {
      return;
    }
    const now = new Date().getTime();
    this.subTime += now - this.savedTime;
    this.paused = false;
  }

  stop() {
    this.pause();
  }

  reset() {
    this.startTime = 0;
    this.savedTime = 0;
    this.subTime = 0;
    this.reseted = true;
  }

  getTime() {
    if(this.reseted) {
      return 0;
    }
    if(this.paused) {
      return this.savedTime - this.startTime - this.subTime;
    }
    const now = new Date().getTime();
    return now - this.startTime  - this.subTime;
  }
}

(function() {
  var effectTexture = null;
  var laycastTargets = [];
  var showing = false;
  var timer = new Stopwatch();
  var readyCount = 60;
  var timeOver = false;
  var totalMaxBroken = 1;
  var totalBroken = 0;
  var gameStart = false;

  let domBalls = document.getElementById('balls');

  window.BOMBER.restart = function() {
    showing = false;
    timer = new Stopwatch();
    readyCount = 60;
    timeOver = false;
    //totalMaxBroken = 1;
    totalBroken = 0;
    gameStart = false;
    //domBalls.children.clear();
    domBalls.innerHTML = '';
    document.getElementById('result').style.display = 'none';
    document.getElementById('desc-overlay').style.display = 'flex';
    document.getElementById('percent').innerText = Math.floor(totalBroken / totalMaxBroken * 100);

    for(let bui of document.getElementById('marker-frame').children) {
      if(bui.components.building) {
        bui.components.building.reset();
      }
    }
  }

  function init() {
    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = '*';
    texLoader.load('./smoke.png', 
      texture => { // onLoad
        domBalls = document.getElementById('balls');
        /*
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ map: texture });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        */
        effectTexture = texture;
      },
      xhr => { // onProgress
      },
      xhr => { // onError
      }
    );


    window.addEventListener('load', () => {
    const countdownDisplay = document.getElementById('time');
    setInterval(() => {
      if(timeOver)
        return;
      const t = Math.min(30000, (30000 - timer.getTime()));
      countdownDisplay.innerText = Math.max(0, Math.floor(t/1000));
      if(readyCount > -1) {
        if(showing) {
          readyCount--;
        }
        const element = document.getElementById('ready-num');
        const backText = element.innerText;
        if(readyCount < 40 && readyCount >= 0)
        {
          const num = Math.floor((readyCount)/10);
          element.innerText = num == 0 ? 'GO' : (num);
        } else {
          element.innerText = '';
        }
        if(readyCount == -1) {
          element.innerText = '';
          timer.play();
        }

        if(!showing) {
          document.getElementById('ready-num').innerText = '';
        }

        if(backText != element.innerText) {
          element.classList.remove("number-animate");
          void element.offsetWidth;
          element.classList.add("number-animate");
        }
      }

      gameStart = (readyCount <= -1);

      if(timer.getTime() >= 30000) {
        timeOver = true;
        timer.stop();
        document.getElementById('percent-result').innerText = (Math.floor(totalBroken / totalMaxBroken * 1000) / 10);
        document.getElementById('result').style.display = 'block';
        //document.getElementById('result').classList.add('transition-show');
      }
    }, 100);
    //console.log('loaded');
  });

    //particleFire.install({THREE: THREE});
    
  }

  function log(arg) {
    //document.getElementById('marker-shower').textContent += arg + '<br>';
  }
  init();
  function shoot(evt) {
    if(!showing || timeOver || !gameStart)
      return;
      /*
    let px, py;
    if(evt.changedTouches) {
      const touches = evt.changedTouches;
      px = touches[0].x;
      py = touches[0].y;
    }
    if(evt.clientX) {
      px = evt.clientX;
      py = evt.clientY;
    }
    */

    const flyer = document.getElementById('flyer'); //player
    let worldPos = new THREE.Vector3();
    worldPos.setFromMatrixPosition(flyer.object3D.matrixWorld);
    flyer.components.sound.playSound();
    //console.log(worldPos  );

    //console.log (flyer.getObject3D('camera') );

    spawnBullet(worldPos.x, worldPos.y, worldPos.z);
  }

  function spawnBullet(x, y, z) {
    const bullet = document.createElement('a-entity');
    bullet.setAttribute('position', x + ' ' + y + ' ' + z);
    bullet.setAttribute('radius', '0.2');
    bullet.setAttribute('scale', '0.1 0.1 0.1');
    bullet.setAttribute('gltf-model', '#bomb');
    bullet.setAttribute('sound', 'src: #sebomb');
    //bullet.setAttribute('color', '#FF9500');
    //bullet.setAttribute('dynamic-body', '');
    //bullet.setAttribute('velocity', '0 0 -20');

    //const scene = document.querySelector('a-scene');
    const base = domBalls;
    //base.appendChild(bullet);

    base.appendChild(bullet);

    const frame = document.querySelector('#marker-frame');

    const raycaster = new THREE.Raycaster();
    raycaster.set(new THREE.Vector3(x, y, z), new THREE.Vector3(0, 0, -1));
    const intersects = raycaster.intersectObjects( laycastTargets, true );

    bullet.addEventListener('componentinitialized', (evt) => {
      if (evt.detail.name === 'bullet-mover') {
        const worldToLocal = new THREE.Matrix4().getInverse(base.object3D.matrixWorld);
        //worldToLocal.decompose(bullet.object3D.position, bullet.object3D.quaternion, bullet.object3D.scale);
        let newpos = bullet.object3D.position.clone();
        newpos.applyMatrix4(worldToLocal);
        let targetPos = new THREE.Vector3(0, 0, -1);
        targetPos.applyMatrix4(worldToLocal);

        bullet.object3D.position.set(newpos.x, newpos.y, newpos.z);
        targetPos.sub(newpos);
        const velocity = targetPos.normalize();//.multiplyScalar(0.0035);
        const mover = bullet.components["bullet-mover"];
        mover.setVelocity(velocity);

        if(intersects.length > 0) {
          mover.targetBuilding = intersects[0].object.el;
          //console.log(intersects[0].object.el);
        }

      }
    });


    if(intersects.length > 0) {
      for(let i = 0; i < intersects.length; i ++) {
        //console.log(intersects[i].distance);
        bullet.setAttribute('bullet-mover', 'distance: ' + intersects[i].distance);
        break;
      }
    } else {
      bullet.setAttribute('bullet-mover', 'distance: 9999');
    }

    //console.log(intersects);
  }

  

  if(window.BOMBER.debugmode == true) {
    window.addEventListener('mousedown', shoot);
  }
  window.addEventListener('touchstart', shoot);
  AFRAME.registerComponent('bullet-mover', {
    schema: {
      distance: {type:'number', default: 0.0 },
      speed: {type:'number', default: 0.45 },
    },
    init: function() {
      this.velocity = new THREE.Vector3();
      this.moveDistance = 0.0;
      this.enable = true;
    },
    tick: function () {  
      if(!this.enable || !showing) {
        return;
      }
     if(this.velocity) {
      this.el.object3D.position.x += this.velocity.x;
      this.el.object3D.position.y += this.velocity.y;
      this.el.object3D.position.z += this.velocity.z;
      this.moveDistance += this.data.speed;
     }

     if(this.data.distance < this.moveDistance) {
       this.el.object3D.visible = false;
       //hit
       if(this.targetBuilding) {
         let d = this.targetBuilding.components.building.hit();
        if(d == true) {
          this.el.components.sound.playSound();
          this.enable = false;

          const smoke = document.createElement('a-entity');
          smoke.setAttribute('position', this.el.object3D.position.x + ' ' + this.el.object3D.position.y + ' ' + this.el.object3D.position.z);
          smoke.setAttribute('smoke-effect', '');
          smoke.setAttribute('render-order', 'smog');
          const base = domBalls;
          base.appendChild(smoke);

          //bullet.setAttribute('color', '#FF9500');
          //bullet.setAttribute('dynamic-body', '');
          //bullet.setAttribute('velocity', '0 0 -20');
      
          //const scene = document.querySelector('a-scene');
          //base.appendChild(bullet);
      

          //this.el.parentNode.removeChild(this.el);
        }
       }
     }
     if(this.el.object3D.position.y < -2) {
      this.enable = false;
      this.el.object3D.visible = false;
     }
     this.el.object3D.rotation.x += 0.03;
     this.el.object3D.rotation.y += 0.03;
     this.el.object3D.rotation.z += 0.03;
    },
    setVelocity : function(vel) {
      this.velocity = vel.clone().multiplyScalar(this.data.speed);
    }
  });


  AFRAME.registerComponent('univ-ticker', {
    init: function() {
      this.el.addEventListener('model-loaded', (obj) => {
        //console.log(this.el.object3D.children);
        //const validObjects = ["inf_1", "inf_2", "s_port", "innovation", "south_hall", "sanaru_hall", "kagai", "takayanagi", "budo", "gym", "north_hall", "eng_8", "eng_7", "eng_4", "eng_5", "monozukuri_house", "monozukuri_center", "eng_1", "eng_2", "eng_6", "eng_3", "nanodevice", "electronics", "Hikarisoki", "inf_graduate", "lecture_building", "sogo", "hei", "tokeitou", "mother", "keijiban", "statue_of_kenjiro", "toilet", "sanaru_hall"];

        const frame = document.querySelector('#marker-frame');
        this.el.object3D.scale = new THREE.Vector3(0.1, 0.1, 0.1);

        const univParent = this.el.object3D.children[0];
        let queue = [...univParent.children];
        log('decompose start');
        const fragment = document.createDocumentFragment();
        while(queue.length > 0/*let i = 0; i < univParent.children.length; i++*/) {
          const child = queue.pop();
          if(child.type == "Mesh"/*true || validObjects.indexOf(child.name) !== -1*/) {
            const model = document.createElement('a-entity');
            const maxhp = Math.floor(Math.sqrt(child.geometry.boundingSphere.radius)/4) + 1;
            if(child.geometry.boundingSphere.radius < 1) {
              continue;
            }
            model.setAttribute('building', 'hp: ' + maxhp + ';maxhp: ' + maxhp + ';');
            if(child.material) {
              //child.material.side = THREE.FrontSide;
              //child.material = new THREE.ShaderMaterial(child);
              child.material.fragmentShader = document.getElementById( 'fs-b' ).textContent;
              child.material.vertexShader = document.getElementById( 'vs' ).textContent;
            }
            
            let worldPos = new THREE.Vector3();
            worldPos.setFromMatrixPosition(child.matrixWorld);
            model.setAttribute('position', `${worldPos.x} ${worldPos.y} ${worldPos.z}`);
            worldPos.setFromMatrixScale(child.matrixWorld);
            worldPos.multiplyScalar(0.0045);
            worldPos.y *= 1.78;
            model.setAttribute('scale', `${worldPos.x} ${worldPos.y} ${worldPos.z}`);
            let euler = new THREE.Euler();
            euler.setFromRotationMatrix(child.matrixWorld);
            model.setAttribute('rotation', `${euler.x} ${euler.y} ${euler.z}`);

            model.setObject3D('mesh', child);
            fragment.appendChild(model);
            totalMaxBroken += maxhp;
            laycastTargets.push(child);
            //console.log(maxhp);
          } else if(child.children) {
            for(let j = 0; j < child.children.length; j++) {
              queue.push(child.children[j]);
            }
          }
        }
        frame.appendChild(fragment);

        log('decompose finish');
        document.getElementById('loading').style.display = 'none';
        
        this.el.setAttribute('visible', 'false');
        //console.log(this.el.object3D.children.length);

      });
    },
    tick: function () {  
      if(showing) {

        let quaternion = new THREE.Quaternion();
        this.el.object3D.getWorldQuaternion( quaternion );

        let rotation = new THREE.Euler();
        rotation.setFromQuaternion(quaternion);
      }
      
    }
  });

  AFRAME.registerComponent('building', {
    schema: {
      hp: {type:'int', default: 2},
      maxhp: {type:'int', default: 2}
    },
    init: function() {
      console.log(this.data.hp + "," + this.data.maxhp);
    },
    tick: function() {

    },
    reset: function() {
      this.data.hp = this.data.maxhp;
      this.el.object3D.visible = true;
      console.log(this.data.hp);
    },
    hit: function() {
      console.log('no~kan' + this.data.hp);
      if(this.data.hp <= 0) {
        this.el.object3D.visible = false;
        return false;
      }
      this.data.hp -= 1;
      this.el.object3D.visible = (this.data.hp <= 0);
      totalBroken += 1;
      document.getElementById('percent').innerText = Math.floor(totalBroken / totalMaxBroken * 100);

      return true;
    },
    getMaxHp: function() {
      return 2;
    }
  });

  AFRAME.registerComponent('marker-ticker', {
    schema: {
      showUniv: {type: 'boolean', default: false}
    },
    init: function() {

      this.el.addEventListener('markerFound', () => {
        //log('found marker');
        this.data.showUniv = true;
        showing = true;
        if(!timeOver) {
          document.getElementById('desc-overlay').style.display = 'none';
          if(readyCount >= 0) {
            readyCount = 60;
          }

          if(readyCount <= 0) {
            timer.play();
          }
        }
      });
      
      this.el.addEventListener('markerLost', () => {
        this.data.showUniv = false;
        showing = false;
        document.getElementById('ready-num').innerText = '';
        //log('lost marker');
        if(!timeOver) {
          document.getElementById('desc-overlay').style.display = 'flex';
          if(readyCount <= 0) {
            timer.pause();
          }
        }
      });
    },
    tick: function () {  
      if(this.data.showUniv) {

      }

      const base = domBalls;
      this.el.object3D.matrix.decompose(base.object3D.position, base.object3D.quaternion, base.object3D.scale);

    }
  });

  AFRAME.registerComponent('smoke-effect', {
    schema: {

    },
    init: function() {

      const effectMaterial = {
        uniforms: {
          "time": {value: 1.0},
          "size": {value: 64.0},
          "texture": {value: effectTexture},
          //"color": {value: new THREE.Vector3(0.7, .7, .7)}
          "color": {value: new THREE.Vector3(0.1, .1, .1)}
        },
        vertexShader: document.getElementById('vs').textContent,
        fragmentShader: document.getElementById('fs').textContent,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        color: 0x00FF00
      }
      const material = new THREE.ShaderMaterial(effectMaterial);
      this.geometry = new THREE.Points( new THREE.SphereGeometry( 1, 4, 4 ), material );
      this.geometry.scale.set(0.005, 0.005, 0.005);
      this.el.setObject3D('geometry', this.geometry);
    },
    tick: function() {
      //this.geometry.material.update( 1/60.0 );
      this.geometry.scale.x *= 1.1;
      this.geometry.scale.y *= 1.1;
      this.geometry.scale.z *= 1.1;
      if(this.geometry.scale.x > 0.1) {
        this.geometry.visible = false;
      }
    }
  });
  
})();
