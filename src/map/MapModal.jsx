// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged } from "firebase/auth";

export default function MapModal({
  isOpen,
  onClose,
  pickup,
  drop,
  farmerName,
  purpose,
  productType,
  weight,
  timestamp
}) {
  if (!isOpen) return null;

  const formattedTime = timestamp?.toDate
    ? timestamp.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "N/A";

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
      <div className="bg-white px-4 py-4 rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] relative flex flex-col">
        <h2 className="text-md font-bold text-[#1A4D2E] text-center mb-2">
          Delivery Route & Request Details
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-red-600 font-bold text-2xl"
        >
          ⓧ
        </button>

        {/* Display Details Here */}
        <div className="text-sm text-[#1A4D2E] mb-2 px-2 space-y-1">
          <p><strong>Farmer:</strong> {farmerName}</p>
          <p><strong>Purpose:</strong> {purpose}</p>
          <p><strong>Product Type:</strong> {productType}</p>
          <p><strong>Weight:</strong> {weight} kg</p>
          <p><strong>Date and Time:</strong> {formattedTime}</p>
        </div>

        <div className="flex-1 overflow-hidden rounded-lg">
          <Maps
            pickupLocation={pickup}
            destinationLocation={drop}
            disablePicker={true}
            routeColor="blue"
            showTooltips={true}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
