import { useState } from "react";
import { Plus } from "lucide-react";
import { db } from "../../../configs/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const webhookURL = import.meta.env.VITE_FIREBASE_VITE_DISCORD_WEBHOOK_URL;

function AddDriverButton({ onAddDriver }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    // Generate a preview URL
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImageToDiscord = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch(webhookURL, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Failed to upload image.");

      const responseData = await response.json();
      const imageUrl = responseData.attachments?.[0]?.url || null;

      if (!imageUrl) throw new Error("Image URL not returned from Discord.");

      console.log("Image successfully uploaded:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    let imageUrl = await uploadImageToDiscord();
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching userId from localStorage...");
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID not found.");
        alert("User ID is missing. Please log in again.");
        setLoading(false);
        return;
      }

      console.log("Adding new hauler to Firestore...");
      await addDoc(collection(db, "haulers"), {
        profileImg: imageUrl,
        organizationId: userId,
        createdAt: serverTimestamp(),
      });

      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("Failed to save image. Check console for errors.");
    } finally {
      setIsOpen(false);
      setImageFile(null);
      setPreviewUrl(null);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1A4D2E] text-white px-5 py-4 flex items-center gap-2 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-transform duration-300"
      >
        <Plus size={20} /> Add Driver
      </button>

      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-96">
            <h2 className="text-2xl font-bold mb-6 text-[#1A4D2E] text-center">
              Upload Driver Image
            </h2>

            {previewUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full shadow-lg"
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
            />

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddDriverButton;
