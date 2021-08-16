(ns webgpu.lessons.google)

(+ 1 2 3)

;; GPU OBJECT
(def gpu (.-gpu js/navigator))

;; Debugging
(set! js/window -gpu gpu)

(def gpu-adapter (atom nil))
(def gpu-device (atom nil))
;;
(defn init-gpu []
  (.then (.requestAdapter gpu)
         (fn [adapter]
           (reset! gpu-adapter adapter)
           (.then (.requestDevice adapter)
                  (fn [device] (reset! gpu-device device))))))

(init-gpu)
(comment
  "Notes"
  "We can access GPU in the WebGPU by calling requestAdapter function
   - it returns a promise that will asynchronously resolve a GPU adapter
  "
  (.then (.requestAdapter gpu)
         (fn [adapter]
           (reset! gpu-adapter adapter))))

(comment
  @gpu-adapter
  "Once we have the GPU adapter we can call the requestDevice method.
   This method returns a promise that will resolve with a GPU Device"
  (.then (.requestDevice @gpu-adapter)
         (fn [device]
           (reset! gpu-device device))))

(comment
  "Now that we have the device, we can start with the rendering pipeline"
  @gpu-device)

(comment
  "Rendering pipeline
    - First we must define buffers
    - Buffers are shared between CPU and GPU so that you can add data to the buffer and then provide it
      to the GPU and also the other way around
    - In our example we need to define FOUR buffers
        1. First one will contain the width and height of the image. This information will be needed
           for the shader program, so a computing instance knows which pixels it must process.
        2. Second buffer will be raw pixel rgba buffer
        3. Third buffer will be used to store the computed pixels by the shader program
        4. And the fourth buffer will be used to copy the result and read the result by the CPU. So
           here we start getting really low level. Lets create the buffer")

(comment
  "==== First buffer: width height buffer ===
    - The first buffer will contain width and the height of the image"
  "We can create a buffer using device.createBuffer method
   mappedAtCreation means javascript as access to the buffer. If it is unmapped
   it is only available to the gpu. That way race condition between CPU and GPU are avoided.
   - Also I must specify the size of the buffer, and the size of the buffer is the size of hte array.
     This can be accessed using -byteLength. Note that this value should be 8 (multiple of 4)
     since we have 2 32 bit integers
   - Next we must set the usage of the buffer. For now we are only going to use as a storage buffer
   Now we have a buffer. Now we must insert the data into the buffer
   ")

(when @gpu-device
  (def data (js/Int32Array. (clj->js [1080 900])))  ;; width and height])
  (def buffer (.createBuffer @gpu-device (clj->js {:mappedAtCreation true
                                                   :size  (.-byteLength data) ;; should be 8
                                                   :usage (.-STORAGE js/GPUBufferUsage)})))

  "- Next we must set the usage of the buffer. For now we are only going to use as a storage buffer
    Now we have a buffer. Now we must insert the data into the buffer"
  (.set (js/Int32Array. (.getMappedRange buffer)) data))

(comment)

(defn process-image [arr width height]
  (init-gpu))

;; testing
(comment)
(process-image [] 200 300)
;; canvas
(def canvas (js/document.getElementById "app"))

(def context (.getContext canvas "webgpu"))

(defn app []
  (js/console.log "WEBGPU"))

(defn ^:dev/after-load start []
  (app))

(defn ^:export init []
  (start))
