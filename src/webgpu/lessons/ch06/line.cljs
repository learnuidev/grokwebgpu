(ns webgpu.lessons.ch06.line
  (:require ["/lessons/06_chapter/02_line.js" :refer [createLine]]
            [cljs.repl :refer [doc source]]
            ["3d-view-controls" :as camera]
            ["gl-matrix" :as gl-matrix]))

"Lesson 1: Create Cube"
(defn create-line [opts]
  (createLine (clj->js opts)))

(defn app []
  (create-line {:camera camera
                :math gl-matrix
                :canvas (js/document.getElementById "app")}))
