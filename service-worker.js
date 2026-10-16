const CACHE_NAME = "html-reference-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// تثبيت التطبيق وتخزين الملفات الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(APP_FILES);

      await self.skipWaiting();
    })()
  );
});

// تفعيل النسخة الجديدة وحذف الكاش القديم الخاص بالتطبيق
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("html-reference-") &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

// تحميل الملفات من الكاش عند انقطاع الإنترنت
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نتدخل في الطلبات الخارجية
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // عرض الصفحة الرئيسية عند تعذر الاتصال
        if (request.mode === "navigate") {
          const offlinePage = await caches.match("./index.html");

          if (offlinePage) return offlinePage;
        }

        return new Response(
          "أنت غير متصل بالإنترنت، وهذا الملف غير محفوظ على جهازك.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
