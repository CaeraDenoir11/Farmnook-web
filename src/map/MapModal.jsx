// MapModal.jsx
import Maps from "../business-components/Maps";

export default function MapModal({ isOpen, onClose, pickup, drop }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
      <div className="bg-white p-4 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] relative flex flex-col">
        <h2 className="text-xl font-bold text-[#1A4D2E] text-center mb-4">
          Delivery Route
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-600 font-bold"
        >
          Close
        </button>
        <div className="flex-1 overflow-hidden rounded-lg">
          <Maps
            pickupLocation={pickup}
            destinationLocation={drop}
            disablePicker={true}
            routeColor="blue"
            showTooltips={true}
          />
        </div>
      </div>
    </div>
  );
}
