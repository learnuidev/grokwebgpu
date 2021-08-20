(ns webgpu.lessons.one-triangle
  (:require ["/lessons/01_triangle.js" :default triangle]))

;; Define interface
(defn shaders [color]
  (.Shaders triangle color))

(defn create-triangle [{:keys [canvas color]}]
  (.CreateTriangle triangle (clj->js {:canvas canvas :color color})))

;; testing time
(comment
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color "(1.0,1.0,1.0,1.0)"})
  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-triangle {:canvas (js/document.getElementById "app")
                    :color {:r "1.0" :g "1.0" :b "0.0" :a "1.0"}}))
