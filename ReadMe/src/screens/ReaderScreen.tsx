import React from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

const ReaderScreen = () => {
  const route = useRoute();
  const { epubUrl, title } = route.params as { epubUrl: string; title: string };

  // Code HTML du lecteur intégré (utilise epub.js via CDN)
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
        document.addEventListener("DOMContentLoaded", function() {
          var book = ePub("${epubUrl}");
          var rendition = book.renderTo("viewer", {
            width: "100%",
            height: "100%",
            flow: "paginated",
            manager: "default"
          });

          var display = rendition.display();

          display.then(function() {
            document.getElementById("loading").style.display = "none";
          }).catch(err => {
            document.getElementById("loading").innerHTML = "Erreur : " + err.message;
          });

          // --- GESTION DU NUMÉRO DE PAGE ---
          book.ready.then(function() {
            // Génère les emplacements pour calculer les pages (peut être lent sur gros livres)
            return book.locations.generate(1000); 
          }).then(function() {
            rendition.on("relocated", function(location) {
              var percent = book.locations.percentageFromCfi(location.start.cfi);
              var currentPage = book.locations.locationFromCfi(location.start.cfi);
              var totalPages = book.locations.total;
              document.getElementById("page-number").innerHTML = "Page " + (currentPage + 1) + " sur " + totalPages;
            });
          });

          // --- GESTION DU SWIPE (Glisser le doigt) ---
          let touchstartX = 0;
          let touchendX = 0;

          function checkDirection() {
            const threshold = 50; // pixels minimum pour un swipe
            if (touchendX < touchstartX - threshold) rendition.next(); // Vers la gauche -> Suivant
            if (touchendX > touchstartX + threshold) rendition.prev(); // Vers la droite -> Précédent
          }

          // On écoute sur le viewer pour capturer les touches dans l'iframe
          rendition.on("touchstart", function(event) {
            touchstartX = event.changedTouches[0].screenX;
          });

          rendition.on("touchend", function(event) {
            touchendX = event.changedTouches[0].screenX;
            checkDirection();
          });
          
          // Compatibilité pour certains navigateurs / Web
          window.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
          });

          window.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
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
