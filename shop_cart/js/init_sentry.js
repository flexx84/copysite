(function() {
  try {
    const EXTRA_KEY = "ROUTE_TO";
    const SENTRY_FO_SHOP_DSN = "https://aedf9f5b48de33cbaaea5c1ab8038f1d@o4509241587597312.ingest.us.sentry.io/4509307606794240";

    const transport = Sentry.makeMultiplexedTransport(
      Sentry.makeFetchTransport,
      (args) => {
        const event = args.getEvent();
        if (
          event &&
          event.extra &&
          EXTRA_KEY in event.extra &&
          Array.isArray(event.extra[EXTRA_KEY])
        ) {
          return event.extra[EXTRA_KEY];
        }
        return [];
      }
    );

    Sentry.init({
      dsn: SENTRY_FO_SHOP_DSN,
      environment: TEST_SERVER ? "development" : "production",
      integrations: [Sentry.moduleMetadataIntegration()],
      transport,
      sampleRate: 0.1,
      ignoreErrors: ["Network Error"],
      beforeSend: (event) => {
        if (event?.exception?.values?.[0]?.stacktrace?.frames) {
          const frames = event.exception.values[0].stacktrace.frames;

          // DSN 설정을 갖고 있는(mfe 앱에서 발생한) 마지막 프레임
          const routeTo = frames
            .filter((frame) => frame.module_metadata && frame.module_metadata.dsn)
            .map((v) => v.module_metadata)
            .slice(-1);

          if (routeTo.length) { 
            event.extra = { 
              ...event.extra,
              [EXTRA_KEY]: routeTo,
            };
            return event;
          }
        }

        // mfe 이외의 이벤트는 전송하지 않음
        return null;
      },
    });

    Sentry.setTag("site_code", SITE_CODE);
    Sentry.setTag("unit_code", UNIT_CODE);
  } catch (error) {
    console.warn("Issue during Sentry initialization: Some error tracking features may be limited.", error);
  }
})();
