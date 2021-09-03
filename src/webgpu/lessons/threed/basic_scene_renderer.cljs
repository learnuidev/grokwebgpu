(ns webgpu.lessons.threed.basic-scene-renderer
  (:require [cljs.repl :refer [doc]]
            ["/lessons/genka/BasicSceneRenderer.js" :as patu :refer [patu Scene Camera WebGPURenderer]]
            ["3d-view-controls" :as camera]
            ["gl-matrix" :refer [vec4 mat4 vec3]]))

(def canvas (js/document.getElementById "app"))
(defn app []
  (patu (clj->js {:libs {:camera camera
                         :vec4 vec4
                         :vec3 vec3
                         :mat4 mat4}
                  :canvas (js/document.getElementById "app")})))
