(ns webgpu.compute.one
  (:require ["/lessons/09_compute.js" :as compute]))

(set! js/window -compute compute)
(comment
  (.then (.computeOnGPU2 compute 3000)
         #(js/console.log %)))

(defn app []
  (js/console.log "compute" compute))
