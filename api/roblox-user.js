export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const username = String(req.query.username || "").trim();

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username Roblox wajib diisi."
    });
  }

  try {
    // Cari username Roblox
    const searchURL =
      "https://users.roblox.com/v1/users/search?keyword=" +
      encodeURIComponent(username) +
      "&limit=10";

    const searchResponse = await fetch(searchURL);

if (!searchResponse.ok) {
  const detail = await searchResponse.text();

  console.error("Roblox API status:", searchResponse.status);
  console.error("Roblox API detail:", detail);

  return res.status(502).json({
    success: false,
    message: "Roblox API gagal merespons.",
    status: searchResponse.status,
    detail: detail.slice(0, 300)
  });
}
    const searchData = await searchResponse.json();
    const users = searchData.data || [];

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "Username Roblox tidak ditemukan."
      });
    }

    // Prioritaskan username yang benar-benar sama
    const exactUser =
      users.find(
        user =>
          String(user.name || "").toLowerCase() === username.toLowerCase()
      ) || users[0];

    const userId = exactUser.id;

    // Ambil avatar
    let avatarUrl = "";

    try {
      const avatarURL =
        "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
        "?userIds=" +
        encodeURIComponent(userId) +
        "&size=150x150&format=Png&isCircular=false";

      const avatarResponse = await fetch(avatarURL);

      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json();

        if (
          avatarData.data &&
          avatarData.data[0] &&
          avatarData.data[0].imageUrl
        ) {
          avatarUrl = avatarData.data[0].imageUrl;
        }
      }
    } catch (avatarError) {
      console.log("Avatar gagal diambil:", avatarError.message);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: exactUser.id,
        username: exactUser.name,
        displayName: exactUser.displayName || exactUser.name,
        avatar: avatarUrl
      }
    });

  } catch (error) {
    console.error("Roblox API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal menghubungi server Roblox. Coba lagi."
    });
  }
}
