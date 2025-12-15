importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAQ8_kmDi3BJVfQAyZ6RqcQ9NCS3b8GuTU",
//   authDomain: "xmodel-ffe3b.firebaseapp.com",
//   projectId: "xmodel-ffe3b",
//   storageBucket: "xmodel-ffe3b.appspot.com",
//   messagingSenderId: "163940771952",
//   appId: "1:163940771952:web:f2e245fc31759946512cb5",
//   measurementId: "G-LFPD8M0Z71"
// };

const defaultConfig = {
  apiKey: true,
  projectId: true,
  messagingSenderId: true,
  appId: true,
};

self.addEventListener('fetch', () => {
  const urlParams = new URLSearchParams(location.search);
  self.firebaseConfig = Object.fromEntries(urlParams);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] notificationclick  ', event);
  event.notification.close();
  var url = event.notification.data.notificationLink;
  if (!url) return null;
  event.waitUntil(
      clients.matchAll({
              type: 'window'
          })
          .then(function(windowClients) {
              for (var i = 0; i < windowClients.length; i++) {
                  var client = windowClients[i];
                  if (client.url === url && 'focus' in client) {
                      return client.focus();
                  }
              }
              if (clients.openWindow) {
                  return clients.openWindow(url);
              }
          })
  );
});

// Initialize Firebase
const app = firebase.initializeApp(self.firebaseConfig || defaultConfig);

const messaging = firebase.messaging(app);

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'New strip4free notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event ', event);
  const data = event.data.json();
  self.registration.showNotification(data.data.title,
    {
      body: data.data.message,
      data: data.data
    });
})