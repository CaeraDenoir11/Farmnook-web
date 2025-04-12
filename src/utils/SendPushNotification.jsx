export const sendPushNotification = async (playerIds, title, message) => {
    try {
        const response = await fetch(
            "https://onesignal.com/api/v1/notifications",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        "Basic os_v2_app_jzlhh64njvhonitip6vz2oil46g64bdagwdumafaqquyisuuucapph6jnfwofmjcs3oaauutfhxzdq6sbyu72jgbiktprkewj5uty5y",
                },
                body: JSON.stringify({
                    app_id: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
                    include_player_ids: playerIds,
                    headings: { en: title },
                    contents: { en: message },
                    data: { openTarget: "NotificationActivity" },
                }),
            }
        );
        const result = await response.json();
        console.log("Push notification sent:", result);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};