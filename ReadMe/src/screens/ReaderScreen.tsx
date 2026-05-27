import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';
import { updateBookProgress } from '../api/ApiService';

const ReaderScreen = () => {
  const route = useRoute();
  const { epubUrl, title, bookId, lastReadPage, lastReadCfi } = route.params as {
    epubUrl: string;
    title: string;
    bookId: number;
    lastReadPage: number;
    lastReadCfi: string | null;
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedCfiRef = useRef<string | null>(lastReadCfi);
  const lastSavedPageRef = useRef<number>(lastReadPage ?? 0);

  const saveProgress = useCallback((page: number, cfi: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (cfi === lastSavedCfiRef.current) return;
      try {
        await updateBookProgress(bookId, page, cfi);
        lastSavedCfiRef.current = cfi;
        lastSavedPageRef.current = page;
      } catch (err) {
        console.error('[Reader] Erreur sauvegarde progression:', err);
      }
    }, 1500);
  }, [bookId]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'page') {
        saveProgress(data.page, data.cfi);
      }
    } catch (err) {
      console.warn('[Reader] Message invalide:', err);
    }
  }, [saveProgress]);

  const savedCfiJson = JSON.stringify(lastReadCfi);

  const readerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #fff; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        #viewer { flex: 1; width: 100%; height: 100%; }
        #loading { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #4A635E; }
        #page-number { 
          position: fixed; bottom: 10px; left: 0; right: 0; 
          text-align: center; font-size: 11px; color: #888; 
          pointer-events: none; z-index: 100;
        }
      </style>
    </head>
    <body>
      <div id="loading">Chargement du livre...</div>
      <div id="viewer"></div>
      <div id="page-number">---</div>

      <script>
        var savedCfi = ${savedCfiJson};

        document.addEventListener("DOMContentLoaded", function() {
          var book = ePub("${epubUrl}");
          var rendition = book.renderTo("viewer", {
            width: "100%",
            height: "100%",
            flow: "paginated",
            manager: "default"
          });

          // Afficher le livre : à la position sauvegardée si dispo, sinon au début
          var displayPromise = savedCfi ? rendition.display(savedCfi) : rendition.display();

          displayPromise.then(function() {
            document.getElementById("loading").style.display = "none";
          }).catch(function() {
            rendition.display().then(function() {
              document.getElementById("loading").style.display = "none";
            }).catch(function(err2) {
              document.getElementById("loading").innerHTML = "Erreur : " + err2.message;
            });
          });

          book.ready.then(function() {
            return book.locations.generate(100);
          }).then(function() {
            rendition.on("relocated", function(location) {
              var currentPage = 0;
              try {
                currentPage = book.locations.locationFromCfi(location.start.cfi);
              } catch(e) {
                currentPage = 0;
              }
              var totalPages = book.locations.total || 0;
              document.getElementById("page-number").innerHTML = "Page " + (currentPage + 1) + " sur " + totalPages;

              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: "page",
                  cfi: location.start.cfi,
                  page: currentPage
                }));
              }
            });
          });

          // GESTION DU SWIPE
          var touchstartX = 0;
          var touchendX = 0;

          function checkDirection() {
            var threshold = 50;
            if (touchendX < touchstartX - threshold) rendition.next();
            if (touchendX > touchstartX + threshold) rendition.prev();
          }

          rendition.on("touchstart", function(event) {
            touchstartX = event.changedTouches[0].screenX;
          });

          rendition.on("touchend", function(event) {
            touchendX = event.changedTouches[0].screenX;
            checkDirection();
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: readerHtml, baseUrl: '' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        mixedContentMode="always"
        startInLoadingState={true}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4A635E" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ReaderScreen;
