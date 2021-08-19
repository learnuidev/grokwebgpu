(ns webgpu.lessons.ch06.cube-vertex-colors
  (:require ["/lessons/06_chapter/01_cube_vertex_colors.js" :as cube]
            [cljs.repl :refer [doc source]]
            ["3d-view-controls" :as camera]
            ["gl-matrix" :refer [vec4 mat4 vec3]]))

;; doesnt work
; (def now (.-doc (.-now cube)) (.-now cube))
(def now "Get the quickest, most high-resolution timestamp possible ." (.-now cube))

(comment
  (doc create-cam)
  (source create-cam))

;;
(comment
  (doc now)
  (doc create-cam)
  (source now))

"Lesson 1: Create Cube"
(defn create-cube [opts]
  (.createCube cube (clj->js opts)))

(defn app []
  (create-cube {:libs {:camera camera
                       :vec4 vec4
                       :vec3 vec3
                       :mat4 mat4}
                :canvas (js/document.getElementById "app")}))
