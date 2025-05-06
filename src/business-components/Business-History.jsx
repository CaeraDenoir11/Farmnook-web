import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../configs/firebase";

export default function History() {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const getReadableLocation = async (coords) => {
    if (!coords) return "No location";
    const [lat, lng] = coords.split(",");
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=9b332265c5664a9984191710ac38cc4a`
      );
      const data = await response.json();
      return data.results?.[0]?.formatted || "Unknown location";
    } catch {
      return "Unknown location";
    }
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");

    const unsubscribe = onSnapshot(
      collection(db, "deliveryHistory"),
      async (snapshot) => {
        setIsLoading(true);

        const deliveryHistories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const deliveryIds = deliveryHistories
          .map((item) => item.deliveryId)
          .filter(Boolean);

        const deliverySnapshots = await Promise.all(
          deliveryIds.map((id) => getDoc(doc(db, "deliveries", id)))
        );
        const deliveries = deliverySnapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));

        const haulerIds = [
          ...new Set(deliveries.map((d) => d.haulerAssignedId)),
        ];
        const requestIds = deliveries.map((d) => d.requestId);

        const haulerSnapshot = await getDocs(
          query(collection(db, "users"), where("userId", "in", haulerIds))
        );
        const haulerMap = Object.fromEntries(
          haulerSnapshot.docs.map((d) => [d.data().userId, d.data()])
        );

        const requestSnapshots = await Promise.all(
          requestIds.map((id) => getDoc(doc(db, "deliveryRequests", id)))
        );
        const requests = requestSnapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));

        const farmerIds = [...new Set(requests.map((r) => r.farmerId))];
        const farmerSnapshot = await getDocs(
          query(collection(db, "users"), where("userId", "in", farmerIds))
        );
        const farmerMap = Object.fromEntries(
          farmerSnapshot.docs.map((d) => [d.data().userId, d.data()])
        );

        const vehicleIds = requests.map((r) => r.vehicleId);
        const vehicleSnapshot = await getDocs(
          query(collection(db, "vehicles"), where("__name__", "in", vehicleIds))
        );
        const vehicleMap = Object.fromEntries(
          vehicleSnapshot.docs.map((d) => [d.id, d.data()])
        );

        const mergedHistory = deliveryHistories
          .map((history) => {
            const delivery = deliveries.find(
              (d) => d.id === history.deliveryId
            );
            if (!delivery) return null;

            const hauler = haulerMap[delivery.haulerAssignedId];
            if (!hauler || hauler.businessId !== currentUserId) return null;

            const request = requests.find((r) => r.id === delivery.requestId);
            if (!request) return null;

            const farmer = farmerMap[request.farmerId] || {};
            const vehicle = vehicleMap[request.vehicleId] || {};

            const deliveryArrivalTime = history.deliveryArrivalTime;
            const formattedArrivalTime =
              deliveryArrivalTime?.toDate?.().toLocaleString() ||
              "No arrival time";
            const dateObject = deliveryArrivalTime?.toDate?.() || new Date(0);

            return {
              id: history.id,
              vehicleType: vehicle.vehicleType || "Unknown",
              haulerName: `${hauler.firstName} ${hauler.lastName}`,
              farmerName:
                `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() ||
                "Unknown Farmer",
              weight: request.weight,
              productType: request.productType,
              purpose:
                request.purpose?.charAt(0).toUpperCase() +
                request.purpose?.slice(1),
              timestamp: formattedArrivalTime,
              timestampRaw: dateObject,
              estimatedCost: request.estimatedCost,
              pickupName: request.pickupName,
              destinationName: request.destinationName,
            };
          })
          .filter(Boolean);

        mergedHistory.sort((a, b) => b.timestampRaw - a.timestampRaw);
        setHistoryData(mergedHistory);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredHistory = historyData.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const queryMatch =
      (entry.farmerName?.toLowerCase() || "").includes(query) ||
      (entry.haulerName?.toLowerCase() || "").includes(query) ||
      (entry.vehicleType?.toLowerCase() || "").includes(query);

    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    const inRange =
      (!fromDate || entry.timestampRaw >= fromDate) &&
      (!toDate || entry.timestampRaw <= toDate);

    return queryMatch && inRange;
  });

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen py-10">
      <div className="container mx-auto px-4 sm:px-8">
        <h1 className="text-2xl font-bold text-[#1A4D2E] mb-6">
          Delivery History
        </h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Farmer, Hauler, or Vehicle Used"
            className="border px-3 py-2 rounded w-full md:w-1/3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="date"
              className="border px-3 py-2 rounded"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
            />
            <input
              type="date"
              className="border px-3 py-2 rounded"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mb-2 text-gray-600">
          Total Deliveries: {filteredHistory.length}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-600">Loading history...</p>
        ) : filteredHistory.length === 0 ? (
          <p className="text-center text-gray-600">
            No delivery history found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-md rounded">
              <thead className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Farmer Name</th>
                  <th className="py-3 px-4 border-b text-left">
                    Hauler Assigned
                  </th>
                  <th className="py-3 px-4 border-b text-left">Vehicle Used</th>
                  <th className="py-3 px-4 border-b text-left">
                    Date Completed
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr
                    key={entry.id}
                    className="text-gray-800 border-b hover:bg-gray-100 cursor-pointer"
                    onClick={async () => {
                      const pickup = await getReadableLocation(
                        entry.pickupLocation
                      );
                      const drop = await getReadableLocation(
                        entry.destinationLocation
                      );

                      setSelectedEntry({
                        ...entry,
                        pickupLocation: pickup,
                        destinationLocation: drop,
                      });
                    }}
                  >
                    <td className="py-3 px-4">{entry.farmerName}</td>
                    <td className="py-3 px-4">{entry.haulerName}</td>
                    <td className="py-3 px-4">{entry.vehicleType}</td>
                    <td className="py-3 px-4">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 bg-white bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <h2 className="text-xl font-semibold text-[#1A4D2E] mb-4">
              Delivery Details
            </h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>
                <strong>Delivery ID:</strong> {selectedEntry.id}
              </li>
              <li>
                <strong>Hauler Assigned:</strong> {selectedEntry.haulerName}
              </li>
              <li>
                <strong>Farmer Name:</strong> {selectedEntry.farmerName}
              </li>
              <li>
                <strong>Vehicle Type:</strong> {selectedEntry.vehicleType}
              </li>
              <li>
                <strong>Product Type:</strong> {selectedEntry.productType}
              </li>
              <li>
                <strong>Purpose:</strong> {selectedEntry.purpose}
              </li>
              <li>
                <strong>Weight:</strong> {selectedEntry.weight} KG
              </li>
              <li>
                <strong>Cost:</strong> {selectedEntry.estimatedCost}
              </li>
              <li>
                <strong>Date Completed:</strong> {selectedEntry.timestamp}
              </li>
              <li>
                <strong>Pickup Location:</strong> {selectedEntry.pickupName}
              </li>
              <li>
                <strong>Destination Location:</strong>{" "}
                {selectedEntry.destinationName}
              </li>
            </ul>
            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-6 bg-[#1A4D2E] text-white px-4 py-2 rounded hover:bg-green-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
