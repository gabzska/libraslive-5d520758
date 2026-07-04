import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Html, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { subscribeLia, getSign } from "@/lib/lia-sign-library";
import { LIA_AVATAR_URL } from "@/lib/lia-config";
import {
  subscribeAnimation,
  getAnimation,
  type ProceduralAnimation,
  type AnimationSample,
} from "@/lib/lia-animations";

interface Lia3DStageProps {
  modelUrl?: string;
  className?: string;
  enableControls?: boolean;
  background?: string | null;
}

/**
 * <Lia3DStage /> — Cena React Three Fiber.
 *
 * Pipelines suportados (em ordem de prioridade):
 *   1. `playAnimation(name)` → GLB em `ANIMATIONS[name].glbUrl` (se existir)
 *   2. `playAnimation(name)` → função procedural `sample(t)` (placeholder)
 *   3. `playSign(gloss)`     → GLB em `SIGN_LIBRARY[gloss].animationUrl`
 *   4. `playSign(gloss)`     → AnimationClip embutida no próprio GLB do avatar
 *
 * Quando o avatar real chegar em `/models/lia.glb` e os GLBs em
 * `/animations/*.glb` forem fornecidos, o stage usa-os automaticamente.
 * Enquanto isso, o placeholder reage às mesmas chamadas — mesmo código.
 */
export function Lia3DStage({
  modelUrl = "/models/lia.glb",
  className,
  enableControls = false,
  background = null,
}: Lia3DStageProps) {
  return (
    <div
      className={className}
      style={{ minHeight: 320, position: "relative" }}
    >
      {/* Halo suave por trás — dá profundidade e centra visualmente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 -z-0 rounded-[40%] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.72 0.19 295 / 0.35), transparent 70%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0.9, 3.2], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        style={{ background: background ?? "transparent" }}
        shadows
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 2]} intensity={1.15} castShadow />
        <directionalLight position={[-2, 2, -1]} intensity={0.35} color="#c9a8ff" />

        <Suspense
          fallback={
            <Html center>
              <span className="text-xs text-muted-foreground">Carregando Lia…</span>
            </Html>
          }
        >
          {/* Grupo de enquadramento — centra o avatar no viewport da câmera */}
          <group position={[0, -0.75, 0]}>
            <LiaSceneRoot modelUrl={modelUrl} />
          </group>
          <Environment preset="studio" />
        </Suspense>

        {enableControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            target={[0, 0.15, 0]}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.9}
          />
        )}
      </Canvas>
    </div>
  );
}


function LiaSceneRoot({ modelUrl }: { modelUrl: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(modelUrl, { method: "HEAD" })
      .then((r) => !cancelled && setAvailable(r.ok))
      .catch(() => !cancelled && setAvailable(false));
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  if (available === null) return null;
  if (available) return <LiaRig url={modelUrl} />;
  return <LiaPlaceholder />;
}

/* ──────────────────────────────────────────────────────────────
 * Estado runtime de animação procedural (compartilhado entre rig e placeholder).
 * ────────────────────────────────────────────────────────────── */
interface ActiveProc {
  anim: ProceduralAnimation;
  startedAt: number;
}

/** Hook que retorna a amostra atual da animação procedural ativa. */
function useActiveProcedural() {
  const ref = useRef<ActiveProc | null>({
    anim: getAnimation("Idle")!,
    startedAt: performance.now(),
  });

  useEffect(() => {
    return subscribeAnimation((evt) => {
      if (!evt.animation) return;
      ref.current = { anim: evt.animation, startedAt: evt.startedAt };
    });
  }, []);

  /** Amostra a animação ativa em `now`. Volta para Idle quando termina. */
  return (now: number): AnimationSample => {
    const cur = ref.current;
    if (!cur) return {};
    const elapsed = now - cur.startedAt;
    let t = elapsed / cur.anim.durationMs;
    if (t >= 1) {
      if (cur.anim.loop) {
        t = t - Math.floor(t);
      } else {
        // termina → cai para Idle automaticamente
        const idle = getAnimation("Idle");
        if (idle && cur.anim.name !== "Idle") {
          ref.current = { anim: idle, startedAt: now };
          return idle.sample(0);
        }
        t = 1;
      }
    }
    return cur.anim.sample(Math.max(0, Math.min(1, t)));
  };
}

/* ──────────────────────────────────────────────────────────────
 * Clip cache para GLBs externos de animação (sinais).
 * ────────────────────────────────────────────────────────────── */
const clipCache = new Map<string, Promise<THREE.AnimationClip[]>>();
const glbLoader = new GLTFLoader();

function loadClips(url: string): Promise<THREE.AnimationClip[]> {
  let p = clipCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      glbLoader.load(
        url,
        (gltf) => resolve(gltf.animations ?? []),
        undefined,
        (err) => reject(err),
      );
    });
    clipCache.set(url, p);
  }
  return p;
}

/* ──────────────────────────────────────────────────────────────
 * Rig real — GLB de avatar carregado.
 * ────────────────────────────────────────────────────────────── */
function LiaRig({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const { actions, mixer, names } = useAnimations(gltf.animations ?? [], groupRef);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const externalActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  const idleAction = useMemo<THREE.AnimationAction | null>(() => {
    const idleName = names.find((n) => /idle/i.test(n));
    return idleName ? actions[idleName] ?? null : null;
  }, [actions, names]);

  useEffect(() => {
    if (idleAction) idleAction.reset().fadeIn(0.3).play();
  }, [idleAction]);

  // Tenta encontrar bones por nomes comuns (Mixamo / generic) para fallback procedural.
  const bones = useMemo(() => {
    const find = (...patterns: RegExp[]): THREE.Object3D | null => {
      let hit: THREE.Object3D | null = null;
      gltf.scene.traverse((obj) => {
        if (hit) return;
        if (patterns.some((p) => p.test(obj.name))) hit = obj as THREE.Object3D;
      });
      return hit;
    };
    return {
      rightArm: find(/RightArm$/i, /mixamorigRightArm/i, /Arm\.R$/i, /upper_?arm\.?R/i),
      rightForearm: find(/RightForeArm/i, /mixamorigRightForeArm/i, /ForeArm\.R$/i, /forearm\.?R/i),
      leftArm: find(/LeftArm$/i, /mixamorigLeftArm/i, /Arm\.L$/i, /upper_?arm\.?L/i),
      head: find(/^Head$/i, /mixamorigHead/i),
    };
  }, [gltf.scene]);

  const sampleProc = useActiveProcedural();

  /** Aplica clip externa via URL (mesma lógica anterior do playSign 3D). */
  async function playClipUrl(animationUrl: string, durationMs: number) {
    if (!mixer || !groupRef.current) return;
    let action = externalActionsRef.current.get(animationUrl);
    if (!action) {
      try {
        const clips = await loadClips(animationUrl);
        const clip = clips[0];
        if (!clip) return;
        action = mixer.clipAction(clip, groupRef.current);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        externalActionsRef.current.set(animationUrl, action);
      } catch {
        return;
      }
    }
    const prev = currentActionRef.current;
    if (prev && prev !== action) prev.fadeOut(0.25);
    if (idleAction && idleAction !== action) idleAction.fadeOut(0.25);
    action.reset().fadeIn(0.25).play();
    currentActionRef.current = action;
    window.setTimeout(() => {
      if (currentActionRef.current === action) {
        action!.fadeOut(0.3);
        if (idleAction) idleAction.reset().fadeIn(0.3).play();
        currentActionRef.current = null;
      }
    }, durationMs + 100);
  }

  // Bus playAnimation → tenta GLB; senão deixa o procedural rodar via useFrame.
  useEffect(() => {
    return subscribeAnimation((evt) => {
      const glb = evt.animation?.glbUrl;
      if (glb) {
        fetch(glb, { method: "HEAD" })
          .then((r) => {
            if (r.ok) void playClipUrl(glb, evt.animation!.durationMs);
          })
          .catch(() => void 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, idleAction]);

  // Bus playSign → mantém o pipeline anterior por gloss.
  useEffect(() => {
    return subscribeLia((evt) => {
      const sign = evt.sign ?? getSign(evt.gloss);
      const dur = sign?.durationMs ?? 1000;
      if (sign?.animationUrl) {
        playClipUrl(sign.animationUrl, dur);
        return;
      }
      const name = names.find((n) => n.toUpperCase() === evt.gloss.toUpperCase());
      const action = name ? actions[name] : null;
      if (action && mixer) {
        const prev = currentActionRef.current;
        if (prev && prev !== action) prev.fadeOut(0.25);
        if (idleAction && idleAction !== action) idleAction.fadeOut(0.25);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().fadeIn(0.25).play();
        currentActionRef.current = action;
        window.setTimeout(() => {
          if (currentActionRef.current === action) {
            action.fadeOut(0.3);
            if (idleAction) idleAction.reset().fadeIn(0.3).play();
            currentActionRef.current = null;
          }
        }, dur + 100);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, names, mixer, idleAction]);

  // Aplica amostragem procedural aos bones SE não houver clip GLB tocando.
  useFrame(() => {
    if (currentActionRef.current) return; // GLB tem prioridade
    const s = sampleProc(performance.now());
    if (!groupRef.current) return;
    if (s.bodyPosY !== undefined) groupRef.current.position.y = s.bodyPosY;
    if (s.bodyRotY !== undefined) groupRef.current.rotation.y = s.bodyRotY;
    if (bones.rightArm) {
      if (s.rightArmRotZ !== undefined) bones.rightArm.rotation.z = s.rightArmRotZ;
      if (s.rightArmRotX !== undefined) bones.rightArm.rotation.x = s.rightArmRotX;
    }
    if (bones.rightForearm) {
      if (s.rightForearmRotX !== undefined) bones.rightForearm.rotation.x = s.rightForearmRotX;
      if (s.rightForearmRotY !== undefined) bones.rightForearm.rotation.y = s.rightForearmRotY;
    }
    if (bones.leftArm && s.leftArmRotZ !== undefined) bones.leftArm.rotation.z = -s.leftArmRotZ;
    if (bones.head) {
      if (s.headRotX !== undefined) bones.head.rotation.x = s.headRotX;
      if (s.headRotY !== undefined) bones.head.rotation.y = s.headRotY;
      if (s.headRotZ !== undefined) bones.head.rotation.z = s.headRotZ;
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Placeholder articulado — corpo + cabeça + braço direito (ombro+antebraço).
 * Executa as MESMAS animações procedurais que o rig real usaria como fallback.
 * ────────────────────────────────────────────────────────────── */
function LiaPlaceholder() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);

  // Pub/sub do playSign (gloss) — leve bounce visual.
  const signPulseRef = useRef(0);
  useEffect(() => {
    return subscribeLia((evt) => {
      signPulseRef.current = evt.sign?.durationMs ?? 900;
    });
  }, []);

  const sample = useActiveProcedural();

  useFrame((_, dt) => {
    const s = sample(performance.now());

    if (rootRef.current) {
      rootRef.current.position.y = (s.bodyPosY ?? 0);
      rootRef.current.rotation.y = (s.bodyRotY ?? 0);
      if (signPulseRef.current > 0) {
        rootRef.current.rotation.y += signPulseRef.current * 0.001;
        signPulseRef.current -= dt * 1000;
      }
    }
    if (headRef.current) {
      headRef.current.rotation.x = s.headRotX ?? 0;
      headRef.current.rotation.y = s.headRotY ?? 0;
      headRef.current.rotation.z = s.headRotZ ?? 0;
    }
    if (rightArmRef.current) {
      // Ombro: rotZ = levantar para a lateral; rotX = frente/trás
      rightArmRef.current.rotation.z = -(s.rightArmRotZ ?? 0);
      rightArmRef.current.rotation.x = s.rightArmRotX ?? 0;
    }
    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = s.rightForearmRotX ?? 0;
      rightForearmRef.current.rotation.y = s.rightForearmRotY ?? 0;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = s.leftArmRotZ ?? 0;
    }
  });

  const skin = "#f4d3b8";
  const hair = "#3a1f12";
  const shirt = "#c9a8ff";

  return (
    <group ref={rootRef} position={[0, 0, 0]}>
      {/* Corpo */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.38, 0.55, 8, 24]} />
        <meshStandardMaterial color={shirt} roughness={0.7} />
      </mesh>

      {/* Cabeça + cabelo + olhos (pivot na base do pescoço) */}
      <group ref={headRef} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.32, 48, 48]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.05, -0.04]}>
          <sphereGeometry args={[0.36, 48, 48, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, 0.0, 0.28]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#2a1810" />
        </mesh>
        <mesh position={[0.1, 0.0, 0.28]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#2a1810" />
        </mesh>
        {/* sorriso */}
        <mesh position={[0, -0.11, 0.29]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.012, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#b2425a" roughness={0.6} />
        </mesh>
      </group>

      {/* Braço direito articulado — pivot no ombro */}
      <group ref={rightArmRef} position={[0.42, 0.78, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.32, 6, 16]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
        {/* Cotovelo: pivot na ponta do braço */}
        <group ref={rightForearmRef} position={[0, -0.42, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.3, 6, 16]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {/* Mão */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <sphereGeometry args={[0.085, 24, 24]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* Braço esquerdo (mais simples) */}
      <group ref={leftArmRef} position={[-0.42, 0.78, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.5, 6, 16]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.62, 0]} castShadow>
          <sphereGeometry args={[0.08, 24, 24]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>

      <Html center position={[0, -0.7, 0]}>
        <span className="rounded-full bg-card/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
          placeholder · coloque <code className="font-mono">/public/models/lia.glb</code>
        </span>
      </Html>
    </group>
  );
}
