(ns webgpu.lessons.compute.twelve-texture
  (:require ["/lessons/00_compute/12_texture.js" :refer [initTexture]]
            ["dat.gui" :refer [GUI]]))

;; Images
(def image-url "assets/image.png")
; (def image-url "assets/aladdin/aladdin_angry.png")
; (def image-url "assets/contra/bg/one.png")
; (def image-url "assets/fungus/helicon.png")

(def gui (GUI.))
(comment
  (js/console.log gui))
(def state (atom {}))
;; app
(defn app []
  (.then (initTexture (clj->js {:canvas (js/document.getElementById "app")
                                :debug true
                                :gui gui
                                :image image-url}))
         (fn [res]
           (js/console.dir res)
           (reset! state res))))

(comment
  "Inspect state"
  (.-device @state))
