import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uEnableWaves;

void main() {
  vUv = uv;
  float time = uTime * 5.0;
  vec3 transformed = position;
  transformed.x += sin(time + position.y) * 0.5 * uEnableWaves;
  transformed.y += cos(time + position.z) * 0.15 * uEnableWaves;
  transformed.z += sin(time + position.x) * uEnableWaves;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
  float time = uTime;
  vec2 pos = vUv;
  float r = texture2D(uTexture, pos + cos(time + pos.x) * 0.008).r;
  float g = texture2D(uTexture, pos + sin(time * 0.7 + pos.x) * 0.006).g;
  float b = texture2D(uTexture, pos - cos(time + pos.y) * 0.008).b;
  float a = texture2D(uTexture, pos).a;
  gl_FragColor = vec4(r, g, b, a);
}
`;

const mapRange = (n: number, start: number, stop: number, start2: number, stop2: number) =>
  ((n - start) / (stop - start)) * (stop2 - start2) + start2;

class AsciiFilter {
  readonly domElement = document.createElement('div');
  private readonly pre = document.createElement('pre');
  private readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d', { willReadFrequently: true });
  private width = 0;
  private height = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly fontSize: number,
    private readonly fontFamily: string,
  ) {
    this.domElement.className = 'ascii-layer__output';
    Object.assign(this.domElement.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
    this.domElement.append(this.pre, this.canvas);
    this.canvas.style.display = 'none';
    if (this.context) this.context.imageSmoothingEnabled = false;
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();
  }

  private reset() {
    if (!this.context) return;
    this.context.font = `${this.fontSize}px ${this.fontFamily}`;
    const charWidth = Math.max(this.context.measureText('A').width, 1);
    this.canvas.width = Math.max(1, Math.floor(this.width / charWidth));
    this.canvas.height = Math.max(1, Math.floor(this.height / this.fontSize));

    Object.assign(this.pre.style, {
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: '0', padding: '0',
      fontFamily: this.fontFamily, fontSize: `${this.fontSize}px`, lineHeight: '1em', letterSpacing: '0', color: '#f4f4f5',
      background: 'transparent', userSelect: 'none', pointerEvents: 'none', textAlign: 'left', whiteSpace: 'pre',
    });
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);
    if (!this.context || !this.canvas.width || !this.canvas.height) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.renderer.domElement, 0, 0, this.canvas.width, this.canvas.height);
    const pixels = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    const chars = ' .:-=+*#%@';
    let output = '';

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const index = x * 4 + y * 4 * this.canvas.width;
        const [r, g, b, a] = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
        if (a === 0) { output += ' '; continue; }
        const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
        output += chars[chars.length - Math.floor((1 - gray) * (chars.length - 1)) - 1];
      }
      output += '\n';
    }
    this.pre.textContent = output;
  }
}

class CanvasText {
  readonly canvas = document.createElement('canvas');
  private readonly context = this.canvas.getContext('2d');

  constructor(private readonly text: string, private readonly fontSize: number, private readonly color: string) {}

  render() {
    if (!this.context) return;
    const font = `700 ${this.fontSize}px "Space Mono", "Noto Sans CJK JP", "Segoe UI Symbol", monospace`;
    this.context.font = font;
    const metrics = this.context.measureText(this.text);
    this.canvas.width = Math.ceil(metrics.width) + 40;
    this.canvas.height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 40;
    this.context.font = font;
    this.context.fillStyle = this.color;
    this.context.textBaseline = 'alphabetic';
    this.context.fillText(this.text, 20, 20 + metrics.actualBoundingBoxAscent);
  }
}

class CanvAscii {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly scene = new THREE.Scene();
  private readonly renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  private readonly mouse: { x: number; y: number };
  private geometry?: THREE.PlaneGeometry;
  private material?: THREE.ShaderMaterial;
  private texture?: THREE.CanvasTexture;
  private mesh?: THREE.Mesh;
  private filter?: AsciiFilter;
  private frame = 0;

  constructor(private readonly container: HTMLElement, private width: number, private height: number, private readonly text: string) {
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.z = 30;
    this.mouse = { x: width / 2, y: height / 2 };
  }

  async init() {
    await document.fonts.ready;
    const textCanvas = new CanvasText(this.text, 420, '#f4f4f5');
    textCanvas.render();
    this.texture = new THREE.CanvasTexture(textCanvas.canvas);
    this.texture.minFilter = THREE.NearestFilter;
    const planeHeight = 18;
    this.geometry = new THREE.PlaneGeometry(planeHeight * (textCanvas.canvas.width / textCanvas.canvas.height), planeHeight, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true,
      uniforms: { uTime: { value: 0 }, uTexture: { value: this.texture }, uEnableWaves: { value: 1 } },
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.filter = new AsciiFilter(this.renderer, 5, '"Space Mono", Consolas, monospace');
    this.container.appendChild(this.filter.domElement);
    this.container.addEventListener('mousemove', this.onPointerMove);
    this.container.addEventListener('touchmove', this.onPointerMove);
    this.setSize(this.width, this.height);
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.filter?.setSize(width, height);
  }

  private onPointerMove = (event: MouseEvent | TouchEvent) => {
    const pointer = 'touches' in event ? event.touches[0] : event;
    if (!pointer) return;
    const bounds = this.container.getBoundingClientRect();
    this.mouse.x = pointer.clientX - bounds.left;
    this.mouse.y = pointer.clientY - bounds.top;
  };

  start() {
    const render = () => {
      this.frame = requestAnimationFrame(render);
      if (!this.mesh || !this.material || !this.filter) return;
      this.material.uniforms.uTime.value = Math.sin(Date.now() * 0.001);
      const x = mapRange(this.mouse.y, 0, this.height, 0.45, -0.45);
      const y = mapRange(this.mouse.x, 0, this.width, -0.45, 0.45);
      this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05;
      this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05;
      this.filter.render(this.scene, this.camera);
    };
    render();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.container.removeEventListener('mousemove', this.onPointerMove);
    this.container.removeEventListener('touchmove', this.onPointerMove);
    this.filter?.domElement.remove();
    this.geometry?.dispose();
    this.material?.dispose();
    this.texture?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

export default function AsciiLayer({ text = String.fromCharCode(0x6cc9) }: { text?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let cancelled = false;
    let instance: CanvAscii | null = null;
    const observer = new ResizeObserver(([entry]) => instance?.setSize(entry.contentRect.width, entry.contentRect.height));

    const setup = async () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const nextInstance = new CanvAscii(container, width, height, text);
      await nextInstance.init();
      if (cancelled) {
        nextInstance.dispose();
        return;
      }
      instance = nextInstance;
      instance.start();
      observer.observe(container);
    };
    setup();

    return () => {
      cancelled = true;
      observer.disconnect();
      instance?.dispose();
    };
  }, [text]);

  return <div ref={ref} className="ascii-layer" aria-hidden="true" />;
}
