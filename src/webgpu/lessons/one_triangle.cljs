(ns webgpu.lessons.one-triangle
  (:require ["/lessons/01_triangle.js" :default triangle]))

;; Define interface
(defn shaders [color]
  (.Shaders triangle color))

(defn create-triangle [{:keys [canvas color background]}]
  (.createTriangle triangle (clj->js {:canvas canvas
                                      :color color
                                      :background background})))

;; testing time
(comment
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"})
  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color {:r 1.0
                            :g 0.2
                            :b 0.5
                            :a 1.0}
                    :background {:r 0.2
                                 :g 0.4
                                 :b 0.8
                                 :a 1.0}}))
                    ; :color "(1.0,0.0,1.0,1.0)"}))
