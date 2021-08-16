(ns webgpu.lessons.four-lines
  (:require ["/drxu/04_lines.js" :default line]))

;; Define interface
(defn shaders [color]
  (.Shaders line color))
;
(defn create-primitive [{:keys [canvas primitive-type]}]
  (.CreatePrimitive line (clj->js {:canvas canvas
                                   :primitiveType primitive-type})))
;
; ;; testing time
(comment
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-tive "point-list"})
  (shaders "(0,0,0,1"))

;; app
(defn app []
  (create-primitive {:canvas (js/document.getElementById "app")
                     :primitive-type "point-list"}))
