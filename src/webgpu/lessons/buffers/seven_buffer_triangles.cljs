(ns webgpu.lessons.buffers.seven-buffer-triangles
  (:require ["/lessons/02_buffers/07_buffer_triangle.js" :as buffers]
            [cljs.repl :refer [doc]]))

(comment
  "Make everything for interactive learning experience")
(.makeGlobal buffers buffers)

(comment "API")

(defn create-square
  "Create a square"
  [{:keys [canvas]}]
  (js/createSquare (clj->js {:canvas canvas})))

(comment
  (doc create-square))
(defn app []
  (let [canvas (js/document.getElementById "app")]
    (create-square {:canvas canvas})))
