(ns webgpu.lessons.twelve-texture
  (:require ["/lessons/12_texture.js" :refer [initTexture]]))

(def state (atom {}))
;; app
(defn app []
  (.then (initTexture (clj->js {:canvas (js/document.getElementById "app")
                                :debug true}))
         (fn [res]
           (js/console.dir res)
           (reset! state res))))

(comment
  "Inspect state"
  (.-device @state))
