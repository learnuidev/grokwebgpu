(ns webgpu.lessons.nine-transformation
  (:require ["gl-matrix" :refer [vec4 mat4]]))

(comment
  "1. create original vector using fromValues"
  (.fromValues vec4 1, 2, 3, 1)

  (.fromScaling mat4 (.create mat4)
                #js [0.5, 0.5, 1.5]))

(defn app []
  (js/console.log "APP"))
