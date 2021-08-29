(ns webgpu.lessons.twelve-texture
  (:require ["/lessons/12_texture.js" :refer [initTexture]]
            ["dat.gui" :refer [GUI]]))

(def gui (GUI.))
(comment
  (js/console.log gui))
(def state (atom {}))
;; app
(defn app []
  (.then (initTexture (clj->js {:canvas (js/document.getElementById "app")
                                :debug true
                                :gui gui}))
         (fn [res]
           (js/console.dir res)
           (reset! state res))))

(comment
  "Inspect state"
  (.-device @state))
