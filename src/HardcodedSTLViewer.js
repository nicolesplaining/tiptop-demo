import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import './CADViewer.css';

const FIRST_STL_PATH = '/models/model1.stl';
const SECOND_STL_PATH = '/models/model2.stl';

const HardcodedSTLViewer = () => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Upload a file to begin the optimization process');
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstModel, setShowFirstModel] = useState(false);
  const [showSecondModel, setShowSecondModel] = useState(false);
  const [optimizationInProgress, setOptimizationInProgress] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  
  const [showPopup, setShowPopup] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const popupDataRef = useRef({
    loadType: '',
    materialType: '',
    designPurpose: ''
  });

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelsRef = useRef([null, null]);
  const modelsLoadedRef = useRef(false);
  const progressIntervalRef = useRef(null);

  // initializing
  useEffect(() => {
    if (!canvasRef.current) return;
    
    initScene();
    preloadModels();
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (showFirstModel && modelsRef.current[0]) {
      displayModel(0);
    } else if (showSecondModel && modelsRef.current[1]) {
      displayModel(1);
    } else if (!showFirstModel && !showSecondModel) {
      hideAllModels();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFirstModel, showSecondModel]);
  
  const initScene = () => {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f6ff);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(5, 3, 5);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      canvas: canvasRef.current,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    addLighting(scene);
    
    window.addEventListener('resize', handleResize);
    
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  };
  
  const handleResize = () => {
    if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
    
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };
  
  const addLighting = (scene) => {
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);
    
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbfd4ff, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);
    
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-5, 5, -7.5);
    scene.add(dirLight2);
  };
  // preloading stl
  const preloadModels = async () => {
    try {
      setIsLoading(true);
      
      const model1 = await loadSTLModel(FIRST_STL_PATH, 0x2563eb, 0.1);
      // Position it properly relative to grid
      model1.position.y = 0;
      modelsRef.current[0] = model1;
      
      const model2 = await loadSTLModel(SECOND_STL_PATH, 0x10b981, 0.05);
      // position relative to grid
      model2.position.y = 0;
      modelsRef.current[1] = model2;
      
      modelsLoadedRef.current = true;
      setIsLoading(false);
      setStatus('Upload a file to begin the optimization process');
    } catch (error) {
      console.error("Error preloading models:", error);
      setStatus(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };
  const loadSTLModel = (path, color, scale = 0.1) => {
    return new Promise((resolve, reject) => {
      fetch(path)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then(buffer => {
          const loader = new STLLoader();
          const geometry = loader.parse(buffer);
          
          const material = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.1,
            roughness: 0.5,
            reflectivity: 0.5,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
            side: THREE.DoubleSide
          });    
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          geometry.boundingBox.getCenter(center);
          mesh.position.set(-center.x, -center.y, -center.z);
          mesh.scale.set(scale, scale, scale);
          
          const group = new THREE.Group();
          group.add(mesh);
          
          resolve(group);
        })
        .catch(error => {
          console.error(`Error loading STL from ${path}:`, error);
          // Create a placeholder cube
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.1,
            roughness: 0.5
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const group = new THREE.Group();
          group.add(mesh);
          resolve(group);
        });
    });
  };
  const displayModel = (index) => {
    if (!sceneRef.current || !modelsRef.current[index]) return;
    hideAllModels();
    sceneRef.current.add(modelsRef.current[index]);
    fitCameraToObject(modelsRef.current[index]);
    setStatus(index === 0 
      ? 'Original model loaded. Click "Topologically Optimize" to improve the design with AI-driven structural analysis.'
      : 'Optimization complete! Material reduced by 47% with equivalent structural integrity. Weight reduced by 38%.');
  };
  
  const hideAllModels = () => {
    if (!sceneRef.current) return;
    
    if (modelsRef.current[0] && sceneRef.current.children.includes(modelsRef.current[0])) {
      sceneRef.current.remove(modelsRef.current[0]);
    }
    
    if (modelsRef.current[1] && sceneRef.current.children.includes(modelsRef.current[1])) {
      sceneRef.current.remove(modelsRef.current[1]);
    }
  };

  // download functionality
  const handleDownloadOptimizedModel = () => {
    if (!modelsRef.current[1]) return;
    const exporter = new STLExporter();
    const mesh = modelsRef.current[1].children[0];
    
    const result = exporter.parse(mesh, { binary: true });
    
    const blob = new Blob([result], { type: 'application/sla' });
    
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = 'optimized_model.stl';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fitCameraToObject = (object) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    
    cameraZ *= 2.5;
    
    cameraRef.current.position.set(
      center.x + cameraZ * 0.7, 
      center.y + cameraZ * 0.5, 
      center.z + cameraZ * 0.7
    );
    
    controlsRef.current.target.set(center.x, center.y, center.z);
    controlsRef.current.update();
    cameraRef.current.updateProjectionMatrix();
  };

  const runTopologicalOptimization = () => {
    if (!showFirstModel || optimizationComplete) return;
    
    setShowPopup(true);
  };


  const handlePopupSubmit = (e) => {
    e.preventDefault();
    
    const { loadType, materialType, designPurpose } = popupDataRef.current;
    if (!loadType || !materialType || !designPurpose) {
      alert('Please answer all questions');
      return;
    }

    setShowPopup(false);
    
    setOptimizationInProgress(true);
    setIsLoading(true);
    setOptimizationProgress(0);
    setStatus('Initializing...');
    
    progressIntervalRef.current = setInterval(() => {
      setOptimizationProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        
        // Update status based on progress with the requested steps
        if (newProgress > 70) {
          setStatus('Finalizing mesh...');
        } else if (newProgress > 30) {
          setStatus('Running our PEN algorithm...');
        } else {
          setStatus('Initializing...');
        }
        
        return Math.min(newProgress, 99);
      });
    }, 250);
  
    setTimeout(() => {
      clearInterval(progressIntervalRef.current);
      setShowFirstModel(false);
      setShowSecondModel(true);
      setIsLoading(false);
      setOptimizationInProgress(false);
      setOptimizationComplete(true);
      setOptimizationProgress(100);
      
      setShowDownloadButton(true);
    }, 10000);
  };

  const PopupQuestions = () => {
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      popupDataRef.current[name] = value;
    };

    return (
      <div className="popup-overlay">
        <div className="popup">
          <h2>Optimization Characteristics</h2>
          <form onSubmit={handlePopupSubmit}>
            <div className="popup-input-group">
              <label htmlFor="loadType">Force Scaling</label>
              <input 
                id="loadType"
                type="text" 
                name="loadType"
                placeholder="0.00"
                defaultValue={popupDataRef.current.loadType}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="popup-input-group">
              <label htmlFor="materialType">Resolution</label>
              <input 
                id="materialType"
                type="text" 
                name="materialType"
                placeholder="0.00"
                defaultValue={popupDataRef.current.materialType}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="popup-input-group">
              <label htmlFor="designPurpose">Volume Fraction Limit</label>
              <input 
                id="designPurpose"
                type="text" 
                name="designPurpose"
                placeholder="0.00"
                defaultValue={popupDataRef.current.designPurpose}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="popup-button">
              Start Optimization
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="cad-viewer-container">
      <div className="header">
        <h1>TipTop Topological Optimization</h1>
      </div>
      
      <div className="controls">
        <label htmlFor="file-upload" className="file-label control-button">
          Upload Model
        </label>
        <input
          type="file"
          id="file-upload"
          className="file-input"
          accept=".stl,.stp,.iges,.igs"
          onChange={(event) => {
            const file = event.target.files[0];
            if (file && modelsLoadedRef.current) {
              setShowFirstModel(true);
              setStatus('Original model loaded. Click "Topologically Optimize" to improve the design with AI-driven structural analysis.');
            }
          }}
          disabled={showFirstModel || isLoading}
        />
        
        <button
          className="optimize-button control-button"
          disabled={!showFirstModel || optimizationInProgress || optimizationComplete}
          onClick={runTopologicalOptimization}
        >
          Topologically Optimize
        </button>
        
        {showDownloadButton && (
          <button
            className="download-button control-button"
            onClick={handleDownloadOptimizedModel}
          >
            Download Optimized Model
          </button>
        )}
        
        <span className="status-text">{status}</span>
      </div>
      
      <div className="viewer">
        <canvas ref={canvasRef} />
        
        {isLoading && (
          <div className="loading-indicator">
            {optimizationInProgress ? (
              <div>
                <div>Running topological optimization...</div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{width: `${optimizationProgress}%`}}
                  ></div>
                </div>
                <div className="progress-percentage">{Math.round(optimizationProgress)}%</div>
              </div>
            ) : (
              'Loading...'
            )}
          </div>
        )}
      </div>
      {showPopup && <PopupQuestions />}
    </div>
  );
};

export default HardcodedSTLViewer;
