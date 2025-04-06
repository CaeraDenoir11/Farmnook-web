useEffect(() => {
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(() => {
    OneSignal.init({
      appId: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
      notifyButton: { enable: true },
      allowLocalhostAsSecureOrigin: true,
    });

    // Optional: Prompt for permissions
    OneSignal.showSlidedownPrompt();
  });
}, []);
