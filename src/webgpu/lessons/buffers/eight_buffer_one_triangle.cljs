(ns webgpu.lessons.buffers.eight-buffer-one-triangle
  (:require ["/lessons/02_buffers/08_buffer_one_triangle.js" :as buffers]
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
