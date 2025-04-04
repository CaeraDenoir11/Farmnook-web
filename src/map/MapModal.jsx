// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged } from "firebase/auth";

export default function MapModal({ isOpen, onClose, pickup, drop }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
      <div className="bg-white px-2 py-4 rounded-2xl shadow-2xl w-full max-w-4xl h-[70vh] relative flex flex-col">
        <h2 className="text-sm font-bold text-[#1A4D2E] text-center mb-2">
          Delivery Route
        </h2>
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-red-600 font-bold text-2xl"
        >
          ⓧ
        </button>
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
