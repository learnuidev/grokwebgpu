(ns webgpu.book.one
  (:require [cljs.spec.alpha :as s]
            [cljs.core.async :refer [go]]
            [cljs.core.async.interop :refer-macros [<p!]]))

(defn get-context [canvas id]
  (.getContext canvas (name id)))

(defn request-adapter []
  (js/navigator.gpu.requestAdapter))

(defn request-device [adapter]
  (.requestDevice adapter))

(comment
  (get-context (js/document.getElementById "app") :webgpu))

(comment
  (instance? js/Number (js/Number.)))

(defn wgpu-device? [d]
  (instance? js/GPUDevice d))

(defn wgpu-canvas? [canvas]
  (instance? js/HTMLCanvasElement canvas))

(defn wgpu-context? [canvas]
  (instance? js/GPUCanvasContext canvas))

(defn get-preferred-format [context adapter]
  (.getPreferredFormat context adapter))
(comment
  (js/document.getElementById "app"))

(s/def ::device wgpu-device?)
(s/def ::canvas wgpu-canvas?)
(s/def ::context wgpu-context?)

;;
(comment
  (s/valid? ::canvas (js/document.getElementById "app"))
  (s/valid? ::context (get-context (js/document.getElementById "app") :webgpu)))

(s/def ::state (s/keys :req-un [::device ::context]))

(defonce state (atom nil))

;;
;; Swap Chain
(defn swapchain [{:keys [context device format]}]
  (.configure context (clj->js {:device device
                                :format format})))

(defn init [{:keys [canvas]}]
  (.then (request-adapter)
         (fn [adapter]
           (.then (request-device adapter)
                  (fn [device]
                    (let [context (get-context canvas :webgpu)
                          format (get-preferred-format context adapter)]
                      (clj->js {:adapter adapter
                                :device device
                                :context context
                                :canvas canvas
                                :format format})))))))
(comment
  (.then (init-2 {:canvas (js/document.getElementById "app")})
         (fn [resp]
           (js/console.log resp))))

(defn init2 [{:keys [canvas]}]
  (go
    (let [adapter (<p! (request-adapter))
          device (<p! (request-device adapter))
          context (get-context canvas :webgpu)
          format (get-preferred-format context adapter)
          init-state {:adapter adapter
                      :device device
                      :context context
                      :canvas canvas
                      :format format}]
      ; (swapchain init-state)
      (reset! state init-state))))

;;
(.then (init {:canvas (js/document.getElementById "app")})
       #(reset! state %))

(comment
  @state)

(defn app []
  "Spec")
