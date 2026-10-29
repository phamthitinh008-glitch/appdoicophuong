/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { VirtualRoom, Exhibit } from '../../types';
import { speechService, PlaybackState } from '../../utils/speech';
import { AudioControlBar } from '../audio/AudioControlBar';
import { AudioSettingsModal } from '../audio/AudioSettingsModal';
import { RoomAutoPromptModal } from '../audio/RoomAutoPromptModal';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle,
  HelpCircle,
  X,
  BookOpen,
  Settings,
} from 'lucide-react';

interface VirtualMuseum3DProps {
  rooms: VirtualRoom[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onSwitchTo2D: () => void;
}

export const VirtualMuseum3D: React.FC<VirtualMuseum3DProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onSwitchTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeExhibit, setActiveExhibit] = useState<Exhibit | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(speechService.getState());
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const lastPromptedRoomRef = useRef<string>('');

  // Active room data
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Ref to hold dynamic 3D elements for room changes
  const interactiveObjectsRef = useRef<THREE.Mesh[]>([]);
  const cameraTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 8));
  const controlsRef = useRef<OrbitControls | null>(null);
  const rotatingGroupRef = useRef<THREE.Group[]>([]);

  // Subscribe to speech service
  useEffect(() => {
    const handleUpdate = (state: PlaybackState) => {
      setPlaybackState(state);
    };
    speechService.addListener(handleUpdate);
    return () => speechService.removeListener(handleUpdate);
  }, []);

  // Room change effect: stop old room audio, prompt for new room
  useEffect(() => {
    speechService.stop();
    const prefs = speechService.getPreferences();
    if (prefs.autoPromptRoom && lastPromptedRoomRef.current !== currentRoom.id) {
      lastPromptedRoomRef.current = currentRoom.id;
      setShowAutoPrompt(true);
    }
  }, [currentRoom.id]);

  // Narration handler
  const handlePlayRoomNarration = useCallback((text: string, title?: string) => {
    if (speechService.isSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(text, {
        title: title || currentRoom.title,
      });
    }
  }, [currentRoom.title]);

  // WebGL 3D Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software GL per Three.js skill
    const glProbe = document.createElement('canvas').getContext('webgl2');
    let isSoftwareGl = false;
    if (glProbe) {
      const ext = glProbe.getExtension('WEBGL_debug_renderer_info');
      const gpuString = ext ? String(glProbe.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      glProbe.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuString);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181313); // Warm deep museum atmosphere
    scene.fog = new THREE.FogExp2(0x181313, 0.025);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.5, 9);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going beneath floor
    controls.minDistance = 2.5;
    controls.maxDistance = 16;
    controls.target.set(0, 1.4, 0);
    controlsRef.current = controls;

    // Museum Architecture: Floor with polished wooden / marble parquet texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d')!;
    ctx.fillStyle = '#261b17';
    ctx.fillRect(0, 0, 512, 512);
    // Draw wood parquet grid lines
    ctx.strokeStyle = '#382823';
    ctx.lineWidth = 4;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.35,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isSoftwareGl;
    scene.add(floor);

    // Back Grand Memorial Wall with red banner & gold stars
    const backWallGeo = new THREE.PlaneGeometry(24, 8);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x221c1a,
      roughness: 0.8,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 4, -8);
    scene.add(backWall);

    // Center Grand Red Banner
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 512;
    const bCtx = bannerCanvas.getContext('2d')!;
    bCtx.fillStyle = '#b91c1c'; // Red flag
    bCtx.fillRect(0, 0, 1024, 512);
    // Gold star and text
    bCtx.fillStyle = '#fde047';
    bCtx.font = 'bold 36px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('ĐỘI THIẾU NIÊN TIỀN PHONG HỒ CHÍ MINH', 512, 90);
    bCtx.font = 'bold 24px sans-serif';
    bCtx.fillText('VÌ TỔ QUỐC XÃ HỘI CHỦ NGHĨA - VÌ LÝ TƯỞNG CỦA BÁC HỒ VĨ ĐẠI', 512, 140);
    bCtx.font = 'bold 44px sans-serif';
    bCtx.fillText('SẴN SÀNG!', 512, 210);
    // Draw golden five-pointed star
    bCtx.save();
    bCtx.translate(512, 340);
    bCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      bCtx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 70, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 70);
      bCtx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 28, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 28);
    }
    bCtx.closePath();
    bCtx.fillStyle = '#facc15';
    bCtx.fill();
    bCtx.restore();

    const bannerTexture = new THREE.CanvasTexture(bannerCanvas);
    bannerTexture.colorSpace = THREE.SRGBColorSpace;
    bannerTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 5),
      new THREE.MeshStandardMaterial({
        map: bannerTexture,
        roughness: 0.5,
      })
    );
    bannerMesh.position.set(0, 4.2, -7.9);
    scene.add(bannerMesh);

    // Warm Key Light + Ambient Light
    const hemiLight = new THREE.HemisphereLight(0xffecd2, 0x1f1917, 1.2);
    scene.add(hemiLight);

    const dirKeyLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
    dirKeyLight.position.set(4, 7, 5);
    dirKeyLight.castShadow = !isSoftwareGl;
    dirKeyLight.shadow.mapSize.width = 1024;
    dirKeyLight.shadow.mapSize.height = 1024;
    scene.add(dirKeyLight);

    // Dynamic Exhibit Pedestals
    const roomExhibits = currentRoom.exhibits;
    const meshes: THREE.Mesh[] = [];
    const rotators: THREE.Group[] = [];

    // Position exhibits along an arc or semi-circle
    const numExhibits = roomExhibits.length;
    const radius = 4.2;

    roomExhibits.forEach((exhibit, idx) => {
      const angle = ((idx - (numExhibits - 1) / 2) * 0.75);
      const posX = Math.sin(angle) * radius;
      const posZ = Math.cos(angle) * (radius * 0.7) - 1.5;

      const pedestalGroup = new THREE.Group();
      pedestalGroup.position.set(posX, 0, posZ);

      // 1. Plinth Base (Dark walnut wood)
      const plinthGeo = new THREE.CylinderGeometry(0.75, 0.85, 1.1, 32);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x3d271d,
        roughness: 0.3,
        metalness: 0.1,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = 0.55;
      plinth.castShadow = !isSoftwareGl;
      plinth.receiveShadow = !isSoftwareGl;
      pedestalGroup.add(plinth);

      // 2. Brass Plaque with exhibit title
      const plaqueCanvas = document.createElement('canvas');
      plaqueCanvas.width = 512;
      plaqueCanvas.height = 128;
      const pCtx = plaqueCanvas.getContext('2d')!;
      pCtx.fillStyle = '#b45309';
      pCtx.fillRect(0, 0, 512, 128);
      pCtx.fillStyle = '#fef3c7';
      pCtx.font = 'bold 26px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.fillText(exhibit.title.slice(0, 28), 256, 55);
      pCtx.font = '20px sans-serif';
      pCtx.fillText('★ CHẠM ĐỂ XEM CHI TIẾT ★', 256, 95);

      const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
      plaqueTex.colorSpace = THREE.SRGBColorSpace;
      const plaqueMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.25),
        new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.2, metalness: 0.8 })
      );
      plaqueMesh.position.set(0, 0.6, 0.76);
      pedestalGroup.add(plaqueMesh);

      // 3. Velvet red cushion
      const velvetGeo = new THREE.CylinderGeometry(0.65, 0.68, 0.08, 32);
      const velvetMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        roughness: 0.9,
      });
      const velvet = new THREE.Mesh(velvetGeo, velvetMat);
      velvet.position.y = 1.14;
      pedestalGroup.add(velvet);

      // 4. Rotating Hero Model on top of pedestal
      const rotatorGroup = new THREE.Group();
      rotatorGroup.position.set(0, 1.45, 0);

      // Create distinctive procedural geometry based on index
      if (idx === 0) {
        // Gold Star / Emblem
        const starGeo = new THREE.OctahedronGeometry(0.35, 1);
        const starMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.15,
          metalness: 0.9,
        });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        rotatorGroup.add(starMesh);
      } else if (idx === 1) {
        // Red Scarf / Memorial Torus
        const torusGeo = new THREE.TorusGeometry(0.28, 0.09, 16, 40);
        const torusMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          roughness: 0.4,
          metalness: 0.2,
        });
        const torusMesh = new THREE.Mesh(torusGeo, torusMat);
        torusMesh.rotation.x = Math.PI / 4;
        rotatorGroup.add(torusMesh);
      } else {
        // Historical Bronze Book / Monument
        const bookGeo = new THREE.BoxGeometry(0.45, 0.12, 0.35);
        const bookMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.3,
          metalness: 0.6,
        });
        const bookMesh = new THREE.Mesh(bookGeo, bookMat);
        rotatorGroup.add(bookMesh);
      }

      pedestalGroup.add(rotatorGroup);
      rotators.push(rotatorGroup);

      // 5. Interactive Glass Vitrine Dome (with depthWrite: false and click proxy)
      const domeGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.85, 32);
      const domeMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isSoftwareGl ? 0.3 : 0.45,
        roughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.7,
        thickness: 0.5,
        depthWrite: false,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 1.55;
      dome.userData = { exhibit };
      pedestalGroup.add(dome);
      meshes.push(dome);

      // Spotlight for this pedestal
      const spotLight = new THREE.SpotLight(0xfff5ea, 3.5, 7, Math.PI / 6, 0.4);
      spotLight.position.set(posX, 5.0, posZ + 0.5);
      spotLight.target = plinth;
      scene.add(spotLight);

      scene.add(pedestalGroup);
    });

    interactiveObjectsRef.current = meshes;
    rotatingGroupRef.current = rotators;

    // Raycaster for user touch / click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClickOrTouch = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;
      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const ex = hit.userData.exhibit as Exhibit;
        if (ex) {
          setActiveExhibit(ex);
          setQuizAnswerSelected(null);
          setIsAnswerRevealed(false);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handleClickOrTouch);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop with damping
    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Slowly rotate hero artifacts on pedestals
      rotatingGroupRef.current.forEach((grp) => {
        grp.rotation.y += delta * 0.8;
      });

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('click', handleClickOrTouch);
      controls.dispose();
      renderer.dispose();
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, [currentRoom]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[580px] bg-stone-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Room Spec Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div className="bg-stone-900/90 backdrop-blur border border-stone-700/80 rounded-xl p-3 shadow-lg max-w-sm text-stone-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
              PHÒNG {currentRoom.roomNumber} / 8
            </span>
            <span className="text-[10px] bg-red-900/80 text-red-200 px-2 py-0.5 rounded font-medium">
              3D Không Gian Ảo
            </span>
          </div>
          <h2 className="font-serif text-base font-bold text-white mt-1 leading-snug">
            {currentRoom.title}
          </h2>
          <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
            {currentRoom.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-stone-800">
            <button
              onClick={() => handlePlayRoomNarration(currentRoom.audioNarrationText, currentRoom.title)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                playbackState.isSpeaking
                  ? 'bg-amber-500 text-stone-900 shadow-sm'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
              }`}
            >
              {playbackState.isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{playbackState.isSpeaking ? 'Dừng Thuyết Minh' : 'Nghe Thuyết Minh Phòng'}</span>
            </button>
            <button
              onClick={onSwitchTo2D}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Chế độ 2D</span>
            </button>
            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="p-1.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors ml-auto"
              title="Cài đặt giọng đọc tiếng Việt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Dedicated Audio Control Bar below Room Narration Button */}
          <AudioControlBar
            onOpenSettings={() => setIsAudioSettingsOpen(true)}
            className="mt-3 w-full"
          />
        </div>
      </div>

      {/* Room Auto Prompt Modal upon room entry */}
      <RoomAutoPromptModal
        isOpen={showAutoPrompt}
        roomNumber={currentRoom.roomNumber}
        roomTitle={currentRoom.title}
        onAccept={() => {
          setShowAutoPrompt(false);
          handlePlayRoomNarration(currentRoom.audioNarrationText, currentRoom.title);
        }}
        onDismiss={() => setShowAutoPrompt(false)}
      />

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />

      {/* Top Right: Helper Guide Indicator */}
      <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 bg-stone-900/80 backdrop-blur border border-stone-700/60 rounded-lg px-3 py-1.5 text-xs text-stone-300 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Kéo chuột để xoay · Lăn chuột để phóng to/thu nhỏ · Chạm hiện vật để xem</span>
      </div>

      {/* Unified Bottom Control Dock (Adheres to Three.js Directive 5) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-4xl pointer-events-auto transition-transform duration-300">
        <div className="flex flex-col items-center">
          {/* Collapse/Expand Toggle Pill */}
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="mb-1.5 px-3 py-1 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 rounded-full text-[11px] font-medium text-stone-300 flex items-center gap-1 shadow-md transition-colors"
          >
            {isHudCollapsed ? (
              <>
                <span>▲ Hiện Bảng Chọn Khu Vực</span>
              </>
            ) : (
              <>
                <span>▼ Ẩn Thanh Điều Khiển</span>
              </>
            )}
          </button>

          {/* Horizontal Dock */}
          {!isHudCollapsed && (
            <div className="w-full bg-stone-900/95 backdrop-blur border border-stone-700/80 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] uppercase font-bold text-stone-400 whitespace-nowrap pl-2 hidden md:inline">
                8 Khu Vực:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none w-full">
                {rooms.map((room) => {
                  const isSelected = room.id === currentRoom.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => onSelectRoom(room.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                          : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-stone-950/40 text-[10px] flex items-center justify-center font-bold">
                        {room.roomNumber}
                      </span>
                      <span>{room.shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exhibit Inspection Modal */}
      {activeExhibit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600 uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>{activeExhibit.category || 'Tư Liệu Hiện Vật'}</span>
                {activeExhibit.historicalDate && (
                  <>
                    <span>·</span>
                    <span className="text-stone-500">{activeExhibit.historicalDate}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setActiveExhibit(null);
                  speechService.stop();
                }}
                className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Image banner */}
              {activeExhibit.imageUrl && (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-stone-100 border border-stone-200">
                  <img
                    src={activeExhibit.imageUrl}
                    alt={activeExhibit.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-medium">
                      Nguồn: {activeExhibit.verifiedSource || 'Bảo tàng truyền thống Đội TNTP Hồ Chí Minh'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
                  {activeExhibit.title}
                </h3>
                {activeExhibit.subtitle && (
                  <p className="text-sm font-medium text-red-700 mt-1">
                    {activeExhibit.subtitle}
                  </p>
                )}
              </div>

              {/* Audio Narration Bar */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Thuyết minh hiện vật bằng giọng nói tiếng Việt
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Nghe giới thiệu chi tiết về ý nghĩa và câu chuyện lịch sử
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handlePlayRoomNarration(
                      activeExhibit.audioNarrationText || activeExhibit.detailedContent,
                      activeExhibit.title
                    )
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm whitespace-nowrap transition-colors"
                >
                  {playbackState.isSpeaking ? 'Dừng đọc' : 'Phát âm thanh'}
                </button>
              </div>

              {/* Narrative Text */}
              <div className="prose prose-stone text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {activeExhibit.detailedContent}
              </div>

              {/* Key Takeaways */}
              {activeExhibit.keyPoints && activeExhibit.keyPoints.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
                    Điểm Ghi Nhớ Quan Trọng:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    {activeExhibit.keyPoints.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✓</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Mini-Quiz */}
              {activeExhibit.interactiveQuiz && (
                <div className="bg-red-50/60 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" />
                    <span>Thử Thách Nhanh Kiểm Tra Hiểu Biết</span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {activeExhibit.interactiveQuiz.question}
                  </p>

                  <div className="space-y-2">
                    {activeExhibit.interactiveQuiz.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === activeExhibit.interactiveQuiz!.answerIndex;
                      const isSelected = quizAnswerSelected === oIdx;

                      let btnStyle = 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50';
                      if (isAnswerRevealed) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-semibold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-100 border-red-400 text-red-900';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-red-600 border-red-600 text-white';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            if (!isAnswerRevealed) {
                              setQuizAnswerSelected(oIdx);
                              setIsAnswerRevealed(true);
                            }
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs rounded-lg border transition-colors ${btnStyle}`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswerRevealed && (
                    <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900">Giải thích: </span>
                        {activeExhibit.interactiveQuiz.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 border-t border-stone-200 px-6 py-3 flex items-center justify-between text-xs text-stone-500">
              <span>Trường Tiểu học và THCS Chiến Thắng – Xã Vũ Lễ, Lạng Sơn</span>
              <button
                onClick={() => {
                  setActiveExhibit(null);
                  speechService.stop();
                }}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
